'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/lib/hooks/useCompany';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { Company } from '@/types';

interface CompanyFormProps {
  companyId?: string;
  onSuccess?: (company: Company) => void;
}

export function CompanyForm({ companyId, onSuccess }: CompanyFormProps) {
  const { company, loading, updateCompany, createCompany } = useCompany(companyId);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    im: '',
    cnae: '',
    item_lista_servico: '',
    cod_tributacao_municipio: '',
    environment: 'homolog' as 'homolog' | 'prod'
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualiza form quando carrega dados da empresa
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        cnpj: company.cnpj,
        im: company.im,
        cnae: company.cnae,
        item_lista_servico: company.item_lista_servico,
        cod_tributacao_municipio: company.cod_tributacao_municipio,
        environment: company.environment
      });
    }
  }, [company]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Remove erro do campo quando usuário digita
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Razão social é obrigatória';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else {
      // Validação básica de CNPJ
      const cnpjNumbers = formData.cnpj.replace(/\D/g, '');
      if (cnpjNumbers.length !== 14) {
        newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
      }
    }

    if (!formData.im.trim()) {
      newErrors.im = 'Inscrição Municipal é obrigatória';
    }

    if (!formData.cnae.trim()) {
      newErrors.cnae = 'CNAE é obrigatório';
    }

    if (!formData.item_lista_servico.trim()) {
      newErrors.item_lista_servico = 'Item da Lista de Serviço é obrigatório';
    }

    if (!formData.cod_tributacao_municipio.trim()) {
      newErrors.cod_tributacao_municipio = 'Código de Tributação Municipal é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submetendo formulário com dados:', formData);
    console.log('Company ID:', companyId);
    
    if (!validateForm()) {
      console.log('Validação falhou:', errors);
      return;
    }

    setSaving(true);

    try {
      console.log('Tentando salvar empresa...');
      
      const result = companyId 
        ? await updateCompany(formData)
        : await createCompany(formData);

      console.log('Resultado:', result);

      if (result.success) {
        console.log('Empresa salva com sucesso!');
        onSuccess?.(result.data);
        alert('Empresa salva com sucesso!');
      } else {
        console.error('Erro ao salvar:', result.error);
        alert(`Erro ao salvar empresa: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro na função:', error);
      alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  if (loading && companyId) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dados da empresa...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            {companyId ? 'Editar Empresa' : 'Cadastrar Empresa'}
          </h3>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Razão Social *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Digite a razão social completa"
                error={errors.name}
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                name="cnpj"
                type="text"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0001-00"
                error={errors.cnpj}
                maxLength={18}
              />
            </div>

            <div>
              <Label htmlFor="im">Inscrição Municipal *</Label>
              <Input
                id="im"
                name="im"
                type="text"
                value={formData.im}
                onChange={handleInputChange}
                placeholder="Digite a inscrição municipal"
                error={errors.im}
              />
            </div>

            <div>
              <Label htmlFor="cnae">CNAE Principal *</Label>
              <Input
                id="cnae"
                name="cnae"
                type="text"
                value={formData.cnae}
                onChange={handleInputChange}
                placeholder="0000-0/00"
                error={errors.cnae}
              />
            </div>

            <div>
              <Label htmlFor="item_lista_servico">Item Lista de Serviço *</Label>
              <Input
                id="item_lista_servico"
                name="item_lista_servico"
                type="text"
                value={formData.item_lista_servico}
                onChange={handleInputChange}
                placeholder="Ex: 1.05"
                error={errors.item_lista_servico}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="cod_tributacao_municipio">Código de Tributação Municipal *</Label>
              <Input
                id="cod_tributacao_municipio"
                name="cod_tributacao_municipio"
                type="text"
                value={formData.cod_tributacao_municipio}
                onChange={handleInputChange}
                placeholder="Digite o código de tributação municipal"
                error={errors.cod_tributacao_municipio}
              />
            </div>

            <div>
              <Label htmlFor="environment">Ambiente *</Label>
              <Select 
                id="environment" 
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
              >
                <option value="homolog">Homologação</option>
                <option value="prod">Produção</option>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Informações Importantes:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Todos os campos são obrigatórios para emissão de NFS-e</li>
              <li>Use o ambiente de homologação para testes</li>
              <li>O Item da Lista e Código de Tributação devem estar corretos</li>
              <li>Consulte a planilha DF_RELACIONAMENTO_CNAE_LC.xlsx se necessário</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => window.history.back()}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              {saving ? 'Salvando...' : companyId ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
