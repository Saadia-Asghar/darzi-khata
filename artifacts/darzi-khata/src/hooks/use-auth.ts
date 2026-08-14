import { useState, useCallback } from 'react';

const SESSION_KEY = 'darzi-khata-auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  const login = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
