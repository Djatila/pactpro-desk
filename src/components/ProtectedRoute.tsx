import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/use-online';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
  const location = useLocation();
  const [showTimeout, setShowTimeout] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Se estiver carregando por mais de 10 segundos, mostrar opção de reload
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setShowTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    // Reset timeout quando parar de carregar
    if (!isLoading) {
      setShowTimeout(false);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
          
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-yellow-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm text-yellow-800">{error}</span>
              </div>
              {!isOnline && (
                <p className="text-xs text-red-700 mt-1">
                  Você está offline. Verifique sua conexão com a internet.
                </p>
              )}
            </div>
          )}
          
          {showTimeout && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Wifi className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Problemas de conectividade?</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                A verificação está demorando mais que o esperado.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Salvar a localização que o usuário tentou acessar
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}