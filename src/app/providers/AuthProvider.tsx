import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/domain/types';
import { LocalStorageService } from '@/infrastructure/storage/LocalStorageService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  // ปรับการ Login ให้รับ Object User และ Token จาก API
  login: (userData: any, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ดึงข้อมูล User และ Token จาก LocalStorage เมื่อเริ่มต้นแอป
  const [user, setUser] = useState<User | null>(() => LocalStorageService.get('unishare_user', null));
  const [token, setToken] = useState<string | null>(() => LocalStorageService.get('unishare_token', null));

  // บันทึกข้อมูลลง LocalStorage ทุกครั้งที่ State เปลี่ยน
  useEffect(() => {
    LocalStorageService.set('unishare_user', user);
    LocalStorageService.set('unishare_token', token);
  }, [user, token]);

  /**
   * 🟢 ฟังก์ชัน Login แบบเชื่อมต่อข้อมูลจริง
   * @param userData ข้อมูลผู้ใช้ที่ได้จาก Response: res.data.user
   * @param accessToken โทเค็นที่ได้จาก Response: res.data.access_token
   */
  const login = (userData: any, accessToken: string) => {
    const formattedUser: User = {
      id: userData.id,
      name: userData.name, // จะได้ค่า "Tarn UniShare" จาก Database จริงๆ
      email: userData.email,
      uni: userData.uni,
      role: userData.role,
      verificationStatus: 'verified',
      isAuthenticated: true
    };

    setUser(formattedUser);
    setToken(accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    LocalStorageService.remove('unishare_user');
    LocalStorageService.remove('unishare_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};