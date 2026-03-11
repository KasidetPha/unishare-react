import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/app/api/axiosInstance';
import Swal from 'sweetalert2';
import { useAuth } from '@/app/providers/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/pending-alumni') // หรือ endpoint เดิมที่คุณใช้ดึง pending
      ]);
      setStats(statsRes.data);
      setPendingUsers(pendingRes.data);
    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const handleApprove = async (userId: number, userName: string) => {
    try {
      await api.put(`/api/admin/approve-alumni/${userId}`);
      Swal.fire('อนุมัติสำเร็จ!', `บัญชีของ ${userName} ใช้งานได้แล้ว`, 'success');
      fetchData();
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถอนุมัติได้', 'error');
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle,  outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const x = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const y = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#374151" className="text-[10px] font-bold" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500 font-bold">กำลังโหลดข้อมูลแผงควบคุม...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-[slideIn_0.3s_ease-out]">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="text-4xl">👑</span> Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2 font-medium">ภาพรวมธุรกิจและจัดการผู้ใช้งานแพลตฟอร์ม UniShare</p>
        </div>
        <button onClick={() => fetchData()} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-all">
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-bold text-sm mb-2">ผู้ใช้งานทั้งหมด</div>
          <div className="text-4xl font-black text-primary-600">{stats?.summary?.total_users || 0} <span className="text-base text-gray-400 font-medium">คน</span></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-bold text-sm mb-2">สินค้าในระบบ</div>
          <div className="text-4xl font-black text-blue-500">{stats?.summary?.total_products || 0} <span className="text-base text-gray-400 font-medium">ชิ้น</span></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-gray-500 font-bold text-sm mb-2">ขายออกแล้ว</div>
          <div className="text-4xl font-black text-green-500">{stats?.summary?.sold_products || 0} <span className="text-base text-gray-400 font-medium">ชิ้น</span></div>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div className="font-bold text-sm mb-2 relative z-10">รอการอนุมัติ (ศิษย์เก่า)</div>
          <div className="text-4xl font-black relative z-10">{stats?.summary?.pending_approvals || 0} <span className="text-base font-medium opacity-80">รายการ</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">📊 จำนวนสินค้าแยกตามหมวดหมู่</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">🍩 สัดส่วนสินค้าแต่ละหมวดหมู่</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats?.chart_data || []} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={80} 
                  paddingAngle={5} dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                >
                  {(stats?.chart_data || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="text-xl">📄</span> รายการศิษย์เก่ารออนุมัติ
          </h3>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">{pendingUsers.length} รายการ</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-bold">ชื่อ - นามสกุล</th>
                <th className="p-4 font-bold">อีเมล</th>
                <th className="p-4 font-bold">มหาวิทยาลัย</th>
                <th className="p-4 font-bold text-center">หลักฐานยืนยัน</th>
                <th className="p-4 font-bold text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length > 0 ? pendingUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 font-bold text-gray-800">{u.name}</td>
                  <td className="p-4 text-gray-500 text-sm">{u.email}</td>
                  <td className="p-4 text-gray-600 font-medium">{u.uni}</td>
                  <td className="p-4 text-center">
                    {u.verification_document ? (
                      <a href={u.verification_document} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg font-bold transition-colors">
                        🔍 ดูรูปเอกสาร
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm italic">ไม่มีไฟล์แนบ</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleApprove(u.id, u.name)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95">
                      ✅ อนุมัติการใช้งาน
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">🎉 ไม่มีรายการค้างพิจารณา</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};