-- Migration: Webhook Logs e Melhorias
-- Criado em: 2025-09-17

-- Tabela para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'hotmart', 'crm', 'erp', etc.
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'processed', 'error', 'retry'
    result JSONB,
    attempts INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
-- Índice GIN para buscar por transaction_id no payload JSONB
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payload_gin ON webhook_logs USING gin(payload);

-- Adicionar campos de webhook_data na tabela invoices se não existir
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS webhook_data JSONB;

-- Índice GIN para buscar invoices por dados de webhook (JSONB)
CREATE INDEX IF NOT EXISTS idx_invoices_webhook_data_gin ON invoices USING gin(webhook_data) WHERE webhook_data IS NOT NULL;

-- RLS Policies para webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ver todos os logs (admin)
CREATE POLICY "webhook_logs_select_policy" ON webhook_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Apenas sistema pode inserir logs (via service role)
CREATE POLICY "webhook_logs_insert_policy" ON webhook_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Policy: Apenas sistema pode atualizar logs
CREATE POLICY "webhook_logs_update_policy" ON webhook_logs
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Função para cleanup automático de logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Manter apenas logs dos últimos 90 dias
    DELETE FROM webhook_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Manter apenas 1000 logs mais recentes por source
    WITH ranked_logs AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY source ORDER BY created_at DESC) as rn
        FROM webhook_logs
    )
    DELETE FROM webhook_logs 
    WHERE id IN (
        SELECT id FROM ranked_logs WHERE rn > 1000
    );
END;
$$;

-- Configurar limpeza automática (executar mensalmente)
-- Nota: Isso requer extensão pg_cron, que pode não estar disponível no Supabase
-- SELECT cron.schedule('cleanup-webhook-logs', '0 2 1 * *', 'SELECT cleanup_old_webhook_logs();');

-- Tabela para configurações de webhook (opcional)
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- 'hotmart', 'crm', 'erp', etc.
    endpoint_url TEXT, -- URL para callbacks/notifications
    secret_key TEXT, -- Chave secreta para validação
    auto_issue BOOLEAN DEFAULT false, -- Auto-emitir NFS-e
    auto_process BOOLEAN DEFAULT false, -- Auto-processar emissão
    default_service_code TEXT,
    default_iss_rate DECIMAL(5,4) DEFAULT 0.02, -- 2%
    default_rps_series TEXT,
    settings JSONB DEFAULT '{}', -- Configurações específicas por source
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, source)
);

-- Índices para webhook_configs
CREATE INDEX IF NOT EXISTS idx_webhook_configs_company ON webhook_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_source ON webhook_configs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON webhook_configs(active);

-- RLS para webhook_configs
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só podem ver configs da sua empresa
CREATE POLICY "webhook_configs_select_policy" ON webhook_configs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Policy: Usuários podem inserir configs para sua empresa
CREATE POLICY "webhook_configs_insert_policy" ON webhook_configs
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar configs da sua empresa
CREATE POLICY "webhook_configs_update_policy" ON webhook_configs
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Policy: Usuários podem deletar configs da sua empresa
CREATE POLICY "webhook_configs_delete_policy" ON webhook_configs
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_webhook_logs_updated_at
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
);

-- Comentários para documentação
COMMENT ON TABLE webhook_logs IS 'Logs de todos os webhooks recebidos e processados';
COMMENT ON TABLE webhook_configs IS 'Configurações de webhook por empresa e fonte';
COMMENT ON COLUMN webhook_logs.payload IS 'Dados completos do webhook recebido';
COMMENT ON COLUMN webhook_logs.result IS 'Resultado do processamento (cliente criado, NFS-e emitida, etc.)';
COMMENT ON COLUMN webhook_configs.settings IS 'Configurações específicas em JSON para cada fonte de webhook';
