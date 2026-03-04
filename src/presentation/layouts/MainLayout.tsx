import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance'; 

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchNotificationCount = async () => {
      try {
        const res = await api.get(`/api/notifications/count/${user.id}`);
        setUnreadCount(res.data.unread_count);
      } catch (error) { console.error("Failed to fetch notification count"); }
    };
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000);
    window.addEventListener('update-notifications', fetchNotificationCount);
    return () => { clearInterval(interval); window.removeEventListener('update-notifications', fetchNotificationCount); };
  }, [user]);

  return (
    <div className="h-full w-full font-thai">
      {/* --- Desktop & Mobile Top Navbar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center cursor-pointer flex-shrink-0 group" onClick={() => navigate('/')}>
              <img 
                src="/logo.png" 
                alt="UniShare Logo" 
                // ขยายความสูงขึ้นเป็น h-16 หรือ h-20 (แต่อาจจะทำให้ Navbar ดูหนาขึ้นนิดนึง)
                // หรือใช้ scale-125 เพื่อขยายรูปให้ใหญ่ขึ้น 25% 
                className="h-16 sm:h-20 scale-125 w-auto object-contain group-hover:scale-110 transition-transform"
              />
            </div>

            

            <div className="flex items-center gap-2 flex-shrink-0">
              
              {/* 💬 ไอคอนแชท (Desktop) */}
              {user && (
                <button onClick={() => navigate('/chat')} className="relative p-2 text-gray-600 hover:bg-gray-100 hover:text-primary-600 rounded-full transition-colors hidden md:block">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* 👤 โปรไฟล์ หรือ ปุ่ม Login */}
              {user ? (
                <div className="flex items-center gap-3 ml-2">
                  <button onClick={() => navigate('/profile')} className="flex items-center gap-2 p-1 pr-3 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden lg:block text-sm font-bold text-gray-700">{user.name}</span>
                  </button>
                  <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-500 hover:text-red-700 font-bold px-2 transition-colors">ออก</button>
                </div>
              ) : (
                <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 shadow-md transition-all active:scale-95">เข้าสู่ระบบ</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <main className="pt-20 pb-24 md:pb-10 min-h-screen bg-[#F8FAFC]">
        <Outlet />
      </main>

      {/* --- Mobile Bottom Nav (ปรับให้มีปุ่มตลาดสำหรับทุกคน) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex py-2 px-1 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
        <button onClick={() => navigate('/')} className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-bold">หน้าแรก</span>
        </button>
        
        <button onClick={() => navigate('/marketplace')} className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span className="text-[10px] font-bold">ตลาด</span>
        </button>

        <button onClick={() => navigate('/sell')} className="flex-1 flex flex-col items-center gap-1 relative group">
          <div className="w-12 h-12 -mt-8 bg-gradient-to-r from-primary-500 to-purple-500 transition-all rounded-full flex items-center justify-center text-white shadow-md border-4 border-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 font-bold group-hover:text-primary-600 transition-colors">ลงขาย</span>
        </button>
        
        <button onClick={() => navigate('/chat')} className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600 relative transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-4 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="text-[10px] font-bold">แชท</span>
        </button>
        
        <button onClick={() => navigate(user ? '/profile' : '/login')} className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[10px] font-bold">โปรไฟล์</span>
        </button>
      </nav>
    </div>
  );
};