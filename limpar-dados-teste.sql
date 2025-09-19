-- ============================================
-- LIMPAR TODOS OS DADOS DE TESTE/MOCK
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Remover todas as invoices (dados mockados)
DELETE FROM invoices;

-- 2. Remover todos os clientes de teste
DELETE FROM customers;

-- 3. Remover logs de webhook de teste
DELETE FROM webhook_logs;

-- 4. Remover logs de operações SOAP de teste
DELETE FROM ws_logs;

-- 5. Remover logs de auditoria de teste
DELETE FROM audit_logs;

-- 6. Verificar se limpou tudo
SELECT 'Invoices restantes:' as tabela, count(*) as total FROM invoices
UNION ALL
SELECT 'Clientes restantes:' as tabela, count(*) as total FROM customers
UNION ALL
SELECT 'Webhook logs restantes:' as tabela, count(*) as total FROM webhook_logs
UNION ALL
SELECT 'WS logs restantes:' as tabela, count(*) as total FROM ws_logs
UNION ALL
SELECT 'Audit logs restantes:' as tabela, count(*) as total FROM audit_logs;

-- 7. Resetar sequências se necessário
-- (Opcional - só se quiser começar numeração do zero)
-- ALTER SEQUENCE IF EXISTS invoices_rps_number_seq RESTART WITH 1;
