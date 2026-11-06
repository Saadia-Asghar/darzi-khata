import { useMemo, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/auth-context';
import { useDemoMode } from './use-demo-mode';
import { claimLegacyShop, useStoredValue, writeStorage } from '../lib/local-store';
import { getAccounts } from './use-auth';
import type { UserAccount } from '../context/auth-context';

const DEFAULT_KARIGARS = ['Ustad Bashir', 'Ahmed Karigar', 'Rustam Ustad'];

export function useKarigars() {
  const { dataOwnerId } = useAuthContext();
  const { demoMode } = useDemoMode();
  const STORAGE_KEY = `darzi-khata-karigars-${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
  const defaults = useMemo(() => demoMode || dataOwnerId === 'demo-account' ? DEFAULT_KARIGARS : [], [dataOwnerId, demoMode]);
  const stored = useStoredValue<string[]>(STORAGE_KEY, defaults);
  const fallbackAccounts = useMemo(() => getAccounts(), []);
  const accounts = useStoredValue<UserAccount[]>('darzi-khata-accounts', fallbackAccounts);
  const karigars = useMemo(() => [...new Set([...stored, ...accounts.filter(a => a.ownerId === dataOwnerId && a.role === 'karigar').map(a => a.name)])], [stored, accounts, dataOwnerId]);

  useEffect(() => {
    if (!demoMode) claimLegacyShop(dataOwnerId);
    if (localStorage.getItem(STORAGE_KEY) === null) {
      const legacy = !demoMode && localStorage.getItem('darzi-khata-legacy-claimed') === JSON.stringify(dataOwnerId)
        ? localStorage.getItem('darzi-khata-karigars') : null;
      writeStorage(STORAGE_KEY, legacy ? JSON.parse(legacy) : defaults);
    }
  }, [STORAGE_KEY, defaults, dataOwnerId, demoMode]);

  const save = useCallback((list: string[]) => {
    writeStorage(STORAGE_KEY, list);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  const addKarigar = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || karigars.includes(trimmed)) return;
    save([...karigars, trimmed]);
  }, [karigars, save]);

  const removeKarigar = useCallback((name: string) => { save(karigars.filter((k) => k !== name)); }, [karigars, save]);

  return { karigars, addKarigar, removeKarigar };
}
