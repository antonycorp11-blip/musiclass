import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useConfirmationLink(showToast: (msg: string, type: string) => void) {
  const [confirmationScreen, setConfirmationScreen] = useState<{ student: string, inst: string, session: string } | null>(null);
  const [quizToken, setQuizToken] = useState<string | null>(null);

  useEffect(() => {
    const handleConfirmation = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('quiz');
      if (token) setQuizToken(token);

      const confirmReadId = params.get('confirm_read');
      if (!confirmReadId) return;

      console.log('Detectada solicitação de confirmação:', confirmReadId);

      const session = params.get('session') || '1';
      const sName = params.get('s_name') || 'Estudante';
      const inst = params.get('inst') || 'Instrumento';

      try {
        const { data, error: fetchError } = await supabase.from('mc_lesson_history')
          .select('read_count, interaction_log')
          .eq('id', confirmReadId)
          .single();

        if (fetchError) throw fetchError;

        const newCount = (data?.read_count || 0) + 1;
        const oldLog = Array.isArray(data?.interaction_log) ? data.interaction_log : [];
        const newLog = [...oldLog, {
          session,
          at: new Date().toISOString(),
          student: sName,
          instrument: inst
        }];

        const { error: updateError } = await supabase.from('mc_lesson_history')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
            read_count: newCount,
            interaction_log: newLog
          })
          .eq('id', confirmReadId);

        if (updateError) throw updateError;

        console.log('Confirmação salva com sucesso!');
        setConfirmationScreen({ student: sName, inst, session });
        window.history.replaceState({}, document.title, "/");
      } catch (err) {
        console.error("Erro no fluxo de confirmação:", err);
        showToast("Erro ao confirmar leitura. Por favor, avise seu professor.", "error");
      }
    };

    handleConfirmation();
  }, [showToast]);

  return { confirmationScreen, setConfirmationScreen, quizToken, setQuizToken };
}
