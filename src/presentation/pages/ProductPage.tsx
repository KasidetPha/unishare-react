import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';
import { Product } from '@/domain/types';
import Swal from 'sweetalert2';

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/products/${id}`);
        
        const p = res.data;
        const formattedProduct: Product = {
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.image_url,
          uni: p.uni,
          condition: p.condition,
          category: p.category,
          description: p.description,
          sellerId: p.seller_id,
          status: p.status,
        };
        
        setProduct(formattedProduct);
      } catch (error) {
        console.error("Failed to fetch product detail:", error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProductDetail();
  }, [id]);

  const handleMarkAsSold = async () => {
    const result = await Swal.fire({
      title: 'ปิดการขายสินค้านี้?',
      text: `เปลี่ยนสถานะเป็นขายแล้วใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e', 
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed && product) {
      try {
        Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
        await api.put(`/api/products/${product.id}/sold`);
        setProduct({ ...product, status: 'sold' });
        Swal.fire('สำเร็จ', 'เปลี่ยนสถานะสินค้าเป็นขายแล้วเรียบร้อย', 'success');
      } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้', 'error');
      }
    }
  };

  const handleChatAndInquire = async () => {
    if (!user) {
      Swal.fire('การแจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนทำการแชท', 'info').then(() => navigate('/login'));
      return;
    }

    const { value: messageText } = await Swal.fire({
      title: 'สอบถามผู้ขาย',
      input: 'textarea',
      inputLabel: `คุณกำลังสอบถาม: ${product?.name}`,
      inputPlaceholder: 'พิมพ์ข้อความที่ต้องการสอบถาม...',
      inputAttributes: {
        'aria-label': 'พิมพ์ข้อความที่นี่'
      },
      showCancelButton: true,
      confirmButtonText: 'ส่งข้อความ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#4f46e5',
      inputValidator: (value) => {
        if (!value) {
          return 'กรุณาพิมพ์ข้อความก่อนส่ง';
        }
      }
    });

    if (messageText && product) {
      try {
        Swal.fire({ title: 'กำลังส่งข้อความ...', didOpen: () => Swal.showLoading() });

        const productLink = `${window.location.origin}/product/${product.id}`;
        const finalMessage = `[อ้างอิงสินค้า: ${product.name} - ฿${product.price.toLocaleString()}]\n${productLink}\n\n${messageText}`;

        await api.post('/api/messages', {
          sender_id: user.id,
          receiver_id: product.sellerId,
          content: finalMessage
        });

        Swal.fire({
          icon: 'success',
          title: 'ส่งข้อความสำเร็จ',
          text: 'ระบบได้ส่งคำถามของคุณไปยังผู้ขายแล้ว',
          confirmButtonColor: '#4f46e5'
        }).then(() => {
          navigate('/chat', { state: { targetUserId: product.sellerId } });
        });

      } catch (error) {
        console.error("Failed to send message:", error);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500">กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">ไม่พบสินค้านี้</h1>
        <p className="text-gray-500 mb-8">สินค้าอาจถูกลบไปแล้ว หรือ URL ไม่ถูกต้อง</p>
        <button onClick={() => navigate('/marketplace')} className="px-6 py-3 bg-primary-600 text-white rounded-full font-bold">
          กลับไปตลาดสินค้า
        </button>
      </div>
    );
  }

  const isOwner = user && String(user.id) === String(product.sellerId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors">หน้าแรก</button> 
        <span>/</span> 
        <button onClick={() => navigate('/marketplace')} className="hover:text-primary-600 transition-colors">ตลาดสินค้า</button>
        <span>/</span> 
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </nav>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* รูปภาพสินค้า */}
        <div className="md:w-1/2 p-6 bg-gray-50 flex items-center justify-center relative">
          <div className="w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 relative">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className={`w-full h-full object-contain p-4 transition-all duration-500 ${product.status === 'sold' ? 'grayscale opacity-50' : ''}`}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }}
            />
            {product.status === 'sold' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <span className="bg-red-500 text-white font-black px-8 py-3 rounded-2xl text-3xl transform -rotate-12 border-4 border-white shadow-2xl tracking-widest">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>
        </div>

        {/* รายละเอียดสินค้า */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col">
          
          {isOwner && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                สินค้าของคุณ
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
          <p className="text-4xl font-black text-primary-600 mb-6">฿{product.price.toLocaleString()}</p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
               {product.condition}
            </span>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
               {product.category}
            </span>
            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
               {product.uni}
            </span>
          </div>

          <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl mb-8 bg-gray-50">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
              {isOwner ? user.name.charAt(0) : 'ผ'}
            </div>
            <div>
              <p className="font-bold text-gray-800 flex items-center gap-1">
                {isOwner ? user.name : `ผู้ใช้ ID: ${product.sellerId}`} 
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-2">ยืนยันตัวตนแล้ว</span>
              </p>
              <p className="text-sm text-gray-500">{product.uni}</p>
            </div>
          </div>

          <div className="mb-8 flex-1">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">รายละเอียดสินค้า</h3>
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 text-sm leading-relaxed border border-gray-100 whitespace-pre-wrap">
              {product.description || "ไม่ได้ระบุรายละเอียดเพิ่มเติม ผู้ซื้อสามารถแชทสอบถามผู้ขายได้โดยตรง"}
            </div>
          </div>

          {/* ปุ่ม Action ด้านล่างสุด */}
          <div className="mt-auto">
            {isOwner ? (
              product.status !== 'sold' ? (
                <button 
                  onClick={handleMarkAsSold}
                  className="w-full py-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-bold hover:bg-green-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  ปิดการขาย
                </button>
              ) : (
                <button 
                  disabled
                  className="w-full py-4 bg-gray-100 text-gray-400 border-2 border-gray-200 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  สินค้านี้ถูกขายไปแล้ว
                </button>
              )
            ) : (
              <button 
                onClick={handleChatAndInquire} 
                disabled={product.status === 'sold'}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-lg shadow-lg ${
                  product.status === 'sold' 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:opacity-90 transform active:scale-95 shadow-primary-600/30'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {product.status === 'sold' ? 'ขายแล้ว (Sold Out)' : 'ทักแชทสอบถามผู้ขาย'}
              </button>
            )}
          </div>

          {product.status !== 'sold' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex gap-3 text-sm text-yellow-800">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p>เพื่อความปลอดภัย ควรพบเจอผู้ขายในที่สาธารณะภายในมหาวิทยาลัย และตรวจสอบสินค้าก่อนชำระเงินทุกครั้ง</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};