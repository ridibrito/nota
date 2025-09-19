'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useCompany } from '@/lib/hooks/useCompany';
import { useInvoices } from '@/lib/hooks/useInvoices';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, profile } = useAuth();
  const { company, loading: companyLoading } = useCompany(profile?.company_id);
  const { invoices, loading: invoicesLoading } = useInvoices({
    companyId: profile?.company_id,
    limit: 10
  });

  // Loading state
  if (companyLoading || invoicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Calcular estatísticas dos dados reais
  const stats = {
    totalInvoices: invoices.length,
    pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
    issuedInvoices: invoices.filter(inv => inv.status === 'issued').length,
    failedInvoices: invoices.filter(inv => inv.status === 'failed').length,
    canceledInvoices: invoices.filter(inv => inv.status === 'canceled').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    totalISS: invoices.reduce((sum, inv) => sum + (inv.iss_value || 0), 0),
  };

  // Últimas 5 notas
  const recentInvoices = invoices.slice(0, 5);
  return (
    <AppLayout 
      user={profile ? {
        name: user?.email?.split('@')[0] || 'Usuário',
        email: user?.email || '',
        role: profile.role
      } : undefined}
      company={company ? {
        name: company.name,
        environment: company.environment
      } : undefined}
    >
      <div className="space-y-6">
        {/* Título */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral das suas notas fiscais de serviço
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de NFS-e</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalInvoices}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingInvoices}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Emitidas</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.issuedInvoices}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Faturado</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalAmount.toLocaleString('pt-BR', {
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
          {/* Resumo geral */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Resumo Geral</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total de NFS-e</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalInvoices}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Valor total</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalAmount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ISS recolhido</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalISS.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Últimas NFS-e */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Últimas NFS-e</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentInvoices.length > 0 ? recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        RPS {invoice.rps_number} - {(invoice as any).customers?.name || 'Cliente não encontrado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                      <Badge variant={invoice.status as 'pending' | 'issued' | 'failed' | 'canceled'}>
                        {invoice.status === 'issued' ? 'Emitida' : 
                         invoice.status === 'pending' ? 'Pendente' : 
                         invoice.status === 'failed' ? 'Falhou' :
                         invoice.status === 'canceled' ? 'Cancelada' : 
                         invoice.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Nenhuma NFS-e encontrada</p>
                    <p className="text-xs text-gray-400 mt-1">Comece emitindo sua primeira nota fiscal</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
