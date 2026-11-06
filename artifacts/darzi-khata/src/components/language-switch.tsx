import { DICT, type Lang } from '../lib/i18n';

/** Language names stay recognizable whichever language is currently selected. */
export function LanguageSwitch({ value, onChange }: { value: Lang; onChange: (language: Lang) => void }) {
  return (
    <div role="group" aria-label={DICT.language[value]} dir="ltr" className="inline-flex shrink-0 rounded-md border border-border bg-card p-0.5">
      {(['en', 'ur'] as const).map(language => (
        <button key={language} type="button" aria-pressed={value === language}
          onClick={() => onChange(language)} lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}
          className={`min-h-[44px] min-w-[56px] px-2 rounded-md text-sm font-medium transition-colors ${value === language ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'} ${language === 'ur' ? 'font-urdu' : ''}`}
          data-testid={`switch-language-${language}`}>
          {DICT[language === 'en' ? 'language_en' : 'language_ur'][value]}
        </button>
      ))}
    </div>
  );
}
