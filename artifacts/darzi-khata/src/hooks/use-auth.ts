import { useState, useEffect, useCallback } from 'react';
import { UserAccount } from '../context/auth-context';
import { notifyStorage } from '../lib/local-store';
import { storage as localStorage } from '../lib/storage';

const ACCOUNTS_KEY = 'darzi-khata-accounts';
const SESSION_KEY = 'darzi-khata-session';

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getAccounts(): UserAccount[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  notifyStorage(ACCOUNTS_KEY);
}

async function ensureDemoAccounts() {
  const accounts = getAccounts();
  // Check if demo suite is already seeded
  if (['demo-account', 'demo-bashir', 'demo-ahmed', 'demo-rustam'].every(id => accounts.some(a => a.id === id))) return;

  const hash = await hashPassword('demo1234');

  const demoOwner: UserAccount = {
    id: 'demo-account',
    name: 'Muhammad Arif (Malik)',
    email: 'demo@darzikhata.com',
    passwordHash: hash,
    shopName: 'Al-Madina Tailors',
    role: 'owner',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const demoBashir: UserAccount = {
    id: 'demo-bashir',
    name: 'Ustad Bashir',
    email: 'bashir@darzikhata.com',
    passwordHash: hash,
    shopName: 'Al-Madina Tailors',
    role: 'karigar',
    ownerId: 'demo-account',
    ownerShopName: 'Al-Madina Tailors',
    createdAt: '2024-01-02T00:00:00.000Z',
  };

  const demoAhmed: UserAccount = {
    id: 'demo-ahmed',
    name: 'Ahmed Karigar',
    email: 'ahmed@darzikhata.com',
    passwordHash: hash,
    shopName: 'Al-Madina Tailors',
    role: 'karigar',
    ownerId: 'demo-account',
    ownerShopName: 'Al-Madina Tailors',
    createdAt: '2024-01-03T00:00:00.000Z',
  };

  const demoRustam: UserAccount = {
    id: 'demo-rustam',
    name: 'Rustam Ustad',
    email: 'rustam@darzikhata.com',
    passwordHash: hash,
    shopName: 'Al-Madina Tailors',
    role: 'karigar',
    ownerId: 'demo-account',
    ownerShopName: 'Al-Madina Tailors',
    createdAt: '2024-01-04T00:00:00.000Z',
  };

  // Re-read after WebCrypto yields, preserving accounts created in the meantime.
  const latest = getAccounts();
  saveAccounts([...latest, ...[demoOwner, demoBashir, demoAhmed, demoRustam].filter(d => !latest.some(a => a.id === d.id || a.email === d.email))]);
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const userId = sessionStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    return getAccounts().find((a) => a.id === userId) ?? null;
  });

  useEffect(() => { ensureDemoAccounts(); }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await ensureDemoAccounts();
    const accounts = getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
    if (!account) return { success: false, error: 'Yeh email registered nahi hai.' };
    const hash = await hashPassword(password);
    if (hash !== account.passwordHash) return { success: false, error: 'Password galat hai.' };
    sessionStorage.setItem(SESSION_KEY, account.id);
    setCurrentUser(account);
    return { success: true };
  }, []);

  const signup = useCallback(async (
    name: string, email: string, password: string, shopName: string,
    role: 'owner' | 'karigar' = 'owner', ownerEmail?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!name.trim()) return { success: false, error: 'Naam zaroor daakhil karein.' };
    if (!email.trim()) return { success: false, error: 'Email zaroor daakhil karein.' };
    if (password.length < 6) return { success: false, error: 'Password kam az kam 6 huroof ka hona chahiye.' };

    const accounts = getAccounts();
    if (accounts.find((a) => a.email.toLowerCase() === email.toLowerCase().trim())) {
      return { success: false, error: 'Yeh email pehle se registered hai. Login karein.' };
    }

    let ownerId: string | undefined;
    let ownerShopName: string | undefined;
    if (role === 'karigar') {
      if (!ownerEmail?.trim()) return { success: false, error: 'Malik/Owner ki email daakhil karein.' };
      const owner = accounts.find((a) => a.email.toLowerCase() === ownerEmail.toLowerCase().trim() && a.role === 'owner');
      if (!owner) return { success: false, error: 'Is email par koi shop owner registered nahi mila.' };
      ownerId = owner.id;
      ownerShopName = owner.shopName;
    }

    const hash = await hashPassword(password);
    const newAccount: UserAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      shopName: role === 'owner' ? (shopName.trim() || `${name.trim()} Tailors`) : (ownerShopName ?? ''),
      role,
      ...(ownerId ? { ownerId, ownerShopName } : {}),
      createdAt: new Date().toISOString(),
    };

    saveAccounts([...accounts, newAccount]);
    sessionStorage.setItem(SESSION_KEY, newAccount.id);
    setCurrentUser(newAccount);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  const updateCurrentUser = useCallback((updates: Partial<UserAccount>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveAccounts(getAccounts().map((a) => (a.id === prev.id ? updated : a)));
      return updated;
    });
  }, []);

  return { currentUser, isAuthenticated: currentUser !== null, login, signup, logout, updateCurrentUser };
}
