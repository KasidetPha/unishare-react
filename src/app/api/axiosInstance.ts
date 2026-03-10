import axios from 'axios';

// 🟢 เช็คอัตโนมัติว่ารันอยู่บน Localhost หรือ Netlify
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 🔴 สำคัญ: เปลี่ยนลิงก์ https://... ให้เป็น URL ของ Backend Render ของคุณ Tarn นะครับ (ห้ามมี / ต่อท้าย)
const API_BASE_URL = isLocal 
  ? 'http://127.0.0.1:8000' 
  : 'https://unishare-server.onrender.com'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ส่วน Interceptor ดึง Token (ถ้ามีโค้ดเก่าอยู่แล้ว ก๊อปมาวางต่อได้เลยครับ)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;