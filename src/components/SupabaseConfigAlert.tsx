import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupabaseConfigAlertProps {
  error: string;
  onDismiss?: () => void;
}

export function SupabaseConfigAlert({ error, onDismiss }: SupabaseConfigAlertProps) {
  const isConfigError = error?.includes('CONFIGURAÇÃO NECESSÁRIA') || 
                       error?.includes('Feature is disabled') ||
                       error?.includes('desabilitada no Supabase');

  const isUserExistsError = error?.includes('já está cadastrado') ||
                           error?.includes('User already registered');
                           
  const isTimeoutError = error?.includes('Timeout') ||
                        error?.includes('conectividade');

  if (!isConfigError && !isUserExistsError && !isTimeoutError) {
    return null;
  }

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/settings/auth', '_blank');
  };

  const openUserManagement = () => {
    window.open('https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/auth/users', '_blank');
  };

  const openLogin = () => {
    window.location.href = '/login';
  };

  const openInstructions = () => {
    window.open('/FIX_SUPABASE_CONFIG.md', '_blank');
  };

  // Alerta para problemas de timeout/conectividade
  if (isTimeoutError) {
    return (
      <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-orange-800 font-semibold">
          🔄 Problemas de Conectividade
        </AlertTitle>
        <AlertDescription className="text-orange-700 mt-2">
          <p className="mb-3">
            Detectamos <strong>timeouts</strong> na conexão com o servidor.
            A aplicação continuará funcionando em modo offline.
          </p>
          
          <div className="bg-orange-100 p-3 rounded-md text-sm mb-3">
            <p className="font-medium mb-2">💡 Dicas para Melhorar:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Feche outras abas que consomem banda</li>
              <li>Verifique sua conexão Wi-Fi ou cabo</li>
              <li>Experimente recarregar a página (Ctrl+F5)</li>
              <li>PCs podem ter conectividade mais lenta que celulares</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button 
              onClick={() => window.location.reload()}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Recarregar Página
            </Button>
            
            {onDismiss && (
              <Button 
                onClick={onDismiss}
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Continuar Offline
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta para usuário já existente
  if (isUserExistsError) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-yellow-800 font-semibold">
          ⚠️ Usuário Já Existe
        </AlertTitle>
        <AlertDescription className="text-yellow-700 mt-2">
          <p className="mb-3">
            Este email já está <strong>cadastrado</strong> no sistema.
            Escolha uma das opções abaixo:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button 
              onClick={openLogin}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Fazer Login
            </Button>
            
            <Button 
              onClick={openUserManagement}
              size="sm"
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </Button>
            
            {onDismiss && (
              <Button 
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-yellow-600 hover:bg-yellow-100"
              >
                Dispensar
              </Button>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-100 rounded-md text-sm">
            <p className="font-medium mb-2">📋 Opções:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Faça login com este email</li>
              <li>Use um email diferente para registrar</li>
              <li>Delete o usuário no Supabase (link acima)</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-red-800 font-semibold">
        🔧 Configuração Necessária no Supabase
      </AlertTitle>
      <AlertDescription className="text-red-700 mt-2">
        <p className="mb-3">
          A autenticação por email está <strong>desabilitada</strong> no seu projeto Supabase.
          Os cadastros não funcionarão até que isso seja corrigido.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <Button 
            onClick={openSupabaseDashboard}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Supabase Dashboard
          </Button>
          
          <Button 
            onClick={openInstructions}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Ver Instruções Detalhadas
          </Button>
          
          {onDismiss && (
            <Button 
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-100"
            >
              Dispensar
            </Button>
          )}
        </div>

        <div className="mt-4 p-3 bg-red-100 rounded-md text-sm">
          <p className="font-medium mb-2">📋 Passos Rápidos:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Authentication → Settings</li>
            <li>✅ HABILITE "Enable email provider"</li>
            <li>❌ DESABILITE "Confirm email"</li>
            <li>💾 Salve as configurações</li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default SupabaseConfigAlert;