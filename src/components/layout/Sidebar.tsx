'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  PlusIcon,
  CogIcon,
  DocumentChartBarIcon,
  KeyIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tomadores', href: '/customers', icon: UsersIcon },
  { 
    name: 'NFS-e', 
    href: '/invoices', 
    icon: DocumentTextIcon,
    children: [
      { name: 'Emitir Nova', href: '/invoices/new', icon: PlusIcon },
      { name: 'Listar', href: '/invoices', icon: DocumentTextIcon },
    ]
  },
  { name: 'Relatórios', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Configurações', href: '/settings', icon: CogIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="Coruss NFS-e" 
            className="h-10 w-auto"
          />
          
        </div>
      </div>
      
      <nav className="sidebar-nav px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.children && item.children.some(child => pathname === child.href));
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={clsx(
                  'sidebar-link',
                  isActive && 'active'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
              
              {item.children && isActive && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={clsx(
                        'flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900 rounded',
                        pathname === child.href && 'text-blue-700 font-medium'
                      )}
                    >
                      <child.icon className="mr-2 h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Coruss NFS-e v1.0</p>
          <p>Ambiente: homolog</p>
        </div>
      </div>
    </div>
  );
}
