import React, { createContext, useContext, useState } from 'react';

type Language = 'th' | 'en';

const translations = {
  th: {
    home: 'หน้าแรก', market: 'ตลาดสินค้า', sell: 'ขาย', chat: 'แชท', profile: 'โปรไฟล์', admin: 'จัดการระบบ',
    login: 'เข้าสู่ระบบ', logout: 'ออกจากระบบ', search_placeholder: '🔍 ค้นหาสินค้า...',
    verified_student: 'นักศึกษายืนยันแล้ว', verified_alumni: 'ศิษย์เก่ายืนยันแล้ว', pending: 'รอตรวจสอบ'
  },
  en: {
    home: 'Home', market: 'Marketplace', sell: 'Sell', chat: 'Chat', profile: 'Profile', admin: 'Admin Panel',
    login: 'Login', logout: 'Logout', search_placeholder: '🔍 Search products...',
    verified_student: 'Verified Student', verified_alumni: 'Verified Alumni', pending: 'Pending Verification'
  }
};

// 👈 1. สร้าง Interface กำหนดโครงสร้างแทนการใช้ any
interface LanguageContextType {
  lang: Language;
  t: (key: keyof typeof translations['th']) => string;
  toggleLanguage: () => void;
}

// 👈 2. ใส่ Type เข้าไปใน createContext
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('th');
  const t = (key: keyof typeof translations['th']) => translations[lang][key] || key;
  const toggleLanguage = () => setLang(prev => prev === 'th' ? 'en' : 'th');

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  // 👈 3. ดักจับ Error เผื่อลืมใส่ Provider (Best Practice)
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};