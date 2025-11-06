import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { NotificacoesFinanceirasService, NotificacaoFinanceira } from '@/services/notificacoesFinanceiras';
import { supabase } from '@/lib/supabase';

interface NotificacoesFinanceirasContextType {
  notificacoes: NotificacaoFinanceira[];
  notificacoesNaoLidas: NotificacaoFinanceira[];
  totalNaoLidas: number;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  atualizarNotificacoes: () => void;
}

const NotificacoesFinanceirasContext = createContext<NotificacoesFinanceirasContextType | undefined>(undefined);

export function useNotificacoesFinanceiras() {
  const context = useContext(NotificacoesFinanceirasContext);
  if (context === undefined) {
    throw new Error('useNotificacoesFinanceiras deve ser usado dentro de um NotificacoesFinanceirasProvider');
  }
  return context;
}

interface NotificacoesFinanceirasProviderProps {
  children: React.ReactNode;
}

export function NotificacoesFinanceirasProvider({ children }: NotificacoesFinanceirasProviderProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoFinanceira[]>([]);
  const service = useMemo(
    () => NotificacoesFinanceirasService.getInstance(supabase),
    [supabase]
  );

  // Atualizar estado com notificações do service
  const atualizarNotificacoes = () => {
    const novasNotificacoes = service.getNotificacoes();
    setNotificacoes(novasNotificacoes);
  };

  // Efeito para atualizar notificações periodicamente
  useEffect(() => {
    // Carregar notificações iniciais
    atualizarNotificacoes();

    // Configurar atualização a cada 2 horas para sincronizar com o service
    const interval = setInterval(() => {
      atualizarNotificacoes();
    }, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Filtrar notificações não lidas
  const notificacoesNaoLidas = useMemo(() => 
    notificacoes.filter(n => !n.lida),
    [notificacoes]
  );
  
  const totalNaoLidas = notificacoesNaoLidas.length;

  // Marcar notificação como lida
  const marcarComoLida = (id: string) => {
    service.marcarComoLida(id);
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
  };

  // Marcar todas as notificações como lidas
  const marcarTodasComoLidas = () => {
    service.marcarTodasComoLidas();
    setNotificacoes(prev => 
      prev.map(n => ({ ...n, lida: true }))
    );
  };

  const value: NotificacoesFinanceirasContextType = {
    notificacoes,
    notificacoesNaoLidas,
    totalNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    atualizarNotificacoes
  };
  return (
    <NotificacoesFinanceirasContext.Provider value={value}>
      {children}
    </NotificacoesFinanceirasContext.Provider>
  );
}