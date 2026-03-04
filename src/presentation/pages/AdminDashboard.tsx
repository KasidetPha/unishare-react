import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance'; // 🟢 ใช้ api instance เพื่อเรียกหา FastAPI
import Swal from 'sweetalert2';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalMessages: number;
  pendingAlumni: number;
}

interface AlumniRequest {
  id: number;
  name: string;
  email: string;
  uni: string;
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalProducts: 0, totalMessages: 0, pendingAlumni: 0 });
  const [requests, setRequests] = useState<AlumniRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 1. Protection: เช็คสิทธิ์ Admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin' && user.email !== 'tarn@unishare.ac.th') {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์เข้าถึง',
        text: 'หน้านี้สงวนไว้สำหรับผู้ดูแลระบบเท่านั้นครับ',
        confirmButtonColor: '#4f46e5'
      }).then(() => navigate('/marketplace'));
    }
  }, [user, navigate]);

  // 📦 2. ดึงข้อมูลจริงจาก Backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // ดึงสถิติรวม
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);
      
      // ดึงรายชื่อคำขออนุมัติศิษย์เก่า
      const requestsRes = await api.get('/api/admin/alumni-requests');
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.email === 'tarn@unishare.ac.th')) {
      fetchData();
    }
  }, [user]);

  // ⚡ 3. ฟังก์ชัน อนุมัติ / ปฏิเสธ ของจริง
  const handleAction = async (requestId: number, name: string, action: 'approve' | 'reject') => {
    const result = await Swal.fire({
      title: action === 'approve' ? 'ยืนยันการอนุมัติ?' : 'ปฏิเสธเอกสาร?',
      text: `คุณกำลังจัดการบัญชีของ: ${name}`,
      icon: action === 'approve' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? '#22c55e' : '#ef4444',
      confirmButtonText: action === 'approve' ? 'อนุมัติบัญชี' : 'ปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
        
        // ยิง API ไปที่หลังบ้าน
        await api.put(`/api/admin/verify-user/${requestId}?action=${action}`);
        
        Swal.fire('สำเร็จ!', `จัดการบัญชีของ ${name} เรียบร้อยแล้ว`, 'success');
        fetchData(); // 🔄 โหลดข้อมูลใหม่เพื่ออัปเดตตารางและตัวเลขสถิติ
      } catch (error) {
        Swal.fire('Error', 'ไม่สามารถดำเนินการได้ในขณะนี้', 'error');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-[slideIn_0.3s_ease-out]">
      
      {/* Header Section */}
      <div className="mb-10">
        <span className="inline-block px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-bold tracking-wider mb-4 border border-red-100">
          <span className="mr-1">🔴</span> Admin Access Only
        </span>
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <span className="text-blue-500 text-5xl">🛡️</span> ระบบจัดการหลังบ้าน
        </h1>
        <p className="text-gray-500 text-lg">ตรวจสอบและอนุมัติการสมัครสมาชิกของ "ศิษย์เก่า"</p>
      </div>

      {/* 📈 Stats Cards - แสดงข้อมูลจริงจาก Database */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl">⏳</div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">รอการตรวจสอบ</p>
            <p className="text-3xl font-black text-gray-800">{stats.pendingAlumni} <span className="text-lg font-medium text-gray-400">บัญชี</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl">✅</div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">สินค้าในระบบ</p>
            <p className="text-3xl font-black text-gray-800">{stats.totalProducts} <span className="text-lg font-medium text-gray-400">รายการ</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl">👥</div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">ผู้ใช้งานทั้งหมด</p>
            <p className="text-3xl font-black text-gray-800">{stats.totalUsers.toLocaleString()} <span className="text-lg font-medium text-gray-400">บัญชี</span></p>
          </div>
        </div>

      </div>

      {/* 📋 Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📄 รายการรอตรวจสอบเอกสาร
          </h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">กำลังดึงข้อมูล...</div>
          ) : requests.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-100">
                  <th className="py-5 px-6 font-medium">รหัส</th>
                  <th className="py-5 px-6 font-medium">ข้อมูลผู้สมัคร</th>
                  <th className="py-5 px-6 font-medium">มหาวิทยาลัย</th>
                  <th className="py-5 px-6 font-medium text-center">เอกสาร</th>
                  <th className="py-5 px-6 font-medium text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-gray-500 font-medium">#{item.id}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-bold border border-primary-100">
                        {item.uni}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100">
                        ดูเอกสาร
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleAction(item.id, item.name, 'reject')}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 border border-red-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, item.name, 'approve')}
                          className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 border border-green-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center text-gray-400 italic">ไม่มีคำขออนุมัติค้างในระบบครับ ☕</div>
          )}
        </div>
      </div>
    </div>
  );
};