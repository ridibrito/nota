-- Migration: Webhook Logs (Versão Simplificada)
-- Criado em: 2025-09-17

-- Tabela para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'processing',
    result JSONB,
    attempts INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices básicos (sem GIN)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Adicionar campo webhook_data na tabela invoices se não existir
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS webhook_data JSONB;

-- RLS Policies para webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Sistema pode fazer tudo (service_role)
CREATE POLICY "webhook_logs_all_policy" ON webhook_logs
    FOR ALL USING (true);

-- Tabela para configurações de webhook (simplificada)
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    auto_issue BOOLEAN DEFAULT false,
    auto_process BOOLEAN DEFAULT false,
    default_service_code TEXT,
    default_iss_rate DECIMAL(5,4) DEFAULT 0.02,
    default_rps_series TEXT,
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, source)
);

-- RLS para webhook_configs (simplificado)
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Sistema pode fazer tudo
CREATE POLICY "webhook_configs_all_policy" ON webhook_configs
    FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_webhook_logs_updated_at ON webhook_logs;
CREATE TRIGGER update_webhook_logs_updated_at
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_configs_updated_at ON webhook_configs;
CREATE TRIGGER update_webhook_configs_updated_at
    BEFORE UPDATE ON webhook_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão para Hotmart (se empresa existe)
INSERT INTO webhook_configs (company_id, source, auto_issue, default_service_code, default_iss_rate, default_rps_series, settings)
SELECT 
    id as company_id,
    'hotmart' as source,
    true as auto_issue,
    '01.05' as default_service_code,
    0.02 as default_iss_rate,
    'HOTMART' as default_rps_series,
    '{"auto_create_customer": true, "auto_process": false}'::jsonb as settings
FROM companies
WHERE NOT EXISTS (
    SELECT 1 FROM webhook_configs 
    WHERE company_id = companies.id AND source = 'hotmart'
)
LIMIT 1; -- Apenas primeira empresa (single-tenant)

-- Comentários para documentação
COMMENT ON TABLE webhook_logs IS 'Logs de todos os webhooks recebidos e processados';
COMMENT ON TABLE webhook_configs IS 'Configurações de webhook por empresa e fonte';
COMMENT ON COLUMN webhook_logs.payload IS 'Dados completos do webhook recebido';
COMMENT ON COLUMN webhook_logs.result IS 'Resultado do processamento (cliente criado, NFS-e emitida, etc.)';
COMMENT ON COLUMN webhook_configs.settings IS 'Configurações específicas em JSON para cada fonte de webhook';
