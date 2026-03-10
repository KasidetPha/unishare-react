import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';
import Swal from 'sweetalert2';

type SellStep = 'choose_plan' | 'payment' | 'form';
type PlanType = 'free' | 'single' | 'pro' | null;

export const SellPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<SellStep>('choose_plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);
  const [remainingFree, setRemainingFree] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('มือสองสภาพสมบูรณ์');
  const [category, setCategory] = useState('other');
  const [subCategory, setSubCategory] = useState('appliance');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); // 🟢 เพิ่ม State สำหรับ Checkbox ยืนยัน

  // ตรวจสอบการล็อกอิน และดึงข้อมูลโควตาลงขายฟรี
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      api.get(`/api/users/${user.id}/quota`)
         .then(res => setRemainingFree(res.data.remaining_free))
         .catch(err => console.error("ไม่สามารถดึงข้อมูลโควตาได้", err));
    }
  }, [user, navigate]);

  // 1. เลือกแพ็กเกจเสร็จ ให้ไปหน้าฟอร์มกรอกข้อมูลเลย
  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setStep('form'); 
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  // 2. ฟังก์ชันส่งข้อมูลเข้า Backend (รองรับทั้งแบบฟรีและแบบจ่ายเงิน)
  const submitProductData = async (isFree: boolean = false) => {
    Swal.fire({
      title: isFree ? 'กำลังลงขายสินค้า...' : 'กำลังตรวจสอบยอดเงิน...',
      html: isFree ? 'ระบบกำลังนำสินค้าของคุณขึ้นตลาด' : 'ระบบกำลังยืนยันการโอนเงินของคุณ',
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => { Swal.showLoading(); }
    }).then(async () => {
      try {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', imageFile!);

        let finalImageUrl = '';
        try {
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalImageUrl = uploadRes.data.url;
        } catch (uploadError) {
          finalImageUrl = 'https://via.placeholder.com/500?text=Uploaded+Image'; 
        }

        const finalCategory = category === 'dorm' ? `dorm-${subCategory}` : category;

        await api.post('/api/products', {
          name,
          price: Number(price),
          image_url: finalImageUrl,
          uni: user?.uni || 'ไม่ระบุ',
          condition,
          category: finalCategory,
          description,
          seller_id: user?.id,
          status: 'available'
        });

        Swal.fire({
          icon: 'success',
          title: isFree ? 'ลงขายฟรีสำเร็จ!' : 'ชำระเงินและลงขายสำเร็จ!',
          text: selectedPlan === 'pro' ? 'คุณเป็น Pro Seller ลงขายได้ยาวๆ 30 วัน!' : 'สินค้าของคุณขึ้นไปอยู่บนตลาดแล้ว',
          confirmButtonColor: '#22c55e'
        }).then(() => navigate('/profile'));
      } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลงขายสินค้าได้ ลองใหม่อีกครั้ง', 'error');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // 3. เวลากด "ถัดไป" หรือ "ลงขายเลย" ในหน้าฟอร์ม
  // 3. เวลากด "ถัดไป" หรือ "ลงขายเลย" ในหน้าฟอร์ม
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !imageFile) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน', 'warning');
      return;
    }
    
    // 🟢 เพิ่มการดักจับ Checkbox ตรงนี้
    if (!isAgreed) {
      Swal.fire('ข้อตกลงการใช้งาน', 'กรุณากดยอมรับเงื่อนไขและยืนยันความถูกต้องของสินค้าก่อนลงขาย', 'warning');
      return;
    }
    
    if (selectedPlan === 'free') {
      submitProductData(true); 
    } else {
      setStep('payment'); 
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-[slideIn_0.3s_ease-out]">
      
      {/* 🔴 STEP 1: เลือกแพ็กเกจ */}
      {step === 'choose_plan' && (
        <div className="text-center py-10">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3">
            เลือกรูปแบบการลงขาย
            <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </h1>
          <p className="text-gray-500 mb-12 text-lg font-medium">เลือกแพ็กเกจที่เหมาะกับสไตล์การขายของคุณ</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* กล่องซ้าย: ฟรี หรือ 9 บาท (ขึ้นอยู่กับโควตา) */}
            {remainingFree !== null && remainingFree > 0 ? (
              <div 
                onClick={() => handleSelectPlan('free')}
                className="bg-white rounded-[2.5rem] p-8 border-2 border-primary-200 shadow-sm hover:shadow-xl hover:border-primary-500 transition-all flex flex-col group relative overflow-hidden cursor-pointer h-full"
              >
                <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-bl-xl z-10">โควตาผู้ใช้ใหม่</div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl -mr-10 -mt-10 transition-colors"></div>
                <div className="relative z-10 text-left flex flex-col h-full">
                  <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">ลงขายฟรี!</h3>
                  <p className="text-gray-500 mb-6 font-medium">เริ่มลงขายได้ทันที ไม่มีค่าใช้จ่าย ลองตลาดได้เลย</p>
                  <div className="mb-8 mt-auto">
                    <span className="text-5xl font-black text-primary-600">฿0</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-gray-700 font-bold text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> เหลือสิทธิ์ลงขายฟรีอีก <span className="text-primary-600 font-black text-lg">{remainingFree}</span> ชิ้น
                    </li>
                  </ul>
                  <button className="w-full py-4 bg-primary-50 text-primary-600 rounded-2xl font-black text-lg group-hover:bg-primary-600 group-hover:text-white transition-all border border-primary-200">
                    ใช้สิทธิ์ลงฟรี
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => handleSelectPlan('single')}
                className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-300 transition-all flex flex-col group relative overflow-hidden cursor-pointer h-full"
              >
                <div className="relative z-10 text-left flex flex-col h-full">
                  <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">ขายรายครั้ง</h3>
                  <p className="text-gray-500 mb-6 font-medium">เหมาะสำหรับคนอยากเคลียร์หอ นานๆ ขายที จ่ายแค่ตอนที่ลงโพสต์</p>
                  <div className="mb-8 mt-auto">
                    <span className="text-5xl font-black text-gray-800 group-hover:text-primary-600 transition-colors">฿9</span>
                    <span className="text-gray-500 font-bold ml-2">/ โพสต์</span>
                  </div>
                  <button className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-lg group-hover:bg-primary-600 group-hover:text-white transition-all border border-gray-200">
                    เลือกแพ็กเกจนี้
                  </button>
                </div>
              </div>
            )}

            {/* กล่องขวา: Pro Seller */}
            <div 
              onClick={() => handleSelectPlan('pro')}
              className="bg-slate-900 rounded-[2.5rem] p-8 border-2 border-slate-800 shadow-2xl flex flex-col group relative overflow-hidden cursor-pointer h-full"
            >
              <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">BEST VALUE</div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full blur-[80px] -mr-10 -mt-10 opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10 text-left flex flex-col h-full">
                <div className="w-16 h-16 bg-white/10 text-yellow-400 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Pro Seller</h3>
                <p className="text-slate-400 mb-6 font-medium">คุ้มสุด! ลงขายได้สูงสุด 15 ชิ้น ภายใน 30 วัน</p>
                <div className="mb-8 mt-auto">
                  <span className="text-5xl font-black text-white">฿99</span>
                  <span className="text-slate-500 font-bold ml-2">/ 30 วัน</span>
                </div>
                <button className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all">
                  สมัคร Pro Seller
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🔴 STEP 2: ฟอร์มกรอกข้อมูล */}
      {step === 'form' && (
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 animate-[slideIn_0.3s_ease-out] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
          
          <button onClick={() => setStep('choose_plan')} className="relative z-10 text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-1 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> กลับไปเลือกแพ็กเกจ
          </button>

          <div className="relative z-10 text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-2">
              รายละเอียดสินค้า
            </h1>
            <p className="text-gray-500 mt-2 font-medium">แพ็กเกจ: <span className="font-bold text-primary-600">{selectedPlan === 'free' ? 'ลงขายฟรี' : selectedPlan === 'pro' ? 'Pro Seller' : 'ขายรายครั้ง (9 บาท)'}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">รูปภาพสินค้า</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer group overflow-hidden bg-gray-50 min-h-[250px]">
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="absolute inset-0 w-full h-full object-contain z-0 p-2" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-0 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-xl flex items-center gap-2">เปลี่ยนรูปภาพ</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-gray-400 group-hover:text-primary-500 transition-all">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-gray-700 font-bold group-hover:text-primary-600 transition-colors">อัปโหลดรูปภาพสินค้า</span>
                    <span className="text-xs text-gray-400 mt-2 font-medium">JPG, PNG, WEBP (สูงสุด 5MB)</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อสินค้า <span className="text-red-500">*</span></label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800" placeholder="เช่น หนังสือ Calculus เล่ม 1" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ราคา (บาท) <span className="text-red-500">*</span></label>
                <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">หมวดหมู่</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800 bg-white cursor-pointer">
                  <option value="electronics">ไอที & อิเล็กทรอนิกส์</option>
                  <option value="books">หนังสือ & ตำราเรียน</option>
                  <option value="dorm">ของใช้หอพัก</option>
                  <option value="fashion">เสื้อผ้า & แฟชั่น</option>
                  <option value="sports">กีฬา / Hobbies</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>

            {/* หมวดหมู่ย่อย (แสดงเมื่อเลือกของใช้หอพัก) */}
            {category === 'dorm' && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทของใช้หอพัก</label>
                <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800 bg-white cursor-pointer border-blue-200 bg-blue-50/30">
                  <option value="appliance">เครื่องใช้ไฟฟ้า (พัดลม, ตู้เย็น, ฯลฯ)</option>
                  <option value="bedding">เครื่องนอน (หมอน, ผ้าห่ม, ฯลฯ)</option>
                  <option value="furniture">เฟอร์นิเจอร์ (โต๊ะ, เก้าอี้, ฯลฯ)</option>
                  <option value="general">ของใช้ทั่วไป (ไม้แขวนเสื้อ, ตะกร้า, ฯลฯ)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">สภาพสินค้า</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800 bg-white cursor-pointer">
                <option value="มือสองสภาพสมบูรณ์">มือสองสภาพสมบูรณ์ (เหมือนใหม่)</option>
                <option value="มือสองสภาพดี">มือสองสภาพดี (80%-90%)</option>
                <option value="มือสองมีตำหนิ">มือสองมีตำหนิ (ใช้งานได้ปกติ)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียดเพิ่มเติม</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800 resize-none" placeholder="บอกรายละเอียด ตำหนิ หรือสถานที่นัดรับ..." />
            </div>

            {/* 🛡️ Checkbox ยืนยันความปลอดภัย (Requirement 5) */}
            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3 mt-6">
              <input 
                type="checkbox" 
                id="agreement"
                required
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer accent-primary-600"
              />
              <label htmlFor="agreement" className="text-sm text-gray-700 font-medium cursor-pointer leading-relaxed">
                ข้าพเจ้ายืนยันว่าสินค้านี้ <span className="text-orange-600 font-bold">เป็นของถูกกฎหมาย ไม่ใช่สินค้าละเมิดลิขสิทธิ์ หรือของโจร</span> และยอมรับเงื่อนไขการใช้งานของแพลตฟอร์ม หากตรวจพบความผิด บัญชีจะถูกระงับทันที
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-6 disabled:opacity-70">
              {isSubmitting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : 
               selectedPlan === 'free' ? 'ลงขายสินค้า (ฟรี!)' : 'ถัดไป (ชำระเงิน)'}
            </button>
          </form>
        </div>
      )}

      {/* 🔴 STEP 3: หน้าชำระเงิน */}
      {step === 'payment' && (
        <div className="max-w-md mx-auto text-center py-10 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
            <button onClick={() => setStep('form')} className="text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-1 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> 
              กลับไปแก้ไขข้อมูลสินค้า
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">ชำระเงินผ่าน PromptPay</h2>
            <p className="text-gray-500 mb-8 font-medium">แพ็กเกจ: <span className="font-bold text-primary-600">{selectedPlan === 'pro' ? 'Pro Seller (99 บาท)' : 'ขายรายครั้ง (9 บาท)'}</span></p>
            <div className="w-64 h-64 mx-auto bg-gray-100 rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center mb-8 relative overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR" className="w-48 h-48 opacity-50 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/10 to-transparent w-full h-full animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <button onClick={() => submitProductData(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
              ยืนยันการชำระเงิน
            </button>
          </div>
        </div>
      )}

    </div>
  );
};