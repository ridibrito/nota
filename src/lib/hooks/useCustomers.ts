'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Customer } from '@/types';

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

export function useCustomers(companyId?: string, search?: string) {
  const [state, setState] = useState<CustomersState>({
    customers: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!companyId) {
      setState({ customers: [], loading: false, error: null });
      return;
    }

    const fetchCustomers = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        let query = supabase
          .from('customers')
          .select('*')
          .eq('company_id', companyId);

        if (search) {
          query = query.or(`name.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,email.ilike.%${search}%`);
        }

        query = query.order('name');

        const { data, error } = await query;

        if (error) {
          setState({ customers: [], loading: false, error: error.message });
          return;
        }

        setState({ customers: data || [], loading: false, error: null });
      } catch (error) {
        setState({
          customers: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    };

    fetchCustomers();
  }, [companyId, search]);

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      setState(prev => ({
        ...prev,
        customers: [data, ...prev.customers]
      }));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      setState(prev => ({
        ...prev,
        customers: prev.customers.map(customer =>
          customer.id === customerId ? data : customer
        )
      }));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        return { success: false, error: error.message };
      }

      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(customer => customer.id !== customerId)
      }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  return {
    ...state,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: () => {
      setState(prev => ({ ...prev, loading: true }));
    }
  };
}
