import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import api from '@/app/api/axiosInstance';
import Swal from 'sweetalert2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalMessages: number;
  pendingAlumni: number;
  chartData?: { name: string; value: number }[];
}

interface AlumniRequest {
  id: number;
  name: string;
  email: string;
  uni: string;
  account_type: string;
  is_active: boolean;
  verification_document: string | null;
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalProducts: 0, totalMessages: 0, pendingAlumni: 0, chartData: [] });
  const [pendingUsers, setPendingUsers] = useState<AlumniRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin' && user.email !== 'tarn@unishare.ac.th') {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์เข้าถึง',
        text: 'หน้านี้สงวนไว้สำหรับผู้ดูแลระบบเท่านั้น',
        confirmButtonColor: '#4f46e5'
      }).then(() => navigate('/marketplace'));
    }
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, requestsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/alumni-requests')
      ]);
      
      const rawStats = statsRes.data;
      setStats({
        totalUsers: rawStats.summary?.total_users ?? rawStats.totalUsers ?? 0,
        totalProducts: rawStats.summary?.total_products ?? rawStats.totalProducts ?? 0,
        totalMessages: rawStats.totalMessages ?? 0,
        pendingAlumni: rawStats.summary?.pending_approvals ?? rawStats.pendingAlumni ?? 0,
        chartData: rawStats.chart_data || []
      });

      setPendingUsers(requestsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.email === 'tarn@unishare.ac.th')) {
      fetchAdminData();
    }
  }, [user]);

  const handleAction = async (id: number, name: string, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: isApprove ? 'ยืนยันการอนุมัติ?' : 'ปฏิเสธเอกสาร?',
      text: `คุณกำลังจัดการบัญชีของ: ${name}`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#22c55e' : '#ef4444',
      confirmButtonText: isApprove ? 'อนุมัติบัญชี' : 'ปฏิเสธและลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
        await api.put(`/api/admin/verify-user/${id}?action=${action}`);
        await Swal.fire('สำเร็จ', `ดำเนินการเรียบร้อยแล้ว`, 'success');
        fetchAdminData(); 
      } catch (error) {
        Swal.fire('Error', 'ไม่สามารถดำเนินการได้ในขณะนี้', 'error');
      }
    }
  };

  // ฟังก์ชันสำหรับวาดข้อความบนกราฟโดนัท
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const x = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const y = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#374151" className="text-[10px] font-bold" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-[slideIn_0.3s_ease-out]">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold mb-3 border border-red-100">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Admin Access Only
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ระบบจัดการหลังบ้าน</h1>
          <p className="text-gray-500 mt-1">ตรวจสอบข้อมูลเชิงธุรกิจและอนุมัติการสมัครสมาชิกของศิษย์เก่า</p>
        </div>
        <button onClick={() => navigate('/profile')} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
          กลับหน้าโปรไฟล์
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">รอการตรวจสอบ</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingAlumni} <span className="text-sm font-normal text-gray-500">บัญชี</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">สินค้าในระบบ</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalProducts} <span className="text-sm font-normal text-gray-500">รายการ</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ผู้ใช้งานทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()} <span className="text-sm font-normal text-gray-500">บัญชี</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
            <span className="w-2 h-5 bg-primary-500 rounded-full"></span>
            จำนวนสินค้าแยกตามหมวดหมู่
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
            <span className="w-2 h-5 bg-pink-500 rounded-full"></span>
            สัดส่วนหมวดหมู่สินค้า
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats.chartData || []} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={80} 
                  paddingAngle={5} dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                >
                  {(stats.chartData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <h2 className="text-lg font-bold text-gray-800">รายการรอตรวจสอบเอกสาร</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">ข้อมูลผู้สมัคร</th>
                <th className="p-4 font-medium">มหาวิทยาลัย</th>
                <th className="p-4 font-medium text-center">เอกสาร</th>
                <th className="p-4 font-medium text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-medium italic">กำลังโหลดข้อมูลจากระบบ...</td></tr>
              ) : pendingUsers.length > 0 ? (
                pendingUsers.map((pUser) => (
                  <tr key={pUser.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{pUser.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pUser.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg border border-primary-100">
                        {pUser.uni}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {pUser.verification_document ? (
                        <button 
                          onClick={() => setSelectedDoc(pUser.verification_document)} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold rounded-lg transition-all"
                        >
                          ตรวจสอบเอกสาร
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">ไม่มีเอกสาร</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAction(pUser.id, pUser.name, 'reject')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button onClick={() => handleAction(pUser.id, pUser.name, 'approve')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-90">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500 italic">
                    🎉 ไม่มีคำขออนุมัติค้างในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
          <div className="relative bg-white rounded-[2rem] p-2 w-full max-w-2xl shadow-2xl animate-[slideIn_0.2s_ease-out]">
            <button onClick={() => setSelectedDoc(null)} className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center min-h-[50vh] p-2">
              <img src={selectedDoc} alt="Verification" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};