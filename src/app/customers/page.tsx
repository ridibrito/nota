'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useCompany } from '@/lib/hooks/useCompany';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CustomerForm } from '@/components/forms/CustomerForm';
import { 
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function CustomersPage() {
  return (
    <AuthGuard>
      <CustomersPageContent />
    </AuthGuard>
  );
}

function CustomersPageContent() {
  const { user, profile } = useAuth();
  const { company } = useCompany();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { customers, loading, deleteCustomer, refetch } = useCustomers(
    company?.id,
    search
  );

  const filteredCustomers = customers.filter(customer => {
    if (typeFilter === 'CPF') {
      return customer.cpf_cnpj.replace(/\D/g, '').length === 11;
    }
    if (typeFilter === 'CNPJ') {
      return customer.cpf_cnpj.replace(/\D/g, '').length === 14;
    }
    return true;
  });

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${customerName}"?`)) {
      return;
    }

    const result = await deleteCustomer(customerId);
    if (result.success) {
      alert('Cliente excluído com sucesso!');
    } else {
      alert(`Erro ao excluir cliente: ${result.error}`);
    }
  };

  return (
    <AppLayout 
      user={profile ? {
        name: user?.email?.split('@')[0] || 'Usuário',
        email: user?.email || '',
        role: profile.role
      } : undefined}
      company={profile ? {
        name: 'Carregando...',
        environment: 'homolog'
      } : undefined}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tomadores</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie seus clientes e tomadores de serviço
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary">
              <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <Button 
              variant="primary"
              onClick={() => setShowNewCustomerForm(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Tomador
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, CPF/CNPJ ou email..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <select 
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="CPF">Pessoa Física</option>
                  <option value="CNPJ">Pessoa Jurídica</option>
                </select>
              </div>
              <div>
                <Button variant="primary" className="w-full">
                  Filtrar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Lista de tomadores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">
                  Tomadores Cadastrados
                </h3>
                <Badge variant="default">
                  {filteredCustomers.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-hidden">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Nome/Razão Social</th>
                    <th className="table-header-cell">CPF/CNPJ</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Tipo</th>
                    <th className="table-header-cell">Cadastrado em</th>
                    <th className="table-header-cell">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando clientes...</p>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-cell text-center py-8">
                        <p className="text-gray-500">Nenhum cliente encontrado</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {search ? 'Tente outro termo de busca' : 'Comece cadastrando seu primeiro cliente'}
                        </p>
                      </td>
                    </tr>
                  ) : filteredCustomers.map((customer) => {
                    const isCompany = customer.cpf_cnpj.replace(/\D/g, '').length === 14;
                    return (
                    <tr key={customer.id}>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-sm">
                          {customer.cpf_cnpj}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-gray-600">
                          {customer.email || '-'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Badge variant={isCompany ? 'issued' : 'pending'}>
                          {isCompany ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <span className="text-gray-500 text-sm">
                          {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Editar"
                            onClick={() => setEditingCustomer(customer)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Excluir"
                            onClick={() => handleDelete(customer.id, customer.name)}
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Paginação */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {filteredCustomers.length} de {customers.length} registros
              {search && ` (filtrados por "${search}")`}
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="primary" size="sm">
                1
              </Button>
              <Button variant="secondary" size="sm" disabled>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Modal de Novo Cliente */}
        {company && (
          <CustomerForm
            companyId={company.id}
            isOpen={showNewCustomerForm}
            onClose={() => setShowNewCustomerForm(false)}
            onSuccess={() => {
              refetch();
              setShowNewCustomerForm(false);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
