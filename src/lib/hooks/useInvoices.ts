'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Invoice } from '@/types';

interface InvoicesState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UseInvoicesParams {
  companyId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useInvoices(params: UseInvoicesParams = {}) {
  const {
    companyId,
    status,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50
  } = params;

  const [state, setState] = useState<InvoicesState>({
    invoices: [],
    loading: true,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      pages: 0
    }
  });

  useEffect(() => {
    if (!companyId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchInvoices = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Constrói parâmetros da URL
        const params = new URLSearchParams({
          companyId,
          page: String(page),
          limit: String(limit),
          ...(status && { status }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        });

        // Chama a API real
        const response = await fetch(`/api/invoices/query?${params}`);
        const result = await response.json();

        if (!result.success) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.error || 'Erro ao carregar invoices'
          }));
          return;
        }

        // Filtra por busca no frontend se necessário
        let invoices = result.data.invoices || [];
        if (search) {
          const searchLower = search.toLowerCase();
          invoices = invoices.filter((invoice: any) => 
            invoice.rps_number?.toLowerCase().includes(searchLower) ||
            invoice.nfse_number?.toLowerCase().includes(searchLower) ||
            invoice.customers?.name?.toLowerCase().includes(searchLower) ||
            invoice.customers?.cpf_cnpj?.toLowerCase().includes(searchLower)
          );
        }

        setState({
          invoices,
          loading: false,
          error: null,
          pagination: result.data.pagination || {
            page,
            limit,
            total: invoices.length,
            pages: Math.ceil(invoices.length / limit)
          }
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro de conexão com a API'
        }));
      }
    };

    fetchInvoices();
  }, [companyId, status, startDate, endDate, search, page, limit]);

  const issueInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch('/api/invoices/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Atualiza a lista local
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(invoice =>
          invoice.id === invoiceId
            ? { ...invoice, status: 'issued' as const, ...result.data }
            : invoice
        )
      }));

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const cancelInvoice = async (invoiceId: string, reason: string) => {
    try {
      const response = await fetch('/api/invoices/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId, reason }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Atualiza a lista local
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(invoice =>
          invoice.id === invoiceId
            ? { ...invoice, status: 'canceled' as const }
            : invoice
        )
      }));

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'status'>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          status: 'pending'
        })
        .select(`
          *,
          customers (
            id,
            name,
            cpf_cnpj
          )
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Adiciona à lista local
      setState(prev => ({
        ...prev,
        invoices: [data, ...prev.invoices],
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1
        }
      }));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  return {
    ...state,
    issueInvoice,
    cancelInvoice,
    createInvoice,
    refetch: () => {
      setState(prev => ({ ...prev, loading: true }));
    }
  };
}
