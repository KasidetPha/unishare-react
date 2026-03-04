// src/presentation/components/ProductCard.tsx
import React from 'react';
import { Product } from '@/domain/types';
import { useNavigate } from 'react-router-dom';

interface Props {
  product: Product;
  size?: 'small' | 'normal';
}

export const ProductCard: React.FC<Props> = ({ product, size = 'normal' }) => {
  const navigate = useNavigate();
  
  const getConditionStyle = (condition: string) => {
    switch(condition) {
      case 'ใหม่มาก':
      case 'สภาพดีมาก':
      case 'ใหม่': return 'bg-green-100 text-green-700';
      case 'สภาพดี': return 'bg-blue-100 text-blue-700';
      case 'มีรอยขีด': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      onClick={() => navigate(`/product/${product.id}`)} 
      className="bg-white rounded-2xl overflow-hidden shadow-md card-hover cursor-pointer"
    >
      {/* แก้ไขจากเดิมที่เป็น {product.imageUrl} มาเป็นแท็ก img ด้านล่างนี้ */}
      <div className={`w-full ${size === 'small' ? 'h-32' : 'h-40'} bg-gray-100 overflow-hidden`}>
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
          onError={(e) => {
            // กรณีลิงก์รูปเสีย ให้แสดงรูป Placeholder แทน
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-800 text-sm truncate">{product.name}</h3>
        <p className="text-primary-600 font-bold mt-1">฿{product.price.toLocaleString()}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">🎓 {product.uni}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${getConditionStyle(product.condition)}`}>
            {product.condition}
          </span>
        </div>
      </div>
    </div>
  );
};