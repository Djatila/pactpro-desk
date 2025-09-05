import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Verificar status da conexão inicial
    checkConnectionStatus();
    
    // Verificar periodicamente a conexão
    const interval = setInterval(checkConnectionStatus, 30000); // A cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    setIsChecking(true);
    
    try {
      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.auth?.getSession !== 'function') {
        setIsOnline(false);
        return;
      }
      
      // Tentar obter a sessão como teste de conectividade
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar conexão:', error);
        setIsOnline(false);
      } else {
        setIsOnline(true);
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isChecking ? (
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verificando
        </Badge>
      ) : isOnline ? (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <Wifi className="h-3 w-3" />
          Online
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
    </div>
  );
}