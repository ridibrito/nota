'use client';

import { useState, useEffect, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCompany } from '@/lib/hooks/useCompany';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { roundABNT } from '@/lib/tax/rounding';
import Link from 'next/link';
import { DocumentPlusIcon, CalculatorIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ClientOnly } from '@/components/ui/ClientOnly';

interface InvoiceFormData {
  customer_id: string;
  rps_number: string;
  rps_series: string;
  competence_date: string;
  service_code: string;
  description: string;
  amount: string;
  deductions: string;
  iss_rate: string;
}

interface InvoiceCalculations {
  service_value: number;
  deductions_value: number;
  calculation_base: number;
  iss_value: number;
  net_value: number;
}

export default function NewInvoicePage() {
  const { user } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const { customers, loading: customersLoading } = useCustomers(company?.id);
  
  // Calcular data inicial de forma consistente
  const initialDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: '',
    rps_number: '',
    rps_series: 'UNICA',
    competence_date: initialDate,
    service_code: '',
    description: '',
    amount: '',
    deductions: '0',
    iss_rate: '2.00'
  });

  const [calculations, setCalculations] = useState<InvoiceCalculations>({
    service_value: 0,
    deductions_value: 0,
    calculation_base: 0,
    iss_value: 0,
    net_value: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gerar próximo número RPS
  useEffect(() => {
    if (company && !formData.rps_number) {
      // Gerar número RPS único baseado no timestamp
      const nextRpsNumber = String(Date.now()).slice(-6);
      setFormData(prev => ({ ...prev, rps_number: nextRpsNumber }));
    }
  }, [company, formData.rps_number]);

  // Gerar novo número RPS a cada submissão para evitar duplicatas
  const generateNewRpsNumber = () => {
    const newRpsNumber = String(Date.now()).slice(-6);
    setFormData(prev => ({ ...prev, rps_number: newRpsNumber }));
    return newRpsNumber;
  };

  // Recalcular valores quando os campos mudarem
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const issRate = parseFloat(formData.iss_rate) || 0;

    const serviceValue = roundABNT(amount);
    const deductionsValue = roundABNT(deductions);
    const calculationBase = roundABNT(serviceValue - deductionsValue);
    const issValue = roundABNT(calculationBase * (issRate / 100));
    const netValue = roundABNT(calculationBase - issValue);

    setCalculations({
      service_value: serviceValue,
      deductions_value: deductionsValue,
      calculation_base: calculationBase,
      iss_value: issValue,
      net_value: netValue
    });
  }, [formData.amount, formData.deductions, formData.iss_rate]);

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validações básicas
      if (!formData.customer_id) {
        throw new Error('Selecione um cliente');
      }
      if (!formData.description.trim()) {
        throw new Error('Descrição do serviço é obrigatória');
      }
      if (parseFloat(formData.amount) <= 0) {
        throw new Error('Valor do serviço deve ser maior que zero');
      }

      // Gerar novo número RPS para evitar duplicatas
      const newRpsNumber = generateNewRpsNumber();

      // Preparar dados para envio
      const invoiceData = {
        company_id: company?.id,
        customer_id: formData.customer_id,
        rps_number: newRpsNumber,
        rps_series: formData.rps_series,
        competence_date: formData.competence_date,
        service_code: formData.service_code || company?.item_lista_servico,
        description: formData.description.trim(),
        amount: calculations.service_value,
        deductions: calculations.deductions_value,
        iss_rate: parseFloat(formData.iss_rate) / 100,
        iss_value: calculations.iss_value
      };

      console.log('Enviando dados da NFS-e:', invoiceData);

      const response = await fetch('/api/invoices/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao emitir NFS-e');
      }

      setSuccess('NFS-e emitida com sucesso!');
      
      // Reset form
      setFormData({
        customer_id: '',
        rps_number: '', // Será gerado pelo useEffect
        rps_series: 'UNICA',
        competence_date: initialDate,
        service_code: '',
        description: '',
        amount: '',
        deductions: '0',
        iss_rate: '2.00'
      });

    } catch (err) {
      console.error('Erro ao emitir NFS-e:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Estado de carregamento geral
  if (companyLoading) {
    return (
      <AuthGuard>
        <AppLayout>
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados...</p>
              </div>
            </CardBody>
          </Card>
        </AppLayout>
      </AuthGuard>
    );
  }

  // Se não há empresa cadastrada
  if (!company) {
    return (
      <AuthGuard>
        <AppLayout>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Configure os dados da empresa primeiro.
                </p>
                <Link href="/company">
                  <Button>Configurar Empresa</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Emitir Nova NFS-e</h1>
              <p className="mt-1 text-sm text-gray-500">
                Preencha os dados para emitir uma nova nota fiscal de serviços
              </p>
            </div>
            <Link href="/invoices">
              <Button variant="secondary">
                Voltar para Lista
              </Button>
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Formulário principal - 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dados do RPS */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <DocumentPlusIcon className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">Dados do RPS</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="rps_number">Número do RPS *</Label>
                        <ClientOnly fallback={
                          <Input
                            id="rps_number"
                            type="text"
                            value=""
                            readOnly
                            className="bg-gray-50"
                            placeholder="Gerando..."
                          />
                        }>
                          <Input
                            id="rps_number"
                            type="text"
                            value={formData.rps_number}
                            onChange={(e) => handleInputChange('rps_number', e.target.value)}
                            required
                            readOnly
                            className="bg-gray-50"
                          />
                        </ClientOnly>
                      </div>
                      <div>
                        <Label htmlFor="rps_series">Série *</Label>
                        <Input
                          id="rps_series"
                          type="text"
                          value={formData.rps_series}
                          onChange={(e) => handleInputChange('rps_series', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="competence_date">Data de Competência *</Label>
                        <Input
                          id="competence_date"
                          type="date"
                          value={formData.competence_date}
                          onChange={(e) => handleInputChange('competence_date', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Tomador */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Tomador do Serviço</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customer">Cliente *</Label>
                        <Select 
                          id="customer"
                          value={formData.customer_id}
                          onChange={(e) => handleInputChange('customer_id', e.target.value)}
                          required
                          disabled={customersLoading}
                        >
                          <option value="">
                            {customersLoading ? 'Carregando clientes...' : 'Selecione um cliente'}
                          </option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.cpf_cnpj}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="text-sm text-gray-500">
                        <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                        Não encontrou o cliente? <Link href="/customers" className="text-blue-600 hover:underline">Cadastre aqui</Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Dados do Serviço */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Dados do Serviço</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="service_code">Código do Serviço</Label>
                        <Input
                          id="service_code"
                          type="text"
                          value={formData.service_code}
                          onChange={(e) => handleInputChange('service_code', e.target.value)}
                          placeholder={company.item_lista_servico || 'Ex: 01.01'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Deixe vazio para usar o código padrão da empresa: {company.item_lista_servico}
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Discriminação do Serviço *</Label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Descreva detalhadamente o serviço prestado..."
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Valores */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">Valores</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="amount">Valor dos Serviços (R$) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => handleInputChange('amount', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="deductions">Deduções (R$)</Label>
                        <Input
                          id="deductions"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.deductions}
                          onChange={(e) => handleInputChange('deductions', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="iss_rate">Alíquota ISS (%)</Label>
                        <Select
                          id="iss_rate"
                          value={formData.iss_rate}
                          onChange={(e) => handleInputChange('iss_rate', e.target.value)}
                        >
                          <option value="2.00">2,00%</option>
                          <option value="3.00">3,00%</option>
                          <option value="4.00">4,00%</option>
                          <option value="5.00">5,00%</option>
                        </Select>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Mensagens */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erro</h3>
                        <div className="mt-2 text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Sucesso</h3>
                        <div className="mt-2 text-sm text-green-700">{success}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex justify-end space-x-3">
                  <Link href="/invoices">
                    <Button variant="secondary">
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit"
                    disabled={loading || !formData.customer_id || !formData.description.trim()}
                  >
                    <DocumentPlusIcon className="h-4 w-4 mr-2" />
                    {loading ? 'Emitindo...' : 'Emitir NFS-e'}
                  </Button>
                </div>
              </div>

              {/* Painel lateral - 1/3 */}
              <div className="space-y-6">
                {/* Prévia dos cálculos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <CalculatorIcon className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">Cálculos (ABNT 5891)</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor dos Serviços:</span>
                        <span className="text-sm font-medium">
                          R$ {calculations.service_value.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">(-) Deduções:</span>
                        <span className="text-sm font-medium">
                          R$ {calculations.deductions_value.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base de Cálculo:</span>
                        <span className="text-sm font-medium">
                          R$ {calculations.calculation_base.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          ISS ({formData.iss_rate}%):
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          R$ {calculations.iss_value.toFixed(2)}
                        </span>
                      </div>
                      
                      <hr />
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-900">Valor Líquido:</span>
                        <span className="text-sm font-semibold text-green-600">
                          R$ {calculations.net_value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Informações importantes */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">ℹ️ Informações</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div>
                        <strong>Ambiente:</strong> {company.environment === 'homolog' ? 'Homologação' : 'Produção'}
                      </div>
                      <div>
                        <strong>Empresa:</strong> {company.name}
                      </div>
                      <div>
                        <strong>CNPJ:</strong> {company.cnpj}
                      </div>
                      <div>
                        <strong>Arredondamento:</strong> ABNT 5891
                      </div>
                      <div>
                        <strong>Padrão:</strong> ABRASF 2.04
                      </div>
                      <hr />
                      <div className="text-xs">
                        <strong>Dica:</strong> Verifique todos os dados antes de emitir. Após a emissão, a nota só pode ser cancelada.
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}