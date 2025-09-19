/**
 * Cliente Supabase configurado para server-side e client-side
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Cliente público (client-side) - sempre disponível
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Cliente admin (server-side) - função que cria sob demanda
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin só pode ser usado no servidor');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Variáveis do Supabase não configuradas no servidor');
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Para compatibilidade com código existente
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdmin() : null;

// Cliente server-side com cookies (App Router) - simplificado para build
export function createSupabaseServer() {
  // Implementação simplificada para evitar problemas de build
  return supabaseAdmin;
}

/**
 * Utilitários de banco de dados
 */

export async function getCompanyById(id: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanyByUserId(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('user_profiles')
    .select(`
      *,
      companies (*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.companies;
}

export async function getCertificateByCompanyId(companyId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('certificates')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function getCustomersByCompanyId(companyId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getInvoicesByCompanyId(
  companyId: string,
  limit = 50,
  offset = 0
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('invoices')
    .select(`
      *,
      customers (
        id,
        name,
        cpf_cnpj
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function createWSLog(log: {
  invoice_id: string;
  operation: 'issue' | 'query' | 'cancel';
  request_xml?: string;
  response_xml?: string;
  http_status?: number;
}) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('ws_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Funções de auditoria
 */

export async function createAuditLog(log: {
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await (supabaseAdmin as any)
    .from('audit_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}
