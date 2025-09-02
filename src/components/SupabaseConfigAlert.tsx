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

  if (!isConfigError) {
    return null;
  }

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/settings/auth', '_blank');
  };

  const openInstructions = () => {
    window.open('/FIX_SUPABASE_CONFIG.md', '_blank');
  };

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