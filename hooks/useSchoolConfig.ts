import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSchoolConfig(currentUser: any) {
  const [schoolConfig, setSchoolConfig] = useState<any>({
    headerPaddingH: 48,
    headerPaddingV: 32,
    logoHeight: 48,
    studentFontSize: 24,
    teacherFontSize: 14,
    logoOffset: 0,
    studentOffset: 0,
    teacherOffset: 0,
    spacing: 24,
    dividerColor: '#E87A2C66',
    showMusiClass: true
  });

  const fetchSchoolConfig = async () => {
    try {
      const { data, error } = await supabase.from('mc_school_config').select('config').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.config) setSchoolConfig(data.config);
    } catch (e) {
      console.warn("Using default school config", e);
    }
  };

  const updateSchoolConfig = async (newConfig: any) => {
    setSchoolConfig(newConfig);
    try {
      const { data: existing } = await supabase.from('mc_school_config').select('id').limit(1).single();
      if (existing) {
        await supabase.from('mc_school_config').update({ config: newConfig }).eq('id', existing.id);
      } else {
        await supabase.from('mc_school_config').insert({ config: newConfig });
      }
    } catch (e) {
      console.error("Error saving school config:", e);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSchoolConfig();
  }, [currentUser]);

  return { schoolConfig, updateSchoolConfig };
}
