import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { rtdb } from '../lib/firebase';
import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
import { TEAMS } from '../data/teams';
import { Send, MessageSquare, ChevronUp, ChevronDown, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮'];

const formatTime = (ts) => {
   if (!ts || typeof ts !== 'number') return '';
   try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   } catch (e) {
      return '';
   }
};

const TextChat = ({ roomId, isCollapsed, onToggleCollapse }) => {
   const { messages, sendMessage, toggleReaction } = useAuction();
   const { user } = useAuth();
   const [text, setText] = useState('');
   const [typingUsers, setTypingUsers] = useState([]);
   const [reactFor, setReactFor] = useState(null);
   const [showJump, setShowJump] = useState(false);
   const scrollContainerRef = useRef(null);
   const stickRef = useRef(true);
   const typingTimerRef = useRef(null);

   // Filter only text and gif chat messages
   const chatMessages = useMemo(
      () => messages.filter(m => m.type === 'text' || m.type === 'gif' || !m.type),
      [messages]
   );

   const scrollToBottom = (force) => {
      const el = scrollContainerRef.current;
      if (!el) return;
      if (force) stickRef.current = true;
      // Deferred to the next frame so the write never forces a sync
      // reflow in the middle of React's commit phase.
      requestAnimationFrame(() => {
         el.scrollTop = el.scrollHeight;
      });
      if (force) setShowJump(false);
   };

   // Stick to bottom only while the user is already near the bottom, so
   // reading history never gets yanked away by live messages.
   const handleScroll = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      stickRef.current = nearBottom;
      setShowJump(!nearBottom && chatMessages.length > 0);
   };

   useEffect(() => {
      if (stickRef.current) scrollToBottom();
   }, [chatMessages.length]);

   // Typing presence: publish while typing, auto-clear when idle.
   useEffect(() => {
      if (!roomId || !user?.uid) return;
      const listRef = ref(rtdb, `auctions/${roomId}/typing`);
      const off = onValue(listRef, (snap) => {
         const val = snap.val() || {};
         const now = Date.now();
         setTypingUsers(
            Object.entries(val)
               .filter(([id, t]) => id !== user.uid && t && now - (t.ts || 0) < 6000)
               .map(([id, t]) => ({ uid: id, ...t }))
         );
      });
      return () => off();
   }, [roomId, user?.uid]);

   useEffect(() => {
      return () => {
         if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
         if (roomId && user?.uid) {
            remove(ref(rtdb, `auctions/${roomId}/typing/${user.uid}`)).catch(() => {});
         }
      };
   }, [roomId, user?.uid]);

   const handleTyping = (val) => {
      setText(val);
      if (!roomId || !user?.uid) return;
      const meRef = ref(rtdb, `auctions/${roomId}/typing/${user.uid}`);
      if (val.trim()) {
         set(meRef, { name: user.displayName || 'Manager', ts: Date.now() }).catch(() => {});
         onDisconnect(meRef).remove().catch(() => {});
         if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
         typingTimerRef.current = setTimeout(() => {
            remove(meRef).catch(() => {});
         }, 2500);
      } else {
         if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
         remove(meRef).catch(() => {});
      }
   };

   const handleSend = async (e) => {
      e.preventDefault();
      if (!text.trim() || !roomId) return;

      try {
         await sendMessage(roomId, text.trim(), 'text');
         setText('');
         if (user?.uid) {
            remove(ref(rtdb, `auctions/${roomId}/typing/${user.uid}`)).catch(() => {});
         }
         scrollToBottom(true);
      } catch (err) {
         // Send failed silently or handled by context
      }
   };

   const [showGifPicker, setShowGifPicker] = useState(false);
   const [gifSearchQuery, setGifSearchQuery] = useState('');
   const [searchedGifs, setSearchedGifs] = useState([]);
   const [isSearchingGifs, setIsSearchingGifs] = useState(false);

   const fetchGifs = async (query = '') => {
      setIsSearchingGifs(true);
      try {
         const url = query.trim()
            ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=16&rating=g`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=16&rating=g`;

         const res = await fetch(url);
         const json = await res.json();
         if (json && json.data) {
            const list = json.data.map(item => ({
               id: item.id,
               name: item.title || 'GIF',
               url: item.images?.fixed_height?.url || item.images?.original?.url
            }));
            setSearchedGifs(list);
         } else {
            setSearchedGifs([]);
         }
      } catch (err) {
         setSearchedGifs([]);
      } finally {
         setIsSearchingGifs(false);
      }
   };

   const handleSearchGifs = async (e) => {
      if (e) e.preventDefault();
      await fetchGifs(gifSearchQuery);
   };

   useEffect(() => {
      if (showGifPicker) {
         fetchGifs('');
      }
   }, [showGifPicker]);

   return (
      <div className="relative flex flex-col flex-1 min-h-0 bg-transparent w-full">
         {onToggleCollapse && (
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
               <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={isCollapsed ? "Expand Chat" : "Collapse Chat"}
               >
                  {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
            </div>
         )}

         {!isCollapsed && (
            <>
               {/* Messages Scroll Area */}
               <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 custom-scrollbar flex flex-col min-h-0"
                  style={{ WebkitOverflowScrolling: 'touch' }}
               >
                  {chatMessages.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-8 text-center my-auto">
                        <MessageSquare size={24} className="text-gray-500 mb-2 animate-pulse" />
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">No banter yet</p>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">Start the conversation</p>
                     </div>
                  ) : (
                     chatMessages.map((msg, index) => {
                        const isMe = msg.userId === user?.uid;

                        // Find bidder's team logo
                        const userTeamLogo = TEAMS.find(t => t.id === msg.teamId || t.name === msg.teamId)?.logo;
                        const timeLabel = formatTime(msg.timestamp);
                        const reactions = msg.reactions || {};
                        const reactionEntries = Object.entries(reactions).filter(([, users]) => users && Object.keys(users).length > 0);

                        return (
                           <motion.div
                              key={msg.id || index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                           >
                              {/* Name and Team Header (only for other users) */}
                              {!isMe && (
                                 <div className="flex items-center gap-1.5 mb-1 px-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                       {msg.userName}
                                    </span>
                                    {msg.teamId && (
                                       <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[7px] font-black text-gray-400 uppercase tracking-widest">
                                          {msg.teamId}
                                       </span>
                                    )}
                                    {timeLabel && (
                                       <span className="text-[7px] font-bold text-gray-600">{timeLabel}</span>
                                    )}
                                 </div>
                              )}

                              {/* Speech Bubble (tap for reactions) */}
                              <div
                                 onClick={() => msg.id && setReactFor(reactFor === msg.id ? null : msg.id)}
                                 className={`rounded-2xl text-[11px] leading-relaxed break-words shadow-lg overflow-hidden cursor-pointer ${
                                    msg.type === 'gif' || (msg.text?.startsWith('http') && msg.text?.includes('.gif'))
                                       ? 'border border-white/10 max-w-[200px]'
                                       : isMe
                                          ? 'px-4 py-3 bg-white/10 border border-white/10 text-white rounded-tr-none'
                                          : 'px-4 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                                 }`}
                              >
                                 {msg.type === 'gif' || (msg.text?.startsWith('http') && msg.text?.includes('.gif')) ? (
                                    <img
                                       src={msg.text}
                                       alt="gif"
                                       loading="lazy"
                                       className="w-full h-auto object-cover block"
                                       onLoad={() => { if (stickRef.current) scrollToBottom(); }}
                                    />
                                 ) : (
                                    msg.text
                                 )}
                              </div>

                              {/* Timestamp for own messages */}
                              {isMe && timeLabel && (
                                 <span className="text-[7px] font-bold text-gray-600 mt-0.5 px-1">{timeLabel}</span>
                              )}

                              {/* Emoji picker */}
                              {reactFor === msg.id && (
                                 <div className="flex gap-1 mt-1.5 bg-black/60 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
                                    {REACTION_EMOJIS.map((emoji) => (
                                       <button
                                          key={emoji}
                                          type="button"
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             toggleReaction(roomId, msg.id, emoji).catch(() => {});
                                             setReactFor(null);
                                          }}
                                          className="text-sm hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                                       >
                                          {emoji}
                                       </button>
                                    ))}
                                 </div>
                              )}

                              {/* Reaction chips */}
                              {reactionEntries.length > 0 && (
                                 <div className="flex gap-1 mt-1 flex-wrap">
                                    {reactionEntries.map(([emoji, users]) => {
                                       const uids = Object.keys(users);
                                       const mine = !!(user && users[user.uid]);
                                       return (
                                          <button
                                             key={emoji}
                                             type="button"
                                             onClick={() => toggleReaction(roomId, msg.id, emoji).catch(() => {})}
                                             className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-all active:scale-95 cursor-pointer ${mine
                                                ? 'bg-white/15 border-white/30'
                                                : 'bg-white/5 border-white/10 hover:border-white/25'}`}
                                          >
                                             <span>{emoji}</span>
                                             <span className="font-black text-gray-300">{uids.length}</span>
                                          </button>
                                       );
                                    })}
                                 </div>
                              )}
                           </motion.div>
                        );
                     })
                  )}
               </div>

               {/* Jump to latest pill */}
               {showJump && (
                  <button
                     type="button"
                     onClick={() => scrollToBottom(true)}
                     className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-2xl transition-all active:scale-95 cursor-pointer z-10"
                  >
                     <ArrowDown size={12} /> New messages
                  </button>
               )}

               {/* Typing indicator */}
               {typingUsers.length > 0 && (
                  <div className="px-4 pb-1 flex items-center gap-1.5">
                     <span className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" />
                        <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                     </span>
                     <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest truncate">
                        {typingUsers.slice(0, 2).map(t => t.name).join(', ')}{typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : ''} typing…
                     </span>
                  </div>
               )}

               {/* Message Input Box */}
               <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-white/[0.01] flex gap-2 relative">
                  <button
                     type="button"
                     onClick={() => setShowGifPicker(!showGifPicker)}
                     className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${showGifPicker ? 'bg-white/10 border-white/20 text-white shadow-inner' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                     title="Send a GIF"
                  >
                     <ImageIcon size={14} />
                  </button>
                  <input
                     type="text"
                     value={text}
                     onChange={(e) => handleTyping(e.target.value)}
                     placeholder="Type a message..."
                     className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-gray-700"
                     maxLength={150}
                  />
                  <button
                     type="submit"
                     disabled={!text.trim()}
                     className="w-10 h-10 bg-white disabled:opacity-40 hover:bg-white/90 text-black rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:scale-100 cursor-pointer shrink-0"
                  >
                     <Send size={14} fill="currentColor" />
                  </button>
               </form>

               {showGifPicker && (
                  <div className="absolute bottom-16 right-3 left-3 bg-[#0d0d0e]/98 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-[60] flex flex-col gap-3">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Global GIF Search</span>
                        <button
                           type="button"
                           onClick={() => {
                              setShowGifPicker(false);
                              setGifSearchQuery('');
                           }}
                           className="text-[8px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                        >
                           Close
                        </button>
                     </div>

                     {/* Search input field */}
                     <form onSubmit={handleSearchGifs} className="flex gap-2">
                        <input
                           type="text"
                           value={gifSearchQuery}
                           onChange={(e) => setGifSearchQuery(e.target.value)}
                           placeholder="Search any GIF (e.g. Dhoni, Kohli...)"
                           className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-gray-700"
                        />
                        <button
                           type="submit"
                           className="px-3 bg-white hover:bg-white/90 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                           Search
                        </button>
                     </form>

                     <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[160px] custom-scrollbar min-h-[80px]">
                        {isSearchingGifs ? (
                           <div className="col-span-4 flex items-center justify-center py-8 opacity-50">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest animate-pulse">Searching Giphy...</span>
                           </div>
                        ) : searchedGifs.length === 0 ? (
                           <div className="col-span-4 flex items-center justify-center py-8 opacity-50">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest">No GIFs Found</span>
                           </div>
                        ) : (
                           searchedGifs.map((gif) => (
                              <button
                                 key={gif.id}
                                 type="button"
                                 onClick={async () => {
                                    try {
                                       await sendMessage(roomId, gif.url, 'gif');
                                       setShowGifPicker(false);
                                       setGifSearchQuery('');
                                    } catch (e) {}
                                 }}
                                 className="relative rounded-lg overflow-hidden border border-white/5 hover:border-white/30 aspect-video group cursor-pointer transition-all active:scale-95 bg-white/5"
                              >
                                 <img src={gif.url} alt={gif.name} loading="lazy" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[7px] font-black text-white uppercase tracking-tight truncate max-w-[90%] px-1">{gif.name}</span>
                                 </div>
                              </button>
                           ))
                        )}
                     </div>
                  </div>
               )}
            </>
         )}
      </div>
   );
};

export default TextChat;
