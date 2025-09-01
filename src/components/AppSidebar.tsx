import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Building2, 
  FileText, 
  BarChart3,
  CreditCard 
} from "lucide-react";
import { useData } from "@/contexts/DataContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Bancos", url: "/bancos", icon: Building2 },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const { contratos } = useData();

  // Calcular métricas do mês vigente
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  const contratosEsteMes = contratos.filter(contrato => {
    try {
      const [day, month, year] = contrato.dataEmprestimo.split('/');
      const contratoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return contratoDate.getMonth() === mesAtual && contratoDate.getFullYear() === anoAtual;
    } catch {
      return false;
    }
  });
  
  const receitaEsteMes = contratosEsteMes.reduce((acc, contrato) => {
    const receitaString = contrato.receitaAgente
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '')      // Remove pontos (separadores de milhares)
      .replace(',', '.');      // Substitui vírgula por ponto decimal
    const receita = parseFloat(receitaString);
    return acc + (isNaN(receita) ? 0 : receita);
  }, 0);

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "text-success hover:bg-accent hover:text-black transition-colors";

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-64"} border-r bg-card shadow-card transition-all`}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-button">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg text-primary-dark">MaiaCred</h2>
                <p className="text-xs text-muted-foreground">Gestão de Contratos</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-success font-medium" style={{ color: "#0D7260" }} >
            {!isCollapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClasses}
                    >
                      <item.icon className="h-5 w-5" style={{ color: "#0D7260" }} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Stats Summary - Only show when expanded */}
        {!isCollapsed && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-success font-medium">
              Resumo Rápido
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="p-3 bg-gradient-card rounded-lg mx-3 shadow-card">
                <div className="text-xs text-muted-foreground mb-1">Este mês</div>
                <div className="text-sm font-medium text-primary-dark">{contratosEsteMes.length} contratos</div>
                <div className="text-xs text-success font-medium">
                  R$ {receitaEsteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}