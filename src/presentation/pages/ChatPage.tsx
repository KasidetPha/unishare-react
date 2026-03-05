import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';

interface Message {
  id?: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp?: string;
}

interface ChatContact {
  user_id: number;
  name: string;
  last_message: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const targetUserId = location.state?.targetUserId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(targetUserId || null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. ดึงรายชื่อคู่สนทนา
  useEffect(() => {
    if (!user) return;
    const fetchContacts = async () => {
      try {
        const res = await api.get(`/api/messages/contacts/${user.id}`);
        setContacts(res.data);
      } catch (error) {
        console.error("Failed to fetch contacts");
      }
    };
    
    fetchContacts();
    const interval = setInterval(fetchContacts, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // 2. ดึงประวัติแชทเมื่อเปลี่ยนห้อง
  useEffect(() => {
    if (!user || !activeChatId) return;
    
    const fetchChatHistoryAndMarkRead = async () => {
      try {
        const res = await api.get(`/api/messages/${user.id}/${activeChatId}`);
        setMessages(res.data);
        await api.put(`/api/messages/read/${user.id}/${activeChatId}`);
        window.dispatchEvent(new Event('update-notifications'));
      } catch (error) {
        console.error("Failed to fetch history");
      }
    };
    
    fetchChatHistoryAndMarkRead();
  }, [user, activeChatId]);    

  // 3. WebSocket Setup
  useEffect(() => {
    if (!user) return;
    const socket = new WebSocket(`wss://https://unishare-server.onrender.com/ws/${user.id}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      if (activeChatId && (newMessage.sender_id === activeChatId || newMessage.receiver_id === activeChatId)) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    return () => socket.close();
  }, [user, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId || !user) return;

    const messageData = {
      sender_id: user.id,
      receiver_id: Number(activeChatId),
      content: inputMessage,
    };

    try {
      const res = await api.post('/api/messages', messageData);
      socketRef.current?.send(JSON.stringify(res.data));
      setMessages((prev) => [...prev, res.data]);
      setInputMessage('');
    } catch (error) {
      console.error("Failed to send message");
    }
  };

  // 🟢 ฟังก์ชันแปลง Text URL ให้เป็นลิงก์ที่เปิด Tab ใหม่
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(urlRegex).map((part, j) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={j}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 underline break-all hover:text-white transition-colors"
              >
                {part}
              </a>
            );
          }
          return part;
        })}
        <br />
      </span>
    ));
  };

  if (!user) return <div className="text-center py-20 font-bold text-gray-500">กรุณาเข้าสู่ระบบครับ</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-120px)] flex gap-4">
      
      {/* 📋 รายชื่อผู้ติดต่อ */}
      <div className="w-1/3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-800">แชทของคุณ</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <div 
                key={contact.user_id}
                onClick={() => setActiveChatId(contact.user_id)}
                className={`p-4 flex items-center gap-3 cursor-pointer border-b border-gray-50 transition-all ${activeChatId === contact.user_id ? 'bg-primary-50 border-r-4 border-primary-500' : 'hover:bg-gray-50'}`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm uppercase">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{contact.name}</p>
                  <p className="text-xs text-gray-500 truncate">{contact.last_message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm italic">ยังไม่มีประวัติการแชท</div>
          )}
        </div>
      </div>

      {/* 💬 กล่องสนทนา */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
        {activeChatId ? (
          <>
            <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-white sticky top-0 z-10 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase">
                {contacts.find(c => c.user_id === activeChatId)?.name.charAt(0) || '👤'}
              </div>
              <p className="font-bold text-gray-800">
                {contacts.find(c => c.user_id === activeChatId)?.name || `ผู้ใช้ ID: ${activeChatId}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${String(msg.sender_id) === String(user.id) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all whitespace-pre-wrap ${
                    String(msg.sender_id) === String(user.id) 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    {/* 🌟 ใช้ฟังก์ชัน Render เพื่อจัดการลิงก์ */}
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-50 flex gap-3">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-400"
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim()}
                className="w-12 h-12 bg-primary-600 disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/20">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-sm mb-6 border border-gray-100">💬</div>
            <p className="font-bold text-xl text-gray-700">ยินดีต้อนรับสู่แชท UniShare</p>
            <p className="text-sm mt-2">เลือกคู่สนทนาจากด้านซ้าย เพื่อเริ่มคุยเลย</p>
          </div>
        )}
      </div>
    </div>
  );
};