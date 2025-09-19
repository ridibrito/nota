import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações para produção
  output: 'standalone',
  
  // Runtime para suporte a certificados
  serverExternalPackages: ['node-forge', 'xml-crypto'],
  
  // Ignorar warnings de ESLint durante build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignorar warnings de TypeScript durante build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
