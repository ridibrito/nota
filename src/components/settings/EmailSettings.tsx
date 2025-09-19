'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export function EmailSettings() {
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const testEmailType = async (type: 'config' | 'welcome' | 'invoice') => {
    if (!testEmail) {
      setTestResult({ type: 'error', message: 'Digite um email para teste' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          email: testEmail,
          data: { name: testName || 'Teste' }
        })
      });

      const result = await response.json();

      setTestResult({
        type: result.success ? 'success' : 'error',
        message: result.success ? result.message : result.error
      });
    } catch (error) {
      setTestResult({
        type: 'error',
        message: 'Erro ao testar email'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <EnvelopeIcon className="w-8 h-8 text-gray-400" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Configurações de Email</h2>
          <p className="text-gray-600">Configurar envio automático de emails via Resend</p>
        </div>
      </div>

      {/* Status da Configuração */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Status da Configuração</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Resend API Key</span>
              <Badge variant="info">Configure no .env.local</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Email de Origem</span>
              <Badge variant="info">Configure no .env.local</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Emails de NFS-e</span>
              <Badge variant="warning">Desabilitado</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Emails de Boas-vindas</span>
              <Badge variant="warning">Desabilitado</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Variáveis de Ambiente</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <Label>RESEND_API_KEY *</Label>
              <Input
                type="password"
                placeholder="re_xxxxxxxxxx"
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenha sua chave em: <a href="https://resend.com/api-keys" target="_blank" className="text-blue-600">resend.com/api-keys</a>
              </p>
            </div>

            <div>
              <Label>RESEND_FROM_EMAIL *</Label>
              <Input
                type="email"
                placeholder="noreply@seudominio.com"
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email verificado no Resend para envio
              </p>
            </div>

            <div>
              <Label>RESEND_REPLY_TO</Label>
              <Input
                type="email"
                placeholder="suporte@seudominio.com"
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email para respostas (opcional)
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configurações de Automação */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Automação de Emails</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <Label>SEND_INVOICE_EMAILS</Label>
              <div className="flex items-center space-x-2 mt-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">true</code>
                <span className="text-sm text-gray-600">- Enviar confirmação de NFS-e para clientes</span>
              </div>
            </div>

            <div>
              <Label>SEND_WELCOME_EMAILS</Label>
              <div className="flex items-center space-x-2 mt-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">true</code>
                <span className="text-sm text-gray-600">- Enviar boas-vindas para novos clientes</span>
              </div>
            </div>

            <div>
              <Label>SEND_WEBHOOK_NOTIFICATIONS</Label>
              <div className="flex items-center space-x-2 mt-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">true</code>
                <span className="text-sm text-gray-600">- Notificar admin sobre webhooks processados</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Teste de Email */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Testar Envio de Emails</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-email">Email para Teste *</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <Label htmlFor="test-name">Nome (Opcional)</Label>
                <Input
                  id="test-name"
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => testEmailType('config')}
                disabled={testing || !testEmail}
                variant="secondary"
                size="sm"
              >
                <Cog6ToothIcon className="w-4 h-4 mr-2" />
                Testar Configuração
              </Button>
              <Button
                onClick={() => testEmailType('welcome')}
                disabled={testing || !testEmail}
                variant="secondary"
                size="sm"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Testar Boas-vindas
              </Button>
              <Button
                onClick={() => testEmailType('invoice')}
                disabled={testing || !testEmail}
                variant="secondary"
                size="sm"
              >
                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                Testar NFS-e
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {testResult.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  )}
                  {testResult.message}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Templates de Email */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Templates Disponíveis</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium">Confirmação NFS-e</h4>
              <p className="text-sm text-gray-600 mt-1">
                Enviado automaticamente para o cliente após emissão
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <EnvelopeIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium">Boas-vindas</h4>
              <p className="text-sm text-gray-600 mt-1">
                Enviado para novos clientes criados via webhook
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <h4 className="font-medium">Notificações</h4>
              <p className="text-sm text-gray-600 mt-1">
                Alertas para administradores sobre webhooks e erros
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Instruções de Configuração */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Como Configurar</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">1. Criar conta no Resend</h4>
              <p className="text-gray-600">Acesse <a href="https://resend.com" target="_blank" className="text-blue-600">resend.com</a> e crie uma conta gratuita</p>
            </div>
            
            <div>
              <h4 className="font-medium">2. Verificar domínio</h4>
              <p className="text-gray-600">Adicione e verifique seu domínio no painel do Resend</p>
            </div>
            
            <div>
              <h4 className="font-medium">3. Obter API Key</h4>
              <p className="text-gray-600">Gere uma API Key em Settings → API Keys</p>
            </div>
            
            <div>
              <h4 className="font-medium">4. Configurar .env.local</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">{`# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@seudominio.com
RESEND_REPLY_TO=suporte@seudominio.com

# Email Automation
SEND_INVOICE_EMAILS=true
SEND_WELCOME_EMAILS=true
SEND_WEBHOOK_NOTIFICATIONS=true`}</pre>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
