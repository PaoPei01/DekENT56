import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { resolveUserAccess, type AccessTarget } from '../services/authAccess';

type RoleAccessState = {
  loading: boolean;
  user: User | null;
  target: AccessTarget | null;
};

export function useRoleAccess(): RoleAccessState {
  const [state, setState] = useState<RoleAccessState>({ loading: true, user: null, target: null });

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setState({ loading: false, user: null, target: null });
        return;
      }
      try {
        const target = await resolveUserAccess(data.user.id);
        if (active) setState({ loading: false, user: data.user, target });
      } catch {
        if (active) setState({ loading: false, user: data.user, target: 'none' });
      }
    }

    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setState({ loading: false, user: null, target: null });
        return;
      }
      setState({ loading: true, user: session.user, target: null });
      resolveUserAccess(session.user.id)
        .then((target) => {
          if (active) setState({ loading: false, user: session.user, target });
        })
        .catch(() => {
          if (active) setState({ loading: false, user: session.user, target: 'none' });
        });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

