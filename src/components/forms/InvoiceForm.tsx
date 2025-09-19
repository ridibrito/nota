'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { calculateTaxValues } from '@/lib/tax/rounding';
import { 
  DocumentPlusIcon,
  CalculatorIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface InvoiceFormData {
  customer_id: string;
  rps_number: string;
  rps_series: string;
  competence_date: string;
  service_code: string;
  description: string;
  amount: number;
  deductions: number;
  iss_rate: number;
}

interface InvoiceFormProps {
  onSuccess?: (invoice: any) => void;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const { profile } = useAuth();
  const { customers, loading: customersLoading } = useCustomers(profile?.company_id);
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: '',
    rps_number: '',
    rps_series: 'UNICA',
    competence_date: new Date().toISOString().split('T')[0],
    service_code: '1.05',
    description: '',
    amount: 0,
    deductions: 0,
    iss_rate: 0.05 // 5% padrão
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [taxCalculation, setTaxCalculation] = useState<any>(null);

  // Gera próximo número de RPS automaticamente
  useEffect(() => {
    const generateRpsNumber = async () => {
      if (!profile?.company_id) return;

      try {
        const response = await fetch(`/api/invoices/query?companyId=${profile.company_id}&limit=1`);
        const result = await response.json();
        
        if (result.success && result.data.invoices.length > 0) {
          const lastRps = result.data.invoices[0].rps_number;
          const nextNumber = String(parseInt(lastRps) + 1).padStart(3, '0');
          setFormData(prev => ({ ...prev, rps_number: nextNumber }));
        } else {
          setFormData(prev => ({ ...prev, rps_number: '001' }));
        }
      } catch (error) {
        console.error('Erro ao gerar número RPS:', error);
        setFormData(prev => ({ ...prev, rps_number: '001' }));
      }
    };

    generateRpsNumber();
  }, [profile?.company_id]);

  // Calcula impostos em tempo real
  useEffect(() => {
    if (formData.amount > 0) {
      const calculation = calculateTaxValues(
        formData.amount,
        formData.iss_rate,
        formData.deductions
      );
      setTaxCalculation(calculation);
    } else {
      setTaxCalculation(null);
    }
  }, [formData.amount, formData.iss_rate, formData.deductions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue: any = value;
    
    // Converte valores numéricos
    if (['amount', 'deductions', 'iss_rate'].includes(name)) {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Remove erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Selecione um cliente';
    }

    if (!formData.rps_number) {
      newErrors.rps_number = 'Número do RPS é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Discriminação do serviço é obrigatória';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Discriminação deve ter pelo menos 10 caracteres';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (formData.iss_rate < 0 || formData.iss_rate > 0.05) {
      newErrors.iss_rate = 'Alíquota deve estar entre 0% e 5%';
    }

    if (formData.deductions < 0) {
      newErrors.deductions = 'Deduções não podem ser negativas';
    }

    if (formData.deductions >= formData.amount) {
      newErrors.deductions = 'Deduções não podem ser maiores ou iguais ao valor do serviço';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submetendo NFS-e:', formData);
    
    if (!validateForm()) {
      console.log('Validação falhou:', errors);
      return;
    }

    if (!profile?.company_id) {
      alert('Erro: ID da empresa não encontrado');
      return;
    }

    setSaving(true);

    try {
      // Primeiro cria a invoice no banco
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          ...formData,
          company_id: profile.company_id,
          iss_value: taxCalculation?.iss_value || 0,
          status: 'pending'
        })
        .select(`
          *,
          customers (
            id,
            name,
            cpf_cnpj
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao criar invoice:', error);
        alert(`Erro ao criar NFS-e: ${error.message}`);
        return;
      }

      console.log('Invoice criada:', invoice);

      // Agora tenta emitir via API
      const emissionResponse = await fetch('/api/invoices/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      const emissionResult = await emissionResponse.json();

      if (emissionResult.success) {
        alert('NFS-e emitida com sucesso!');
        onSuccess?.(invoice);
        
        // Reset form
        setFormData({
          customer_id: '',
          rps_number: String(parseInt(formData.rps_number) + 1).padStart(3, '0'),
          rps_series: 'UNICA',
          competence_date: new Date().toISOString().split('T')[0],
          service_code: '1.05',
          description: '',
          amount: 0,
          deductions: 0,
          iss_rate: 0.05
        });
      } else {
        console.error('Erro na emissão:', emissionResult);
        alert(`Erro na emissão: ${emissionResult.error}\n\nDetalhes: ${JSON.stringify(emissionResult.details, null, 2)}`);
      }

    } catch (error) {
      console.error('Erro no processo:', error);
      alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="rps_number">Número do RPS *</Label>
                    <Input
                      id="rps_number"
                      name="rps_number"
                      type="text"
                      value={formData.rps_number}
                      onChange={handleInputChange}
                      placeholder="Ex: 001"
                      error={errors.rps_number}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rps_series">Série *</Label>
                    <Input
                      id="rps_series"
                      name="rps_series"
                      type="text"
                      value={formData.rps_series}
                      onChange={handleInputChange}
                      placeholder="Ex: UNICA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="competence_date">Data de Competência *</Label>
                    <Input
                      id="competence_date"
                      name="competence_date"
                      type="date"
                      value={formData.competence_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Tomador */}
                <div className="mt-6">
                  <Label htmlFor="customer_id">Cliente *</Label>
                  <Select 
                    id="customer_id" 
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    error={errors.customer_id}
                  >
                    <option value="">Selecione um cliente</option>
                    {customersLoading ? (
                      <option disabled>Carregando clientes...</option>
                    ) : (
                      customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.cpf_cnpj}
                        </option>
                      ))
                    )}
                  </Select>
                  {customers.length === 0 && !customersLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                      Nenhum cliente cadastrado. <Link href="/customers" className="text-blue-600 hover:underline">Cadastre aqui</Link>
                    </p>
                  )}
                </div>

                {/* Dados do Serviço */}
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="service_code">Código do Serviço *</Label>
                    <Input
                      id="service_code"
                      name="service_code"
                      type="text"
                      value={formData.service_code}
                      onChange={handleInputChange}
                      placeholder="Ex: 1.05"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Discriminação do Serviço *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Descreva detalhadamente o serviço prestado..."
                      error={errors.description}
                    />
                  </div>
                </div>

                {/* Valores */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Valores</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="amount">Valor dos Serviços (R$) *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount || ''}
                        onChange={handleInputChange}
                        placeholder="0,00"
                        error={errors.amount}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deductions">Deduções (R$)</Label>
                      <Input
                        id="deductions"
                        name="deductions"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deductions || ''}
                        onChange={handleInputChange}
                        placeholder="0,00"
                        error={errors.deductions}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="iss_rate">Alíquota ISS (%)</Label>
                      <Select
                        id="iss_rate"
                        name="iss_rate"
                        value={formData.iss_rate}
                        onChange={handleInputChange}
                      >
                        <option value={0.02}>2%</option>
                        <option value={0.03}>3%</option>
                        <option value={0.04}>4%</option>
                        <option value={0.05}>5%</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="mt-8 flex justify-end space-x-3">
                  <Link href="/invoices">
                    <Button variant="secondary">
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    variant="success"
                    loading={saving}
                    disabled={saving || !formData.customer_id || !formData.description || formData.amount <= 0}
                  >
                    <DocumentPlusIcon className="h-4 w-4 mr-2" />
                    {saving ? 'Emitindo...' : 'Emitir NFS-e'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Painel lateral - 1/3 */}
        <div className="space-y-6">
          {/* Prévia dos cálculos */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CalculatorIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Cálculos ABNT 5891</h3>
              </div>
            </CardHeader>
            <CardBody>
              {taxCalculation ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor dos Serviços:</span>
                    <span className="text-sm font-medium">
                      {taxCalculation.base_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deduções:</span>
                    <span className="text-sm font-medium">
                      {taxCalculation.deductions.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      ISS ({(taxCalculation.iss_rate * 100).toFixed(2)}%):
                    </span>
                    <span className="text-sm font-medium text-red-600">
                      {taxCalculation.iss_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">Valor Líquido:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {taxCalculation.net_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg mt-4">
                    <p className="text-xs text-blue-800">
                      <strong>Arredondamento ABNT 5891:</strong><br />
                      Cálculo com 6 casas decimais, conservação na 2ª casa.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CalculatorIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Digite o valor para ver os cálculos</p>
                </div>
              )}
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
                  <strong>Ambiente:</strong> Homologação
                </div>
                <div>
                  <strong>Padrão:</strong> ABRASF 2.04
                </div>
                <div>
                  <strong>Município:</strong> Brasília/DF
                </div>
                <hr />
                <div className="text-xs">
                  <strong>⚠️ Importante:</strong> Verifique todos os dados antes de emitir. Após a emissão, a nota só pode ser cancelada.
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
