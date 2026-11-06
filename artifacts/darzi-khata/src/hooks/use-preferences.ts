import { useEffect, type ReactNode } from 'react';
import { useSettings } from './use-settings';
import { DICT, isDictKey, fill, setCurrentLang, type Lang, type Vars } from '../lib/i18n';

export type PaperSize = 'a4' | '80' | '58';

export function usePreferences() {
  const { settings, saveSettings } = useSettings();
  const urduFirst = settings.language === 'ur';
  const lang: Lang = urduFirst ? 'ur' : 'en';
  /**
   * One visible language at a time keeps labels readable on small screens.
   * {name} placeholders and Urdu numerals still follow the selected language.
   */
  function label(key: string, varsOrUr?: Vars | string): string {
    if (typeof varsOrUr === 'string') return lang === 'ur' ? varsOrUr : key;
    if (isDictKey(key)) return fill(DICT[key][lang], varsOrUr, lang);
    return key;
  }
  /** Single-language text in the primary language. */
  function one(key: string, varsOrUr?: Vars | string): string {
    if (typeof varsOrUr === 'string') return lang === 'ur' ? varsOrUr : key;
    if (isDictKey(key)) return fill(DICT[key][lang], varsOrUr, lang);
    return key;
  }
  return {
    urduFirst,
    lang,
    fontSize: settings.fontSize || 'normal',
    paperSize: (settings.paperSize || 'a4') as PaperSize,
    label,
    one,
    setLanguage: (language: 'en' | 'ur') => saveSettings({ ...settings, language }),
    setFontSize: (fontSize: 'normal' | 'large') => saveSettings({ ...settings, fontSize }),
    setPaperSize: (paperSize: PaperSize) => saveSettings({ ...settings, paperSize }),
  };
}
export function AppPreferences({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  setCurrentLang(settings.language === 'ur' ? 'ur' : 'en');
  useEffect(() => {
    const root = document.documentElement;
    root.dir = settings.language === 'ur' ? 'rtl' : 'ltr';
    root.lang = settings.language === 'ur' ? 'ur' : 'en';
    root.style.fontSize = settings.fontSize === 'large' ? '20px' : '16px';
    root.classList.toggle('dark', !!settings.darkMode);
    root.classList.toggle('large-font', settings.fontSize === 'large');
    document.body.dataset.paper = settings.paperSize || 'a4';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.darkMode ? '#121816' : '#155B43');
    return () => { root.dir = 'ltr'; root.lang = 'en'; root.style.fontSize = '16px'; root.classList.remove('large-font'); };
  }, [settings.language, settings.fontSize, settings.darkMode, settings.paperSize]);
  return children;
}
