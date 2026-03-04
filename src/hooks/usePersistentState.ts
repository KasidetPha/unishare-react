import { useState, useEffect } from 'react';
import { LocalStorageService } from '@/infrastructure/storage/LocalStorageService';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    return LocalStorageService.get<T>(key, initialValue);
  });

  useEffect(() => {
    LocalStorageService.set(key, state);
  }, [key, state]);

  return [state, setState] as const;
}