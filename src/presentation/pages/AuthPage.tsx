import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { THAI_UNIVERSITIES } from '@/utils/constants'; 
import api from '@/app/api/axiosInstance'; 
import Swal from 'sweetalert2';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuthContext } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [accountType, setAccountType] = useState<'student' | 'alumni'>('student');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // States สำหรับระบบค้นหามหาวิทยาลัย
  const [uni, setUni] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);

  // 🟢 เพิ่ม State เพื่อเก็บไฟล์โดยเฉพาะ แก้ปัญหาดึงไฟล์จาก DOM แล้วได้ null
  const [docFile, setDocFile] = useState<File | null>(null);

  const filteredUnis = THAI_UNIVERSITIES.map(group => ({
    group: group.group,
    list: group.list.filter(u => u.toLowerCase().includes(uni.toLowerCase()))
  })).filter(group => group.list.length > 0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post('/api/login', { email, password });
      setAuthContext(res.data.user, res.data.access_token);
      
      Swal.fire({
        icon: 'success',
        title: 'ยินดีต้อนรับกลับครับ!',
        text: `สวัสดีคุณ ${res.data.user.name}`,
        timer: 2000,
        showConfirmButton: false
      });
      
      navigate('/marketplace');
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: error.response?.data?.detail || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation เบื้องต้น
    if (password !== confirmPassword) {
      Swal.fire('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน', 'warning');
      return;
    }
    if (password.length < 8) {
      Swal.fire('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'warning');
      return;
    }
    if (!uni.trim()) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาระบุมหาวิทยาลัย', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      let docUrl = null;

      // 🟢 2. จัดการรูปภาพหลักฐาน
      if (accountType === 'alumni') {
        if (!docFile) {
          Swal.fire('ข้อมูลไม่ครบ', 'กรุณาอัปโหลดรูปหลักฐานการศึกษาด้วยครับ', 'warning');
          setIsSubmitting(false);
          return;
        }
        
        const formData = new FormData();
        formData.append('file', docFile); 
        
        // 🔑 เพิ่ม Header สำหรับการอัปโหลดไฟล์ แก้ 422 Error ขั้นเด็ดขาด
        const uploadRes = await api.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        docUrl = uploadRes.data.url;
      }

      // 3. เตรียมข้อมูล Payload
      const payload = {
        name: name,
        email: email,
        password: password,
        uni: uni,
        account_type: accountType,
        verification_document: docUrl
      };

      // 4. ส่งข้อมูลสมัครสมาชิก
      const res = await api.post('/api/register', payload);

      // 5. แยกแยะผลลัพธ์การเข้าใช้งาน
      if (res.data.access_token) {
        setAuthContext(res.data.user, res.data.access_token);
        await Swal.fire({
          icon: 'success',
          title: 'สมัครสมาชิกสำเร็จ',
          text: 'ยินดีต้อนรับเข้าสู่ระบบ UniShare',
          timer: 2000,
          showConfirmButton: false
        });
        navigate('/marketplace');
      } else {
        await Swal.fire({
          icon: 'info',
          title: 'ลงทะเบียนเรียบร้อย',
          text: 'บัญชีศิษย์เก่าของคุณอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ กรุณารอการอนุมัติก่อนเข้าใช้งาน',
          confirmButtonColor: '#4f46e5'
        });
        setMode('login');
        setDocFile(null); // ล้างค่าไฟล์
        window.scrollTo(0, 0);
      }

    } catch (error: any) {
      // 🟢 โชว์ Error จริงจาก Backend แทน [object Object]
      const errorMessage = error.response?.data?.detail || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      Swal.fire({
        icon: 'error',
        title: 'สมัครสมาชิกไม่สำเร็จ',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto flex justify-center mb-4">
              {/* 🟢 ปรับให้ใหญ่ขึ้นเป็น h-32 (มือถือ) และ h-40 (หน้าจอใหญ่) */}
              <img 
                src="/logo.png" 
                alt="UniShare Logo" 
                className="h-32 sm:h-40 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
            <p className="text-gray-500 mt-2">หรือสมัครสมาชิกใหม่เพื่อเริ่มต้นใช้งาน</p>
          </div>

          {/* Login Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-full">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${mode === 'login' ? 'nav-active bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              เข้าสู่ระบบ
            </button>
            <button 
              onClick={() => setMode('register')} 
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${mode === 'register' ? 'nav-active bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              สมัครใหม่
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 animate-[slideIn_0.3s_ease-out]">
              <div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมลมหาวิทยาลัย" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" required />
              </div>
              <div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" required />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg mt-4 disabled:opacity-50">
                {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4 animate-[slideIn_0.3s_ease-out]">
              
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setAccountType('student')} className={`flex-1 py-1.5 text-sm rounded ${accountType === 'student' ? 'bg-white shadow-sm font-medium text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  ศิษย์ปัจจุบัน
                </button>
                <button type="button" onClick={() => setAccountType('alumni')} className={`flex-1 py-1.5 text-sm rounded ${accountType === 'alumni' ? 'bg-white shadow-sm font-medium text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  ศิษย์เก่า
                </button>
              </div>

              {accountType === 'alumni' && (
                <div className="p-4 border-2 border-dashed border-primary-200 rounded-xl bg-primary-50 text-center mb-4">
                  <span className="text-2xl block mb-2">📄</span>
                  <p className="text-sm font-medium text-primary-700">อัปโหลดเอกสารยืนยันตัวตน</p>
                  <p className="text-xs text-gray-500 mt-1">เช่น บัตรศิษย์เก่า, ทรานสคริปต์</p>
                  {/* 🟢 อัปเดต Input File ให้รับค่าเข้า State */}
                  <input 
                    type="file" 
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="mt-3 text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
                  />
                </div>
              )}

              <div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" required />
              </div>
              <div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมลมหาวิทยาลัย" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" required />
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={uni} 
                  onChange={(e) => {
                    setUni(e.target.value);
                    setShowUniDropdown(true);
                  }} 
                  onFocus={() => setShowUniDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUniDropdown(false), 200)}
                  placeholder="พิมพ์ค้นหา หรือ เลือกมหาวิทยาลัย" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" 
                  required 
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showUniDropdown && filteredUnis.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto text-sm animate-[slideIn_0.1s_ease-out]">
                    {filteredUnis.map((group) => (
                      <React.Fragment key={group.group}>
                        <li className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase sticky top-0 border-y border-gray-100 shadow-sm z-10 backdrop-blur-md bg-opacity-90">
                          {group.group}
                        </li>
                        {group.list.map((university) => (
                          <li 
                            key={university}
                            onClick={() => {
                              setUni(university);
                              setShowUniDropdown(false);
                            }}
                            className="px-4 py-2.5 pl-6 hover:bg-primary-50 text-gray-700 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            {university}
                          </li>
                        ))}
                      </React.Fragment>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" required />
              </div>
              <div>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="ยืนยันรหัสผ่าน" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" required />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg mt-4 disabled:opacity-50">
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'สมัครสมาชิก'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <button 
              onClick={() => navigate('/')} 
              className="text-primary-600 hover:text-primary-700 hover:underline font-medium inline-flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              กลับหน้าหลัก
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};