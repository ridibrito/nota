'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, getStatusVariant, getStatusText } from '@/components/ui/Badge';
import { useCompany } from '@/lib/hooks/useCompany';
import { useInvoices } from '@/lib/hooks/useInvoices';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';


export default function InvoicesPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1
  });

  // Estado para notas do ISSNet DF
  const [issnetInvoices, setIssnetInvoices] = useState([]);
  const [issnetLoading, setIssnetLoading] = useState(false);
  const [issnetError, setIssnetError] = useState<string | null>(null);

  // Buscar notas do ISSNet DF por período
  const fetchISSNetInvoices = async (startDate: string, endDate: string) => {
    if (!company?.id || !startDate || !endDate) return;

    setIssnetLoading(true);
    setIssnetError(null);

    try {
      const response = await fetch('/api/invoices/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          startDate,
          endDate
        })
      });

      const result = await response.json();

      if (result.success) {
        // Converter resposta do ISSNet para formato da interface
        if (result.data.xml_response) {
          const parsedData = parseISSNetXMLToInvoices(result.data.xml_response);
          setIssnetInvoices(parsedData);
        } else if (result.data.invoices) {
          // Dados já no formato correto (simulação ou API direta)
          setIssnetInvoices(result.data.invoices);
        } else {
          setIssnetInvoices([]);
        }
      } else {
        // Se ISSNet falhar, tentar simulação
        try {
          const simResponse = await fetch('/api/invoices/simulate-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: company.id,
              startDate,
              endDate
            })
          });

          const simResult = await simResponse.json();
          if (simResult.success) {
            setIssnetInvoices(simResult.data.invoices);
            setIssnetError('⚠️ Mostrando dados simulados - ISSNet DF indisponível');
          } else {
            setIssnetError(result.error || 'Erro ao buscar notas no ISSNet DF');
          }
        } catch (simError) {
          setIssnetError(result.error || 'Erro ao buscar notas no ISSNet DF');
        }
      }
    } catch (err) {
      setIssnetError(err instanceof Error ? err.message : 'Erro de conexão');
      console.error('Erro ao buscar ISSNet:', err);
    } finally {
      setIssnetLoading(false);
    }
  };

  // Função para converter XML do ISSNet em dados da interface
  const parseISSNetXMLToInvoices = (xmlResponse: string) => {
    try {
      console.log('Parseando XML do ISSNet:', xmlResponse);

      // Remove CDATA se presente
      const cleanXml = xmlResponse.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
      
      // Extrair múltiplas NFS-e se houver
      const invoices = [];
      
      // Regex para encontrar cada NFS-e no XML
      const nfseRegex = /<InfNfse[^>]*>(.*?)<\/InfNfse>/gs;
      const matches = cleanXml.matchAll(nfseRegex);
      
      for (const match of matches) {
        const nfseXml = match[0];
        
        // Extrair dados de cada NFS-e
        const nfseNumber = nfseXml.match(/<Numero>([^<]+)<\/Numero>/)?.[1];
        const verificationCode = nfseXml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/)?.[1];
        const issueDate = nfseXml.match(/<DataEmissao>([^<]+)<\/DataEmissao>/)?.[1];
        const rpsNumber = nfseXml.match(/<IdentificacaoRps>.*?<Numero>([^<]+)<\/Numero>/s)?.[1];
        const rpsSeries = nfseXml.match(/<IdentificacaoRps>.*?<Serie>([^<]+)<\/Serie>/s)?.[1];
        
        // Dados do serviço
        const serviceValue = nfseXml.match(/<ValorServicos>([^<]+)<\/ValorServicos>/)?.[1];
        const deductions = nfseXml.match(/<ValorDeducoes>([^<]+)<\/ValorDeducoes>/)?.[1];
        const issValue = nfseXml.match(/<ValorIss>([^<]+)<\/ValorIss>/)?.[1];
        const description = nfseXml.match(/<Discriminacao>([^<]+)<\/Discriminacao>/)?.[1];
        
        // Dados do tomador
        const customerName = nfseXml.match(/<RazaoSocial>([^<]+)<\/RazaoSocial>/)?.[1];
        const customerDoc = nfseXml.match(/<(?:Cpf|Cnpj)>([^<]+)<\/(?:Cpf|Cnpj)>/)?.[1];
        
        if (nfseNumber) {
          invoices.push({
            id: `issnet-${nfseNumber}`,
            rps_number: rpsNumber || 'N/A',
            rps_series: rpsSeries || 'N/A',
            nfse_number: nfseNumber,
            nfse_verification_code: verificationCode,
            amount: parseFloat(serviceValue || '0'),
            deductions: parseFloat(deductions || '0'),
            iss_value: parseFloat(issValue || '0'),
            description: description || 'Serviço prestado',
            status: 'issued' as const,
            competence_date: issueDate ? issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
            created_at: issueDate || new Date().toISOString(),
            updated_at: issueDate || new Date().toISOString(),
            company_id: company?.id || '',
            customer_id: `issnet-customer-${nfseNumber}`,
            service_code: '01.05',
            iss_rate: serviceValue ? (parseFloat(issValue || '0') / parseFloat(serviceValue)) : 0,
            customers: {
              id: `issnet-customer-${nfseNumber}`,
              name: customerName || 'Cliente não identificado',
              cpf_cnpj: customerDoc ? formatDocument(customerDoc) : 'N/A'
            }
          });
        }
      }
      
      console.log('Invoices parseadas do ISSNet:', invoices);
      return invoices;
      
    } catch (err) {
      console.error('Erro ao parsear XML do ISSNet:', err);
      return [];
    }
  };

  // Função auxiliar para formatar documento
  const formatDocument = (doc: string) => {
    const numbers = doc.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  // Hook local para compatibilidade (dados do banco local)
  const { 
    invoices: localInvoices, 
    loading: localLoading, 
    error: localError, 
    pagination, 
    issueInvoice, 
    cancelInvoice 
  } = useInvoices({
    companyId: company?.id,
    ...filters
  });


  // Usar dados do ISSNet se disponíveis, senão dados locais
  const invoices = issnetInvoices.length > 0 ? issnetInvoices : localInvoices;
  const loading = issnetLoading || localLoading;
  const error = issnetError || localError;

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!invoices.length) {
      return { total: 0, pending: 0, issued: 0, failed: 0, canceled: 0 };
    }
    
    return invoices.reduce((acc, invoice) => {
      acc.total++;
      acc[invoice.status]++;
      return acc;
    }, { total: 0, pending: 0, issued: 0, failed: 0, canceled: 0 });
  }, [invoices]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleReissue = async (invoiceId: string) => {
    if (!confirm('Tem certeza que deseja reenviar esta NFS-e?')) return;
    
    const result = await issueInvoice(invoiceId);
    if (result.success) {
      alert('NFS-e reenviada com sucesso!');
    } else {
      alert(`Erro ao reenviar: ${result.error}`);
    }
  };

  const handleCancel = async (invoiceId: string) => {
    const reason = prompt('Motivo do cancelamento:');
    if (!reason) return;
    
    const result = await cancelInvoice(invoiceId, reason);
    if (result.success) {
      alert('NFS-e cancelada com sucesso!');
    } else {
      alert(`Erro ao cancelar: ${result.error}`);
    }
  };


  if (!company) {
    return (
      <AppLayout user={user} company={company}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Configure sua empresa primeiro para ver as notas fiscais.</p>
            <Link href="/settings" className="mt-4 inline-block">
              <Button variant="primary">
                Configurar Empresa
              </Button>
            </Link>
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
            <h1 className="text-2xl font-semibold text-gray-900">Notas Fiscais</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie suas NFS-e emitidas e pendentes
            </p>
          </div>
          <Link href="/invoices/new">
            <Button variant="primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Emitir NFS-e
            </Button>
          </Link>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pendentes</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{stats.issued}</div>
                <div className="text-sm text-gray-500">Emitidas</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-500">Falhas</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-600">{stats.canceled}</div>
                <div className="text-sm text-gray-500">Canceladas</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Filtros e Consulta</h3>
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!filters.startDate || !filters.endDate}
                  onClick={() => fetchISSNetInvoices(filters.startDate, filters.endDate)}
                  loading={issnetLoading}
                >
                  {issnetLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por RPS, cliente ou número NFS-e..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <select 
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="issued">Emitida</option>
                  <option value="failed">Falha</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>
              <div>
                <Input 
                  type="date" 
                  placeholder="Data inicial"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                  title="Obrigatório para buscar no ISSNet DF"
                />
                <p className="text-xs text-gray-500 mt-1">Data inicial *</p>
              </div>
              <div>
                <Input 
                  type="date" 
                  placeholder="Data final"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                  title="Obrigatório para buscar no ISSNet DF"
                />
                <p className="text-xs text-gray-500 mt-1">Data final *</p>
              </div>
            </div>
            
            {/* Instruções */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Como funciona:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• <strong>Carregamento automático:</strong> Mostra notas do mês vigente ao abrir a página</li>
                <li>• <strong>Botão "Buscar":</strong> Consulta suas notas reais no portal do governo (ISSNet DF)</li>
                <li>• <strong>Filtros:</strong> Defina período, status ou busque por texto para refinar resultados</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* Lista de NFS-e */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">
                  Notas Fiscais
                </h3>
                {issnetInvoices.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🌐 ISSNet DF
                  </span>
                )}
                {issnetInvoices.length === 0 && localInvoices.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    💾 Local
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja limpar TODOS os dados de teste? Esta ação não pode ser desfeita!')) return;
                    
                    try {
                      const response = await fetch('/api/admin/clean-test-data', { method: 'POST' });
                      const result = await response.json();
                      
                      if (result.success) {
                        alert('Dados de teste removidos! Recarregando página...');
                        window.location.reload();
                      } else {
                        alert(`Erro: ${result.error}`);
                      }
                    } catch (err) {
                      alert('Erro ao limpar dados');
                    }
                  }}
                >
                  🗑️ Limpar Dados de Teste
                </Button>
                <Button variant="secondary" size="sm">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Carregando notas fiscais...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 mb-2">Erro ao carregar notas fiscais</p>
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Nenhuma nota fiscal encontrada</p>
                  <p className="text-sm text-gray-500">Comece emitindo sua primeira NFS-e</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">RPS</th>
                      <th className="table-header-cell">Cliente</th>
                      <th className="table-header-cell">Valor</th>
                      <th className="table-header-cell">ISS</th>
                      <th className="table-header-cell">NFS-e</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Data</th>
                      <th className="table-header-cell">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.rps_number}
                            </div>
                            <div className="text-xs text-gray-500">
                              Série: {invoice.rps_series}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.customers?.name || 'Cliente não encontrado'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {invoice.customers?.cpf_cnpj || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="font-medium">
                            {invoice.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-gray-600">
                            {(invoice.iss_value || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </span>
                        </td>
                        <td className="table-cell">
                          {invoice.nfse_number ? (
                            <span className="font-mono text-sm">
                              {invoice.nfse_number}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {getStatusText(invoice.status)}
                          </Badge>
                        </td>
                        <td className="table-cell">
                          <span className="text-gray-500 text-sm">
                            {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" title="Visualizar">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            {invoice.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Reenviar"
                                onClick={() => handleReissue(invoice.id)}
                              >
                                <ArrowPathIcon className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            {invoice.status === 'issued' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Cancelar"
                                onClick={() => handleCancel(invoice.id)}
                              >
                                <XMarkIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Paginação */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={pagination.page <= 1}
                onClick={() => handleFilterChange({ page: pagination.page - 1 })}
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                {pagination.page} de {pagination.pages}
              </span>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={pagination.page >= pagination.pages}
                onClick={() => handleFilterChange({ page: pagination.page + 1 })}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
