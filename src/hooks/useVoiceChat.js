import { useState, useEffect, useRef, useCallback } from 'react';
import { rtdb } from '../lib/firebase';
import {
  ref,
  set,
  get,
  update,
  push,
  remove,
  onValue,
  onChildAdded,
  onChildRemoved,
} from 'firebase/database';

// ICE servers: Google STUN always, plus Metered TURN relay when configured.
// Get free TURN credentials (20 GB/mo): dashboard.metered.ca → TURN Server
// → Add Credential, then set VITE_TURN_URLS / VITE_TURN_USERNAME /
// VITE_TURN_CREDENTIAL (comma-separated urls, e.g.
// "turn:global.relay.metered.ca:80,turn:global.relay.metered.ca:443,turns:global.relay.metered.ca:443?transport=tcp").
const buildIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  const urls = (import.meta.env.VITE_TURN_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const username = import.meta.env.VITE_TURN_USERNAME;
  const credential = import.meta.env.VITE_TURN_CREDENTIAL;
  if (urls.length > 0 && username && credential) {
    servers.push({ urls, username, credential });
  }
  return servers;
};

const ICE_SERVERS = buildIceServers();
export const isTurnConfigured = () => ICE_SERVERS.some((s) => s.username);

export const isVoiceSupported = () =>
  typeof window !== 'undefined' &&
  typeof window.RTCPeerConnection !== 'undefined' &&
  !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/**
 * Mesh voice chat for an auction room.
 * Signaling + presence run over Firebase RTDB; audio is peer-to-peer WebRTC.
 * Deterministic dialing (smaller uid dials) + polite/impolite glare handling.
 */
export const useVoiceChat = ({ roomId, user, displayName, teamId, teamName }) => {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [deviceMuted, setDeviceMuted] = useState(false);
  const [peers, setPeers] = useState([]); // voice presence (others): [{ uid, name, teamId, teamName, muted }]
  const [connectedUids, setConnectedUids] = useState([]); // peers with live audio flowing
  const [error, setError] = useState('');

  const localStreamRef = useRef(null);
  const lastArgsRef = useRef(null);
  const pcsRef = useRef(new Map()); // peerUid -> { pc, pendingIce: [] }
  const audioElsRef = useRef(new Map()); // peerUid -> HTMLAudioElement
  const joinedRef = useRef(false);
  const offFnsRef = useRef([]);
  const retryTimersRef = useRef(new Map()); // peerUid -> timeout id

  // Identity mirror. Syncs from props only when they carry real values, so
  // join() overrides (persistent-provider pattern) are never clobbered by
  // a re-render.
  const metaRef = useRef({ roomId, myUid: user?.uid, displayName, teamId, teamName });
  if (roomId) metaRef.current.roomId = roomId;
  if (user?.uid) metaRef.current.myUid = user.uid;
  if (displayName) metaRef.current.displayName = displayName;
  if (teamId !== undefined && teamId !== null) metaRef.current.teamId = teamId;
  if (teamName !== undefined && teamName !== null) metaRef.current.teamName = teamName;

  const markConnected = useCallback((uid, on) => {
    setConnectedUids((prev) => {
      const has = prev.includes(uid);
      if (on && !has) return [...prev, uid];
      if (!on && has) return prev.filter((id) => id !== uid);
      return prev;
    });
  }, []);

  const sendSignal = useCallback((toUid, msg) => {
    const { roomId: rid, myUid: from } = metaRef.current;
    if (!rid || !from) return;
    push(ref(rtdb, `auctions/${rid}/voice-signals/${toUid}`), { from, ...msg }).catch(() => {});
  }, []);

  const ensureAudioEl = useCallback((uid) => {
    let el = audioElsRef.current.get(uid);
    if (!el) {
      el = new Audio();
      el.autoplay = true;
      el.playsInline = true;
      audioElsRef.current.set(uid, el);
    }
    return el;
  }, []);

  const teardownPeer = useCallback((uid) => {
    const entry = pcsRef.current.get(uid);
    if (entry) {
      try { entry.pc.close(); } catch (e) { /* ignore */ }
      pcsRef.current.delete(uid);
    }
    const el = audioElsRef.current.get(uid);
    if (el) {
      try { el.pause(); } catch (e) { /* ignore */ }
      el.srcObject = null;
      audioElsRef.current.delete(uid);
    }
    const timer = retryTimersRef.current.get(uid);
    if (timer) {
      clearTimeout(timer);
      retryTimersRef.current.delete(uid);
    }
    markConnected(uid, false);
  }, [markConnected]);

  const ensurePc = useCallback((peerUid) => {
    const { myUid: self } = metaRef.current;
    let entry = pcsRef.current.get(peerUid);
    if (entry) return entry;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    entry = { pc, pendingIce: [] };
    pcsRef.current.set(peerUid, entry);

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => {
        try { pc.addTrack(t, stream); } catch (e) { /* ignore */ }
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal(peerUid, { kind: 'ice', candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      const remote = e.streams && e.streams[0];
      if (!remote) return;
      const el = ensureAudioEl(peerUid);
      el.srcObject = remote;
      el.play().catch(() => {});
      markConnected(peerUid, true);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        markConnected(peerUid, true);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        markConnected(peerUid, false);
        // The dialer (smaller uid) re-dials on hard failure.
        if (state === 'failed' && joinedRef.current && self && self < peerUid) {
          if (!retryTimersRef.current.has(peerUid)) {
            const timer = setTimeout(() => {
              retryTimersRef.current.delete(peerUid);
              if (!joinedRef.current) return;
              teardownPeer(peerUid);
              dialPeer(peerUid);
            }, 2000);
            retryTimersRef.current.set(peerUid, timer);
          }
        }
      }
    };

    return entry;
  }, [ensureAudioEl, markConnected, sendSignal, teardownPeer]);

  const dialPeer = useCallback(async (peerUid) => {
    const { myUid: self } = metaRef.current;
    if (!joinedRef.current || !self || !localStreamRef.current) return;
    if (pcsRef.current.has(peerUid)) return;
    try {
      const { pc } = ensurePc(peerUid);
      if (pc.signalingState !== 'stable') return;
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      sendSignal(peerUid, { kind: 'offer', sdp: offer });
    } catch (e) { /* will retry on next discovery pass */ }
  }, [ensurePc, sendSignal]);

  const flushPendingIce = useCallback(async (peerUid) => {
    const entry = pcsRef.current.get(peerUid);
    if (!entry) return;
    const { pc, pendingIce } = entry;
    entry.pendingIce = [];
    for (const c of pendingIce) {
      try { await pc.addIceCandidate(c); } catch (e) { /* ignore */ }
    }
  }, []);

  const handleSignal = useCallback(async (msg) => {
    const { myUid: self } = metaRef.current;
    if (!joinedRef.current || !self || !msg || !msg.from || msg.from === self) return;
    const from = msg.from;
    try {
      if (msg.kind === 'offer' && msg.sdp) {
        // Only negotiate with peers actually present on this room's voice
        // roster (the server rule now permits any authed sender).
        try {
          const present = await get(ref(rtdb, `auctions/${metaRef.current.roomId}/voice/${from}`));
          if (!present.exists()) return;
        } catch (e) { return; }
        const { pc } = ensurePc(from);
        const polite = self > from; // larger uid yields on glare
        if (!polite && pc.signalingState !== 'stable') return; // our offer wins
        if (polite && pc.signalingState !== 'stable') {
          await pc.setLocalDescription({ type: 'rollback' });
        }
        await pc.setRemoteDescription(msg.sdp);
        await flushPendingIce(from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(from, { kind: 'answer', sdp: answer });
      } else if (msg.kind === 'answer' && msg.sdp) {
        const entry = pcsRef.current.get(from);
        if (!entry || entry.pc.signalingState !== 'have-local-offer') return;
        await entry.pc.setRemoteDescription(msg.sdp);
        await flushPendingIce(from);
      } else if (msg.kind === 'ice' && msg.candidate) {
        const entry = pcsRef.current.get(from);
        if (!entry) return;
        const cand = new RTCIceCandidate(msg.candidate);
        if (entry.pc.remoteDescription) {
          try { await entry.pc.addIceCandidate(cand); } catch (e) { /* ignore */ }
        } else {
          entry.pendingIce.push(cand);
        }
      }
    } catch (e) { /* ignore malformed signals */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensurePc, flushPendingIce, sendSignal]);

  const detachAll = useCallback(() => {
    offFnsRef.current.forEach((off) => {
      try { off(); } catch (e) { /* ignore */ }
    });
    offFnsRef.current = [];
  }, []);

  const leave = useCallback(async () => {
    joinedRef.current = false;
    detachAll();
    [...pcsRef.current.keys()].forEach(teardownPeer);
    retryTimersRef.current.forEach((t) => clearTimeout(t));
    retryTimersRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) { /* ignore */ }
      });
      localStreamRef.current = null;
    }
    const { roomId: rid, myUid: uid } = metaRef.current;
    if (rid && uid) {
      try {
        const { onDisconnect: odb } = await import('firebase/database');
        await odb(ref(rtdb, `auctions/${rid}/voice/${uid}`)).cancel().catch(() => {});
      } catch (e) { /* ignore */ }
      remove(ref(rtdb, `auctions/${rid}/voice/${uid}`)).catch(() => {});
    }
    setJoined(false);
    setJoining(false);
    setActiveRoomId(null);
    setDeviceMuted(false);
    setMuted(false);
    setPeers([]);
    setConnectedUids([]);
  }, [detachAll, teardownPeer]);

  const join = useCallback(async (override) => {
    // Allow callers (e.g. a persistent provider) to join with fresh args
    // without remounting the hook.
    if (override) {
      metaRef.current = { ...metaRef.current, ...override };
    }
    lastArgsRef.current = { ...metaRef.current };
    const { roomId: rid, myUid: uid } = metaRef.current;
    const { displayName: nm, teamId: tid, teamName: tnm } = metaRef.current;
    if (!rid || !uid || joinedRef.current) return;
    if (!isVoiceSupported()) {
      setError('Voice chat is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setError('');
    setJoining(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((t) => { t.enabled = true; });

      // Surface OS/browser-level mic mutes (user muted in system tray, no
      // device, etc.) so "mic not working" is diagnosable in the UI.
      setDeviceMuted(false);
      stream.getAudioTracks().forEach((t) => {
        t.onmute = () => setDeviceMuted(true);
        t.onunmute = () => setDeviceMuted(false);
        if (t.muted) setDeviceMuted(true);
      });

      // iOS Safari blocks remote <audio>.play() outside gestures: the join
      // tap usually unlocks it, but replay on the next gestures as backup.
      const unlockRemote = () => {
        audioElsRef.current.forEach((el) => { el.play().catch(() => {}); });
      };
      ['pointerdown', 'keydown', 'touchend'].forEach((ev) =>
        window.addEventListener(ev, unlockRemote, { once: true })
      );

      // Drop any stale signals addressed to us from a previous session.
      remove(ref(rtdb, `auctions/${rid}/voice-signals/${uid}`)).catch(() => {});

      const presenceRef = ref(rtdb, `auctions/${rid}/voice/${uid}`);
      await set(presenceRef, {
        name: nm || 'Manager',
        teamId: tid || '',
        teamName: tnm || '',
        muted: false,
        ts: Date.now(),
      });
      const { onDisconnect: odb } = await import('firebase/database');
      odb(presenceRef).remove().catch(() => {});

      joinedRef.current = true;
      setActiveRoomId(rid);

      // Roster (everyone currently in voice, including us).
      const offRoster = onValue(ref(rtdb, `auctions/${rid}/voice`), (snap) => {
        const val = snap.val() || {};
        setPeers(
          Object.entries(val)
            .filter(([id]) => id !== metaRef.current.myUid)
            .map(([id, p]) => ({ uid: id, ...p }))
        );
      });

      // Inbox: signals addressed to us.
      const inboxRef = ref(rtdb, `auctions/${rid}/voice-signals/${uid}`);
      const offInbox = onChildAdded(inboxRef, (snap) => {
        handleSignal(snap.val());
        remove(snap.ref).catch(() => {});
      });

      // Departures: tear down dead peer connections.
      const offLeft = onChildRemoved(ref(rtdb, `auctions/${rid}/voice`), (snap) => {
        teardownPeer(snap.key);
      });

      offFnsRef.current = [offRoster, offInbox, offLeft];
      setJoined(true);
    } catch (e) {
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        setError('Microphone blocked. Allow mic access in the browser address bar and try again.');
      } else if (e && e.name === 'NotFoundError') {
        setError('No microphone found on this device.');
      } else {
        setError('Could not start voice chat. Please try again.');
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (err) { /* ignore */ } });
        localStreamRef.current = null;
      }
    } finally {
      setJoining(false);
    }
  }, [handleSignal, teardownPeer]);

  // Dial newly discovered peers (smaller uid dials larger — deterministic, no glare).
  // Reads identity from metaRef so a persistent provider can join rooms
  // without remounting.
  useEffect(() => {
    if (!joined) return;
    const self = metaRef.current.myUid;
    if (!self) return;
    peers.forEach((p) => {
      if (p.uid > self && !pcsRef.current.has(p.uid)) {
        dialPeer(p.uid);
      }
    });
  }, [peers, joined, dialPeer]);

  const toggleMute = useCallback(async () => {
    const { roomId: rid, myUid: uid } = metaRef.current;
    const next = !muted;
    setMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !next; });
    }
    if (rid && uid && joinedRef.current) {
      update(ref(rtdb, `auctions/${rid}/voice/${uid}`), { muted: next }).catch(() => {});
    }
  }, [muted]);

  // Manual recovery: full leave + rejoin with the last-used identity.
  // Fixes one-sided "I can't hear anyone" states (stale ICE, ghost peers).
  const reconnect = useCallback(async () => {
    const args = lastArgsRef.current;
    if (!args?.roomId || !args?.user?.uid) return;
    setError('');
    await leave();
    await join(args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leave voice when the room unmounts.
  useEffect(() => {
    return () => {
      joinedRef.current = false;
      detachAll();
      [...pcsRef.current.keys()].forEach((uid) => {
        const entry = pcsRef.current.get(uid);
        if (entry) { try { entry.pc.close(); } catch (e) { /* ignore */ } }
      });
      pcsRef.current.clear();
      audioElsRef.current.forEach((el) => { try { el.pause(); } catch (e) { /* ignore */ } });
      audioElsRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* ignore */ } });
      }
      const { roomId: rid, myUid: uid } = metaRef.current;
      if (rid && uid) {
        remove(ref(rtdb, `auctions/${rid}/voice/${uid}`)).catch(() => {});
      }
    };
  }, [detachAll]);

  return {
    supported: isVoiceSupported(),
    turnConfigured: isTurnConfigured(),
    joined,
    joining,
    activeRoomId,
    muted,
    deviceMuted,
    peers,
    connectedUids,
    error,
    join,
    leave,
    toggleMute,
    reconnect,
  };
};
