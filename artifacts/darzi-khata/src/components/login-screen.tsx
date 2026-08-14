import { useState, useEffect } from 'react';
import { Scissors, Delete, LogIn, Lock } from 'lucide-react';
import { useSettings } from '../hooks/use-settings';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { settings } = useSettings();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const PIN_LENGTH = 4;

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      if (pin === settings.pin) {
        setError(false);
        onLogin();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          setShake(false);
        }, 700);
      }
    }
  }, [pin, settings.pin, onLogin]);

  const handleKey = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin((p) => p + digit);
    }
  };

  const handleBack = () => {
    setPin((p) => p.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="min-h-[100dvh] bg-emerald-900 dark:bg-gray-950 flex flex-col items-center justify-center px-6 select-none">
      {/* Branding */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-700 rounded-full shadow-2xl mb-5">
          <Scissors size={36} color="#d97706" className="rotate-90" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase">DARZI KHATA</h1>
        <h2 className="font-urdu text-emerald-300 text-2xl mt-1">درزی کھاتہ</h2>
        {settings.shopName && (
          <p className="text-emerald-400 text-sm mt-2 font-medium">{settings.shopName}</p>
        )}
      </div>

      {/* PIN Dots */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-1 mb-2">
          <Lock size={14} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">PIN daakhil karein</span>
        </div>
        <div className={`flex gap-4 mt-3 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? error
                    ? 'bg-red-500 border-red-400'
                    : 'bg-amber-400 border-amber-400 scale-110'
                  : 'bg-transparent border-emerald-500'
              }`}
            />
          ))}
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-3 font-semibold animate-pulse">
            Galat PIN — dobara koshish karein
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {keys.map((key, idx) => {
          if (key === '') {
            return <div key={idx} />;
          }
          if (key === 'back') {
            return (
              <button
                key={idx}
                onClick={handleBack}
                disabled={pin.length === 0}
                className="h-16 rounded-2xl bg-emerald-800 dark:bg-gray-800 text-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 shadow-lg"
                aria-label="Delete"
              >
                <Delete size={22} />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              className="h-16 rounded-2xl bg-emerald-700 dark:bg-gray-700 text-white text-2xl font-bold flex items-center justify-center active:scale-95 active:bg-emerald-600 transition-transform shadow-lg hover:bg-emerald-600"
              data-testid={`pin-key-${key}`}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Skip hint if no PIN set */}
      {!settings.pin && (
        <button
          onClick={onLogin}
          className="mt-10 flex items-center gap-2 text-emerald-400 hover:text-emerald-200 text-sm font-medium transition-colors"
          data-testid="btn-skip-pin"
        >
          <LogIn size={16} /> PIN set nahi — seedha andar jaiye
        </button>
      )}

      <p className="text-emerald-600 text-xs mt-10">Darzi Khata v2.0 — درزی کھاتہ</p>
    </div>
  );
}
