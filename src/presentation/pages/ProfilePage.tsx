import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance'; 
import Swal from 'sweetalert2';
import { Product } from '@/domain/types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();
  
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUni, setEditUni] = useState('');

  // 🟢 States สำหรับแก้ไขสินค้า
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCondition, setEditProdCondition] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdImageFile, setEditProdImageFile] = useState<File | null>(null);
  const [editProdImagePreview, setEditProdImagePreview] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setEditName(user.name || '');
      setEditUni(user.uni || '');
      fetchMyProducts(); 
    }
  }, [user, navigate]);

  const fetchMyProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/products');
      const formattedProducts: Product[] = res.data.map((p: any) => ({
        id: p.id, name: p.name, price: p.price, imageUrl: p.image_url, uni: p.uni,
        condition: p.condition, category: p.category, description: p.description,
        sellerId: p.seller_id, status: p.status,
      }));

      const filtered = formattedProducts
        .filter(p => p.sellerId != null && user?.id != null && String(p.sellerId) === String(user.id))
        .sort((a, b) => b.id - a.id);
        
      setMyProducts(filtered);
    } catch (error) { 
      console.error("Failed to fetch products:", error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    const result = await Swal.fire({
      title: 'ลบสินค้านี้?', text: `คุณแน่ใจหรือไม่ที่จะลบ "${productName}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ใช่, ลบเลย', cancelButtonText: 'ยกเลิก', reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'กำลังลบ...', didOpen: () => Swal.showLoading() });
        await api.delete(`/api/products/${productId}`);
        setMyProducts(prev => prev.filter(p => p.id !== productId));
        Swal.fire('ลบสำเร็จ', 'สินค้าของคุณถูกลบออกจากระบบแล้ว', 'success');
      } catch (error) { Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบสินค้าได้', 'error'); }
    }
  };

  const handleMarkAsSold = async (productId: number, productName: string) => {
    const result = await Swal.fire({
      title: 'ปิดการขายสินค้านี้?', text: `เปลี่ยนสถานะ "${productName}" เป็นขายแล้วใช่หรือไม่?`, icon: 'question',
      showCancelButton: true, confirmButtonColor: '#22c55e', cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ใช่, ขายแล้ว', cancelButtonText: 'ยกเลิก', reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'กำลังอัปเดต...', didOpen: () => Swal.showLoading() });
        await api.put(`/api/products/${productId}/sold`);
        setMyProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'sold' } : p));
        Swal.fire('สำเร็จ', 'เปลี่ยนสถานะสินค้าเป็นขายแล้วเรียบร้อย', 'success');
      } catch (error) { Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้', 'error'); }
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ?', text: "คุณต้องการออกจากระบบใช่หรือไม่?", icon: 'question',
      showCancelButton: true, confirmButtonColor: '#4f46e5', confirmButtonText: 'ออกจากระบบ', cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) { logout(); navigate('/'); }
    });
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อด้วยครับ', 'warning'); return; }
    try {
      Swal.fire({ title: 'กำลังบันทึกข้อมูล...', didOpen: () => Swal.showLoading() });
      await api.put(`/api/users/${user?.id}`, { name: editName });
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        storedUser.name = editName; 
        localStorage.setItem('user', JSON.stringify(storedUser)); 
      }
      if (user && login) {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        login({ ...user, name: editName }, token); 
      }
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว', confirmButtonColor: '#22c55e', timer: 1500, showConfirmButton: false }).then(() => { setShowEditProfileModal(false); });
    } catch (error) { Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตโปรไฟล์ได้', 'error'); }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProdName(product.name);
    setEditProdPrice(String(product.price));
    setEditProdCondition(product.condition || 'สภาพดี (80%-90%)');
    setEditProdCategory(product.category || 'other');
    setEditProdDesc(product.description || '');
    setEditProdImagePreview(product.imageUrl); 
    setEditProdImageFile(null); 
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditProdImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProdImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;
    if (!editProdName || !editProdPrice) { Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและราคาให้ครบถ้วน', 'warning'); return; }

    try {
      Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
      
      let finalImageUrl = editingProduct.imageUrl;

      if (editProdImageFile) {
        const formData = new FormData();
        formData.append('file', editProdImageFile);
        const uploadRes = await api.post('/api/upload', formData);
        finalImageUrl = uploadRes.data.url;
      }

      await api.put(`/api/products/${editingProduct.id}`, {
        name: editProdName,
        price: Number(editProdPrice),
        condition: editProdCondition,
        category: editProdCategory,
        description: editProdDesc,
        image_url: finalImageUrl 
      });

      setMyProducts(prev => prev.map(p => p.id === editingProduct.id ? { 
        ...p, name: editProdName, price: Number(editProdPrice), 
        condition: editProdCondition, category: editProdCategory, 
        description: editProdDesc, imageUrl: finalImageUrl 
      } : p));

      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'แก้ไขข้อมูลสินค้าเรียบร้อย', confirmButtonColor: '#22c55e', timer: 1500, showConfirmButton: false });
      setEditingProduct(null);
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขสินค้าได้', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 relative">
      
      {/* Profile Header */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mb-8 relative">
        <div className="h-32 md:h-40 w-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-600 relative overflow-hidden">
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>
        
        <div className="px-6 md:px-8 pb-8">
          <div className="flex justify-between items-start">
            <div className="-mt-12 md:-mt-16 relative z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white p-1.5 shadow-md">
                 <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center text-white text-4xl md:text-5xl font-black uppercase shadow-inner border-[3px] border-white">
                   {user.name ? user.name.charAt(0) : 'U'}
                 </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(user.role === 'admin' || user.email === 'tarn@unishare.ac.th') && (
                <button onClick={() => navigate('/admin')} className="px-4 py-2 md:px-5 md:py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2 border border-slate-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> ระบบหลังบ้าน
                </button>
              )}
              <button onClick={() => setShowEditProfileModal(true)} className="px-4 py-2 md:px-5 md:py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-full font-bold text-gray-700 text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> แก้ไขโปรไฟล์
              </button>
              <button onClick={handleLogout} className="px-4 py-2 md:px-5 md:py-2.5 bg-red-50 border border-red-100 hover:bg-red-100 rounded-full font-bold text-red-500 text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> ออกจากระบบ
              </button>
            </div>
          </div>

          <div className="mt-6 md:mt-8 px-2">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
              <span className="px-4 py-2 bg-primary-50 text-primary-700 font-bold text-sm rounded-full border border-primary-100 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> {user.uni}
              </span>
              <span className="px-4 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-full border border-green-100 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ยืนยันตัวตนแล้ว
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards (ปรับเหลือ 3 กล่อง) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-gray-100">
          <p className="text-4xl font-black text-primary-600 mb-1">{myProducts.length}</p>
          <p className="text-sm font-bold text-gray-500">สินค้าลงขาย</p>
        </div>
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-gray-100">
          <p className="text-4xl font-black text-green-500 mb-1">{myProducts.filter(p => p.status === 'sold').length}</p>
          <p className="text-sm font-bold text-gray-500">ขายแล้ว</p>
        </div>
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="text-3xl text-yellow-400 mb-1"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></div>
          <p className="text-sm font-bold text-gray-500">สถานะผู้ขาย</p>
        </div>
      </div>

      {/* สินค้าของฉัน (เอา Tab ออก) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h2 className="text-lg font-bold text-gray-800">สินค้าของฉัน</h2>
        </div>

        <div className="p-6 md:p-8 min-h-[400px]">
          <div className="animate-[slideIn_0.3s_ease-out]">
            {isLoading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
            ) : myProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {myProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                      <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${product.status === 'sold' ? 'grayscale opacity-60' : ''}`} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }} />
                      {product.status === 'sold' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="bg-red-500 text-white font-black px-4 py-1.5 rounded-lg text-sm border-2 border-white shadow-lg transform -rotate-12">SOLD OUT</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
                      <p className="text-xl font-black text-primary-600 mb-4">฿{product.price.toLocaleString()}</p>
                      <div className="mt-auto flex gap-1.5 flex-wrap">
                        {product.status !== 'sold' ? (
                          <button onClick={() => handleMarkAsSold(product.id, product.name)} className="flex-1 py-2 bg-green-50 text-green-600 font-bold text-[11px] lg:text-xs rounded-xl hover:bg-green-500 hover:text-white transition-colors border border-green-200 flex items-center justify-center gap-1 min-w-[30%]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> ปิดการขาย
                          </button>
                        ) : (
                          <button onClick={() => navigate(`/product/${product.id}`)} className="flex-1 py-2 bg-gray-50 text-gray-700 font-bold text-[11px] lg:text-xs rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-1 min-w-[30%]">ดูสินค้า</button>
                        )}
                        <button onClick={() => openEditProductModal(product)} className="w-10 flex items-center justify-center bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-blue-100 flex-shrink-0" title="แก้ไขสินค้า">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id, product.name)} className="w-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 flex-shrink-0" title="ลบสินค้านี้">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                 <div className="text-5xl mb-4 text-gray-300 flex justify-center"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                 <p className="text-gray-500 mb-6 font-medium">คุณยังไม่ได้ลงขายสินค้าในระบบครับ</p>
                 <button onClick={() => navigate('/sell')} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 mx-auto">
                   ลงขายสินค้าชิ้นแรก <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 🟢 Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-[slideIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              แก้ไขสินค้า
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">รูปภาพสินค้า</label>
                <div className="relative h-48 w-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all group">
                  <input type="file" accept="image/*" onChange={handleEditImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <img src={editProdImagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold bg-blue-600 px-4 py-2 rounded-xl text-sm">เปลี่ยนรูปภาพ</span>
                  </div>
                </div>
              </div>

              <div>
                 <label className="text-sm font-bold text-gray-600 mb-1 block">ชื่อสินค้า</label>
                 <input type="text" value={editProdName} onChange={e => setEditProdName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 focus:border-blue-400 outline-none rounded-xl bg-gray-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-sm font-bold text-gray-600 mb-1 block">ราคา (บาท)</label>
                   <input type="number" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} className="w-full px-4 py-3 border border-gray-200 focus:border-blue-400 outline-none rounded-xl bg-gray-50" />
                </div>
                <div>
                   <label className="text-sm font-bold text-gray-600 mb-1 block">หมวดหมู่</label>
                   <select value={editProdCategory} onChange={e => setEditProdCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-200 focus:border-blue-400 outline-none rounded-xl bg-gray-50 cursor-pointer">
                     <option value="electronics">ไอที & อิเล็กทรอนิกส์</option>
                     <option value="books">หนังสือ & ตำราเรียน</option>
                     <option value="dorm">ของใช้หอพัก</option>
                     <option value="fashion">เสื้อผ้า & แฟชั่น</option>
                     <option value="sports">กีฬา / Hobbies</option>
                     <option value="other">อื่นๆ</option>
                   </select>
                </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-600 mb-1 block">สภาพสินค้า</label>
                 <select value={editProdCondition} onChange={e => setEditProdCondition(e.target.value)} className="w-full px-4 py-3 border border-gray-200 focus:border-blue-400 outline-none rounded-xl bg-gray-50 cursor-pointer">
                   <option value="มือหนึ่ง (ยังไม่แกะซีล)">มือหนึ่ง (ยังไม่แกะซีล)</option>
                   <option value="สภาพดีเหมือนใหม่ (95%+)">สภาพดีเหมือนใหม่ (95%+)</option>
                   <option value="สภาพดี (80%-90%)">สภาพดี (80%-90%)</option>
                   <option value="มีตำหนิเล็กน้อย (ใช้งานได้ปกติ)">มีตำหนิเล็กน้อย (ใช้งานได้ปกติ)</option>
                 </select>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-600 mb-1 block">รายละเอียดเพิ่มเติม</label>
                 <textarea rows={3} value={editProdDesc} onChange={e => setEditProdDesc(e.target.value)} className="w-full px-4 py-3 border border-gray-200 focus:border-blue-400 outline-none rounded-xl bg-gray-50 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">ยกเลิก</button>
              <button onClick={handleSaveProductEdit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">บันทึกการแก้ไข</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowEditProfileModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800"><svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> แก้ไขโปรไฟล์</h2>
            <div className="space-y-5">
              <div><label className="text-sm font-bold text-gray-600 mb-2 block">ชื่อที่แสดง</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 focus:border-primary-400 outline-none rounded-xl bg-gray-50 transition-all" /></div>
              <div><label className="text-sm font-bold text-gray-600 mb-2 block">มหาวิทยาลัย (แก้ไขไม่ได้)</label><input type="text" value={editUni} disabled className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed" /></div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowEditProfileModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">ยกเลิก</button>
              <button onClick={handleSaveProfile} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};