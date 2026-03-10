import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Product } from '@/domain/types';
import api from '@/app/api/axiosInstance'; 

// เปลี่ยนอิโมจิเป็น SVG
const CATEGORIES = [
  { id: 'books', label: 'หนังสือ / ตำรา' },
  { id: 'electronics', label: 'อิเล็กทรอนิกส์' },
  { id: 'dorm', label: 'ของใช้หอพัก (รวมทั้งหมด)' },
  { id: 'dorm-appliance', label: 'เครื่องใช้ไฟฟ้า' },
  { id: 'dorm-bedding', label: 'เครื่องนอน' },     
  { id: 'dorm-furniture', label: 'เฟอร์นิเจอร์' },  
  { id: 'dorm-general', label: 'ของใช้ทั่วไป' },    
  { id: 'fashion', label: 'เสื้อผ้า / แฟชั่น' },
  { id: 'sports', label: 'กีฬา / Hobbies' },
  { id: 'other', label: 'อื่นๆ' }
];

interface FilterSidebarProps {
  uniFilter: string;
  setUniFilter: (value: 'all' | 'same') => void;
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (value: { min: string; max: string }) => void;
  user: { uni: string; name?: string } | null;
  navigate: NavigateFunction;
  onReset: () => void;
  onRequireLogin: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  uniFilter, setUniFilter, selectedCategories, toggleCategory, 
  priceRange, setPriceRange, user, onReset, onRequireLogin
}) => (
  <div className="space-y-6">
    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4">
      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
      ตัวกรองสินค้า
    </h3>

    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <label className="block text-sm font-bold text-gray-700 mb-3">มหาวิทยาลัย</label>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="radio" checked={uniFilter === 'all'} onChange={() => setUniFilter('all')} className="w-4 h-4 text-primary-600 focus:ring-primary-500 accent-primary-600" />
          <span className="text-sm text-gray-600 group-hover:text-primary-600 font-medium">ทุกมหาวิทยาลัย</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="radio" 
            checked={uniFilter === 'same'} 
            onChange={() => {
              if(!user) { onRequireLogin(); return; }
              setUniFilter('same');
            }} 
            className="w-4 h-4 text-primary-600 focus:ring-primary-500 accent-primary-600" 
          />
          <span className="text-sm text-gray-600 group-hover:text-primary-600 font-medium">เฉพาะมหาลัยเดียวกัน</span>
        </label>
      </div>
    </div>

    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <label className="block text-sm font-bold text-gray-700 mb-4">หมวดหมู่</label>
      <div className="space-y-1.5"> {/* 🟢 ปรับลดระยะห่างให้ไอเทมย่อยดูเป็นกลุ่มเดียวกัน */}
        {CATEGORIES.map(cat => {
          // 🟢 เช็คว่าเป็นหมวดหมู่ย่อยหรือไม่
          const isSub = cat.id.startsWith('dorm-');
          
          return (
            <label 
              key={cat.id} 
              className={`flex items-center cursor-pointer group transition-all ${
                isSub 
                  ? 'ml-6 pl-3 py-1.5 border-l-2 border-gray-100 hover:border-primary-300 gap-2.5' 
                  : 'gap-3 py-1.5'
              }`}
            >
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(cat.id)} 
                onChange={() => toggleCategory(cat.id)} 
                className={`rounded text-primary-600 focus:ring-primary-500 accent-primary-600 transition-all ${
                  isSub ? 'w-3.5 h-3.5' : 'w-4 h-4' // หมวดหมู่ย่อยปรับ Checkbox ให้เล็กลงนิดนึง
                }`} 
              />
              <span className={`font-medium transition-colors ${
                isSub 
                  ? 'text-sm text-gray-500 group-hover:text-primary-600' // หมวดหมู่ย่อยสีจะอ่อนกว่า
                  : 'text-sm text-gray-700 group-hover:text-primary-600'
              }`}>
                {cat.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>

    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <label className="block text-sm font-bold text-gray-700 mb-3">ช่วงราคา (฿)</label>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="ต่ำสุด" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 bg-gray-50 transition-all" />
        <input type="number" placeholder="สูงสุด" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 bg-gray-50 transition-all" />
      </div>
    </div>

    <button onClick={onReset} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">ล้างตัวกรองทั้งหมด</button>
  </div>
);

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); 
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState(''); 
  const [sortBy, setSortBy] = useState('latest');
  const [uniFilter, setUniFilter] = useState<'all' | 'same'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/api/products'); 
        const formatted = res.data.map((p: any) => ({
          id: p.id, name: p.name, price: p.price, imageUrl: p.image_url, uni: p.uni,
          condition: p.condition, category: p.category, description: p.description,
          sellerId: p.seller_id, status: p.status,
        }));
        setProducts(formatted);
      } catch (error) {
        console.error("Error fetching marketplace data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryId);
      let nextSelected = [...prev];

      // 🟢 กรณีที่ 1: กดที่ตัวแม่ "ของใช้หอพัก (รวมทั้งหมด)"
      if (categoryId === 'dorm') {
        const dormItems = ['dorm', 'dorm-appliance', 'dorm-bedding', 'dorm-furniture', 'dorm-general'];
        if (isSelected) {
          // ถ้าเอาตัวแม่ออก -> เอาตัวลูกออกทั้งหมด
          nextSelected = nextSelected.filter(id => !dormItems.includes(id));
        } else {
          // ถ้าติ๊กตัวแม่ -> ติ๊กตัวลูกทั้งหมด
          dormItems.forEach(id => {
            if (!nextSelected.includes(id)) nextSelected.push(id);
          });
        }
      } 
      // 🟢 กรณีที่ 2: กดที่ตัวลูก (เช่น เครื่องใช้ไฟฟ้า, เครื่องนอน)
      else if (categoryId.startsWith('dorm-')) {
        if (isSelected) {
          // ถ้าเอาตัวลูกออก 1 ตัว -> ต้องเอาติ๊กตัวแม่ออกด้วย
          nextSelected = nextSelected.filter(id => id !== categoryId && id !== 'dorm');
        } else {
          nextSelected.push(categoryId);
          // เช็คว่าถ้าผู้ใช้ไล่ติ๊กตัวลูกจนครบ 4 หมวดแล้ว -> ให้ติ๊กตัวแม่ด้วย
          const allSubs = ['dorm-appliance', 'dorm-bedding', 'dorm-furniture', 'dorm-general'];
          const isAllSubsSelected = allSubs.every(sub => nextSelected.includes(sub));
          if (isAllSubsSelected && !nextSelected.includes('dorm')) {
            nextSelected.push('dorm');
          }
        }
      } 
      // 🟢 กรณีที่ 3: หมวดหมู่อื่นๆ ทั่วไป (ทำงานแบบปกติ)
      else {
        if (isSelected) {
          nextSelected = nextSelected.filter(id => id !== categoryId);
        } else {
          nextSelected.push(categoryId);
        }
      }

      return nextSelected;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm(''); setUniFilter('all'); setSelectedCategories([]); setPriceRange({min: '', max: ''}); setSortBy('latest');
  };

  // 🟢 ลอจิกการกรองที่อัปเดตใหม่
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    
    if (searchTerm.trim() !== '') {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (uniFilter === 'same' && user) {
      result = result.filter(p => p.uni === user.uni);
    }
    
    // 🟢 ถ้าเลือกหมวดหมู่ ให้เช็คถึงหมวดหมู่ย่อยด้วย
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.some(cat => {
        // ถ้าเลือก dorm (รวมทั้งหมด) ให้ค้นหาทั้ง dorm เดี่ยวๆ และ dorm-xxx ทั้งหมด
        if (cat === 'dorm') {
          return p.category === 'dorm' || p.category?.startsWith('dorm-');
        }
        return p.category === cat;
      }));
    }
    
    const min = Number(priceRange.min); 
    const max = Number(priceRange.max);
    if (min > 0) result = result.filter(p => p.price >= min);
    if (max > 0) result = result.filter(p => p.price <= max);

    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      default: result.sort((a, b) => b.id - a.id); break; 
    }
    return result;
  }, [products, searchTerm, uniFilter, selectedCategories, priceRange, sortBy, user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative animate-[slideIn_0.3s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <nav className="text-sm text-gray-500 mb-2 flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors font-medium">หน้าแรก</button> 
            <span>/</span> 
            <span className="text-gray-800 font-bold">ตลาดสินค้า</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            ตลาดสินค้า
          </h1>
          <p className="text-gray-500 mt-1">พบสินค้าทั้งหมด <span className="font-bold text-primary-600">{filteredAndSortedProducts.length}</span> รายการ</p>
        </div>
        
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:border-primary-400 focus:ring-4 focus:ring-primary-50 outline-none text-sm font-bold text-gray-700 cursor-pointer transition-all">
          <option value="latest">เรียงตาม: ลงล่าสุด</option>
          <option value="price_asc">ราคา: ต่ำสุด - สูงสุด</option>
          <option value="price_desc">ราคา: สูงสุด - ต่ำสุด</option>
        </select>
      </div>

      <div className="mb-8 relative group">
         <input 
            type="text" placeholder="ค้นหาสินค้า เช่น หนังสือ, ไอแพด..."
            className="w-full pl-14 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm focus:border-primary-400 focus:ring-4 focus:ring-primary-50 outline-none transition-all text-gray-700 font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
         />
         <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </span>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 self-start">
          <FilterSidebar uniFilter={uniFilter} setUniFilter={setUniFilter} selectedCategories={selectedCategories} toggleCategory={toggleCategory} priceRange={priceRange} setPriceRange={setPriceRange} user={user} navigate={navigate} onReset={handleResetFilters} onRequireLogin={() => setShowLoginModal(true)} />
        </aside>

        <div className="flex-1">
          <button onClick={() => setIsMobileFilterOpen(true)} className="lg:hidden w-full mb-6 py-3.5 bg-white rounded-2xl border border-gray-200 font-bold text-gray-700 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> 
            ปรับแต่งตัวกรอง
          </button>

          {(selectedCategories.length > 0 || uniFilter === 'same' || searchTerm) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchTerm && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200 shadow-sm">ค้นหา: "{searchTerm}" <button onClick={() => setSearchTerm('')} className="hover:text-red-500 ml-1 transition-colors text-base leading-none">×</button></span>}
              {uniFilter === 'same' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-bold border border-primary-100 shadow-sm">มหาลัยเดียวกัน <button onClick={() => setUniFilter('all')} className="hover:text-red-500 ml-1 transition-colors text-base leading-none">×</button></span>}
              {selectedCategories.map(catId => {
                const catInfo = CATEGORIES.find(c => c.id === catId);
                return <span key={catId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-bold border border-primary-100 shadow-sm">{catInfo?.label} <button onClick={() => toggleCategory(catId)} className="hover:text-red-500 ml-1 transition-colors text-base leading-none">×</button></span>
              })}
              <button onClick={handleResetFilters} className="text-xs text-gray-400 hover:text-red-500 font-medium px-2 underline transition-colors">ล้างทั้งหมด</button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredAndSortedProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => navigate(`/product/${product.id}`)} 
                  className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full transform-gpu z-0"
                >
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-gray-100 pointer-events-none z-10 transition-colors"></div>

                  <div className="relative aspect-square bg-gray-50 overflow-hidden rounded-t-2xl z-0 isolate" style={{ transform: 'translateZ(0)' }}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className={`w-full h-full object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-110 ${product.status === 'sold' ? 'grayscale opacity-60' : ''}`} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }} 
                    />
                    {product.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] rounded-t-2xl z-10">
                        <span className="bg-red-500 text-white font-black px-4 py-2 rounded-xl text-lg transform -rotate-12 border-2 border-white shadow-lg">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between z-10">
                       <span className="bg-white/90 backdrop-blur-sm text-primary-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm truncate max-w-[80%] border border-primary-100/50">
                        {product.uni}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1 bg-white rounded-b-2xl relative z-0">
                    <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3 font-medium">{product.condition}</p>
                    <div className="mt-auto flex items-end justify-between">
                      <span className="text-lg md:text-xl font-black text-primary-600">
                        ฿{product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบสินค้าที่คุณตามหา</h3>
              <p className="text-gray-500 mb-6">ลองล้างตัวกรองหรือเปลี่ยนคำค้นหาดูนะ</p>
              <button onClick={handleResetFilters} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">ล้างตัวกรองทั้งหมด</button>
            </div>
          )}
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-surface-50 p-6 overflow-y-auto shadow-2xl animate-[slideIn_0.3s_ease-out]">
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-black text-2xl text-gray-800 flex items-center gap-2">ตัวกรอง</h3>
               <button onClick={() => setIsMobileFilterOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors rounded-full text-gray-600 font-bold">&times;</button>
             </div>
             <FilterSidebar uniFilter={uniFilter} setUniFilter={setUniFilter} selectedCategories={selectedCategories} toggleCategory={toggleCategory} priceRange={priceRange} setPriceRange={setPriceRange} user={user} navigate={navigate} onReset={handleResetFilters} onRequireLogin={() => { setIsMobileFilterOpen(false); setShowLoginModal(true); }} />
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-200 text-gray-500 transition-colors font-bold">✕</button>
            <div className="text-center mb-6 mt-2">
              <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800">เข้าสู่ระบบก่อนนะ</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed font-medium">ฟีเจอร์นี้สงวนสิทธิ์ไว้สำหรับ<br/>นักศึกษาที่เข้าสู่ระบบแล้วเท่านั้น</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setShowLoginModal(false); navigate('/login'); }} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all active:scale-95 text-lg">ไปหน้าเข้าสู่ระบบ</button>
              <button onClick={() => setShowLoginModal(false)} className="w-full py-3.5 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all">ไว้คราวหลัง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};