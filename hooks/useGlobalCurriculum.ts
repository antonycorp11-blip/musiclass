import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchCurriculumTopics } from '../services/curriculumService';
import { CurriculumTopic, StudentTopicProgress } from '../types';

export function useGlobalCurriculum(currentUser: any) {
  const [allTopics, setAllTopics] = useState<CurriculumTopic[]>([]);
  const [allProgress, setAllProgress] = useState<StudentTopicProgress[]>([]);

  const fetchGlobalCurriculum = async () => {
    try {
      const groups = ['harmono_melodico', 'percussao', 'vocal'] as const;
      const topicsPromises = groups.map(g => fetchCurriculumTopics(g));
      const results = await Promise.all(topicsPromises);
      const flatTopics = results.flat();
      setAllTopics(flatTopics);

      try {
        const { data: progressData } = await supabase.from('mc_student_topics').select('*');
        if (progressData) {
          setAllProgress(progressData.map(p => ({
            ...p,
            topic: flatTopics.find(t => t.id === p.topic_id)
          })));
        }
      } catch (e) {
        console.warn("Tabela mc_student_topics ausente.");
      }
    } catch (e) { console.error("Erro ao buscar currículo global:", e); }
  };

  useEffect(() => {
    if (currentUser) fetchGlobalCurriculum();
  }, [currentUser]);

  return { allTopics, allProgress };
}
