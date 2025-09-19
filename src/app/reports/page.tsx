import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { 
  DocumentChartBarIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

// Mock data
const mockUser = {
  name: 'Ricardo Silva',
  email: 'ricardo@empresa.com',
  role: 'admin' as const
};

const mockCompany = {
  name: 'Minha Empresa Ltda',
  environment: 'homolog' as const
};

const mockReportData = {
  period: {
    start: '2025-01-01',
    end: '2025-01-31'
  },
  summary: {
    totalInvoices: 25,
    totalAmount: 45750.00,
    totalISS: 2287.50,
    totalDeductions: 1200.00,
    netAmount: 44550.00,
    avgTicket: 1830.00
  },
  byStatus: {
    issued: { count: 20, amount: 38750.00 },
    pending: { count: 3, amount: 4500.00 },
    failed: { count: 1, amount: 1500.00 },
    canceled: { count: 1, amount: 1000.00 }
  },
  topCustomers: [
    { name: 'Empresa ABC Ltda', count: 5, amount: 15000.00 },
    { name: 'Maria Santos Consultoria ME', count: 4, amount: 12800.00 },
    { name: 'João Silva', count: 3, amount: 8500.00 },
    { name: 'Pedro Oliveira', count: 2, amount: 5200.00 }
  ]
};

export default function ReportsPage() {
  return (
    <AppLayout user={mockUser} company={mockCompany}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analise o desempenho das suas emissões de NFS-e
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="start_date">Data Inicial</Label>
                <Input
                  id="start_date"
                  type="date"
                  defaultValue={mockReportData.period.start}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data Final</Label>
                <Input
                  id="end_date"
                  type="date"
                  defaultValue={mockReportData.period.end}
                />
              </div>
              <div>
                <Label htmlFor="status_filter">Status</Label>
                <Select id="status_filter">
                  <option value="">Todos os status</option>
                  <option value="issued">Emitidas</option>
                  <option value="pending">Pendentes</option>
                  <option value="failed">Falharam</option>
                  <option value="canceled">Canceladas</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="primary" className="w-full">
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de NFS-e</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockReportData.summary.totalInvoices}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockReportData.summary.totalAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ISS Recolhido</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockReportData.summary.totalISS.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentChartBarIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ticket Médio</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockReportData.summary.avgTicket.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Status das NFS-e */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Distribuição por Status</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {Object.entries(mockReportData.byStatus).map(([status, data]) => {
                  const percentage = ((data.count / mockReportData.summary.totalInvoices) * 100).toFixed(1);
                  const statusLabels = {
                    issued: { label: 'Emitidas', color: 'bg-green-500' },
                    pending: { label: 'Pendentes', color: 'bg-yellow-500' },
                    failed: { label: 'Falharam', color: 'bg-red-500' },
                    canceled: { label: 'Canceladas', color: 'bg-gray-500' }
                  };
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${statusLabels[status as keyof typeof statusLabels].color}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {statusLabels[status as keyof typeof statusLabels].label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {data.count} ({percentage}%)
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Top Clientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Principais Clientes</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {mockReportData.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {customer.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.count} NFS-e
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Resumo Financeiro Detalhado */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Resumo Financeiro</h3>
              <Button variant="secondary" size="sm">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Bruto dos Serviços:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {mockReportData.summary.totalAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">(-) Deduções:</span>
                  <span className="text-sm font-medium text-red-600">
                    {mockReportData.summary.totalDeductions.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">(-) ISS:</span>
                  <span className="text-sm font-medium text-red-600">
                    {mockReportData.summary.totalISS.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Valor Líquido:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {mockReportData.summary.netAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>Período:</strong> {new Date(mockReportData.period.start).toLocaleDateString('pt-BR')} a {new Date(mockReportData.period.end).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Alíquota Média ISS:</strong> {((mockReportData.summary.totalISS / mockReportData.summary.totalAmount) * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Taxa de Sucesso:</strong> {((mockReportData.byStatus.issued.count / mockReportData.summary.totalInvoices) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Ações de Export */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Exportar Dados</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Button variant="secondary">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="secondary">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="secondary">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Relatório PDF
              </Button>
              <Button variant="secondary">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                XMLs das NFS-e
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
