import { useState } from "react";
import { Bell, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuHeader, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";

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
              message: `Contrato vence em ${Math.ceil(diffDays / 30)} meses`,
              contratoId: contrato.id,
              clienteNome: contrato.clienteNome,
              diasRestantes: diffDays
            });
          } else if (diffDays <= 60 && diffDays > 30) { // 2 meses
            notifications.push({
              id: `${contrato.id}-2m`,
              type: 'warning',
              title: 'Atenção: Contrato vencendo em breve',
              message: `Contrato vence em ${Math.ceil(diffDays / 30)} meses`,
              contratoId: contrato.id,
              clienteNome: contrato.clienteNome,
              diasRestantes: diffDays
            });
          } else if (diffDays <= 30 && diffDays > 0) { // 1 mês
            notifications.push({
              id: `${contrato.id}-1m`,
              type: 'warning',
              title: 'Urgente: Contrato vencendo em 1 mês',
              message: `Contrato vence em ${diffDays} dias`,
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
  const hasNotifications = notifications.length > 0;

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
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end" forceMount>
        <div className="px-4 py-2 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          <p className="text-xs text-muted-foreground">
            Contratos próximos do vencimento
          </p>
        </div>
        
        {!hasNotifications ? (
          <div className="p-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação no momento
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
                      <span>Contrato ID: {notification.contratoId}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {hasNotifications && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <p className="text-xs text-center text-muted-foreground">
                💡 Entre em contato com os clientes para renovação
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}