'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompany } from '@/lib/hooks/useCompany';
import { useInvoices } from '@/lib/hooks/useInvoices';
import { 
  DocumentChartBarIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  
  // Definir período padrão (mês atual)
  const defaultPeriod = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    };
  }, []);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: defaultPeriod.startDate,
    endDate: defaultPeriod.endDate,
    status: ''
  });

  const [generating, setGenerating] = useState(false);

  // Buscar dados de invoices para o relatório
  const { 
    invoices, 
    loading, 
    error,
    pagination 
  } = useInvoices({
    companyId: company?.id,
    startDate: filters.startDate,
    endDate: filters.endDate,
    status: filters.status,
    limit: 1000 // Buscar muitas para relatório
  });

  // Calcular métricas do relatório
  const reportData = useMemo(() => {
    if (!invoices.length) {
      return {
        summary: {
          totalInvoices: 0,
          totalAmount: 0,
          totalISS: 0,
          totalDeductions: 0,
          netAmount: 0,
          avgTicket: 0
        },
        byStatus: {
          issued: { count: 0, amount: 0 },
          pending: { count: 0, amount: 0 },
          failed: { count: 0, amount: 0 },
          canceled: { count: 0, amount: 0 }
        },
        topCustomers: []
      };
    }

    // Calcular totais
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.service_value || 0), 0);
    const totalISS = invoices.reduce((sum, inv) => sum + (inv.iss_value || 0), 0);
    const totalDeductions = invoices.reduce((sum, inv) => sum + (inv.deductions_value || 0), 0);
    const netAmount = totalAmount - totalDeductions - totalISS;
    const avgTicket = totalAmount / invoices.length;

    // Agrupar por status
    const byStatus = invoices.reduce((acc, inv) => {
      const status = inv.status || 'pending';
      if (!acc[status]) acc[status] = { count: 0, amount: 0 };
      acc[status].count++;
      acc[status].amount += inv.service_value || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Top clientes
    const customerStats = invoices.reduce((acc, inv) => {
      const name = inv.customer_name || 'Cliente não identificado';
      if (!acc[name]) acc[name] = { count: 0, amount: 0 };
      acc[name].count++;
      acc[name].amount += inv.service_value || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const topCustomers = Object.entries(customerStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      summary: {
        totalInvoices: invoices.length,
        totalAmount,
        totalISS,
        totalDeductions,
        netAmount,
        avgTicket
      },
      byStatus: {
        issued: byStatus.issued || { count: 0, amount: 0 },
        pending: byStatus.pending || { count: 0, amount: 0 },
        failed: byStatus.failed || { count: 0, amount: 0 },
        canceled: byStatus.canceled || { count: 0, amount: 0 }
      },
      topCustomers
    };
  }, [invoices]);

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const generateReport = async () => {
    setGenerating(true);
    // Simular geração de relatório
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
  };

  if (!company) {
    return (
      <AppLayout user={user} company={company}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Configure sua empresa para visualizar relatórios</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} company={company}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Analise o desempenho das suas emissões de NFS-e
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
            )}
            <span className="text-sm text-gray-500">
              {reportData.summary.totalInvoices} notas encontradas
            </span>
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
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data Final</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status_filter">Status</Label>
                <Select 
                  id="status_filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="issued">Emitidas</option>
                  <option value="pending">Pendentes</option>
                  <option value="failed">Falharam</option>
                  <option value="canceled">Canceladas</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={generateReport}
                  disabled={generating}
                  loading={generating}
                >
                  {generating ? 'Gerando...' : 'Gerar Relatório'}
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
                    {reportData.summary.totalInvoices}
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
                    {reportData.summary.totalAmount.toLocaleString('pt-BR', {
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
                    {reportData.summary.totalISS.toLocaleString('pt-BR', {
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
                    {reportData.summary.avgTicket.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {error && (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">Erro ao carregar dados</div>
                <div className="text-sm text-gray-500">{error}</div>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Status das NFS-e */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Distribuição por Status</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {Object.entries(reportData.byStatus).map(([status, data]) => {
                  const percentage = reportData.summary.totalInvoices > 0 
                    ? ((data.count / reportData.summary.totalInvoices) * 100).toFixed(1)
                    : '0';
                  
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
              
              {reportData.summary.totalInvoices === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma nota fiscal encontrada no período</p>
                  <p className="text-xs mt-1">Ajuste os filtros ou emita algumas notas</p>
                </div>
              )}
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
                {reportData.topCustomers.length > 0 ? (
                  reportData.topCustomers.map((customer, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum cliente encontrado</p>
                    <p className="text-xs mt-1">Emita algumas notas para ver estatísticas</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Resumo Financeiro Detalhado */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Resumo Financeiro</h3>
              <Button variant="secondary" size="sm" disabled>
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
                    {reportData.summary.totalAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">(-) Deduções:</span>
                  <span className="text-sm font-medium text-red-600">
                    {reportData.summary.totalDeductions.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">(-) ISS:</span>
                  <span className="text-sm font-medium text-red-600">
                    {reportData.summary.totalISS.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Valor Líquido:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {reportData.summary.netAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>Período:</strong> {new Date(filters.startDate).toLocaleDateString('pt-BR')} a {new Date(filters.endDate).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Alíquota Média ISS:</strong> {
                    reportData.summary.totalAmount > 0 
                      ? ((reportData.summary.totalISS / reportData.summary.totalAmount) * 100).toFixed(2)
                      : '0'
                  }%
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Taxa de Sucesso:</strong> {
                    reportData.summary.totalInvoices > 0
                      ? ((reportData.byStatus.issued.count / reportData.summary.totalInvoices) * 100).toFixed(1)
                      : '0'
                  }%
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Ticket Médio:</strong> {reportData.summary.avgTicket.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
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
              <Button variant="secondary" disabled>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="secondary" disabled>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="secondary" disabled>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Relatório PDF
              </Button>
              <Button variant="secondary" disabled>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                XMLs das NFS-e
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Funcionalidades de exportação serão implementadas em versões futuras
            </p>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}