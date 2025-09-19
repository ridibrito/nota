'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Company } from '@/types';

interface CompanyState {
  company: Company | null;
  loading: boolean;
  error: string | null;
}

export function useCompany(companyId?: string) {
  // Mock temporário para desenvolvimento - remover em produção
  const mockCompany: Company = {
    id: 'e8281131-097c-49c4-ab97-078a8c7f4e65',
    name: 'Alb Soluções e serviços LTDA',
    cnpj: '44.981.253/0001-69',
    im: '123456789',
    cnae: '73.11-4-00',
    item_lista_servico: '10.08',
    cod_tributacao_municipio: '17.06',
    environment: 'homolog',
    created_at: '2025-09-17T11:52:30.15515+00:00'
  };

  const [state, setState] = useState<CompanyState>({
    company: mockCompany,
    loading: false,
    error: null
  });

  useEffect(() => {
    // Mock temporário - comentado para desenvolvimento
    // Descomentar em produção
    /*
    const fetchCompany = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        console.log('Buscando empresa...', { companyId });

        let query = supabase.from('companies').select('*');
        
        if (companyId) {
          // Buscar empresa específica por ID
          query = query.eq('id', companyId);
        } else {
          // Buscar primeira empresa (assumindo single-tenant para MVP)
          query = query.limit(1);
        }

        const { data, error } = await query.single();

        console.log('Resultado da busca:', { data, error });

        if (error) {
          if (error.code === 'PGRST116') {
            // Nenhuma empresa encontrada
            console.log('Nenhuma empresa encontrada');
            setState({ company: null, loading: false, error: null });
          } else {
            console.error('Erro ao buscar empresa:', error);
            setState({ company: null, loading: false, error: error.message });
          }
          return;
        }

        console.log('Empresa carregada:', data);
        setState({ company: data, loading: false, error: null });
      } catch (error) {
        console.error('Erro na busca da empresa:', error);
        setState({
          company: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    };

    fetchCompany();
    */
  }, [companyId]);

  const updateCompany = async (updates: Partial<Company>) => {
    if (!state.company?.id) {
      return { success: false, error: 'Nenhuma empresa encontrada para atualizar' };
    }

    try {
      console.log('Atualizando empresa via API:', { companyId: state.company.id, updates });

      const response = await fetch(`/api/companies/${state.company.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Erro da API:', result);
        return { success: false, error: result.error };
      }

      setState(prev => ({ ...prev, company: result.data }));
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Erro na requisição:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  const createCompany = async (companyData: Omit<Company, 'id' | 'created_at'>) => {
    try {
      console.log('Criando empresa via Supabase:', companyData);

      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      console.log('Resultado da criação:', { data, error });

      if (error) {
        return { success: false, error: error.message };
      }

      setState({ company: data, loading: false, error: null });
      return { success: true, data };
    } catch (error) {
      console.error('Erro na criação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...state,
    updateCompany,
    createCompany,
    refetch: () => {
      if (companyId) {
        setState(prev => ({ ...prev, loading: true }));
        // O useEffect será executado novamente
      }
    }
  };
}
