import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function RootRedirect() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const [showLoading, setShowLoading] = useState(false);
  const [forceRedirect, setForceRedirect] = useState(false);

  useEffect(() => {
    console.log('🔄 RootRedirect - Estado:', { isAuthenticated, isLoading, error });
    
    // Mostrar loading após 500ms
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, 500);

    // Forçar redirecionamento após 10 segundos para evitar tela branca infinita
    const forceTimer = setTimeout(() => {
      console.warn('⚠️ Forçando redirecionamento após timeout');
      setForceRedirect(true);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(forceTimer);
    };
  }, [isAuthenticated, isLoading, error]);

  // Forçar redirecionamento em caso de timeout
  if (forceRedirect) {
    console.log('🔄 Redirecionamento forçado para /login');
    return <Navigate to="/login" replace />;
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-6 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Erro de Autenticação</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4"
          >
            Tentar Novamente
          </Button>
          <div className="mt-4">
            <Button 
              onClick={() => window.location.href = '/login'} 
              variant="default"
            >
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se ainda está carregando e já passou 500ms, mostrar loading
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
          <div className="text-xs text-muted-foreground/70">
            Aguarde alguns segundos
          </div>
        </div>
      </div>
    );
  }

  // Se ainda está carregando (menos de 500ms), não mostrar nada (evita flash)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Tela em branco temporária para evitar flash */}
      </div>
    );
  }

  // Redirecionar baseado no status de autenticação
  if (isAuthenticated) {
    console.log('✅ Usuário autenticado - redirecionando para /dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('❌ Usuário não autenticado - redirecionando para /login');
    return <Navigate to="/login" replace />;
  }
}