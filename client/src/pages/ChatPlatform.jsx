import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API = 'http://localhost:5000';

const ROLE_LABELS = { admin: 'Admin', trainer: 'Coach', member: 'Member', gymOwner: 'Gym Owner' };
const ROLE_COLORS = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  trainer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-green-500/20 text-green-400 border-green-500/30',
  gymOwner: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

function ChatPlatform() {
  const user = useMemo(() => {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('userInfo');
    return rawUser ? JSON.parse(rawUser) : null;
  }, []);
  const token = localStorage.getItem('token') || user?.token || '';
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  const [contacts, setContacts] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [activeChat, setActiveChat] = useState({ id: 'community', name: 'Global Community', type: 'community' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [allMentionables, setAllMentionables] = useState([]);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const activeChatRef = useRef(activeChat);
  const socketRef = useRef(null);

  const EMOJI_LIST = ['😀','😊','😂','❤️','👍','👋','🔥','💪','🏋️','✅','🎉','🙏','😍','😎','👏','💯','🤔','😅','🥳','🙌','💪','🏃','🧘','🥗','💧'];

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
    setShowEmojiPicker(false);
    setShowMentions(false);
  };

  // Init socket
  useEffect(() => {
    if (!user) return;
    const sock = io(API, { transports: ['websocket', 'polling'] });
    socketRef.current = sock;

    sock.on('connect', () => {
      setIsConnected(true);
      sock.emit('setup', user);
    });
    sock.on('disconnect', () => setIsConnected(false));

    // New message from server — only add to state if it belongs to the CURRENT chat (fix global/private mix-up)
    sock.on('receive_message', (msg) => {
      const curr = activeChatRef.current;
      const rcv = msg.receiver != null ? String(msg.receiver) : 'community';
      const snd = msg.sender?._id != null ? String(msg.sender._id) : (msg.sender ? String(msg.sender) : '');
      const currId = String(curr?.id || '');
      const myId = user?._id != null ? String(user._id) : (user?.id ? String(user.id) : '');

      const isCommunity = currId === 'community' && rcv === 'community';
      const isCoaches = currId === 'coaches_group' && rcv === 'coaches_group';
      const isDM = curr?.type === 'user' && rcv !== 'community' && rcv !== 'coaches_group' && (snd === currId || rcv === currId);

      if (!isCommunity && !isCoaches && !isDM) {
        if (snd !== myId) {
          const key = (rcv === 'community' || rcv === 'coaches_group') ? rcv : snd;
          setUnreadCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        }
        return;
      }

      setMessages(prev => {
        if (msg.tempId) {
          const tempIndex = prev.findIndex(m => m._id === msg.tempId);
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = msg;
            return updated;
          }
        }
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    sock.on('error', (err) => {
      console.error('Chat socket error:', err);
    });

    sock.on('online_users', (ids) => setOnlineUserIds(ids));

    sock.on('message_deleted', (deletedId) => {
      setMessages(prev => prev.filter(m => m._id !== deletedId));
    });

    return () => {
      sock.disconnect();
      if (socketRef.current === sock) socketRef.current = null;
    };
  }, [user]);

  // Fetch contacts and unread counts
  useEffect(() => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    axios.get(`${API}/api/chat/contacts`, config).then(({ data }) => {
      setContacts(data);
      setAllMentionables([
        { id: 'community', label: 'everyone', role: 'community' },
        ...data.map(c => ({ id: c._id, label: c.name, role: c.role }))
      ]);
    }).catch(console.error);

    axios.get(`${API}/api/chat/unread`, config).then(({ data }) => {
      setUnreadCounts(prev => ({ ...prev, ...data }));
    }).catch(console.error);
    
  }, [token]);

  // For members, keep private focused as 1-on-1 with coach (not coaches group room)
  useEffect(() => {
    if (!isMember) return;
    if (activeChat.id !== 'coaches_group') return;
    const firstCoach = contacts.find(c => ['trainer', 'gymOwner', 'admin'].includes(c.role));
    if (firstCoach) {
      setActiveChat({ id: firstCoach._id, name: firstCoach.name, type: 'user', role: firstCoach.role });
    }
  }, [isMember, activeChat.id, contacts]);

  // Load chat history
  useEffect(() => {
    if (!token || !activeChat) return;
    setLoadingHistory(true);
    setMessages([]);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    axios.get(`${API}/api/chat/history/${activeChat.id}`, config)
      .then(({ data }) => {
        setMessages(data);
        setUnreadCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
    if (socketRef.current) socketRef.current.emit('join_chat', activeChat.id);
  }, [activeChat, token]);

  // Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mentions
  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    const pos = e.target.selectionStart;
    setCursorPos(pos);
    const textBefore = val.substring(0, pos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      setMentionSuggestions(allMentionables.filter(m => m.label.toLowerCase().includes(query)));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (m) => {
    const textBefore = newMessage.substring(0, cursorPos);
    const atIndex = textBefore.lastIndexOf('@');
    const tag = m.role === 'admin' ? '@Admin' : `@${m.label}`;
    setNewMessage(`${newMessage.substring(0, atIndex)}${tag} ${newMessage.substring(cursorPos)}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji) => {
    const before = newMessage.slice(0, cursorPos);
    const after = newMessage.slice(cursorPos);
    setNewMessage(before + emoji + after);
    setCursorPos(cursorPos + emoji.length);
    inputRef.current?.focus();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaFile) return;
    const socket = socketRef.current;
    if (!socket || !user) return;

    // Temporary optimistic UI ID to ensure it displays immediately
    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId,
      sender: user,
      content: newMessage,
      mediaType: mediaFile ? (mediaFile.type.startsWith('image/') ? 'image' : mediaFile.type.startsWith('video/') ? 'video' : 'audio') : 'none',
      mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : '',
      createdAt: new Date().toISOString()
    };
    
    // Optimistic append
    setMessages(prev => [...prev, tempMsg]);

    const currentMsg = newMessage;
    const currentMedia = mediaFile;
    setNewMessage('');
    setMediaFile(null);
    setShowEmojiPicker(false);

    let mediaUrl = '', mediaType = 'none';
    if (currentMedia) {
      const fd = new FormData();
      fd.append('media', currentMedia);
      try {
        const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
        const { data } = await axios.post(`${API}/api/chat/upload`, fd, config);
        mediaUrl = data.mediaUrl;
        mediaType = data.mediaType;
      } catch (err) { console.error('Upload failed', err); return; }
    }

    const receiver = activeChat.type === 'community' ? 'community' : (activeChat.type === 'coaches_group' ? 'coaches_group' : activeChat.id);
    socket.emit('send_message', {
      sender: user._id || user.id,
      receiver,
      content: currentMsg,
      mediaUrl,
      mediaType,
      tempId
    });
  };

  const deleteMessage = (msgId) => {
    const socket = socketRef.current;
    if (!isAdmin || !socket) return;
    socket.emit('delete_message', { messageId: msgId, userId: user._id || user.id });
  };

  const renderMedia = (msg) => {
    const src = msg.mediaUrl.startsWith('blob:') ? msg.mediaUrl : `${API}${msg.mediaUrl}`;
    if (msg.mediaType === 'image') return <img src={src} alt="attachment" className="max-w-[240px] rounded-xl mt-2 border border-white/10" />;
    if (msg.mediaType === 'video') return <video src={src} controls className="max-w-[280px] rounded-xl mt-2" />;
    if (msg.mediaType === 'audio') return <audio src={src} controls className="mt-2 w-full" />;
    return null;
  };

  const renderText = (text) => {
    if (!text) return null;
    return text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="text-yellow-400 font-semibold">{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(search.toLowerCase()))
  );

  const isMe = (msg) => {
    const sid = msg.sender?._id != null ? String(msg.sender._id) : (msg.sender ? String(msg.sender) : '');
    const myId = user?._id != null ? String(user._id) : (user?.id ? String(user.id) : '');
    return sid === myId;
  };

  const isOnline = (userId) => onlineUserIds.includes(userId);
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const roleWord = (role) => {
    if (role === 'member') return 'member';
    if (role === 'trainer' || role === 'gymOwner' || role === 'admin') return 'coach';
    return 'user';
  };
  const textBoxLabel = (() => {
    const me = user?.name || 'You';
    if (activeChat?.type === 'user') {
      return `${roleWord(user?.role)}(${me}) -> ${roleWord(activeChat?.role)}(${activeChat?.name || 'User'})`;
    }
    if (activeChat?.type === 'community') return `community (${me})`;
    if (activeChat?.type === 'coaches_group') return `coaches group (${me})`;
    return `chat (${me})`;
  })();

  const coachContacts = filteredContacts.filter(c => ['trainer', 'gymOwner', 'admin'].includes(c.role));
  const coaches = coachContacts;
  const others = isMember ? [] : filteredContacts.filter(c => !['trainer', 'gymOwner', 'admin'].includes(c.role));

  return (
    <div className="flex h-[calc(100vh-80px)] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 -m-4">
      {/* LEFT PANE */}
      <div className="w-[300px] shrink-0 flex flex-col bg-neutral-900 border-r border-neutral-800">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Chats</h2>
          <div className="flex items-center gap-2">
            <div className="relative" title={totalUnread > 0 ? `${totalUnread} unread messages` : 'No unread messages'}>
              <button type="button" className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
                🔔
              </button>
              {totalUnread > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/40 animate-ping"></span>
                </>
              )}
            </div>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500'}`}></span>
            <span className="text-xs text-neutral-500">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        <div className="px-3 py-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-neutral-800 text-white text-sm px-4 py-2 rounded-xl border border-neutral-700 focus:outline-none focus:border-yellow-500/50 placeholder-neutral-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Community */}
          <div className="px-4 py-2 mt-2">
            <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Community
            </p>
          </div>
          <button
            onClick={() => handleChatSelect({ id: 'community', name: 'Global Community', type: 'community' })}
            className={`w-full p-3 border-b border-neutral-800 flex items-center gap-3 text-left transition-colors ${activeChat.id === 'community' ? 'bg-yellow-500/10 border-l-[3px] border-l-yellow-400' : 'hover:bg-neutral-800/60'}`}
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold shrink-0">GC</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Global Community</p>
              <p className="text-neutral-500 text-xs mt-0.5">Message all users</p>
            </div>
            {unreadCounts['community'] > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                {unreadCounts['community']}
              </span>
            )}
          </button>

          {!isMember && (
            <button
              onClick={() => handleChatSelect({ id: 'coaches_group', name: 'Ask Coaches (Private)', type: 'coaches_group' })}
              className={`w-full mt-2 px-4 py-2 flex items-center justify-between border-b border-neutral-800 transition-colors ${activeChat.id === 'coaches_group' ? 'bg-yellow-500/10 border-l-[3px] border-l-yellow-400' : 'hover:bg-neutral-800/60'}`}
            >
              <div className="flex-1 text-left">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Private
                </p>
              </div>
              {unreadCounts['coaches_group'] > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 mr-2">
                  {unreadCounts['coaches_group']}
                </span>
              )}
              <span className="text-[9px] text-yellow-500 border border-yellow-500/30 rounded px-1.5 py-0.5 bg-yellow-500/10 shrink-0">Message All Coaches</span>
            </button>
          )}

          {/* Private Sections */}
          {coaches.length > 0 && (
            <>
              <div className="px-4 py-2 mt-2">
                <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold">Coaches & Admin</p>
              </div>
              {coaches.map(contact => {
                const online = isOnline(contact._id);
                const isLockedForMember = isMember && !contact.isAssignedCoach;
                return (
                  <button
                    key={contact._id}
                    onClick={() => {
                      if (isLockedForMember) return;
                      handleChatSelect({ id: contact._id, name: contact.name, type: 'user', role: contact.role });
                    }}
                    className={`w-full p-3 border-b border-neutral-800 flex items-center gap-3 text-left transition-colors ${isLockedForMember ? 'opacity-55 cursor-not-allowed' : ''} ${activeChat.id === contact._id ? 'bg-yellow-500/10 border-l-[3px] border-l-yellow-400' : 'hover:bg-neutral-800/60'}`}
                    title={isLockedForMember ? 'Locked: only assigned coach chat is allowed' : `Chat with ${contact.name}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold overflow-hidden">
                        {contact.profilePic
                          ? <img src={`${API}${contact.profilePic}`} alt={contact.name} className="w-full h-full object-cover" />
                          : contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 ${online ? 'bg-green-400' : 'bg-neutral-600'}`}></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${ROLE_COLORS[contact.role] || 'bg-neutral-700 text-neutral-400'}`}>
                          {ROLE_LABELS[contact.role] || contact.role}
                        </span>
                        {contact.isAssignedCoach && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 font-semibold">
                            Assigned
                          </span>
                        )}
                        <span className={`text-[9px] font-medium ${online ? 'text-green-400' : 'text-neutral-600'}`}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    {unreadCounts[contact._id] > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                        {unreadCounts[contact._id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
          {others.length > 0 && (
            <>
              <div className="px-4 py-2 mt-2">
                <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold">Members</p>
              </div>
              {others.map(contact => {
                const online = isOnline(contact._id);
                return (
                  <button
                    key={contact._id}
                    onClick={() => handleChatSelect({ id: contact._id, name: contact.name, type: 'user', role: contact.role })}
                    className={`w-full p-3 border-b border-neutral-800 flex items-center gap-3 text-left transition-colors ${activeChat.id === contact._id ? 'bg-yellow-500/10 border-l-[3px] border-l-yellow-400' : 'hover:bg-neutral-800/60'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold overflow-hidden">
                        {contact.profilePic
                          ? <img src={`${API}${contact.profilePic}`} alt={contact.name} className="w-full h-full object-cover" />
                          : contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 ${online ? 'bg-green-400' : 'bg-neutral-600'}`}></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${ROLE_COLORS[contact.role] || 'bg-neutral-700 text-neutral-400'}`}>
                          {ROLE_LABELS[contact.role] || contact.role}
                        </span>
                        <span className={`text-[9px] font-medium ${online ? 'text-green-400' : 'text-neutral-600'}`}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    {unreadCounts[contact._id] > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                        {unreadCounts[contact._id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="h-16 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm flex items-center px-6 gap-3 shrink-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${['community', 'coaches_group'].includes(activeChat.type) ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' : 'bg-neutral-700 text-white'}`}>
            {activeChat.type === 'community' ? 'GC' : activeChat.type === 'coaches_group' ? 'AC' : activeChat.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-none">{activeChat.name}</h2>
            {activeChat.type === 'user' && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline(activeChat.id) ? 'bg-green-400' : 'bg-neutral-600'}`}></span>
                <span className={`text-xs ${isOnline(activeChat.id) ? 'text-green-400' : 'text-neutral-500'}`}>{isOnline(activeChat.id) ? 'Online' : 'Offline'}</span>
              </div>
            )}
            {activeChat.type === 'community' && (
               <span className="text-xs text-neutral-500">Community Channel</span>
            )}
            {activeChat.type === 'coaches_group' && (
               <span className="text-xs text-neutral-500">Private Coaches Support Group</span>
            )}
          </div>
          {activeChat.type === 'user' && (
            <div className="ml-auto flex gap-2">
              <button className="text-neutral-400 hover:text-green-400 p-2 rounded-lg hover:bg-neutral-800 transition" title="Voice Call (Coming Soon)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </button>
              <button className="text-neutral-400 hover:text-blue-400 p-2 rounded-lg hover:bg-neutral-800 transition" title="Video Call (Coming Soon)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
              </button>
            </div>
          )}
        </div>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: 'radial-gradient(ellipse at top right, rgba(212,175,55,0.03),transparent 60%), #0a0a0a' }}>
          {loadingHistory && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-yellow-500/40 border-t-yellow-400 animate-spin"></div>
            </div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              </div>
              <p className="text-neutral-500 text-sm">No messages yet. Say hi! Type <span className="text-yellow-400">@</span> to mention someone</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const mine = isMe(msg);
            const key = msg._id || `temp-${i}`; 
            const isGroup = activeChat.type === 'community' || activeChat.type === 'coaches_group';
            const showSenderInfo = isGroup || (!mine && activeChat.type === 'user');

            return (
              <div key={key} className={`flex flex-col group ${mine ? 'items-end' : 'items-start'}`}>
                {showSenderInfo && (
                  <div className={`flex items-center gap-1.5 mb-1 ${mine ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                    <span className="text-xs font-semibold text-neutral-400">{mine ? 'You' : msg.sender?.name || 'Unknown'}</span>
                    {msg.sender?.role && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase tracking-widest ${ROLE_COLORS[msg.sender.role] || 'bg-neutral-800 text-neutral-400'}`}>
                        {ROLE_LABELS[msg.sender.role] || msg.sender.role}
                      </span>
                    )}
                  </div>
                )}
                <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                  {isAdmin && (
                    <button onClick={() => deleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-400 text-xs shrink-0 mb-2" title="Delete message">🗑</button>
                  )}
                  <div className={`inline-block max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.2)] ${mine ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-tr-sm' : 'bg-neutral-800 text-white rounded-tl-sm border border-neutral-700/50'}`}>
                    {msg.content && <p className="text-sm leading-snug whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>{renderText(msg.content)}</p>}
                    {msg.mediaType !== 'none' && renderMedia(msg)}
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 mx-1 font-medium">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* @mention */}
        {showMentions && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-[88px] left-6 right-6 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto">
            <div className="px-3 py-2 border-b border-neutral-700/50">
              <p className="text-xs text-neutral-500 font-semibold">Mention a person or group</p>
            </div>
            {mentionSuggestions.map(m => (
              <button key={m.id} onClick={() => insertMention(m)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-700/60 transition text-left">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${m.role === 'community' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' : m.role === 'admin' ? 'bg-red-900 text-red-300' : m.role === 'trainer' ? 'bg-blue-900 text-blue-300' : m.role === 'gymOwner' ? 'bg-purple-900 text-purple-300' : 'bg-neutral-700 text-white'}`}>
                  {m.role === 'community' ? 'GC' : m.label.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">@{m.label}</p>
                  <p className="text-neutral-500 text-xs capitalize">{ROLE_LABELS[m.role] || m.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-[88px] left-6 right-6 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-3 z-50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-500 font-semibold">Emoji</p>
              <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-neutral-400 hover:text-white text-sm">✕</button>
            </div>
            <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto">
              {EMOJI_LIST.map((emoji, i) => (
                <button key={i} type="button" onClick={() => insertEmoji(emoji)} className="text-2xl p-2 rounded-lg hover:bg-neutral-700/80 transition" title="Insert emoji">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 p-4 bg-neutral-900 border-t border-neutral-800">
          {mediaFile && (
            <div className="mb-2 px-3 py-2 bg-neutral-800 rounded-xl flex items-center justify-between gap-2">
              <span className="text-sm text-neutral-300 truncate">📎 {mediaFile.name}</span>
              <button onClick={() => setMediaFile(null)} className="text-red-400 text-xs shrink-0 hover:text-red-300 transition">✕</button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-11 h-11 shrink-0 rounded-full bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 flex items-center justify-center transition" title="Attach Image, Video or Audio">
              <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
            </button>
            <button type="button" onClick={() => { setShowEmojiPicker(prev => !prev); setShowMentions(false); }} className={`w-11 h-11 shrink-0 rounded-full border flex items-center justify-center transition text-xl ${showEmojiPicker ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'}`} title="Insert emoji">
              😀
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={e => setMediaFile(e.target.files[0])} className="hidden" />
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === 'Escape') setShowMentions(false); }}
              placeholder={`Message ${activeChat.name}... ${textBoxLabel} (type @ to mention)`}
              className="flex-1 bg-neutral-800 text-white rounded-full px-5 py-3 text-sm border border-neutral-700 focus:outline-none focus:border-yellow-500/60 placeholder-neutral-600"
            />
            <button type="submit" disabled={!newMessage.trim() && !mediaFile} className="w-11 h-11 shrink-0 rounded-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 flex items-center justify-center transition shadow-md">
              <svg className="w-5 h-5 text-black transform rotate-90 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPlatform;
