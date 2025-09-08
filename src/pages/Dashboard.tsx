import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { ContratosChart } from "@/components/charts/ContratosChart";
import { ContratoFormModal } from "@/components/forms/ContratoFormModal";
import { ClienteFormModal } from "@/components/forms/ClienteFormModal";
import { BancoFormModal } from "@/components/forms/BancoFormModal";
import { useData } from "@/contexts/DataContext";
import { type ContratoFormData, type ClienteFormData, type BancoFormData } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Plus,
  Calendar,
  Building2,
  BarChart3,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isBancoModalOpen, setIsBancoModalOpen] = useState(false);
  const { clientes, contratos, addContrato, addCliente, addBanco } = useData();
  const navigate = useNavigate();

  // Obter clientes mais recentes (ordenados por ID que representa ordem de cadastro)
  const clientesRecentes = [...clientes]
    .sort((a, b) => parseInt(b.id) - parseInt(a.id)) // Ordem decrescente por ID
    .slice(0, 4); // Pegar apenas os 4 mais recentes

  // Calcular estatísticas reais do mês vigente
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Contratos do mês atual
  const contratosEsteMes = contratos.filter(contrato => {
    try {
      const [day, month, year] = contrato.dataEmprestimo.split('/');
      const contratoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return contratoDate.getMonth() === mesAtual && contratoDate.getFullYear() === anoAtual;
    } catch {
      return false;
    }
  });
  
  // Clientes ativos (com pelo menos um contrato ativo)
  const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
  const contratosEsteMsCount = contratosEsteMes.length;
  
  // Receita total baseada nos contratos do mês atual
  const receitaTotal = contratosEsteMes
    .filter(c => c.status === 'ativo' || c.status === 'finalizado')
    .reduce((acc, c) => {
      // Corrigir parsing de moeda brasileira
      const receitaString = c.receitaAgente
        .replace(/[R$\s]/g, '') // Remove R$ e espaços
        .replace(/\./g, '')      // Remove pontos (separadores de milhares)
        .replace(',', '.');      // Substitui vírgula por ponto decimal
      const receita = parseFloat(receitaString);
      return acc + (isNaN(receita) ? 0 : receita);
    }, 0);
    
  const ticketMedio = contratosEsteMsCount > 0 ? receitaTotal / contratosEsteMsCount : 0;

  const handleCreateContrato = async (data: ContratoFormData) => {
    try {
      addContrato(data as any);
      toast.success('Contrato criado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar contrato');
      throw error;
    }
  };

  const handleCreateCliente = async (data: ClienteFormData) => {
    try {
      addCliente(data as any);
      toast.success('Cliente cadastrado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar cliente');
      throw error;
    }
  };

  const handleCreateBanco = async (data: BancoFormData) => {
    try {
      addBanco({
        nome: data.nome,
        codigo: data.codigo,
        taxaMedia: data.taxaMedia || 0,
        contato: data.contato || '',
        telefoneContato: data.telefoneContato || '',
        observacoes: data.observacoes || ''
      });
      toast.success('Banco cadastrado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar banco');
      throw error;
    }
  };

  // Funções para ações rápidas
  const handleCadastrarCliente = () => {
    setIsClienteModalOpen(true);
  };

  const handleCadastrarBanco = () => {
    setIsBancoModalOpen(true);
  };

  const handleNovoContrato = () => {
    setIsContratoModalOpen(true);
  };

  const handleGerarRelatorio = () => {
    navigate('/relatorios');
    toast.info('Redirecionando para a página de relatórios...');
  };

  // Função para formatar data relativa
  const getDataRelativa = (id: string) => {
    const idNum = parseInt(id);
    const clientesOrdenados = [...clientes].sort((a, b) => parseInt(b.id) - parseInt(a.id));
    const posicao = clientesOrdenados.findIndex(c => c.id === id);
    
    if (posicao === 0) return 'Hoje';
    if (posicao === 1) return 'Ontem';
    if (posicao === 2) return '2 dias';
    if (posicao === 3) return '3 dias';
    return `${posicao} dias`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white shadow-card">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo ao MaiaCred!
        </h1>
        <p className="text-blue-100 mb-4">
          Acompanhe seus contratos, clientes e receitas em tempo real
        </p>
        <Button 
          variant="secondary" 
          className="bg-white text-primary hover:bg-white/90"
          onClick={() => setIsContratoModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>
       
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Clientes Ativos"
          value={clientesAtivos.toString()}
          description="Com contratos ativos"
          icon={Users}
          trend={{ value: clientes.length > 0 ? `${Math.round((clientesAtivos / clientes.length) * 100)}%` : "0%", isPositive: true }}
          gradient="primary"
        />
        
        <StatsCard
          title="Contratos Este Mês"
          value={contratosEsteMsCount.toString()}
          description="Novos contratos"
          icon={FileText}
          trend={{ value: contratosEsteMsCount > 0 ? "↑" : "0%", isPositive: contratosEsteMsCount > 0 }}
          gradient="info"
        />
        
        <StatsCard
          title="Receita Total"
          value={`R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Comissões este mês"
          icon={DollarSign}
          trend={{ value: receitaTotal > 0 ? "↑" : "0%", isPositive: receitaTotal > 0 }}
          gradient="success"
        />
        
        <StatsCard
          title="Ticket Médio"
          value={`R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Por contrato"
          icon={TrendingUp}
          trend={{ value: ticketMedio > 0 ? "→" : "0%", isPositive: false }}
          gradient="warning"
        />
      </div>

      {/* Charts and Recent Activity */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Gráficos de Contratos */}
          <ContratosChart />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Clientes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientesRecentes.length > 0 ? (
                clientesRecentes.map((cliente) => (
                  <div key={cliente.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{cliente.nome}</p>
                      <p className="text-xs text-muted-foreground">{cliente.cpf}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-primary">{cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}</p>
                      <p className="text-xs text-muted-foreground">{getDataRelativa(cliente.id)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda</p>
                  <p className="text-xs text-muted-foreground">Cadastre seu primeiro cliente para vê-lo aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button 
                className="w-full justify-start bg-gradient-primary hover:opacity-90" 
                size="lg"
                onClick={handleCadastrarCliente}
              >
                <Users className="h-4 w-4 mr-3" />
                Cadastrar Cliente
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={handleCadastrarBanco}
              >
                <Building2 className="h-4 w-4 mr-3" />
                Cadastrar Banco
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={handleNovoContrato}
              >
                <FileText className="h-4 w-4 mr-3" />
                Novo Contrato
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={handleGerarRelatorio}
              >
                <Calendar className="h-4 w-4 mr-3" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>

      {/* Monthly Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Visão Geral do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <div className="text-2xl font-bold text-primary-dark">{contratosEsteMsCount}</div>
              <div className="text-sm text-muted-foreground">Contratos Fechados</div>
            </div>
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <div className="text-2xl font-bold text-success">
                R$ {contratosEsteMes.reduce((acc, c) => acc + c.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Volume Total</div>
            </div>
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <div className="text-2xl font-bold text-info">
                {ticketMedio > 0 ? `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
              </div>
              <div className="text-sm text-muted-foreground">Ticket Médio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Contrato */}
      <ContratoFormModal
        isOpen={isContratoModalOpen}
        onClose={() => setIsContratoModalOpen(false)}
        onSubmit={handleCreateContrato}
        mode="create"
      />

      {/* Modal de Cliente */}
      <ClienteFormModal
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
        onSubmit={handleCreateCliente}
        mode="create"
      />

      {/* Modal de Banco */}
      <BancoFormModal
        isOpen={isBancoModalOpen}
        onClose={() => setIsBancoModalOpen(false)}
        onSubmit={handleCreateBanco}
        mode="create"
      />
    </div>
  );
}