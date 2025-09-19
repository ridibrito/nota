'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CogIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export function SystemSettings() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <CogIcon className="w-8 h-8 text-gray-400" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Configurações do Sistema</h2>
          <p className="text-gray-600">Configurações gerais e informações do sistema</p>
        </div>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Informações do Sistema</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Versão:</span>
              <div className="font-medium">Coruss NFS-e v1.0.0</div>
            </div>
            <div>
              <span className="text-gray-500">Padrão:</span>
              <div className="font-medium">ABRASF 2.04</div>
            </div>
            <div>
              <span className="text-gray-500">Arredondamento:</span>
              <div className="font-medium">ABNT 5891</div>
            </div>
            <div>
              <span className="text-gray-500">Região:</span>
              <div className="font-medium">Distrito Federal (DF)</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status dos Serviços */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Status dos Serviços</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Banco de Dados (Supabase)</span>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Conectado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Autenticação</span>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Webhooks</span>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Operacional
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Emissão de NFS-e</span>
              <Badge variant="success">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Funcionando
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <strong>Variáveis de Ambiente:</strong>
              <ul className="mt-2 space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL: Configurado</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY: Configurado</li>
                <li>• SUPABASE_SERVICE_ROLE_KEY: Configurado</li>
                <li>• CERT_ENCRYPTION_KEY: Configurado</li>
              </ul>
            </div>
            <div>
              <strong>Recursos Ativos:</strong>
              <ul className="mt-2 space-y-1">
                <li>• ✅ Emissão de NFS-e</li>
                <li>• ✅ Gestão de clientes</li>
                <li>• ✅ Upload de certificados</li>
                <li>• ✅ Webhooks automáticos</li>
                <li>• ✅ Cálculos fiscais ABNT</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
