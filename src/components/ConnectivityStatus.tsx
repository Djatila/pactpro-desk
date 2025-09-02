import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface ConnectivityStatusProps {
  onRetry?: () => void;
}

export function ConnectivityStatus({ onRetry }: ConnectivityStatusProps) {
  const [showOfflineStatus, setShowOfflineStatus] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Detectar se há timeouts frequentes no console
    const checkConsoleErrors = () => {
      const hasTimeoutErrors = performance.getEntriesByType('navigation')
        .some((entry: any) => entry.loadEventEnd - entry.loadEventStart > 8000);
      
      if (hasTimeoutErrors) {
        setShowOfflineStatus(true);
      }
    };

    // Monitorar conectividade
    const handleOnline = () => setShowOfflineStatus(false);
    const handleOffline = () => setShowOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    if (!navigator.onLine) {
      setShowOfflineStatus(true);
    }

    // Verificar se há problemas de timeout
    setTimeout(checkConsoleErrors, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    if (onRetry) {
      await onRetry();
    } else {
      // Recarregar a página como fallback
      window.location.reload();
    }
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  if (!showOfflineStatus && navigator.onLine) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-800 mb-4">
      {navigator.onLine ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <AlertTitle className="text-blue-800 font-semibold flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Status de Conectividade
      </AlertTitle>
      <AlertDescription className="text-blue-700 mt-2">
        {!navigator.onLine ? (
          <div>
            <p className="mb-3">
              <strong>Sem conexão com a internet</strong> detectada.
            </p>
            <div className="bg-blue-100 p-3 rounded-md text-sm mb-3">
              <p className="font-medium mb-2">💡 Modo Offline:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>A aplicação continuará funcionando com dados locais</li>
                <li>Alterações serão sincronizadas quando a conexão retornar</li>
                <li>Verifique sua conexão Wi-Fi ou dados móveis</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-3">
              Conexão com internet <strong>detectada</strong>, mas há problemas de conectividade com o servidor.
            </p>
            <div className="bg-blue-100 p-3 rounded-md text-sm mb-3">
              <p className="font-medium mb-2">🖥️ PC vs 📱 Celular:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>PCs podem ter conectividade mais lenta que celulares</li>
                <li>Verifique se outras abas estão consumindo banda</li>
                <li>Experimente usar Wi-Fi ao invés de cabo ou vice-versa</li>
                <li>Antivírus ou firewall podem estar bloqueando conexões</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <Button 
            onClick={handleRetry}
            size="sm"
            disabled={isRetrying}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Tentando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => setShowOfflineStatus(false)}
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Continuar Offline
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default ConnectivityStatus;