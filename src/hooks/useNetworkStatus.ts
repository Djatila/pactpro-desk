import { useState, useEffect, useCallback } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState(Date.now());

  const checkServerConnection = useCallback(async () => {
    try {
      // Verificação mais agressiva com múltiplas tentativas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout

      // Tentar múltiplos endpoints para garantir detecção
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1'
      ];

      let connected = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          });
          connected = true;
          break;
        } catch (error) {
          continue;
        }
      }

      clearTimeout(timeoutId);
      
      // Se nenhum endpoint funcionou, definitivamente offline
      if (!connected) {
        setIsOnline(false);
        setIsServerReachable(false);
      } else {
        setIsOnline(true);
        setIsServerReachable(true);
      }
      
      setLastCheck(Date.now());
    } catch (error) {
      setIsOnline(false);
      setIsServerReachable(false);
      setLastCheck(Date.now());
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Evento online detectado');
      setIsOnline(true);
      checkServerConnection();
    };

    const handleOffline = () => {
      console.log('Evento offline detectado');
      setIsOnline(false);
      setIsServerReachable(false);
    };

    // Adicionar listeners para eventos de conectividade
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação inicial
    checkServerConnection();

    // Verificar periodicamente a conexão (mais frequente)
    const interval = setInterval(() => {
      checkServerConnection();
    }, 5000); // A cada 5 segundos

    // Verificação adicional quando a página ganha foco
    const handleFocus = () => {
      checkServerConnection();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [checkServerConnection]);

  return {
    isOnline,
    isServerReachable,
    isFullyConnected: isOnline && isServerReachable === true,
    checkConnection: checkServerConnection,
    lastCheck
  };
}