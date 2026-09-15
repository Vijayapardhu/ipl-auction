import React from 'react';
import VoiceChat from './VoiceChat';
import TextChat from './TextChat';

/**
 * Single Connect tab: room voice on top, live chat below.
 * Voice is compact so chat keeps most of the space.
 */
const ConnectPanel = ({ roomId, onJoinedChange }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <VoiceChat roomId={roomId} compact onJoinedChange={onJoinedChange} />
      <div className="mx-4 h-px bg-white/5 shrink-0" />
      <TextChat roomId={roomId} />
    </div>
  );
};

export default ConnectPanel;
