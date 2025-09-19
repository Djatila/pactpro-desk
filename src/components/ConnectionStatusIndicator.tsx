import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatusIndicator() {
  const { isOnline, isServerReachable, isFullyConnected, checkConnection, lastCheck } = useNetworkStatus();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  // Log para debug
  console.log('Status de conexão:', {
    navigatorOnline: navigator.onLine,
    isOnline,
    isServerReachable,
    isFullyConnected,
    lastCheck: new Date(lastCheck).toLocaleTimeString()
  });

  // Determinar o status e as cores
  const getConnectionStatus = () => {
    if (!isOnline || isServerReachable === false) {
      return {
        icon: WifiOff,
        text: 'Offline',
        className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
        iconClassName: 'text-red-600'
      };
    }

    if (isServerReachable === null) {
      return {
        icon: RefreshCw,
        text: 'Verificando',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
        iconClassName: 'text-yellow-600 animate-spin'
      };
    }

    if (isFullyConnected) {
      return {
        icon: Wifi,
        text: 'Online',
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
        iconClassName: 'text-green-600'
      };
    }

    return {
      icon: AlertTriangle,
      text: 'Instável',
      className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      iconClassName: 'text-orange-600'
    };
  };

  const status = getConnectionStatus();
  const IconComponent = status.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1.5 transition-all duration-300 cursor-pointer",
          status.className
        )}
        onClick={() => {
          console.log('Forçando verificação de conexão...');
          checkConnection();
        }}
        title={`Última verificação: ${new Date(lastCheck).toLocaleTimeString()}`}
      >
        <IconComponent 
          className={cn(
            "h-3 w-3 transition-colors duration-300",
            status.iconClassName
          )} 
        />
        <span className="text-xs font-medium">{status.text}</span>
      </Badge>
    </div>
  );
}