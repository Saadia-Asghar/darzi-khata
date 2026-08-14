import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'darzi-khata-karigars';
const DEFAULT_KARIGARS = ['Ustad Bashir', 'Ahmed Karigar', 'Rustam Ustad'];

export function useKarigars() {
  const [karigars, setKarigars] = useState<string[]>(DEFAULT_KARIGARS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setKarigars(JSON.parse(stored));
      } catch {
        setKarigars(DEFAULT_KARIGARS);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KARIGARS));
    }
  }, []);

  const save = useCallback((list: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setKarigars(list);
  }, []);

  const addKarigar = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || karigars.includes(trimmed)) return;
    save([...karigars, trimmed]);
  }, [karigars, save]);

  const removeKarigar = useCallback((name: string) => {
    save(karigars.filter((k) => k !== name));
  }, [karigars, save]);

  return { karigars, addKarigar, removeKarigar };
}
