import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';
import Swal from 'sweetalert2';

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
  
  const activeChatIdRef = useRef<number | null>(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // 1. ดึงรายชื่อคู่สนทนา
  const fetchContacts = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/messages/contacts/${user.id}`);
      setContacts(res.data);
    } catch (error) {
      console.error("Failed to fetch contacts");
    }
  };

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // 2. ดึงประวัติแชทเมื่อเปลี่ยนห้อง
  const fetchChatHistory = async (chatId: number) => {
    if (!user) return;
    try {
      const res = await api.get(`/api/messages/${user.id}/${chatId}`);
      setMessages(res.data);
      await api.put(`/api/messages/read/${user.id}/${chatId}`);
      window.dispatchEvent(new Event('update-notifications'));
    } catch (error) {
      console.error("Failed to fetch history");
    }
  };

  useEffect(() => {
    if (activeChatId) {
      fetchChatHistory(activeChatId);
    }
  }, [user, activeChatId]);    

  // 3. WebSocket Setup
  useEffect(() => {
    if (!user) return;
    
    // สลับ URL ให้ตรงกับสภาพแวดล้อม (Localhost หรือ Render)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocal ? `ws://127.0.0.1:8000/ws/${user.id}` : `wss://unishare-server.onrender.com/ws/${user.id}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        if (!newMessage || !newMessage.content) return;

        const currentActiveId = String(activeChatIdRef.current);
        const incomingSenderId = String(newMessage.sender_id);
        const incomingReceiverId = String(newMessage.receiver_id);
        
        // อัปเดตรายชื่อด้านซ้ายเสมอเมื่อมีคนทักมา
        setContacts(prevContacts => {
           const otherId = incomingSenderId === String(user.id) ? newMessage.receiver_id : newMessage.sender_id;
           return prevContacts.map(c => 
             String(c.user_id) === String(otherId) ? { ...c, last_message: newMessage.content } : c
           );
        });

        // 🟢 ถ้าเราเป็นคนส่งเอง ไม่ต้องทำอะไร (เพราะเราแปะข้อความขึ้นจอไปแล้วตอนกดปุ่ม)
        if (incomingSenderId === String(user.id)) return;

        // 🟢 ถ้าห้องแชทนั้นเปิดอยู่ ให้เอาข้อความมาแปะตรงกลางจอเลย
        if (activeChatIdRef.current && (incomingSenderId === currentActiveId || incomingReceiverId === currentActiveId)) {
          setMessages((prev) => {
            // แก้บัคจุดตาย: เช็คให้ชัวร์ว่ามันมีค่า id ส่งมาจริงๆ ถึงจะเอามาเช็คซ้ำ
            const isDuplicate = prev.some(msg => 
              msg.id != null && newMessage.id != null && String(msg.id) === String(newMessage.id)
            );
            
            if (!isDuplicate) {
              return [...prev, newMessage];
            }
            return prev;
          });
          
          // ถ้าเปิดอ่านอยู่ ให้ยิงบอก Backend ว่าอ่านแล้ว
          api.put(`/api/messages/read/${user.id}/${incomingSenderId}`).catch(() => {});
        }
      } catch (err) {
        console.error("WebSocket Message Parse Error", err);
      }
    };

    return () => socket.close();
  }, [user]);

  // เลื่อนจอลงล่างสุดอัตโนมัติ
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. ฟังก์ชันส่งข้อความ
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !activeChatId || !user) return;

    setInputMessage(''); // เคลียร์ช่องแชททันที

    try {
      // 1. เซฟลงฐานข้อมูล
      const res = await api.post('/api/messages', {
        sender_id: user.id,
        receiver_id: Number(activeChatId),
        content: text,
      });

      const actualMessage = res.data.data ? res.data.data : res.data;

      // 🟢 2. เอาข้อความที่เซฟสำเร็จแล้ว มาแปะขึ้นจอฝั่งเราทันที! (รับประกันว่าเห็น 100%)
      setMessages(prev => [...prev, actualMessage]);

      // 3. อัปเดตรายชื่อด้านซ้ายมือของเรา
      setContacts(prevContacts => 
         prevContacts.map(c => 
           String(c.user_id) === String(activeChatId) ? { ...c, last_message: text } : c
         )
      );

      // 4. สั่ง WebSocket ให้ส่งข้อความไปหาฝั่งตรงข้าม
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(actualMessage));
      }

    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งข้อความ", error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'ขัดข้อง',
        text: 'ส่งข้อความไม่สำเร็จ',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  const handleReportUser = () => {
    Swal.fire({
      title: 'รายงานผู้ใช้',
      input: 'textarea',
      inputLabel: 'ระบุเหตุผลที่ต้องการรายงาน',
      inputPlaceholder: 'พิมพ์รายละเอียดที่นี่...',
      showCancelButton: true,
      confirmButtonText: 'ส่งรายงาน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) Swal.fire('สำเร็จ', 'ส่งรายงานสำเร็จ', 'success');
    });
  };

  const renderMessageContent = (content: string) => {
    if (!content) return <span>...</span>;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(urlRegex).map((part, j) => {
          if (part.match(urlRegex)) {
            return <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline break-all hover:text-white transition-colors">{part}</a>;
          }
          return part;
        })}
        <br />
      </span>
    ));
  };

  if (!user) return <div className="text-center py-20 font-bold text-gray-500">กรุณาเข้าสู่ระบบ</div>;

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
                className={`p-4 flex items-center gap-3 cursor-pointer border-b border-gray-50 transition-all ${String(activeChatId) === String(contact.user_id) ? 'bg-primary-50 border-r-4 border-primary-500' : 'hover:bg-gray-50'}`}
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
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase">
                  {contacts.find(c => String(c.user_id) === String(activeChatId))?.name.charAt(0) || '👤'}
                </div>
                <p className="font-bold text-gray-800">
                  {contacts.find(c => String(c.user_id) === String(activeChatId))?.name || `ผู้ใช้ ID: ${activeChatId}`}
                </p>
              </div>
              <button onClick={handleReportUser} className="text-red-400 hover:text-red-600 font-bold text-sm flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50">
                🚩 รายงานผู้ใช้
              </button>
            </div>

            <div className="bg-orange-50/80 border-b border-orange-100 p-3.5 flex items-start gap-3 shadow-sm z-10 backdrop-blur-sm">
              <span className="text-orange-500 text-lg">⚠️</span>
              <p className="text-xs text-orange-800 font-medium leading-relaxed">
                <span className="font-bold">โปรดระวังการหลอกลวง!</span> หลีกเลี่ยงการโอนเงินนอกระบบก่อนตรวจสอบสินค้าอย่างละเอียด หากพบการให้โอนเงินมัดจำแบบน่าสงสัย กรุณากดปุ่ม 🚩 รายงานผู้ใช้มุมขวาบนทันที
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