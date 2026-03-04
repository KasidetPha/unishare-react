export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  uni: string;
  condition: string;
  category: string;
  description?: string;
  sellerId: string; // 👈 เชื่อมโยงกับคนขาย
  status: 'available' | 'sold'; // 👈 สถานะสินค้า
}

export interface Review {
  name: string;
  uni: string;
  rating: number;
  text: string;
  date: string;
  avatar: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  uni: string;
  role: 'student' | 'alumni' | 'admin'; // 👈 เพิ่ม Role
  verificationStatus: 'verified' | 'pending' | 'unverified'; // 👈 สถานะการยืนยันตัวตน
  isAuthenticated: boolean;
}