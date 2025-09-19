import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificacoesFinanceirasService, NotificacaoFinanceira } from '@/services/notificacoesFinanceiras';

interface NotificacoesFinanceirasContextType {
  notificacoes: NotificacaoFinanceira[];
  notificacoesNaoLidas: NotificacaoFinanceira[];
  notificacoesInstitucionais: NotificacaoFinanceira[];
  notificacoesMercado: NotificacaoFinanceira[];
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
  const service = NotificacoesFinanceirasService.getInstance();

  // Atualizar estado com notificações do service
  const atualizarNotificacoes = () => {
    const novasNotificacoes = service.getNotificacoes();
    setNotificacoes(novasNotificacoes);
  };

  // Efeito para atualizar notificações periodicamente
  useEffect(() => {
    // Carregar notificações iniciais
    atualizarNotificacoes();

    // Configurar atualização a cada 30 segundos para sincronizar com o service
    const interval = setInterval(() => {
      atualizarNotificacoes();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Calcular notificações derivadas
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);
  const notificacoesInstitucionais = notificacoes.filter(n => n.categoria === 'institucional');
  const notificacoesMercado = notificacoes.filter(n => n.categoria === 'mercado');
  const totalNaoLidas = notificacoesNaoLidas.length;

  const marcarComoLida = (id: string) => {
    service.marcarComoLida(id);
    atualizarNotificacoes();
  };

  const marcarTodasComoLidas = () => {
    service.marcarTodasComoLidas();
    atualizarNotificacoes();
  };

  const value: NotificacoesFinanceirasContextType = {
    notificacoes,
    notificacoesNaoLidas,
    notificacoesInstitucionais,
    notificacoesMercado,
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