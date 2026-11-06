import { bi } from '../lib/i18n';
import { useMemo, useCallback } from 'react';
import type { Customer } from '../types/order';
import { useAuthContext } from '../context/auth-context';
import { useDemoMode } from './use-demo-mode';
import { useOrders } from './use-orders';
import { useStoredValue, writeStorage } from '../lib/local-store';
import { readJSON } from '../lib/storage';
import { customerKey } from '../lib/migrations';
import { validateCustomers } from '../lib/order-validation';
export function useCustomers() {
  useOrders();
  const { dataOwnerId } = useAuthContext();
  const { demoMode } = useDemoMode();
  const key = `darzi-khata-customers-${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
  const fallback = useMemo<Customer[]>(() => [], []);
  const customers = useStoredValue<Customer[]>(key, fallback);
  const saveCustomer = useCallback((input: Customer) => {
    if (!input.name.trim() || input.phone.replace(/\D/g, '').length < 10) throw new Error(bi('m_name_and_valid_phone_required'));
    const all = readJSON<Customer[]>(key, []);
    if (all.some(c => c.id !== input.id && customerKey(c.phone,c.id) === customerKey(input.phone,input.id)))
      throw new Error(bi('m_this_phone_already_belongs_to_a_customer'));
    const next = { ...input, name: input.name.trim(), updatedAt: new Date().toISOString() };
    writeStorage(key, all.some(c => c.id === next.id) ? all.map(c => c.id === next.id ? next : c) : [...all, next]);
    return next;
  }, [key]);
  const setAllCustomers = useCallback((all: Customer[]) => { validateCustomers(all); writeStorage(key, all); }, [key]);
  return { customers, saveCustomer, setAllCustomers };
}
