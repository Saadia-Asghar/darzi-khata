import { useMemo, useEffect, useCallback } from 'react';
import { Measurements, CollarType, DamanType, PocketType, CuffType } from '../types/order';
import { useAuthContext } from '../context/auth-context';
import { useDemoMode } from './use-demo-mode';
import { claimLegacyShop, useStoredValue, writeStorage } from '../lib/local-store';

export interface MeasurementTemplate {
  id: string;
  name: string;
  measurements: Measurements;
  collarType?: CollarType;
  damanType?: DamanType;
  pockets?: PocketType;
  cuffType?: CuffType;
  createdAt: string;
}

export function useTemplates() {
  const { dataOwnerId } = useAuthContext();
  const { demoMode } = useDemoMode();
  const STORAGE_KEY = `darzi-khata-templates-${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
  const fallback = useMemo<MeasurementTemplate[]>(() => [], []);
  const templates = useStoredValue<MeasurementTemplate[]>(STORAGE_KEY, fallback);

  useEffect(() => {
    if (!demoMode) claimLegacyShop(dataOwnerId);
    if (localStorage.getItem(STORAGE_KEY) === null) {
      const legacy = !demoMode && localStorage.getItem('darzi-khata-legacy-claimed') === JSON.stringify(dataOwnerId)
        ? localStorage.getItem('darzi-khata-templates') : null;
      writeStorage(STORAGE_KEY, legacy ? JSON.parse(legacy) : []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY, dataOwnerId, demoMode]);

  const saveTemplates = useCallback((newTemplates: MeasurementTemplate[]) => {
    writeStorage(STORAGE_KEY, newTemplates);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  const addTemplate = useCallback((template: Omit<MeasurementTemplate, 'id' | 'createdAt'>) => {
    saveTemplates([{ ...template, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...templates]);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => { saveTemplates(templates.filter((t) => t.id !== id)); }, [templates, saveTemplates]);

  return { templates, isLoaded: true, addTemplate, deleteTemplate };
}
