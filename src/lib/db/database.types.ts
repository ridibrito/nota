/**
 * Tipos TypeScript gerados automaticamente pelo Supabase
 * Atualizar com: npx supabase gen types typescript --project-id=your-project-id > src/lib/db/database.types.ts
 */

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          cnpj: string;
          im: string;
          cnae: string;
          item_lista_servico: string;
          cod_tributacao_municipio: string;
          environment: 'homolog' | 'prod';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cnpj: string;
          im: string;
          cnae: string;
          item_lista_servico: string;
          cod_tributacao_municipio: string;
          environment?: 'homolog' | 'prod';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cnpj?: string;
          im?: string;
          cnae?: string;
          item_lista_servico?: string;
          cod_tributacao_municipio?: string;
          environment?: 'homolog' | 'prod';
          created_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          company_id: string;
          storage_path: string;
          pfx_iv: string;
          pfx_tag: string;
          pfx_ciphertext: string;
          passphrase_ciphertext: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          storage_path: string;
          pfx_iv: string;
          pfx_tag: string;
          pfx_ciphertext: string;
          passphrase_ciphertext: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          storage_path?: string;
          pfx_iv?: string;
          pfx_tag?: string;
          pfx_ciphertext?: string;
          passphrase_ciphertext?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          cpf_cnpj: string;
          name: string;
          email: string | null;
          address: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          cpf_cnpj: string;
          name: string;
          email?: string | null;
          address?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          cpf_cnpj?: string;
          name?: string;
          email?: string | null;
          address?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string;
          rps_number: string;
          rps_series: string;
          competence_date: string;
          service_code: string;
          description: string;
          amount: number;
          deductions: number;
          iss_rate: number;
          iss_value: number | null;
          nfse_number: string | null;
          nfse_verification_code: string | null;
          protocol: string | null;
          status: 'pending' | 'issued' | 'failed' | 'canceled';
          xml_rps: string | null;
          xml_nfse: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          customer_id: string;
          rps_number: string;
          rps_series?: string;
          competence_date: string;
          service_code: string;
          description: string;
          amount: number;
          deductions?: number;
          iss_rate: number;
          iss_value?: number | null;
          nfse_number?: string | null;
          nfse_verification_code?: string | null;
          protocol?: string | null;
          status?: 'pending' | 'issued' | 'failed' | 'canceled';
          xml_rps?: string | null;
          xml_nfse?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_id?: string;
          rps_number?: string;
          rps_series?: string;
          competence_date?: string;
          service_code?: string;
          description?: string;
          amount?: number;
          deductions?: number;
          iss_rate?: number;
          iss_value?: number | null;
          nfse_number?: string | null;
          nfse_verification_code?: string | null;
          protocol?: string | null;
          status?: 'pending' | 'issued' | 'failed' | 'canceled';
          xml_rps?: string | null;
          xml_nfse?: string | null;
          created_at?: string;
        };
      };
      ws_logs: {
        Row: {
          id: string;
          invoice_id: string;
          operation: 'issue' | 'query' | 'cancel';
          request_xml: string | null;
          response_xml: string | null;
          http_status: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          operation: 'issue' | 'query' | 'cancel';
          request_xml?: string | null;
          response_xml?: string | null;
          http_status?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          operation?: 'issue' | 'query' | 'cancel';
          request_xml?: string | null;
          response_xml?: string | null;
          http_status?: number | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'operator';
          company_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'admin' | 'operator';
          company_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'operator';
          company_id?: string;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource: string;
          resource_id: string;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource: string;
          resource_id: string;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          resource?: string;
          resource_id?: string;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
