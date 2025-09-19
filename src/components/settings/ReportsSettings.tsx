'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export function ReportsSettings() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <ChartBarIcon className="w-8 h-8 text-gray-400" />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Configurações de Relatórios</h2>
          <p className="text-gray-600">Configurações para geração de relatórios e exportações</p>
        </div>
      </div>

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Relatórios Disponíveis</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Configurações de relatórios serão implementadas aqui</p>
            <p className="text-sm text-gray-500 mt-2">
              Em breve: exportação CSV, relatórios fiscais, dashboards personalizados
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
