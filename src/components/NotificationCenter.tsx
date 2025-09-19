import { useState } from "react";
import { Bell, Calendar, AlertTriangle, TrendingUp, Building2, History, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { useNotificacoesFinanceiras } from "@/contexts/NotificacoesFinanceirasContext";
import { NotificacaoFinanceira } from "@/services/notificacoesFinanceiras";
import { formatContratoNome } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'warning' | 'info';
  title: string;
  message: string;
  contratoId: string;
  clienteNome: string;
  diasRestantes: number;
}

export function NotificationCenter() {
  const { contratos, clientes } = useData();
  const {
    notificacoesNaoLidas: notificacoesFinanceirasNaoLidas,
    notificacoesInstitucionais,
    notificacoesMercado,
    totalNaoLidas: totalFinanceirasNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas
  } = useNotificacoesFinanceiras();
  
  const [activeTab, setActiveTab] = useState('contratos');
  const [showHistorico, setShowHistorico] = useState(false);
  
  // Calcular notificações baseadas nos contratos próximos do vencimento
  const getNotifications = (): Notification[] => {
    const hoje = new Date();
    const notifications: Notification[] = [];
    
    contratos.forEach(contrato => {
      if (contrato.status === 'ativo') {
        try {
          // Calcular data de término do contrato
          const [day, month, year] = contrato.dataEmprestimo.split('/');
          const dataInicio = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const dataTermino = new Date(dataInicio);
          dataTermino.setMonth(dataTermino.getMonth() + contrato.parcelas);
          
          // Calcular diferença em dias
          const diffTime = dataTermino.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Gerar notificações para 3, 2 e 1 mês(es) antes do vencimento
          if (diffDays <= 90 && diffDays > 60) { // 3 meses
            notifications.push({
              id: `${contrato.id}-3m`,
              type: 'info',
              title: 'Contrato próximo do vencimento',
              message: `${formatContratoNome(contratos, contrato)} vence em ${Math.ceil(diffDays / 30)} meses`,
              contratoId: contrato.id,
              clienteNome: contrato.clienteNome,
              diasRestantes: diffDays
            });
          } else if (diffDays <= 60 && diffDays > 30) { // 2 meses
            notifications.push({
              id: `${contrato.id}-2m`,
              type: 'warning',
              title: 'Atenção: Contrato vencendo em breve',
              message: `${formatContratoNome(contratos, contrato)} vence em ${Math.ceil(diffDays / 30)} meses`,
              contratoId: contrato.id,
              clienteNome: contrato.clienteNome,
              diasRestantes: diffDays
            });
          } else if (diffDays <= 30 && diffDays > 0) { // 1 mês
            notifications.push({
              id: `${contrato.id}-1m`,
              type: 'warning',
              title: 'Urgente: Contrato vencendo em 1 mês',
              message: `${formatContratoNome(contratos, contrato)} vence em ${diffDays} dias`,
              contratoId: contrato.id,
              clienteNome: contrato.clienteNome,
              diasRestantes: diffDays
            });
          }
        } catch (error) {
          // Ignorar contratos com data inválida
        }
      }
    });
    
    return notifications.sort((a, b) => a.diasRestantes - b.diasRestantes);
  };

  const notifications = getNotifications();
  const hasContractNotifications = notifications.length > 0;
  const totalNotifications = notifications.length + totalFinanceirasNaoLidas;
  const hasNotifications = totalNotifications > 0;

  // Funções para formatar dados financeiros
  const formatarHoraFinanceira = (dataHora: string) => {
    try {
      const data = new Date(dataHora);
      const agora = new Date();
      const diffMinutos = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60));
      
      if (diffMinutos < 60) {
        return `${diffMinutos}min`;
      } else if (diffMinutos < 1440) { // menos de 24 horas
        const horas = Math.floor(diffMinutos / 60);
        return `${horas}h${String(diffMinutos % 60).padStart(2, '0')}`;
      } else {
        return data.toLocaleDateString('pt-BR');
      }
    } catch {
      return '...';
    }
  };

  const getIconeFinanceiro = (tipo: NotificacaoFinanceira['tipo']) => {
    switch (tipo) {
      case 'SELIC':
      case 'CDI':
      case 'POUPANCA':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'IPCA':
      case 'IGPM':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'CAMBIO':
        return <Building2 className="h-4 w-4 text-green-500" />;
      case 'PIB':
      case 'DESEMPREGO':
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case 'NOTICIA':
        return <Bell className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCorVariacao = (variacao?: number) => {
    if (!variacao) return 'text-gray-600';
    return variacao >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getIconeVariacao = (variacao?: number) => {
    if (!variacao) return null;
    return variacao >= 0 ? '📈' : '📉';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Calendar className="h-4 w-4 text-info" />;
    }
  };

  const formatMensagem = (notification: Notification) => {
    const meses = Math.ceil(notification.diasRestantes / 30);
    if (notification.diasRestantes <= 30) {
      return `Vence em ${notification.diasRestantes} dias`;
    } else {
      return `Vence em ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96 max-h-[32rem] overflow-y-auto" align="end" forceMount>
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Notificações</h3>
            {hasNotifications && (
              <Badge variant="outline" className="text-xs">
                {totalNotifications} {totalNotifications === 1 ? 'nova' : 'novas'}
              </Badge>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="contratos" className="text-xs px-2">
                Contratos
                {hasContractNotifications && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 text-xs p-0">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs px-2">
                Mercado
                {totalFinanceirasNaoLidas > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 text-xs p-0">
                    {totalFinanceirasNaoLidas}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs px-2">
                <History className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="contratos" className="mt-0">
              {!hasContractNotifications ? (
                <div className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma notificação de contratos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você será notificado sobre contratos próximos do vencimento
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="p-4 cursor-pointer">
                      <div className="flex items-start gap-3 w-full">
                        {getIcon(notification.type)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium leading-tight">
                              {notification.clienteNome}
                            </p>
                            <Badge 
                              variant={notification.type === 'warning' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {formatMensagem(notification)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{notification.message}</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="financeiro" className="mt-0">
              <div className="space-y-2">
                {/* Seção Institucional */}
                <div>
                  <div className="px-3 py-2 bg-blue-50 border-l-2 border-blue-400">
                    <p className="text-xs font-medium text-blue-700">Institucional</p>
                  </div>
                  {notificacoesInstitucionais.filter(n => !n.lida).slice(0, 3).map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      className="p-3 cursor-pointer" 
                      onClick={() => marcarComoLida(notif.id)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {getIconeFinanceiro(notif.tipo)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium leading-tight">
                              {notif.titulo}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatarHoraFinanceira(notif.dataHora)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notif.fonte}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                
                {/* Seção Mercado */}
                <div>
                  <div className="px-3 py-2 bg-orange-50 border-l-2 border-orange-400">
                    <p className="text-xs font-medium text-orange-700">Mercado</p>
                  </div>
                  {notificacoesMercado.filter(n => !n.lida).slice(0, 2).map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      className="p-3 cursor-pointer"
                      onClick={() => marcarComoLida(notif.id)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {getIconeFinanceiro(notif.tipo)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium leading-tight">
                              {notif.titulo}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatarHoraFinanceira(notif.dataHora)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notif.fonte}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                
                {totalFinanceirasNaoLidas === 0 && (
                  <div className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma notificação financeira
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acompanhe os indicadores econômicos em tempo real
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="historico" className="mt-0">
              <div className="p-4 text-center">
                <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Histórico de Notificações
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Visualize todas as notificações arquivadas
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    // TODO: Implementar modal de histórico completo
                    console.log('Abrir histórico completo');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {(hasContractNotifications || totalFinanceirasNaoLidas > 0) && activeTab !== 'historico' && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 flex items-center justify-between bg-accent/30">
              <p className="text-xs text-muted-foreground">
                {activeTab === 'contratos' 
                  ? '💡 Entre em contato com os clientes para renovação'
                  : '📊 Mantenha-se atualizado com o mercado financeiro'
                }
              </p>
              {activeTab === 'financeiro' && totalFinanceirasNaoLidas > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-auto p-1"
                  onClick={marcarTodasComoLidas}
                >
                  Marcar como lidas
                </Button>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}