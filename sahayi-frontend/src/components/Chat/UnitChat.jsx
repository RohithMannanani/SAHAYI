import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import axios from 'axios';
import './UnitChat.css';
import { Users, User, Send, Search } from 'lucide-react';

const UnitChat = ({ unitId, currentUser }) => {
    const effectiveUser = currentUser || (() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [activeChat, setActiveChat] = useState('unit'); // 'unit' or member userId
    const [members, setMembers] = useState([]);
    const [chatHistories, setChatHistories] = useState({ unit: [] });
    const [newMessage, setNewMessage] = useState('');
    const [connection, setConnection] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:7151';

    useEffect(() => {
        let isMounted = true;
        let hubConnection = null;

        const initializeChat = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                // Fetch unit chat history
                const unitRes = await axios.get(`${apiBase}/api/chat/unit/${unitId}`, { headers });
                
                // Fetch members
                const membersRes = await axios.get(`${apiBase}/api/chat/members/${unitId}`, { headers });

                if (isMounted) {
                    setChatHistories(prev => ({ ...prev, unit: unitRes.data }));
                    setMembers(membersRes.data);
                }
            } catch (err) {
                console.error("Failed to load chat data", err);
            }
        };

        const setupSignalR = async () => {
            const token = localStorage.getItem('token');
            hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(`${apiBase}/chathub`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .build();

            // Handle Group Messages
            hubConnection.on('ReceiveMessage', (message) => {
                if (isMounted) {
                    setChatHistories(prev => {
                        const currentUnitHistory = prev['unit'] || [];
                        const msgId = message.groupMessageId || message.GroupMessageId;
                        if (msgId && currentUnitHistory.some(m => (m.groupMessageId || m.GroupMessageId) === msgId)) {
                            return prev;
                        }
                        return { ...prev, unit: [...currentUnitHistory, message] };
                    });
                }
            });

            // Handle Direct Messages
            hubConnection.on('ReceiveDirectMessage', (message) => {
                if (isMounted) {
                    setChatHistories(prev => {
                        const senderId = message.senderId || message.SenderId;
                        const receiverId = message.receiverId || message.ReceiverId;
                        
                        // The chat partner is the one who is NOT the current user
                        // If current user is sender, chat partner is receiver. 
                        const partnerId = String(senderId) === String(effectiveUser?.userId) ? receiverId : senderId;
                        const partnerStr = String(partnerId);

                        const currentHistory = prev[partnerStr] || [];
                        const msgId = message.directMessageId || message.DirectMessageId;
                        if (msgId && currentHistory.some(m => (m.directMessageId || m.DirectMessageId) === msgId)) {
                            return prev;
                        }
                        return { ...prev, [partnerStr]: [...currentHistory, message] };
                    });
                }
            });

            try {
                await hubConnection.start();
                if (isMounted) {
                    setConnection(hubConnection);
                    setIsConnecting(false);
                } else {
                    hubConnection.stop();
                }
            } catch (e) {
                console.error('Connection failed: ', e);
                if (isMounted) setIsConnecting(false);
            }
        };

        if (unitId && effectiveUser?.userId) {
            initializeChat();
            setupSignalR();
        }

        return () => {
            isMounted = false;
            if (hubConnection) {
                hubConnection.stop();
            }
        };
    }, [unitId, effectiveUser?.userId]);

    // Fetch DM history when a member is clicked and we don't have it
    useEffect(() => {
        const fetchDmHistory = async () => {
            if (activeChat !== 'unit' && !chatHistories[activeChat]) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${apiBase}/api/chat/direct/${activeChat}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setChatHistories(prev => ({ ...prev, [activeChat]: response.data }));
                } catch (err) {
                    console.error(`Failed to load DM history for ${activeChat}`, err);
                }
            }
        };
        fetchDmHistory();
    }, [activeChat]);

    const currentMessages = chatHistories[activeChat] || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !connection) return;

        try {
            if (activeChat === 'unit') {
                await connection.invoke('SendMessage', newMessage);
            } else {
                await connection.invoke('SendDirectMessage', parseInt(activeChat), newMessage);
            }
            setNewMessage('');
        } catch (e) {
            console.error('Send failed: ', e);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!unitId) {
        return <div className="chat-container empty-state">Unit ID is required to join chat.</div>;
    }

    const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const activeContact = members.find(m => String(m.userId) === activeChat);
    const activeChatName = activeChat === 'unit' 
        ? 'Unit Group Chat' 
        : activeContact?.name || 'Direct Message';

    return (
        <div className="messenger-layout">
            <div className="messenger-sidebar">
                <div className="messenger-sidebar-header">
                    <div className="messenger-header-top">
                        <div className="messenger-user-badge">
                            <div className="contact-avatar my-avatar">
                                {effectiveUser?.avatarUrl ? (
                                    <img
                                        src={effectiveUser.avatarUrl}
                                        alt={effectiveUser?.fullName || 'Me'}
                                        onError={e => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(effectiveUser?.fullName || 'Me')}&background=0C382E&color=fff`;
                                        }}
                                    />
                                ) : (
                                    <span className="chat-initials">{getInitials(effectiveUser?.fullName || effectiveUser?.name || 'Me')}</span>
                                )}
                            </div>
                            <div className="messenger-user-info">
                                <h3>Chats</h3>
                                <span className="messenger-user-name">{effectiveUser?.fullName || 'You'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="messenger-search">
                        <Search size={16} />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="messenger-contacts">
                    <div 
                        className={`messenger-contact-item ${activeChat === 'unit' ? 'active' : ''}`}
                        onClick={() => setActiveChat('unit')}
                    >
                        <div className="contact-avatar group-avatar">
                            <Users size={20} />
                        </div>
                        <div className="contact-info">
                            <h4>Unit Group</h4>
                            <span className="contact-role">All Members</span>
                        </div>
                    </div>
                    
                    <div className="messenger-contacts-divider">
                        <span>Members</span>
                    </div>

                    {filteredMembers.map(member => (
                        <div 
                            key={member.userId}
                            className={`messenger-contact-item ${activeChat === String(member.userId) ? 'active' : ''}`}
                            onClick={() => setActiveChat(String(member.userId))}
                        >
                            <div className="contact-avatar">
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        onError={e => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0C382E&color=fff`;
                                        }}
                                    />
                                ) : (
                                    <span className="chat-initials">{getInitials(member.name)}</span>
                                )}
                            </div>
                            <div className="contact-info">
                                <h4>{member.name}</h4>
                                <span className="contact-role">{member.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="messenger-main chat-wrapper">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-header-title">
                            {activeChat === 'unit' ? (
                                <div className="chat-active-avatar group-icon">
                                    <Users size={22} />
                                </div>
                            ) : (
                                <div className="chat-active-avatar">
                                    {activeContact?.avatar ? (
                                        <img
                                            src={activeContact.avatar}
                                            alt={activeChatName}
                                            onError={e => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChatName)}&background=0C382E&color=fff`;
                                            }}
                                        />
                                    ) : (
                                        <span className="chat-initials" style={{ color: '#fff' }}>
                                            {getInitials(activeChatName)}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div>
                                <h2>{activeChatName}</h2>
                                {activeChat !== 'unit' && activeContact?.role && (
                                    <span className="chat-header-subtitle">{activeContact.role}</span>
                                )}
                            </div>
                        </div>
                        <span className={`status-indicator ${isConnecting ? 'connecting' : 'online'}`}>
                            {isConnecting ? 'Connecting...' : 'Online'}
                        </span>
                    </div>
                </div>
                
                <div className="chat-messages-container">
                    {currentMessages.length === 0 && !isConnecting && (
                        <div className="chat-empty-state">
                            <div className="chat-empty-icon">👋</div>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    
                    {currentMessages.map((msg, index) => {
                        const msgId = msg.groupMessageId || msg.GroupMessageId || msg.directMessageId || msg.DirectMessageId;
                        const senderId = msg.senderId || msg.SenderId;
                        const senderName = msg.senderName || msg.SenderName;
                        const senderRole = msg.senderRole || msg.SenderRole;
                        const senderAvatar = msg.senderAvatar || msg.SenderAvatar;
                        const messageText = msg.messageText || msg.MessageText;
                        const sentAt = msg.sentAt || msg.SentAt;
                        
                        const isMine = String(senderId) === String(effectiveUser?.userId);
                        const myAvatar = effectiveUser?.avatarUrl || senderAvatar;
                        
                        return (
                            <div key={msgId || index} className={`chat-message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                                <div className="chat-avatar" title={isMine ? 'You' : (senderRole || senderName)}>
                                    {isMine ? (
                                        myAvatar ? (
                                            <img
                                                src={myAvatar}
                                                alt="You"
                                                onError={e => {
                                                    e.target.onerror = null;
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(effectiveUser?.fullName || 'You')}&background=0C382E&color=fff`;
                                                }}
                                            />
                                        ) : (
                                            <span className="chat-initials">{getInitials(effectiveUser?.fullName || 'You')}</span>
                                        )
                                    ) : (
                                        senderAvatar ? (
                                            <img
                                                src={senderAvatar}
                                                alt={senderName}
                                                onError={e => {
                                                    e.target.onerror = null;
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=0C382E&color=fff`;
                                                }}
                                            />
                                        ) : (
                                            <span className="chat-initials">{getInitials(senderName)}</span>
                                        )
                                    )}
                                </div>
                                <div className="chat-message-content">
                                    {!isMine && (
                                        <div className="chat-sender-info">
                                            <span className="sender-name">{senderName}</span>
                                            {activeChat === 'unit' && <span className="sender-role">{senderRole}</span>}
                                        </div>
                                    )}
                                    <div className="chat-bubble">
                                        <p>{messageText}</p>
                                        <span className="chat-timestamp">{formatTime(sentAt)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <form onSubmit={handleSendMessage} className="chat-input-form">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="chat-input"
                            disabled={isConnecting}
                        />
                        <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() || isConnecting}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UnitChat;
