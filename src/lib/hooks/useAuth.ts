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
  // Função para carregar dados do localStorage
  const loadUserFromStorage = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedUser = localStorage.getItem('user_profile');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.warn('Erro ao carregar perfil do localStorage:', error);
    }
    
    // Dados padrão se não houver no localStorage
    return {
      id: '12345678-1234-1234-1234-123456789abc',
      email: 'usuario@teste.com',
      name: 'Usuário Teste',
      role: 'admin' as const
    };
  };

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Carregar dados do localStorage na inicialização
    const userData = loadUserFromStorage();
    if (userData) {
      setState({
        user: userData,
        profile: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          company_id: 'e8281131-097c-49c4-ab97-078a8c7f4e65'
        },
        loading: false,
        error: null
      });
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }

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
    try {
      // Limpar estado local
      setState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });

      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('company_data');
      }

      // Se Supabase estiver configurado, fazer logout lá também
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('Erro no logout do Supabase:', error.message);
        }
      } catch (supabaseError) {
        console.warn('Supabase não disponível para logout:', supabaseError);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = (updates: { name?: string; email?: string }) => {
    setState(prev => {
      const updatedUser = prev.user ? { ...prev.user, ...updates } : prev.user;
      const updatedProfile = prev.profile ? { ...prev.profile, ...updates } : prev.profile;
      
      // Salvar no localStorage
      if (updatedUser && typeof window !== 'undefined') {
        try {
          localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        } catch (error) {
          console.warn('Erro ao salvar perfil no localStorage:', error);
        }
      }
      
      return {
        ...prev,
        user: updatedUser,
        profile: updatedProfile
      };
    });
  };

  return {
    ...state,
    signIn,
    signOut,
    updateProfile
  };
}
