'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export function IntegrationSettings() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <DocumentTextIcon className="w-8 h-8 text-gray-400" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Configurações de Integrações</h2>
          <p className="text-gray-600">APIs externas e automações do sistema</p>
        </div>
      </div>

      {/* ISSNet DF */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">ISSNet DF</h3>
            <Badge variant="warning">Simulação</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Configuração Atual</h4>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Ambiente:</span>
                  <Badge variant="warning">Homologação</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modo:</span>
                  <Badge variant="info">Simulação</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Padrão:</span>
                  <span>ABRASF 2.04</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Nota:</strong> O sistema está em modo simulação, gerando números fictícios de NFS-e.
              Para usar o ISSNet real, configure o certificado A1 e as URLs de produção.
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Automações */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Automações Ativas</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Auto-criação de Clientes</span>
                <p className="text-sm text-gray-500">Via webhooks Hotmart e genéricos</p>
              </div>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Auto-emissão de NFS-e</span>
                <p className="text-sm text-gray-500">Para vendas aprovadas via webhook</p>
              </div>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Cálculo Automático de Impostos</span>
                <p className="text-sm text-gray-500">Arredondamento ABNT 5891</p>
              </div>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Ativo
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* APIs Disponíveis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">APIs Disponíveis</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Emissão de NFS-e</h4>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">POST /api/invoices/issue</code>
              <p className="text-sm text-gray-500 mt-1">Emitir nova NFS-e com dados do cliente</p>
            </div>
            <div>
              <h4 className="font-medium">Consulta de NFS-e</h4>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">POST /api/invoices/query</code>
              <p className="text-sm text-gray-500 mt-1">Consultar status de NFS-e no ISSNet</p>
            </div>
            <div>
              <h4 className="font-medium">Cancelamento</h4>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">POST /api/invoices/cancel</code>
              <p className="text-sm text-gray-500 mt-1">Cancelar NFS-e emitida</p>
            </div>
            <div>
              <h4 className="font-medium">Webhooks</h4>
              <div className="space-y-1">
                <div><code className="text-xs bg-gray-100 px-2 py-1 rounded">POST /api/webhooks/hotmart</code></div>
                <div><code className="text-xs bg-gray-100 px-2 py-1 rounded">POST /api/webhooks/generic</code></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Receber dados de sistemas externos</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
