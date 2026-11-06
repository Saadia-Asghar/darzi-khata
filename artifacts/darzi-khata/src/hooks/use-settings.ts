import { useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '../context/auth-context';
import { claimLegacyShop, useStoredValue, writeStorage } from '../lib/local-store';
import { useDemoMode } from './use-demo-mode';
import { storage as localStorage } from '../lib/storage';

export interface ShopSettings {
  shopName: string;
  shopNameUrdu: string;
  address: string;
  phone: string;
  thankYouMessage: string;
  darkMode: boolean;
  zindigiWallet?: string;
  raastId?: string;
  accountTitle?: string;
  shopType?: 'shop' | 'home-based' | 'women-home-tailor';
  language?: 'en' | 'ur';
  fontSize?: 'normal' | 'large';
}

const getDefaultSettings = (shopName?: string): ShopSettings => ({
  shopName: shopName || 'Meri Dukan',
  shopNameUrdu: 'میری دوکان',
  address: '',
  phone: '',
  thankYouMessage: 'Shukriya! Delivery ki tareekh par rabta farmaiye ga.',
  darkMode: false,
});

export function useSettings() {
  const { currentUser, userId, dataOwnerId } = useAuthContext();
  const { demoMode } = useDemoMode();
  // Settings are personal per user (not shared with team)
  const STORAGE_KEY = `darzi-khata-settings-${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
  const defaults = useMemo(() => ({
    ...getDefaultSettings(currentUser?.shopName),
    ...(demoMode ? { zindigiWallet: '03000000000', raastId: '03000000000', accountTitle: 'Al-Madina Tailors (DEMO)', shopType: 'shop' as const } : {}),
  }), [currentUser?.shopName, demoMode]);
  const stored = useStoredValue<ShopSettings>(STORAGE_KEY, defaults);
  const settings = useMemo(() => ({ ...defaults, ...stored }), [stored, defaults]);

  useEffect(() => {
    if (!demoMode) claimLegacyShop(dataOwnerId);
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    const legacy = !demoMode && localStorage.getItem('darzi-khata-legacy-claimed') === JSON.stringify(dataOwnerId)
      ? localStorage.getItem('darzi-khata-settings') : null;
    writeStorage(STORAGE_KEY, legacy ? { ...defaults, ...JSON.parse(legacy) } : defaults);
  }, [STORAGE_KEY, defaults, demoMode, dataOwnerId]);

  const saveSettings = useCallback((newSettings: ShopSettings) => {
    writeStorage(STORAGE_KEY, { ...defaults, ...newSettings });
    document.documentElement.classList.toggle('dark', !!newSettings.darkMode);
    // Keep personal display preference without mixing demonstration payment details.
    if (demoMode) localStorage.setItem(`darzi-khata-dark-${userId}`, String(!!newSettings.darkMode));
  }, [STORAGE_KEY, defaults, demoMode, userId]);

  return { settings, isLoaded: true, saveSettings };
}
