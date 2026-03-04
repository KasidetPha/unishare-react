import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';
import Swal from 'sweetalert2';

type SellStep = 'choose_plan' | 'payment' | 'form';
type PlanType = 'single' | 'monthly' | null;

export const SellPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<SellStep>('choose_plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('สภาพดี (90%+)');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleSimulatePayment = () => {
    Swal.fire({
      title: 'กำลังตรวจสอบยอดเงิน...',
      html: 'ระบบกำลังยืนยันการโอนเงินของคุณ',
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => { Swal.showLoading(); }
    }).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'ชำระเงินสำเร็จ!',
        text: selectedPlan === 'monthly' ? 'คุณเป็น Pro Seller ลงขายได้ไม่อั้น 30 วัน!' : 'ชำระค่าสล็อตลงขาย 1 ชิ้นเรียบร้อยครับ',
        confirmButtonColor: '#4f46e5'
      }).then(() => setStep('form'));
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB ครับ', 'warning');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !imageFile) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วนครับ', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', imageFile);

      let finalImageUrl = '';
      try {
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      } catch (uploadError) {
        finalImageUrl = 'https://via.placeholder.com/500?text=Uploaded+Image'; 
      }

      await api.post('/api/products', {
        name,
        price: Number(price),
        image_url: finalImageUrl,
        uni: user?.uni || 'ไม่ระบุ',
        condition,
        category,
        description,
        seller_id: user?.id,
        status: 'available'
      });

      Swal.fire({
        icon: 'success',
        title: 'ลงขายสำเร็จ!',
        text: 'สินค้าของคุณขึ้นไปอยู่บนตลาดแล้วครับ',
        confirmButtonColor: '#22c55e'
      }).then(() => navigate('/profile'));
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลงขายสินค้าได้ ลองใหม่อีกครั้งครับ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-[slideIn_0.3s_ease-out]">
      
      {step === 'choose_plan' && (
        <div className="text-center py-10">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3">
            เลือกรูปแบบการลงขาย
            <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </h1>
          <p className="text-gray-500 mb-12 text-lg font-medium">เลือกแพ็กเกจที่เหมาะกับสไตล์การขายของคุณ</p>

          {/* 🟢 ปรับโครงสร้าง grid และ items-stretch เพื่อให้ card เท่ากัน */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* Package: Single */}
            <div 
              className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-300 transition-all flex flex-col group relative overflow-hidden cursor-pointer h-full" 
              onClick={() => handleSelectPlan('single')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary-100 transition-colors"></div>
              <div className="relative z-10 text-left flex flex-col h-full">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">ขายรายครั้ง</h3>
                <p className="text-gray-500 mb-6 font-medium">เหมาะสำหรับคนอยากเคลียร์หอ นานๆ ขายที จ่ายแค่ตอนที่ลงโพสต์</p>
                <div className="mb-8 mt-auto">
                  <span className="text-5xl font-black text-primary-600">฿15</span>
                  <span className="text-gray-500 font-bold ml-2">/ โพสต์</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-700 font-bold text-sm">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> ลงขายสินค้าได้ 1 ชิ้น
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 font-bold text-sm">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> อยู่จนกว่าจะขายออก
                  </li>
                  <li className="flex items-center gap-3 text-gray-300 font-bold text-sm line-through">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg> ดันโพสต์อัตโนมัติ
                  </li>
                </ul>
                <button className="w-full py-4 bg-gray-50 text-primary-600 rounded-2xl font-black text-lg group-hover:bg-primary-600 group-hover:text-white transition-all border border-gray-200">
                  เลือกแพ็กเกจนี้
                </button>
              </div>
            </div>

            {/* Package: Monthly */}
            <div 
              className="bg-slate-900 rounded-[2.5rem] p-8 border-2 border-slate-800 shadow-2xl flex flex-col group relative overflow-hidden cursor-pointer h-full" 
              onClick={() => handleSelectPlan('monthly')}
            >
              <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">BEST VALUE</div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full blur-[80px] -mr-10 -mt-10 opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10 text-left flex flex-col h-full">
                <div className="w-16 h-16 bg-white/10 text-yellow-400 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Pro Seller</h3>
                <p className="text-slate-400 mb-6 font-medium">เหมาะสำหรับพ่อค้าแม่ค้าตัวยง หรือคนของเยอะ ลงกี่ชิ้นก็คุ้ม!</p>
                <div className="mb-8 mt-auto">
                  <span className="text-5xl font-black text-white">฿99</span>
                  <span className="text-slate-500 font-bold ml-2">/ 30 วัน</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> ลงขายสินค้าได้ <span className="text-white underline decoration-primary-500 underline-offset-4">ไม่อั้น</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> ป้าย Pro เพิ่มความน่าเชื่อถือ
                  </li>
                  <li className="flex items-center gap-3 text-slate-200 font-bold text-sm">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> ดันโพสต์ขึ้นหน้าแรกฟรี
                  </li>
                </ul>
                <button className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all">
                  สมัคร Pro Seller
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="max-w-md mx-auto text-center py-10 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
            <button onClick={() => setStep('choose_plan')} className="text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-1 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> 
              กลับไปเลือกแพ็กเกจ
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">ชำระเงินผ่าน PromptPay</h2>
            <p className="text-gray-500 mb-8 font-medium">แพ็กเกจ: <span className="font-bold text-primary-600">{selectedPlan === 'monthly' ? 'Pro Seller' : 'ขายรายครั้ง'}</span></p>
            <div className="w-64 h-64 mx-auto bg-gray-100 rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center mb-8 relative overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR" className="w-48 h-48 opacity-50 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/10 to-transparent w-full h-full animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <button onClick={handleSimulatePayment} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
              ยืนยันการชำระเงิน
            </button>
          </div>
        </div>
      )}

      {step === 'form' && (
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 animate-[slideIn_0.3s_ease-out] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
          <div className="relative z-10 text-center mb-10">
            <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-green-100 text-green-700 font-black text-xs rounded-full mb-4 uppercase tracking-wider">
              Ready to Sell
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center justify-center gap-2">
              รายละเอียดสินค้า
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">ระบุข้อมูลสินค้าให้ครบถ้วนเพื่อความรวดเร็วในการขาย</p>
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

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">สภาพสินค้า</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800 bg-white cursor-pointer">
                <option value="มือหนึ่ง">มือหนึ่ง (ยังไม่แกะซีล)</option>
                <option value="สภาพดีเหมือนใหม่">สภาพดีเหมือนใหม่ (95%+)</option>
                <option value="สภาพดี">สภาพดี (80%-90%)</option>
                <option value="มีตำหนิเล็กน้อย">มีตำหนิเล็กน้อย (ใช้งานได้ปกติ)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียดเพิ่มเติม</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary-400 outline-none transition-all font-medium text-gray-800 resize-none" placeholder="บอกรายละเอียด ตำหนิ หรือสถานที่นัดรับ..." />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-8 disabled:opacity-70">
              {isSubmitting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : 'โพสต์ลงตลาดสินค้า'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};