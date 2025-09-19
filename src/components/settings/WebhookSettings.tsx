'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  LinkIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface WebhookLog {
  id: string;
  source: string;
  event: string;
  payload: any;
  status: 'processing' | 'processed' | 'error' | 'retry';
  result?: any;
  processed_at: string;
  error_message?: string;
}

export function WebhookSettings() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'urls' | 'logs' | 'docs'>('urls');
  const [showSecrets, setShowSecrets] = useState(false);

  // URLs dos webhooks
  const webhookUrls = {
    hotmart: typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/hotmart` : '',
    generic: typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/generic` : ''
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, []);

  const fetchWebhookLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks/logs?limit=20');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aqui você poderia adicionar uma notificação
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="success"><CheckCircleIcon className="w-4 h-4 mr-1" />Processado</Badge>;
      case 'processing':
        return <Badge variant="warning"><ClockIcon className="w-4 h-4 mr-1" />Processando</Badge>;
      case 'error':
        return <Badge variant="danger"><XCircleIcon className="w-4 h-4 mr-1" />Erro</Badge>;
      case 'retry':
        return <Badge variant="info"><ExclamationTriangleIcon className="w-4 h-4 mr-1" />Tentando</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <LinkIcon className="w-8 h-8 text-gray-400" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Configurações de Webhooks</h2>
          <p className="text-gray-600">Integração automática com Hotmart, CRM, ERP e outros sistemas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'urls', name: 'URLs & Configuração' },
            { id: 'logs', name: 'Logs' },
            { id: 'docs', name: 'Documentação' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'urls' && (
        <div className="space-y-6">
          {/* URLs dos Webhooks */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">URLs dos Webhooks</h3>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Hotmart Webhook */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <img 
                      src="/hotmart.png" 
                      alt="Hotmart" 
                      className="w-32 h-16 rounded-lg object-contain "
                    />
                  </div>
                  
                  <div className="flex-1"></div>
                  <Badge variant="success">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Ativo
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-orange-900">URL do Webhook</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="text"
                        value={webhookUrls.hotmart}
                        readOnly
                        className="bg-white/70 font-mono text-sm border-orange-200"
                      />
                      <Button
                        onClick={() => copyToClipboard(webhookUrls.hotmart)}
                        variant="secondary"
                        size="sm"
                        className="bg-white/70 hover:bg-white border-orange-200"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 border border-orange-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-orange-900 mb-2">📋 Como configurar:</h5>
                    <ol className="text-xs text-orange-800 space-y-1">
                      <li>1. Acesse o painel da Hotmart</li>
                      <li>2. Vá em Ferramentas → Postback/Webhook</li>
                      <li>3. Cole a URL acima</li>
                      <li>4. Ative os eventos: PURCHASE_APPROVED, PURCHASE_COMPLETE</li>
                    </ol>
                  </div>
                  
                  <div className="bg-white/50 border border-orange-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-orange-900 mb-2">⚡ Funcionalidades:</h5>
                    <ul className="text-xs text-orange-800 space-y-1">
                      <li>• ✅ Criação automática de clientes</li>
                      <li>• ✅ Geração automática de NFS-e</li>
                      <li>• ✅ Conversão de valores (centavos → reais)</li>
                      <li>• ✅ Série personalizada: "HOTMART"</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Webhook Genérico */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <LinkIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900">Webhook Genérico</h4>
                    <p className="text-sm text-blue-700">CRM, ERP e outros sistemas</p>
                  </div>
                  <div className="flex-1"></div>
                  <Badge variant="success">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Ativo
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-blue-900">URL do Webhook</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="text"
                        value={webhookUrls.generic}
                        readOnly
                        className="bg-white/70 font-mono text-sm border-blue-200"
                      />
                      <Button
                        onClick={() => copyToClipboard(webhookUrls.generic)}
                        variant="secondary"
                        size="sm"
                        className="bg-white/70 hover:bg-white border-blue-200"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">🔧 Configuração:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Configure seu sistema para enviar POST para a URL acima</li>
                      <li>• Use o formato JSON especificado na documentação</li>
                      <li>• Opcional: Configure assinatura HMAC para segurança</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">⚡ Funcionalidades:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• ✅ Suporte a múltiplas origens</li>
                      <li>• ✅ Configuração flexível por webhook</li>
                      <li>• ✅ Auto-criação de clientes</li>
                      <li>• ✅ Séries personalizáveis (CRM, ERP, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Configurações de Segurança */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Segurança dos Webhooks</h3>
                <Button
                  onClick={() => setShowSecrets(!showSecrets)}
                  variant="secondary"
                  size="sm"
                >
                  {showSecrets ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <Label>Chave Secreta Hotmart (Opcional)</Label>
                <Input
                  type={showSecrets ? "text" : "password"}
                  placeholder="Configure no .env.local: HOTMART_WEBHOOK_SECRET"
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para validar assinaturas HMAC dos webhooks da Hotmart
                </p>
              </div>

              <div>
                <Label>Chave Secreta Genérica (Opcional)</Label>
                <Input
                  type={showSecrets ? "text" : "password"}
                  placeholder="Configure no .env.local: GENERIC_WEBHOOK_SECRET"
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para validar assinaturas de outros sistemas
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Resumo das Integrações */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Resumo das Integrações</h3>
              <p className="text-sm text-gray-600 mt-1">
                Status geral dos webhooks configurados
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hotmart Status */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <img 
                      src="/hotmart.png" 
                      alt="Hotmart" 
                      className="w-24 h-8 rounded object-contain p-1"
                    />
                    <div>
                      
                      <Badge variant="success" className="text-xs">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Operacional
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-orange-800">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-600" />
                      <span>Auto-criação de clientes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-600" />
                      <span>Auto-emissão de NFS-e</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-3 h-3 text-yellow-600" />
                      <span>Requer certificado A1</span>
                    </div>
                  </div>
                </div>

                {/* Genérico Status */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                      <LinkIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Genérico</h4>
                      <Badge variant="success" className="text-xs">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Operacional
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-blue-800">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-600" />
                      <span>Múltiplas origens</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-600" />
                      <span>Configuração flexível</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-600" />
                      <span>Validação HMAC opcional</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Logs de Webhooks</h3>
              <Button onClick={fetchWebhookLogs} disabled={loading} size="sm">
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum webhook recebido ainda</p>
                <p className="text-sm text-gray-500 mt-2">
                  Configure seus sistemas para enviar webhooks para os endpoints acima
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resultado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.processed_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{log.source}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.event}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.result?.customer?.name && (
                            <div>Cliente: {log.result.customer.name}</div>
                          )}
                          {log.result?.invoice?.id && (
                            <div>NFS-e: {log.result.invoice.rps_number}</div>
                          )}
                          {log.error_message && (
                            <div className="text-red-600 text-xs">{log.error_message}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Documentação Hotmart */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <img 
                  src="/hotmart.png" 
                  alt="Hotmart" 
                  className="w-8 h-8 rounded object-contain bg-white p-1 shadow-sm"
                />
                <h3 className="text-lg font-semibold">Integração Hotmart</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h4 className="font-medium">1. Configurar Webhook na Hotmart</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Acesse o painel da Hotmart → Ferramentas → Postback/Webhook
                </p>
                <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-sm">
                  URL: {webhookUrls.hotmart}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">2. Eventos Suportados</h4>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• <code>PURCHASE_APPROVED</code> - Compra aprovada</li>
                  <li>• <code>PURCHASE_COMPLETE</code> - Compra finalizada</li>
                  <li>• <code>PURCHASE_CANCELED</code> - Compra cancelada</li>
                  <li>• <code>PURCHASE_REFUNDED</code> - Compra estornada</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">3. Processo Automático</h4>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Cliente criado automaticamente</li>
                  <li>• NFS-e gerada com série "HOTMART"</li>
                  <li>• Valor convertido de centavos para reais</li>
                  <li>• Código de serviço: 01.05 (Desenvolvimento)</li>
                </ul>
              </div>
            </CardBody>
          </Card>

          {/* Documentação Genérica */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center shadow-sm">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold">Webhook Genérico</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h4 className="font-medium">1. Formato do Payload</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "sale.approved",
  "source": "crm",
  "customer": {
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "document": "123.456.789-00"
  },
  "service": {
    "description": "Consultoria em TI",
    "amount": 1500.00,
    "iss_rate": 2.0
  },
  "config": {
    "auto_issue": true,
    "rps_series": "CRM"
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium">2. Eventos Suportados</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Vendas:</strong>
                    <ul className="text-gray-600 mt-1">
                      <li>• sale.created</li>
                      <li>• sale.approved</li>
                      <li>• sale.canceled</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Outros:</strong>
                    <ul className="text-gray-600 mt-1">
                      <li>• order.completed</li>
                      <li>• payment.approved</li>
                      <li>• customer.created</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
