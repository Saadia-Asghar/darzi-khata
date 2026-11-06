import { useEffect, type ReactNode } from 'react';
import { useSettings } from './use-settings';
export function usePreferences() {
  const { settings, saveSettings } = useSettings();
  const urduFirst = settings.language === 'ur';
  return {
    urduFirst,
    fontSize: settings.fontSize || 'normal',
    label: (en: string, ur: string) => urduFirst ? `${ur} / ${en}` : `${en} / ${ur}`,
    setLanguage: (language: 'en' | 'ur') => saveSettings({ ...settings, language }),
    setFontSize: (fontSize: 'normal' | 'large') => saveSettings({ ...settings, fontSize }),
  };
}
export function AppPreferences({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    root.dir = settings.language === 'ur' ? 'rtl' : 'ltr';
    root.lang = settings.language === 'ur' ? 'ur' : 'en';
    root.style.fontSize = settings.fontSize === 'large' ? '20px' : '16px';
    root.classList.toggle('dark',!!settings.darkMode);
    root.classList.toggle('large-font',settings.fontSize === 'large');
    return () => { root.dir = 'ltr'; root.lang = 'en'; root.style.fontSize = '16px'; root.classList.remove('large-font'); };
  }, [settings.language,settings.fontSize,settings.darkMode]);
  return children;
}
