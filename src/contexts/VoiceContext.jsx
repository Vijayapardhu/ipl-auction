import React, { createContext, useContext, useCallback } from 'react';
import { useVoiceChat } from '../hooks/useVoiceChat';

const VoiceContext = createContext(null);

export const useVoice = () => useContext(VoiceContext);

/**
 * App-level voice session. Mounted once, so room voice keeps running while
 * the user navigates to other pages. Remote audio elements live in the hook
 * (detached from the DOM) and survive route changes.
 */
export const VoiceProvider = ({ children }) => {
  const vc = useVoiceChat({ roomId: null, user: null });

  // Join voice for a room. Handles switching: leaves the old room first.
  const joinVoice = useCallback(async (args) => {
    if (!args?.roomId || !args?.user?.uid) return;
    if (vc.joined && vc.activeRoomId === args.roomId) return;
    if (vc.joined) {
      await vc.leave();
    }
    await vc.join(args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vc.joined, vc.activeRoomId]);

  const value = { ...vc, joinVoice };
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
