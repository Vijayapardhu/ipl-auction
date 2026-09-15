import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { getDb, getFs } from '../lib/firebase';
import { getPlayers } from '../lib/players';
import { TEAMS } from '../data/teams';
import {
  Zap,
  Gavel,
  Loader2,
  Users,
  ChevronRight,
  ChevronDown,
  Check,
  Star,
  History,
  Trophy,
  Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuctionActivityFeed from '../components/AuctionActivityFeed';
import Footer from '../components/Footer';

const LogoMarquee = () => {
  const marqueeTeams = [...TEAMS, ...TEAMS]; // Double for seamless loop
  return (
    <div className="relative overflow-hidden w-full min-w-0 py-10 select-none">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />

      <motion.div
        className="flex w-max min-w-0 gap-12 items-center"
        animate={{ x: [0, -1920] }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {marqueeTeams.map((t, idx) => (
          <div key={`${t.id}-${idx}`} className="flex-shrink-0 group">
            <img
              src={t.logo}
              alt={`${t.name} IPL Logo`}
              loading="lazy"
              decoding="async"
              className="h-12 md:h-16 w-auto object-contain transition-all duration-500 opacity-40 group-hover:opacity-100 group-hover:scale-110 grayscale group-hover:grayscale-0 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 15
    }
  }
};

const MODES = [
  {
    id: 'mega',
    icon: Trophy,
    name: 'Mega Auction',
    tagline: 'The full spectacle',
    players: '25 Players',
    budget: '₹120 Cr Budget',
  },
  {
    id: 'sprint11',
    icon: Star,
    name: '11-Player Classic',
    tagline: 'A full XI showdown',
    players: '11 Players',
    budget: '₹90 Cr Budget',
  },
  {
    id: 'sprint5',
    icon: Zap,
    name: '5-Player Sprint',
    tagline: 'Fast & furious',
    players: '5 Players',
    budget: '₹60 Cr Budget',
  },
];

const STEPS = [
  {
    icon: Gavel,
    step: '01',
    title: 'Create a Room',
    text: 'Pick your franchise, choose a mode, and get a shareable room code in seconds.',
  },
  {
    icon: Users,
    step: '02',
    title: 'Invite Friends',
    text: 'Friends join from any device with the code — no installs, just the browser.',
  },
  {
    icon: Trophy,
    step: '03',
    title: 'Bid & Build',
    text: 'Real-time bidding wars with voice chat, live timers, and instant squads.',
  },
];

const Navbar = ({ user, logout }) => (
  <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050505]/85 border-b border-white/5">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
      <a href="#top" className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5500] to-[#ff8c00] flex items-center justify-center shadow-[0_4px_20px_rgba(255,85,0,0.3)]">
          <Gavel size={18} className="text-white" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-black tracking-tight text-white">AUCTION HUB</p>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-0.5">IPL Simulator</p>
        </div>
      </a>
      <nav className="hidden md:flex items-center gap-7 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
        <a href="#live" className="hover:text-white transition-colors">Live</a>
        <a href="#play" className="hover:text-white transition-colors">Play</a>
        <a href="#modes" className="hover:text-white transition-colors">Modes</a>
        <a href="#how" className="hover:text-white transition-colors">How it works</a>
      </nav>
      <div className="flex items-center gap-2.5 shrink-0">
        {user ? (
          <>
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName || 'Manager'} className="w-8 h-8 rounded-full border border-white/20" />
            )}
            <span className="hidden sm:block text-[10px] font-black text-gray-300 uppercase tracking-widest max-w-[120px] truncate">
              {user.displayName || 'Manager'}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-[9px] font-black text-gray-400 hover:text-red-400 uppercase tracking-widest transition-all cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <a
            href="#play"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(255,85,0,0.25)] hover:shadow-[0_6px_28px_rgba(255,85,0,0.4)] transition-all active:scale-95"
          >
            Sign In
          </a>
        )}
      </div>
    </div>
  </header>
);

const Hero = ({ onCreate, onJoin }) => (
  <div className="relative overflow-hidden">
    {/* Ghost backdrop word */}
    <div aria-hidden className="pointer-events-none select-none absolute inset-x-0 top-6 text-center font-black uppercase leading-none tracking-tighter text-[24vw] sm:text-[18vw] text-transparent opacity-100" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.07)' }}>
      Bid
    </div>
    <div className="text-center relative max-w-4xl mx-auto px-4 pt-14 sm:pt-20 pb-8">
      <h1 className="sr-only">IPL Auction Simulator &amp; Game - Live IPL Mega Auction 2026</h1>
      <motion.div
        variants={itemVariants}
        className="inline-flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
        </span>
        Free Online IPL Game • 2026 Season
      </motion.div>

      <motion.p variants={itemVariants} className="text-[clamp(0.85rem,3vw,1.05rem)] font-extrabold tracking-[0.4em] text-gray-400 uppercase">
        Play the
      </motion.p>
      <motion.h2 variants={itemVariants} className="text-[clamp(3rem,12vw,7.5rem)] font-black tracking-tighter text-white leading-[0.9] uppercase mt-2">
        IPL Auction
      </motion.h2>
      <motion.div variants={itemVariants} className="text-[clamp(3rem,12vw,7.5rem)] font-black tracking-tighter leading-[0.9] uppercase italic bg-gradient-to-r from-[#ff5500] via-[#ff8c00] to-[#ff5500] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(255,85,0,0.3)]">
        Simulator
      </motion.div>

      <motion.p variants={itemVariants} className="text-xs sm:text-base text-gray-400 font-medium max-w-xl mx-auto mt-6 leading-relaxed">
        Host a <span className="text-gray-200 font-bold">live IPL mega auction game</span> with friends.
        Bid in real-time, manage your <span className="text-gray-200 font-bold">₹120 Cr budget</span>,
        talk over <span className="text-gray-200 font-bold">voice chat</span>, and build your dream franchise squad.
      </motion.p>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <button
          onClick={onCreate}
          className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(255,85,0,0.25)] hover:shadow-[0_10px_40px_rgba(255,85,0,0.45)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
        >
          <Gavel size={17} /> Create Auction Room
        </button>
        <button
          onClick={onJoin}
          className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-white/5 border border-white/10 text-gray-200 hover:text-white hover:bg-white/10 hover:border-white/20 font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
        >
          <Zap size={17} /> Join with Code
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center justify-center gap-5 sm:gap-8 mt-10 text-center">
        {[
          ['10', 'Franchises'],
          ['500+', 'Players'],
          ['3', 'Game Modes'],
          ['Live', 'Bidding'],
        ].map(([num, label]) => (
          <div key={label}>
            <p className="text-lg sm:text-2xl font-black text-white tracking-tight">{num}</p>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  </div>
);

const FAQS = [
  {
    q: 'Is the IPL auction simulator free to play?',
    a: 'Yes. The IPL Auction Hub simulator is completely free — sign in with Google or play as a guest, create a room and start bidding with friends in seconds.',
  },
  {
    q: 'How do I play the IPL auction game online with friends?',
    a: 'Create an auction room, pick your franchise and share the 6-letter room code. Friends join from any browser on mobile or desktop — no downloads needed — and bid live with built-in voice chat.',
  },
  {
    q: 'How does bidding work in the IPL mega auction simulator?',
    a: 'Each player starts at a base price with a live countdown timer. Every bid raises the price and resets the timer. The highest bidder when the timer hits zero wins the player, with a Rs 120 crore budget and max 8 overseas players per squad in Mega mode.',
  },
  {
    q: 'Which teams and players are included?',
    a: 'All 10 IPL franchises (MI, CSK, RCB, KKR, DC, PBKS, RR, SRH, GT, LSG) and 500+ players with roles, stats and base prices across Mega, Classic and Sprint modes.',
  },
  {
    q: 'Do I need an account to play?',
    a: 'No. You can join instantly as a guest with just a name, or sign in with Google to track your auction history across sessions.',
  },
];

const Faq = () => {
  const [open, setOpen] = useState(null);
  return (
    <motion.section
      variants={itemVariants}
      className="max-w-3xl mx-auto px-4 mt-16 scroll-mt-20"
    >
      <div className="text-center mb-8">
        <p className="text-[10px] font-black text-[#ff5500] uppercase tracking-[0.35em] mb-2">Good to know</p>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">IPL auction game FAQs</h2>
      </div>
      <div className="space-y-3">
        {FAQS.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white/[0.05] border-white/15' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">{item.q}</span>
                <ChevronDown size={16} className={`text-gray-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
};

const LandingPage = () => {
  const [selectedTeam, setSelectedTeam] = useState('MI');
  const [activeTab, setActiveTab] = useState('new');
  const [auctionType, setAuctionType] = useState('mega'); // 'mega', 'sprint11' or 'sprint5'
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');

  const { user, loginWithGoogle, loginAsGuest, logout } = useAuth();
  const { createRoom, joinRoomDb } = useAuction();
  const navigate = useNavigate();

  // Check for URL errors (e.g., from being kicked) + shared room deep links (?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'kicked') {
      setError('ACCESS DENIED: You have been removed from that hub by the host.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const sharedRoom = params.get('room');
    if (sharedRoom) {
      setRoomCode(sharedRoom.toUpperCase());
      setActiveTab('join');
      // Let the page settle, then take them straight to the join form.
      setTimeout(() => {
        document.getElementById('play')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 700);
    }
  }, []);

  // Prefetch the room chunks during idle time so entering a room feels
  // instant. Skipped on metered connections.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.connection?.saveData) return;
    const prefetch = () => {
      import('./AuctionRoom').catch(() => {});
      import('./Lobby').catch(() => {});
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 10000 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = setTimeout(prefetch, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch auction history when user switches to history tab
  useEffect(() => {
    if (activeTab !== 'history' || !user?.uid || historyData.length > 0) return;


    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        // Firestore + player data load here (history tab only) — never on first paint.
        const { collection, query, where, getDocs, documentId } = await getFs();
        const db = await getDb();
        const IPL_PLAYERS = await getPlayers();
        const teamsQuery = query(
          collection(db, 'teams'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(teamsQuery);

        // Extract unique auction IDs
        const teamDocsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const auctionIds = [...new Set(teamDocsData.map(t => t.auctionId))].filter(Boolean);

        // Fetch auction room metadata in batches of 30
        const auctionDataMap = {};
        for (let i = 0; i < auctionIds.length; i += 30) {
          const chunk = auctionIds.slice(i, i + 30);
          const auctionsQuery = query(
            collection(db, 'auctions'),
            where(documentId(), 'in', chunk)
          );
          const auctionsSnap = await getDocs(auctionsQuery);
          auctionsSnap.forEach(d => {
            auctionDataMap[d.id] = d.data();
          });
        }

        // Map team documents with pre-fetched auction metadata
        const sessions = teamDocsData.map((teamData) => {
          const auctionData = auctionDataMap[teamData.auctionId];
          const totalBudget = auctionData?.settings?.budget || 120;
          const spent = totalBudget - (teamData.budgetRemaining || totalBudget);

          return {
            id: teamData.id,
            roomId: teamData.auctionId,
            teamId: teamData.teamId,
            teamName: teamData.teamName,
            budgetRemaining: teamData.budgetRemaining,
            spent,
            squad: (teamData.squad || []).map(s => {
              const pid = typeof s === 'string' ? s : s.id;
              const bid = typeof s === 'string' ? 0 : s.bid;
              const playerInfo = IPL_PLAYERS.find(p => p.id === pid);
              return { ...playerInfo, bid };
            }),
            status: auctionData?.status || 'unknown',
            mode: auctionData?.auctionType || 'mega',
            playerCount: auctionData?.players?.length || 0,
            createdAt: teamData.createdAt || auctionData?.createdAt || null
          };
        });

        // Sorting: Strictly Time (latest first)
        sessions.sort((a, b) => {
          const timeA = a.createdAt?.seconds || a.createdAt?._seconds || 0;
          const timeB = b.createdAt?.seconds || b.createdAt?._seconds || 0;
          return timeB - timeA;
        });
        setHistoryData(sessions);
      } catch (err) {
        // Failed to fetch history
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab, user?.uid]);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGuestSignIn = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a name');
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsGuest(guestName.trim());
      setIsSubmitting(false);
    } catch (err) {
      setError('Guest login failed. Ensure Anonymous Auth is enabled.');
      setTimeout(() => setError(''), 3000);
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const displayName = user.displayName || 'Manager';

      if (activeTab === 'new') {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        await createRoom(newRoomId, user.uid, { name: displayName, team: selectedTeam }, auctionType);
        navigate(`/lobby/${newRoomId}`);
      } else if (activeTab === 'join') {
        if (!roomCode) {
          setIsSubmitting(false);
          return;
        }
        const code = roomCode.toUpperCase();
        await joinRoomDb(code, user.uid, { name: displayName, team: '' });
        navigate(`/lobby/${code}`);
      }
    } catch (error) {
      setError(error.message || 'Failed to create/join room. Please try again.');
      setTimeout(() => setError(''), 3000);
      setIsSubmitting(false);
    }
  };

  const scrollToPlay = () => {
    document.getElementById('play')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const goCreate = () => {
    if (user) setActiveTab('new');
    scrollToPlay();
  };
  const goJoin = () => {
    if (user) setActiveTab('join');
    scrollToPlay();
  };
  const pickMode = (mode) => {
    setAuctionType(mode);
    if (user) setActiveTab('new');
    scrollToPlay();
  };

  return (
    <motion.div
      id="top"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-[100dvh] pt-safe pb-safe bg-[#050505] font-sans text-white overflow-x-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[70%] h-[420px] bg-orange-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-[30%] -left-[10%] w-[35%] h-[35%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <Navbar user={user} logout={logout} />

      <main className="relative z-10">
        <Hero onCreate={goCreate} onJoin={goJoin} />

        {/* ─── Live band ─── */}
        <motion.section
          id="live"
          variants={itemVariants}
          className="max-w-6xl mx-auto px-4 scroll-mt-20"
        >
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-4 sm:p-6 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Happening now</h2>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live signings</span>
            </div>
            <AuctionActivityFeed />
          </div>
        </motion.section>

        {/* ─── Play hub ─── */}
        <motion.section
          id="play"
          variants={itemVariants}
          className="max-w-6xl mx-auto px-4 mt-12 scroll-mt-20"
        >
          <div className="text-center mb-6">
            <p className="text-[10px] font-black text-[#ff5500] uppercase tracking-[0.35em] mb-2">Enter the hub</p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
              {user ? 'Create, Join, Replay' : 'Sign in to play'}
            </h2>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {!user ? (
              <div className="p-6 sm:p-10 max-w-xl mx-auto flex flex-col items-center">
                <h3 className="text-xl font-black uppercase tracking-tight mb-1">
                  {isGuestMode ? 'Guest Access' : 'Welcome, Manager'}
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">
                  {isGuestMode ? 'Enter a name to join' : 'Sign in to enter the auction hub'}
                </p>

                {!isGuestMode ? (
                  <div className="w-full space-y-4">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                      <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                        <svg viewBox="0 0 24 24" width="18" height="18" className="fill-white">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continue with Google</span>
                      </div>
                    </button>

                    <div className="relative py-2 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                      <span className="relative bg-[#0c0c0c] px-4 text-[9px] font-black text-gray-700 uppercase tracking-widest italic">Wait, I'm a guest</span>
                    </div>

                    <button
                      onClick={() => setIsGuestMode(true)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black uppercase tracking-[0.2rem] text-xs cursor-pointer active:scale-[0.98]"
                    >
                      <Users size={18} /> Join as Guest
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGuestSignIn} className="w-full space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Your Manager Name</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. MS Dhoni"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black uppercase text-sm tracking-widest placeholder:text-gray-800 focus:outline-none focus:border-orange-500/50 transition-all"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                      <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Start Auction Hub</span>}
                        {!isSubmitting && <ChevronRight size={18} className="group-hover/submit:translate-x-1 transition-transform" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsGuestMode(false)}
                      className="w-full text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-[0.3em] transition-colors mt-2"
                    >
                      ← Back to Google Login
                    </button>
                  </form>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-500 font-bold text-center">{error}</motion.p>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-8">
                {/* Flat Tab Bar Navigation: Create / Join / History */}
                <div className="flex items-center gap-1 border-b border-white/5 mb-8 overflow-x-auto">
                  {[
                    ['new', 'Create'],
                    ['join', 'Join'],
                    ['history', 'History'],
                  ].map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3.5 px-6 font-black text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 whitespace-nowrap cursor-pointer ${activeTab === tab
                        ? 'border-[#ff5500] text-[#ff5500]'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* ─── CREATE TAB ─── */}
                  {activeTab === 'new' && (
                    <motion.form
                      key="create-tab"
                      onSubmit={handleFormSubmit}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <div className="mb-4 ml-1">
                          <h4 className="text-[13px] font-black uppercase text-gray-400 tracking-wider">Franchise</h4>
                          <p className="text-[11px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">Choose the team you'll manage.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {TEAMS.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedTeam(t.id)}
                              className={`relative group/team flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 cursor-pointer ${selectedTeam === t.id
                                ? 'bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                                : 'bg-[#151515] border border-transparent hover:bg-white/[0.04]'
                                }`}
                            >
                              {selectedTeam === t.id && (
                                <div className="absolute top-2.5 right-2.5 text-white">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                              <div className={`w-12 h-12 rounded-2xl bg-white/5 p-1.5 flex items-center justify-center mb-2 transition-transform duration-200 ${selectedTeam === t.id ? 'scale-105' : 'group-hover/team:scale-105'}`}>
                                <img src={t.logo} alt={`${t.name} Logo`} loading="lazy" decoding="async" className="w-full h-full object-contain filter" />
                              </div>
                              <span className={`text-[8px] font-black uppercase text-center tracking-tighter truncate w-full ${selectedTeam === t.id ? 'text-white' : 'text-gray-500'}`}>
                                {t.name.split(' ').slice(0, 1)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 ml-1">
                          <h4 className="text-[13px] font-black uppercase text-gray-400 tracking-wider">Mode</h4>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          {MODES.map((mode) => {
                            const Icon = mode.icon;
                            const selected = auctionType === mode.id;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setAuctionType(mode.id)}
                                className={`flex-1 p-4 rounded-2xl transition-all duration-200 text-left relative overflow-hidden cursor-pointer ${selected
                                  ? 'bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                                  : 'bg-[#151515] border border-transparent hover:bg-white/[0.04]'
                                  }`}
                              >
                                {selected && (
                                  <div className="absolute top-3.5 right-3.5 text-white"><Check size={12} strokeWidth={3} /></div>
                                )}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Icon size={14} className={selected ? 'text-white' : 'text-gray-600'} />
                                  <span className={`text-[10px] font-black uppercase tracking-tight ${selected ? 'text-white' : 'text-gray-500'}`}>{mode.name}</span>
                                </div>
                                <div className="space-y-0.5 text-[8px] font-bold text-gray-600 uppercase tracking-wide">
                                  <div>{mode.players}</div>
                                  <div>{mode.budget}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-4 mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-12 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                          <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-xs">
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Start Auction</span><ChevronRight size={16} className="group-hover/submit:translate-x-1 transition-transform" /></>}
                          </div>
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* ─── JOIN TAB ─── */}
                  {activeTab === 'join' && (
                    <motion.form
                      key="join-tab"
                      onSubmit={handleFormSubmit}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6 max-w-xl mx-auto"
                    >
                      <div className="relative group">
                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Access Token</label>
                        <input
                          type="text"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500/50 transition-all text-white font-black uppercase tracking-[0.5em] text-center text-lg placeholder:tracking-normal placeholder:text-xs placeholder:text-gray-700"
                          placeholder="Enter Room Code"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                        <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Join Auction</span><ChevronRight size={18} className="group-hover/submit:translate-x-1 transition-transform" /></>}
                        </div>
                      </button>
                    </motion.form>
                  )}

                  {/* ─── HISTORY TAB ─── */}
                  {activeTab === 'history' && (
                    <motion.div
                      key="history-tab"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Syncing Database...</p>
                        </div>
                      ) : historyData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-16 h-16 bg-white/5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center mb-4">
                            <History size={28} className="text-gray-700" />
                          </div>
                          <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">No Auctions Yet</h4>
                          <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Create or join a room to start bidding!</p>
                        </div>
                      ) : (
                        <>
                          {/* Session List */}
                          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {historyData.map((session) => {
                              const teamMeta = TEAMS.find(t => t.id === session.teamId);
                              const isExpanded = expandedSession === session.id;
                              const overseasCount = session.squad.filter(p => p?.country !== 'IND').length;

                              return (
                                <div key={session.id} className="space-y-1 cv-auto">
                                  <button
                                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                                    className={`w-full text-left p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${isExpanded ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1 sm:p-1.5 flex items-center justify-center shrink-0">
                                        <img src={teamMeta?.logo} alt={`${teamMeta?.name || 'Team'} Logo`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h5 className="text-xs sm:text-sm font-black uppercase tracking-tight truncate">{teamMeta?.name || session.teamName}</h5>
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5">
                                          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Room: {session.roomId}</span>
                                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${session.mode === 'mega' ? 'bg-orange-500/10 text-orange-500'
                                            : session.mode === 'sprint11' ? 'bg-yellow-500/10 text-yellow-500'
                                              : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {session.mode}
                                          </span>
                                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${session.status === 'completed' ? 'bg-green-500/10 text-green-500'
                                            : session.status === 'active' ? 'bg-yellow-500/10 text-yellow-500'
                                              : 'bg-gray-500/10 text-gray-500'
                                            }`}>
                                            {session.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
                                      <div className="text-right">
                                        <span className="text-[10px] sm:text-xs font-black italic text-yellow-500 block">₹{session.spent.toFixed(1)} Cr</span>
                                        <span className="block text-[7px] sm:text-[8px] font-bold text-gray-500">{session.squad.length} players</span>
                                      </div>
                                      <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                  </button>

                                  {/* Expanded Squad */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="bg-[#111] border border-white/5 rounded-2xl p-3 sm:p-4 space-y-3 mt-1">
                                          {/* Quick Stats */}
                                          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 text-[8px] sm:text-[9px] font-black uppercase tracking-tight px-1.5 py-1 bg-white/[0.02] rounded-xl border border-white/5">
                                            <span className="text-gray-400">Budget Left: <span className="text-green-400">₹{session.budgetRemaining?.toFixed(1)} Cr</span></span>
                                            <span className="text-gray-400">Overseas: <span className="text-purple-400">{overseasCount}/8</span></span>
                                            <span className="text-gray-400">Squad: <span className="text-white">{session.squad.length}/25</span></span>
                                          </div>

                                          {/* Players by Role */}
                                          {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                                            const rolePlayers = session.squad.filter(p => p?.role === role);
                                            if (rolePlayers.length === 0) return null;

                                            return (
                                              <div key={role}>
                                                <div className="flex items-center gap-2 px-1 mb-1.5">
                                                  <span className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-widest">{role}s</span>
                                                  <div className="flex-1 h-px bg-white/5" />
                                                  <span className="text-[8px] font-black text-gray-600">{rolePlayers.length}</span>
                                                </div>
                                                <div className="space-y-1">
                                                  {rolePlayers.map((p, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/5 transition-all p-2 sm:p-2.5 rounded-xl">
                                                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                                        <img src={p?.image} alt={p?.name} loading="lazy" decoding="async" className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-md bg-white/5 shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                          <h6 className="text-[10px] sm:text-[11px] font-black leading-tight truncate">{p?.name}</h6>
                                                          <div className="flex items-center gap-1.5">
                                                        <span className="text-[7px] font-bold text-gray-500 uppercase">{p?.type}</span>
                                                        {p?.country !== 'IND' && !/overseas/i.test(p?.type || '') && <Wifi size={8} className="text-purple-400 rotate-90 shrink-0" />}
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <span className="text-[9px] sm:text-[10px] font-black italic text-yellow-500 shrink-0">₹{(p?.bid || 0).toFixed(2)} Cr</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {session.squad.length === 0 && (
                                            <p className="text-center text-[10px] text-gray-600 font-bold py-4 uppercase">No players acquired in this session</p>
                                          )}

                                          {/* View Full Summary / Resume Auction Button */}
                                          {session.status === 'completed' ? (
                                            <button
                                              onClick={() => navigate(`/summary/${session.roomId}`)}
                                              className="w-full mt-2 py-2.5 sm:py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                              <Trophy size={12} /> View Full Summary
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => navigate(`/lobby/${session.roomId}`)}
                                              className="w-full mt-2 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                              <Zap size={12} /> Resume / Join Auction
                                            </button>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-500 font-bold text-center">{error}</motion.p>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* ─── Modes ─── */}
        <motion.section
          id="modes"
          variants={itemVariants}
          className="max-w-6xl mx-auto px-4 mt-16 scroll-mt-20"
        >
          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-[#ff5500] uppercase tracking-[0.35em] mb-2">Pick your format</p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">Three ways to play</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const selected = user && auctionType === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => pickMode(mode.id)}
                  className={`text-left p-6 rounded-[1.75rem] border transition-all duration-300 cursor-pointer group active:scale-[0.98] ${selected
                    ? 'bg-white/[0.06] border-[#ff5500]/50 shadow-[0_0_40px_rgba(255,85,0,0.15)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                    }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff5500]/20 to-[#ff8c00]/5 border border-[#ff5500]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={20} className="text-[#ff5500]" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">{mode.name}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 mb-4">{mode.tagline}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300">{mode.players}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-yellow-500">{mode.budget}</span>
                  </div>
                  <span className="mt-5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5500]">
                    {user ? 'Select & create' : 'Sign in to play'} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ─── How it works ─── */}
        <motion.section
          id="how"
          variants={itemVariants}
          className="max-w-6xl mx-auto px-4 mt-16 scroll-mt-20"
        >
          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-[#ff5500] uppercase tracking-[0.35em] mb-2">Zero learning curve</p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">Bidding in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="relative p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/10 overflow-hidden"
                >
                  <span className="absolute -top-2 right-4 text-[64px] font-black text-white/[0.04] select-none leading-none">{step.step}</span>
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white mb-1.5">{step.title}</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{step.text}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        <Faq />

        {/* ─── Franchises ─── */}
        <motion.section variants={itemVariants} className="max-w-6xl mx-auto px-4 mt-16">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px w-12 bg-white/10" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Official Franchises</span>
            <div className="h-px w-12 bg-white/10" />
          </div>
          <LogoMarquee />
        </motion.section>

        <Footer />
      </main>
    </motion.div>
  );
};

export default LandingPage;
