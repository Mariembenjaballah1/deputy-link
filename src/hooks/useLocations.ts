import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wilaya, Daira, Mutamadiya } from '@/types';

interface UseLocationsResult {
  wilayas: Wilaya[];
  dairas: Daira[];
  mutamadiyat: Mutamadiya[];
  isLoading: boolean;
  error: Error | null;
  getDairasByWilaya: (wilayaId: string) => Daira[];
  getMutamadiyatByDaira: (dairaId: string) => Mutamadiya[];
  getWilayaName: (wilayaId: string) => string;
  getDairaName: (dairaId: string) => string;
  getMutamadiyaName: (mutamadiyaId: string) => string;
}

// Cache for locations data
let cachedWilayas: Wilaya[] | null = null;
let cachedDairas: Daira[] | null = null;
let cachedMutamadiyat: Mutamadiya[] | null = null;
let cachePromise: Promise<void> | null = null;

async function loadLocationsData() {
  if (cachedWilayas && cachedDairas && cachedMutamadiyat) {
    return;
  }

  const [wilayasRes, dairasRes, mutamadiyatRes] = await Promise.all([
    supabase.from('wilayas').select('*').order('code'),
    supabase.from('dairas').select('*').order('name'),
    supabase.from('mutamadiyat').select('*').order('name'),
  ]);

  if (wilayasRes.data) {
    cachedWilayas = wilayasRes.data.map(w => ({ 
      id: w.id, 
      name: w.name, 
      code: w.code 
    }));
  }

  if (dairasRes.data) {
    cachedDairas = dairasRes.data.map(d => ({ 
      id: d.id, 
      name: d.name, 
      wilayaId: d.wilaya_id 
    }));
  }

  if (mutamadiyatRes.data) {
    cachedMutamadiyat = mutamadiyatRes.data.map(m => ({ 
      id: m.id, 
      name: m.name, 
      dairaId: m.daira_id,
      wilayaId: m.wilaya_id
    }));
  }
}

export function useLocations(): UseLocationsResult {
  const [wilayas, setWilayas] = useState<Wilaya[]>(cachedWilayas || []);
  const [dairas, setDairas] = useState<Daira[]>(cachedDairas || []);
  const [mutamadiyat, setMutamadiyat] = useState<Mutamadiya[]>(cachedMutamadiyat || []);
  const [isLoading, setIsLoading] = useState(!cachedWilayas);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedWilayas && cachedDairas && cachedMutamadiyat) {
      setWilayas(cachedWilayas);
      setDairas(cachedDairas);
      setMutamadiyat(cachedMutamadiyat);
      setIsLoading(false);
      return;
    }

    if (!cachePromise) {
      cachePromise = loadLocationsData();
    }

    cachePromise
      .then(() => {
        setWilayas(cachedWilayas || []);
        setDairas(cachedDairas || []);
        setMutamadiyat(cachedMutamadiyat || []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  const getDairasByWilaya = (wilayaId: string): Daira[] => {
    return dairas.filter(d => d.wilayaId === wilayaId);
  };

  const getMutamadiyatByDaira = (dairaId: string): Mutamadiya[] => {
    return mutamadiyat.filter(m => m.dairaId === dairaId);
  };

  const getWilayaName = (wilayaId: string): string => {
    return wilayas.find(w => w.id === wilayaId)?.name || '';
  };

  const getDairaName = (dairaId: string): string => {
    return dairas.find(d => d.id === dairaId)?.name || '';
  };

  const getMutamadiyaName = (mutamadiyaId: string): string => {
    return mutamadiyat.find(m => m.id === mutamadiyaId)?.name || '';
  };

  return {
    wilayas,
    dairas,
    mutamadiyat,
    isLoading,
    error,
    getDairasByWilaya,
    getMutamadiyatByDaira,
    getWilayaName,
    getDairaName,
    getMutamadiyaName,
  };
}

// Export a function to invalidate cache if needed
export function invalidateLocationsCache() {
  cachedWilayas = null;
  cachedDairas = null;
  cachedMutamadiyat = null;
  cachePromise = null;
}
