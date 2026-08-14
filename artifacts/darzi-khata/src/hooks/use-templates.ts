import { useState, useEffect, useCallback } from 'react';
import { Measurements, CollarType, DamanType, PocketType, CuffType } from '../types/order';

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

const STORAGE_KEY = 'darzi-khata-templates';

export function useTemplates() {
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse templates', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveTemplates = useCallback((newTemplates: MeasurementTemplate[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  }, []);

  const addTemplate = useCallback((template: Omit<MeasurementTemplate, 'id' | 'createdAt'>) => {
    const newTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveTemplates([newTemplate, ...templates]);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  }, [templates, saveTemplates]);

  return {
    templates,
    isLoaded,
    addTemplate,
    deleteTemplate
  };
}
