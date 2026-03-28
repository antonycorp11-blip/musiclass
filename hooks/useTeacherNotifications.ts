import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';

export function useTeacherNotifications(currentUser: any, students: Student[], fetchInitialData: () => Promise<void>) {
  useEffect(() => {
    if (currentUser && currentUser.role === 'teacher') {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'mc_lesson_history',
            filter: `teacher_id=eq.${currentUser.id}`
          },
          (payload) => {
            const oldRead = payload.old.read_count || 0;
            const newRead = payload.new.read_count || 0;

            if (newRead > oldRead || (payload.new.is_read && !payload.old.is_read)) {
              // Sound notification if possible
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(() => { });

              // Browser notification
              if (Notification.permission === 'granted') {
                const s = students.find(std => std.id === payload.new.student_id);
                const sName = s ? s.name : 'Um aluno';
                new Notification('Confirmação MusiClass!', {
                  body: `${sName} confirmou o treino agora!`,
                  icon: '/favicon.ico',
                  requireInteraction: true
                });
              }
              fetchInitialData();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, students, fetchInitialData]);
}
