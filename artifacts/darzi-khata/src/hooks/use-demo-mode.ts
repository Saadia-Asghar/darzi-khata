import { useCallback } from 'react';
import { useAuthContext } from '../context/auth-context';
import { createFinancialDemo } from '../lib/demo-data';
import { removeStorage, useStoredValue, writeStorage } from '../lib/local-store';
import { storage as localStorage } from '../lib/storage';
import { clearPhotos } from '../lib/photos';

export const demoModeKey = (ownerId: string) => `darzi-khata-demo-mode-${ownerId}`;
export const scopedOrdersKey = (ownerId: string, demo: boolean) =>
  `darzi-khata-orders-${demo ? 'financial-demo-' : ''}${ownerId}`;
export function useDemoMode() {
  const { dataOwnerId } = useAuthContext();
  const demoMode = useStoredValue<boolean>(demoModeKey(dataOwnerId), dataOwnerId === 'demo-account');
  const setDemoMode = useCallback((enabled: boolean) => {
    if (enabled && !localStorage.getItem(scopedOrdersKey(dataOwnerId, true))) {
      writeStorage(scopedOrdersKey(dataOwnerId, true), createFinancialDemo(new Date(), dataOwnerId));
    }
    writeStorage(demoModeKey(dataOwnerId), enabled);
  }, [dataOwnerId]);
  const clearDemoData = useCallback(async () => {
    await clearPhotos(`financial-demo-${dataOwnerId}`);
    writeStorage(demoModeKey(dataOwnerId), false);
    removeStorage(scopedOrdersKey(dataOwnerId, true));
    removeStorage(`darzi-khata-serial-financial-demo-${dataOwnerId}`);
    removeStorage(`darzi-khata-settings-financial-demo-${dataOwnerId}`);
    removeStorage(`darzi-khata-templates-financial-demo-${dataOwnerId}`);
    removeStorage(`darzi-khata-karigars-financial-demo-${dataOwnerId}`);
    removeStorage(`darzi-khata-customers-financial-demo-${dataOwnerId}`);
    removeStorage(`darzi-khata-schema-financial-demo-${dataOwnerId}`);
  }, [dataOwnerId]);
  return { demoMode, setDemoMode, clearDemoData };
}
