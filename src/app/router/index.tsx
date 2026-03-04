import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { LandingPage } from '@/presentation/pages/LandingPage';
import { AuthPage } from '@/presentation/pages/AuthPage';
import { MarketplacePage } from '@/presentation/pages/MarketplacePage';
import { SellPage } from '@/presentation/pages/SellPage';
import { ProductPage } from '@/presentation/pages/ProductPage';
import { ProfilePage } from '@/presentation/pages/ProfilePage';
import { ChatPage } from '@/presentation/pages/ChatPage'; // 👈 นำเข้าไฟล์หน้า Chat
import { AdminPage } from '@/presentation/pages/AdminPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'sell', element: <SellPage /> },
      { path: 'product/:id', element: <ProductPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'chat', element: <ChatPage /> }, // 👈 เพิ่ม Route ไปยังหน้าแชท
      { path: 'admin', element: <AdminPage /> }, // 👈 เพิ่ม Route ไปยังหน้าแชท
      
    ],
  },
  {
    path: '/login',
    element: <AuthPage />
  }
]);