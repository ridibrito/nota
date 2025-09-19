// Database Types
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  im: string; // inscrição municipal
  cnae: string;
  item_lista_servico: string;
  cod_tributacao_municipio: string;
  environment: 'homolog' | 'prod';
  created_at: string;
}

export interface Certificate {
  id: string;
  company_id: string;
  storage_path: string;
  pfx_iv: Uint8Array;
  pfx_tag: Uint8Array;
  pfx_ciphertext: Uint8Array;
  passphrase_ciphertext: Uint8Array;
  created_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  cpf_cnpj: string;
  name: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  created_at: string;
}

export interface Invoice {
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
  iss_value?: number;
  nfse_number?: string;
  nfse_verification_code?: string;
  protocol?: string;
  status: 'pending' | 'issued' | 'failed' | 'canceled';
  xml_rps?: string;
  xml_nfse?: string;
  created_at: string;
}

export interface WSLog {
  id: string;
  invoice_id: string;
  operation: 'issue' | 'query' | 'cancel';
  request_xml?: string;
  response_xml?: string;
  http_status?: number;
  created_at: string;
}

// Form Types
export interface CompanyFormData {
  name: string;
  cnpj: string;
  im: string;
  cnae: string;
  item_lista_servico: string;
  cod_tributacao_municipio: string;
  environment: 'homolog' | 'prod';
}

export interface CustomerFormData {
  cpf_cnpj: string;
  name: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

export interface InvoiceFormData {
  customer_id: string;
  rps_number: string;
  rps_series: string;
  competence_date: string;
  service_code: string;
  description: string;
  amount: number;
  deductions: number;
  iss_rate: number;
}

// SOAP Types
export interface SOAPEnvelope {
  'soap12:Envelope': {
    'soap12:Body': Record<string, unknown>;
  };
}

export interface ISSNetResponse {
  success: boolean;
  protocol?: string;
  nfse_number?: string;
  verification_code?: string;
  errors?: string[];
  xml_response?: string;
}

// Certificate Types
export interface CertificateData {
  pfx: Buffer;
  passphrase: string;
  cert: string; // PEM format
  key: string;  // PEM format
}

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'operator';
  company_id: string;
}

// API Response Types
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tax Calculation Types
export interface TaxCalculation {
  base_value: number;
  iss_rate: number;
  iss_value: number;
  deductions: number;
  net_value: number;
}

// Audit Types
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}
