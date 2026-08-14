import { useState, useEffect, useCallback } from 'react';

export interface ShopSettings {
  shopName: string;
  shopNameUrdu: string;
  address: string;
  phone: string;
  thankYouMessage: string;
  darkMode: boolean;
  pinEnabled: boolean;
  pin: string;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "Al-Madina Tailors",
  shopNameUrdu: "المدینہ ٹیلرز",
  address: "Shop #4, Main Bazar",
  phone: "0300-0000000",
  thankYouMessage: "Shukriya! Delivery ki tareekh par rabta farmaiye ga.",
  darkMode: false,
  pinEnabled: false,
  pin: '',
};

const STORAGE_KEY = 'darzi-khata-settings';

export function useSettings() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = useCallback((newSettings: ShopSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  }, []);

  return { settings, isLoaded, saveSettings };
}
