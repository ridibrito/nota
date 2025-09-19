'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  BuildingOfficeIcon,
  LinkIcon,
  KeyIcon,
  CogIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

// Componentes das configurações
import { CompanySettings } from '@/components/settings/CompanySettings';
import { WebhookSettings } from '@/components/settings/WebhookSettings';
import { CertificateSettings } from '@/components/settings/CertificateSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { ReportsSettings } from '@/components/settings/ReportsSettings';

type SettingsTab = 'company' | 'webhooks' | 'certificates' | 'emails' | 'system' | 'integrations' | 'reports';

const settingsTabs = [
  {
    id: 'company' as SettingsTab,
    name: 'Empresa',
    description: 'Dados da empresa, CNPJ, IM',
    icon: BuildingOfficeIcon,
    component: CompanySettings
  },
  {
    id: 'certificates' as SettingsTab,
    name: 'Certificados',
    description: 'Certificado A1, upload e validação',
    icon: KeyIcon,
    component: CertificateSettings
  },
  {
    id: 'webhooks' as SettingsTab,
    name: 'Webhooks',
    description: 'Integração Hotmart, CRM, ERP',
    icon: LinkIcon,
    component: WebhookSettings
  },
  {
    id: 'emails' as SettingsTab,
    name: 'Emails',
    description: 'Configuração Resend e templates',
    icon: EnvelopeIcon,
    component: EmailSettings
  },
  {
    id: 'integrations' as SettingsTab,
    name: 'Integrações',
    description: 'APIs externas e automações',
    icon: DocumentTextIcon,
    component: IntegrationSettings
  },
  {
    id: 'reports' as SettingsTab,
    name: 'Relatórios',
    description: 'Configurações de relatórios',
    icon: ChartBarIcon,
    component: ReportsSettings
  },
  {
    id: 'system' as SettingsTab,
    name: 'Sistema',
    description: 'Configurações gerais do sistema',
    icon: CogIcon,
    component: SystemSettings
  }
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  // Verificar se há um tab específico na URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab;
    if (tabParam && settingsTabs.find(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const ActiveComponent = settingsTabs.find(tab => tab.id === activeTab)?.component;

  // Debug removido após correção

  if (!ActiveComponent) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="p-8">
            <div className="text-center">
              <p className="text-red-600">Erro: Componente não encontrado para a aba: {activeTab}</p>
              <p className="text-sm text-gray-500">Tabs disponíveis: {settingsTabs.map(t => t.id).join(', ')}</p>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="flex h-full">
          {/* Sidebar de Configurações */}
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie todas as configurações do sistema
              </p>
            </div>
            
            <nav className="p-4">
              <ul className="space-y-2">
                {settingsTabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start p-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium ${
                          activeTab === tab.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {tab.name}
                        </div>
                        <div className={`text-xs mt-1 ${
                          activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              <ActiveComponent />
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Carregando configurações...</div>}>
      <SettingsContent />
    </Suspense>
  );
}