import { create } from 'zustand';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';

export type Locale = 'en' | 'fr' | 'ar';

type Translations = typeof en;

const locales: Record<Locale, Translations> = { en, fr, ar };

const STORAGE_KEY = 'factureflow_locale';

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && ['en', 'fr', 'ar'].includes(stored)) return stored;
    const browser = navigator.language.toLowerCase();
    if (browser.startsWith('ar')) return 'ar';
    if (browser.startsWith('fr')) return 'fr';
  }
  return 'en';
};

interface I18nState {
  locale: Locale;
  t: Translations;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  formatCurrency: (amount: number) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: 'en',
  t: en,
  isRTL: false,

  setLocale: (locale: Locale) => {
    const isRTL = locale === 'ar';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.setAttribute('lang', locale);
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    }
    set({ locale, t: locales[locale], isRTL });
  },

  formatCurrency: (amount: number) => {
    const { locale } = get();
    const localeMap: Record<Locale, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      ar: 'ar-DZ',
    };
    try {
      return new Intl.NumberFormat(localeMap[locale], {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' ' + (locale === 'ar' ? 'دج' : locale === 'fr' ? 'DA' : 'DA');
    } catch {
      return `${amount.toFixed(2)} DA`;
    }
  },
}));

// Initialize locale from storage on client after hydration
if (typeof window !== 'undefined') {
  const initial = getInitialLocale();
  useI18nStore.getState().setLocale(initial);
}
