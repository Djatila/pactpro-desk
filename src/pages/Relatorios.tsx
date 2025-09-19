import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceitaChart } from "@/components/charts/ReceitaChart";
import { MetaAnualModal } from "@/components/modals/MetaAnualModal";
import { useData } from "@/contexts/DataContext";
import { formatContratoNumero } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Calendar,
  Download,
  FileText,
  BarChart3,
  Filter,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Printer,
  Target
} from "lucide-react";

export default function Relatorios() {
  const [filtroMes, setFiltroMes] = useState("2025-09");
  const [filtroBanco, setFiltroBanco] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const { contratos, bancos, clientes, metaAnual, updateMetaAnual } = useData();

  // Funções para as ações
  const handleGerarRelatorio = () => {
    toast.success(`Relatório de ${dadosRelatorio.periodo} gerado com sucesso!`);
  };

  const handleExportarPDF = () => {
    // Simular exportação de PDF
    toast.info('Iniciando exportação do relatório para PDF...');
    setTimeout(() => {
      toast.success('Relatório exportado com sucesso!');
    }, 2000);
  };

  const handleImprimir = () => {
    // Imprimir a página atual
    window.print();
    toast.info('Enviando para impressão...');
  };

  const handleConfigMeta = () => {
    setIsMetaModalOpen(true);
  };

  const handleSaveMeta = (novaMeta: number) => {
    updateMetaAnual(novaMeta);
  };

  // Função auxiliar para calcular receita total global
  const receitaTotalGlobal = useMemo(() => {
    return contratos.reduce((acc, c) => {
      const receitaString = c.receitaAgente
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const receita = parseFloat(receitaString);
      return acc + (isNaN(receita) ? 0 : receita);
    }, 0);
  }, [contratos]);

  const progressoMeta = metaAnual > 0 ? (receitaTotalGlobal / metaAnual) * 100 : 0;

  // Calcular dados reais com base nos contratos
  const dadosRelatorio = useMemo(() => {
    // Filtrar por período selecionado
    const [ano, mes] = filtroMes.split('-');
    const contratosDoMes = contratos.filter(contrato => {
      const [dia, mesContrato, anoContrato] = contrato.dataEmprestimo.split('/');
      return anoContrato === ano && mesContrato.padStart(2, '0') === mes;
    });

    // Filtrar por banco se selecionado
    const contratosFiltrados = filtroBanco === 'todos' 
      ? contratosDoMes 
      : contratosDoMes.filter(c => c.bancoId === filtroBanco);

    // Filtrar por cliente se especificado
    const contratosFiltradosCliente = filtroCliente 
      ? contratosFiltrados.filter(c => 
          c.clienteNome.toLowerCase().includes(filtroCliente.toLowerCase())
        )
      : contratosFiltrados;

    // Calcular totais
    const totalContratos = contratosFiltradosCliente.length;
    const volumeTotal = contratosFiltradosCliente.reduce((acc, c) => acc + c.valorTotal, 0);
    
    const receitaTotal = contratosFiltradosCliente.reduce((acc, c) => {
      const receitaString = c.receitaAgente
        .replace(/[R$\s]/g, '') // Remove R$ e espaços
        .replace(/\./g, '')      // Remove pontos (separadores de milhares)
        .replace(',', '.');      // Substitui vírgula por ponto decimal
      const receita = parseFloat(receitaString);
      return acc + (isNaN(receita) ? 0 : receita);
    }, 0);

    const ticketMedio = totalContratos > 0 ? volumeTotal / totalContratos : 0;

    // Agrupar por banco
    const bancosStats = bancos.map(banco => {
      const contratosBanco = contratosFiltradosCliente.filter(c => c.bancoId === banco.id);
      const volumeBanco = contratosBanco.reduce((acc, c) => acc + c.valorTotal, 0);
      const receitaBanco = contratosBanco.reduce((acc, c) => {
        const receitaString = c.receitaAgente
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const receita = parseFloat(receitaString);
        return acc + (isNaN(receita) ? 0 : receita);
      }, 0);
      
      return {
        nome: banco.nome,
        contratos: contratosBanco.length,
        volume: volumeBanco,
        receita: receitaBanco
      };
    }).filter(banco => banco.contratos > 0);

    // Contratos detalhados
    const contratosDetalhados = contratosFiltradosCliente.map(contrato => {
      const receitaString = contrato.receitaAgente
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const receita = parseFloat(receitaString) || 0;
      
      return {
        id: parseInt(contrato.id),
        contratoOriginal: contrato, // Adicionar contrato original para gerar nomenclatura
        cliente: contrato.clienteNome,
        banco: contrato.bancoNome,
        valor: contrato.valorTotal,
        receita: receita,
        data: contrato.dataEmprestimo
      };
    });

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const periodoNome = `${nomesMeses[parseInt(mes) - 1]} ${ano}`;

    return {
      periodo: periodoNome,
      totalContratos,
      receitaTotal,
      volumeTotal,
      ticketMedio,
      bancos: bancosStats,
      contratosDetalhados
    };
  }, [contratos, bancos, filtroMes, filtroBanco, filtroCliente]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Relatórios</h1>
          <p className="text-muted-foreground">Análise completa dos seus contratos e receitas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConfigMeta}>
            <Target className="h-4 w-4 mr-2" />
            Meta Anual
          </Button>
          <Button variant="outline" onClick={handleImprimir}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90" onClick={handleExportarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Período
              </label>
              <Input
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Banco
              </label>
              <Select value={filtroBanco} onValueChange={setFiltroBanco}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os bancos</SelectItem>
                  {bancos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id}>{banco.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Cliente
              </label>
              <Input
                placeholder="Nome do cliente..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full" onClick={handleGerarRelatorio}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detalhes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {contratos.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Nenhum contrato encontrado</h3>
                <p className="text-sm text-muted-foreground">Cadastre alguns contratos para visualizar os gráficos de receita.</p>
              </CardContent>
            </Card>
          ) : (
            <ReceitaChart />
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          {/* Indicador de Meta Anual */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary-dark">Meta Anual 2025</h3>
                </div>
                <Button variant="outline" size="sm" onClick={handleConfigMeta}>
                  <Target className="h-4 w-4 mr-2" />
                  Editar Meta
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Meta Anual</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {metaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-xl font-bold text-success">
                    R$ {receitaTotalGlobal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Progresso</p>
                  <p className={`text-xl font-bold ${
                    progressoMeta >= 100 ? 'text-success' : progressoMeta > 0 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {progressoMeta.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Barra de Progresso */}
              <div className="mt-4">
                <div className="bg-accent rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progressoMeta)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contratos</p>
                <p className="text-xl font-bold text-primary-dark">{dadosRelatorio.totalContratos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-success p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold text-success">
                  R$ {dadosRelatorio.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-info p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-xl font-bold text-info">
                  R$ {dadosRelatorio.volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold text-warning">
                  R$ {dadosRelatorio.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

          {dadosRelatorio.totalContratos === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Nenhum dado para o período selecionado</h3>
                <p className="text-sm text-muted-foreground">Selecione um período diferente ou cadastre contratos para {dadosRelatorio.periodo}.</p>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {dadosRelatorio.totalContratos === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Nenhum contrato para {dadosRelatorio.periodo}</h3>
                <p className="text-sm text-muted-foreground">Selecione um período diferente ou cadastre contratos para visualizar os detalhes.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Performance por Banco */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Performance por Banco - {dadosRelatorio.periodo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dadosRelatorio.bancos.length === 0 ? (
                      <div className="text-center py-8">
                        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum banco com contratos no período selecionado</p>
                      </div>
                    ) : (
                      dadosRelatorio.bancos.map((banco, index) => (
                        <div key={index} className="bg-accent/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-primary-dark">{banco.nome}</h4>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{banco.contratos} contratos</span>
                              <span className="font-medium text-success">
                                R$ {banco.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="text-center p-2 bg-card rounded">
                              <p className="text-xs text-muted-foreground">Contratos</p>
                              <p className="font-bold text-primary-dark">{banco.contratos}</p>
                            </div>
                            <div className="text-center p-2 bg-card rounded">
                              <p className="text-xs text-muted-foreground">Volume</p>
                              <p className="font-bold text-info">
                                R$ {banco.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-card rounded">
                              <p className="text-xs text-muted-foreground">Receita</p>
                              <p className="font-bold text-success">
                                R$ {banco.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lista Detalhada */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Contratos Detalhados - {dadosRelatorio.periodo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {dadosRelatorio.contratosDetalhados.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum contrato encontrado para este período</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ID</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Cliente</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Banco</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Data</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Valor</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Receita</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dadosRelatorio.contratosDetalhados.map((contrato) => (
                            <tr key={contrato.id} className="border-b hover:bg-accent/50">
                              <td className="p-3 text-sm font-medium">{formatContratoNumero(contratos, contrato.contratoOriginal)}</td>
                              <td className="p-3 text-sm">{contrato.cliente}</td>
                              <td className="p-3 text-sm">{contrato.banco}</td>
                              <td className="p-3 text-sm text-muted-foreground">{contrato.data}</td>
                              <td className="p-3 text-sm text-right font-medium text-info">
                                R$ {contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-sm text-right font-bold text-success">
                                R$ {contrato.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-accent/50 font-medium">
                            <td colSpan={4} className="p-3 text-sm">Total</td>
                            <td className="p-3 text-sm text-right text-info">
                              R$ {dadosRelatorio.volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-sm text-right text-success">
                              R$ {dadosRelatorio.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Configuração de Meta Anual */}
      <MetaAnualModal 
        isOpen={isMetaModalOpen}
        onClose={() => setIsMetaModalOpen(false)}
        metaAtual={metaAnual}
        onSave={handleSaveMeta}
      />
    </div>
  );
}