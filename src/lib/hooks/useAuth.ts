'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'operator';
  company_id: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  // Mock temporário para desenvolvimento - remover em produção
  const mockUser = {
    id: 'mock-user-id',
    email: 'usuario@teste.com',
    name: 'Usuário Teste',
    role: 'admin' as const
  };

  const [state, setState] = useState<AuthState>({
    user: mockUser as any,
    profile: {
      id: 'mock-user-id',
      email: 'usuario@teste.com',
      role: 'admin',
      company_id: 'e8281131-097c-49c4-ab97-078a8c7f4e65'
    },
    loading: false,
    error: null
  });

  useEffect(() => {
    // Mock temporário - comentado para desenvolvimento
    // Descomentar em produção com Supabase configurado
    /*
    // Verifica se Supabase está configurado (só no cliente)
    if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      setState({
        user: null,
        profile: null,
        loading: false,
        error: 'Supabase não configurado. Configure as variáveis de ambiente.'
      });
      return;
    }

    // Verifica sessão atual
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (session?.user) {
          // Busca perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            setState(prev => ({ ...prev, error: profileError.message, loading: false }));
            return;
          }

          setState({
            user: session.user,
            profile,
            loading: false,
            error: null
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          loading: false 
        }));
      }
    };

    getSession();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setState({
            user: session.user,
            profile,
            loading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      }
    );

    return () => subscription.unsubscribe();
    */
  }, []);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updateProfile = (updates: { name?: string; email?: string }) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : prev.user,
      profile: prev.profile ? { ...prev.profile, ...updates } : prev.profile
    }));
  };

  return {
    ...state,
    signIn,
    signOut,
    updateProfile
  };
}
