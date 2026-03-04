import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';
import { Product } from '@/domain/types';

// 🟢 เปลี่ยนจาก Emoji เป็น SVG Icons แบบมินิมอล
const QUICK_CATEGORIES = [
  { 
    id: 'electronics', name: 'ไอที & แกดเจ็ต', color: 'from-blue-400 to-blue-600',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  },
  { 
    id: 'books', name: 'หนังสือเรียน', color: 'from-orange-400 to-orange-600',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  },
  { 
    id: 'dorm', name: 'ของใช้หอพัก', color: 'from-teal-400 to-teal-600',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  },
  { 
    id: 'fashion', name: 'เสื้อผ้าแฟชั่น', color: 'from-pink-400 to-pink-600',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const res = await api.get('/api/products');
        const formatted = res.data.map((p: any) => ({
          id: p.id, name: p.name, price: p.price, imageUrl: p.image_url, uni: p.uni, status: p.status,
        }));
        
        const availableLatest = formatted
          .filter((p: Product) => p.status !== 'sold')
          .sort((a: Product, b: Product) => b.id - a.id)
          .slice(0, 4);
          
        setRecentProducts(availableLatest);
      } catch (error) {
        console.error("Failed to fetch recent products", error);
      }
    };
    fetchRecentProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden selection:bg-primary-200">
      
      {/* 🌟 1. Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 flex flex-col items-center justify-center min-h-[90vh]">
        
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-400/30 to-purple-400/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-pink-400/20 to-orange-400/20 rounded-full blur-[150px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center max-w-5xl mx-auto px-4 relative z-10 animate-[slideIn_0.5s_ease-out]">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-primary-500/10 mb-8 hover:scale-105 transition-transform">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-700 tracking-wide">พื้นที่ซื้อขายของมือสองสำหรับนักศึกษา</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-black text-gray-900 tracking-tight leading-[1.1] mb-8 select-none">
            เปลี่ยนของในหอ <br className="hidden md:block"/>
            ให้กลายเป็น <br className="md:hidden"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 relative inline-block">
              เงินทุนหมุนเวียน
              <svg className="absolute w-full h-4 -bottom-1 left-0 text-pink-400/50" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"/></svg>
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            ซื้อขายหนังสือเรียน ไอแพด หรือของใช้หอพัก ปลอดภัย มั่นใจได้ เพราะ <span className="text-gray-800 font-bold">ยืนยันตัวตนด้วยบัตรนักศึกษา</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button 
              onClick={() => navigate(user ? '/marketplace' : '/login')}
              className="w-full sm:w-auto px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-bold text-lg hover:bg-primary-600 transition-all duration-300 shadow-2xl shadow-gray-900/30 hover:-translate-y-1 flex items-center justify-center gap-3 group"
            >
              {user ? 'เข้าสู่ตลาดสินค้า' : 'เริ่มต้นใช้งานฟรี'}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            {/* <button 
              onClick={() => navigate('/marketplace')}
              className="w-full sm:w-auto px-10 py-5 bg-white/80 backdrop-blur-md text-gray-800 border border-gray-200 rounded-[1.5rem] font-bold text-lg hover:bg-white hover:border-primary-300 hover:text-primary-600 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg shadow-gray-200/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              สำรวจสินค้า
            </button> */}
          </div>
        </div>
      </section>

      {/* 🎯 2. Quick Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_CATEGORIES.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => navigate('/marketplace')}
              className="bg-white rounded-[2rem] p-8 text-center cursor-pointer shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group border border-gray-100"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 🔥 3. Live Preview Section */}
      {recentProducts.length > 0 && (
        <section className="py-20 relative z-10 -mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    สินค้ามาใหม่ล่าสุด
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </h2>
                  <p className="text-gray-500 font-medium mt-2">อัปเดตแบบเรียลไทม์จากนักศึกษา</p>
                </div>
                <button onClick={() => navigate('/marketplace')} className="hidden sm:flex font-bold text-primary-600 hover:text-primary-800 transition-colors items-center gap-1 group">
                  ดูทั้งหมด <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {recentProducts.map(product => (
                  <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="bg-white rounded-3xl p-3 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
                    <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-50 mb-4">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }} />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/50">
                        <span className="text-[10px] font-black text-primary-700 uppercase">{product.uni}</span>
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1 mb-1 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                      <p className="text-xl font-black text-primary-600">฿{product.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 🎯 4. Feature Section */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">ตอบโจทย์ชีวิตเด็กมหาลัย</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/10 rotate-3 group-hover:scale-110">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">ปลอดภัย ไร้มิจฉาชีพ</h3>
              <p className="text-gray-500 leading-relaxed">ระบบยืนยันตัวตนด้วยอีเมลสถาบัน มั่นใจได้ว่ากำลังซื้อขายกับเพื่อนร่วมมหาวิทยาลัยจริงๆ</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-green-500/10 -rotate-3 group-hover:scale-110">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">เซฟเงินในกระเป๋า</h3>
              <p className="text-gray-500 leading-relaxed">ประหยัดค่าใช้จ่ายด้วยสินค้ามือสองสภาพดี ในราคาที่ถูกกว่าของใหม่เกินครึ่ง</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-orange-500/10 rotate-3 group-hover:scale-110">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">แชทนัดรับ ง่ายนิดเดียว</h3>
              <p className="text-gray-500 leading-relaxed">ทักแชทคุยกับผู้ขายได้โดยตรงผ่านระบบ นัดเจอที่โรงอาหารหรือหอสมุดได้ทันที</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 5. Bottom CTA */}
      <section className="py-10 px-4 mb-20">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-500 to-purple-600 rounded-full blur-[100px] opacity-40 -mr-40 -mt-40 mix-blend-screen animate-pulse"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">เริ่มส่งต่อความคุ้มค่า วันนี้</h2>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              อัปโหลดรูปภาพ ตั้งราคา และโพสต์ขายสินค้าของคุณได้ภายในไม่กี่นาที
            </p>
            <button 
              onClick={() => navigate(user ? '/sell' : '/register')}
              className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-primary-50 transition-all duration-300 hover:scale-105 shadow-xl flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              {user ? 'ลงขายสินค้าใหม่' : 'สมัครสมาชิกเพื่อลงขาย'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-10 border-t border-gray-100 text-center pb-20">
        <div className="flex items-center justify-center gap-2 mb-4 text-2xl font-black text-gray-900 tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 text-white rounded-lg flex items-center justify-center text-sm shadow-md">U</div>
          UniShare.
        </div>
        <p className="text-gray-400 font-medium flex items-center justify-center gap-1.5 text-sm">
          Designed with IT Squad
          {/* <svg className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> */}
          
        </p>
      </footer>

    </div>
  );
};