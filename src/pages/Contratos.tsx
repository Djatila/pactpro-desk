import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContratoFormModal } from "@/components/forms/ContratoFormModal";
import { ContratoDetailModal } from "@/components/modals/ContratoDetailModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { TipoContratoManagerModal } from "@/components/modals/TipoContratoManagerModal";
import { useData } from "@/contexts/DataContext";
import { type ContratoFormData, getTipoContratoLabel } from "@/lib/validations";
import { formatContratoNome } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  DollarSign,
  Building2,
  User,
  Edit,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  Settings,
  File
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Importar cn para classes condicionais

export default function Contratos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<any>(null);
  const [viewingContrato, setViewingContrato] = useState<any>(null);
  const [deletingContrato, setDeletingContrato] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTipoManagerModalOpen, setIsTipoManagerModal] = useState(false);
  const [searchParams] = useSearchParams();
  const { contratos, bancos, addContrato, updateContrato, deleteContrato, downloadContratoPdf, loadTiposContrato } = useData();
  // Estado para os tipos de contrato
  const [tiposContrato, setTiposContrato] = useState<{value: string, label: string}[]>([]);

  // Carregar tipos de contrato quando o componente montar
  useEffect(() => {
    const loadTipos = async () => {
      try {
        // Passar os contratos atuais para garantir que tipos personalizados sejam incluídos
        const tipos = await loadTiposContrato(contratos);
        setTiposContrato(tipos);
      } catch (error) {
        console.error('Erro ao carregar tipos de contrato na página:', error);
      }
    };
    
    loadTipos();
  }, [loadTiposContrato, contratos]);

  // Filtro por banco via URL
  const bancoFilter = searchParams.get('banco');
  const bancoFiltrado = bancoFilter ? bancos.find(b => b.id === bancoFilter) : null;

  useEffect(() => {
    if (bancoFiltrado) {
      toast.info(`Mostrando contratos do ${bancoFiltrado.nome}`);
    }
  }, [bancoFiltrado]);

  const handleCreateContrato = async (data: ContratoFormData) => {
    try {
      // Remover campos de PDF dos dados antes de enviar
      const { pdfUrl, pdfName, ...formDataWithoutPdf } = data as any;
      const result = await addContrato(formDataWithoutPdf as any);
      if (result) {
        // Não fechamos o modal automaticamente para permitir upload de PDF
        // O fechamento será feito pelo usuário quando clicar no botão "Concluir"
        toast.success('Contrato cadastrado com sucesso!');
      } else {
        toast.error('Erro ao cadastrar contrato');
      }
    } catch (error) {
      console.error('Erro ao cadastrar contrato:', error);
      toast.error('Erro ao cadastrar contrato');
      throw error;
    }
  };

  const handleEditContrato = async (data: ContratoFormData) => {
    try {
      if (editingContrato) {
        // Remover campos de PDF dos dados antes de enviar
        const { pdfUrl, pdfName, ...formDataWithoutPdf } = data as any;
        const result = await updateContrato(editingContrato.id, formDataWithoutPdf as any);
        if (result) {
          // Não fechamos o modal automaticamente para permitir upload de PDF
          // O fechamento será feito pelo usuário quando clicar no botão "Concluir"
          toast.success('Contrato atualizado com sucesso!');
          
          // Atualizar os dados do contrato em edição para refletir as mudanças
          setEditingContrato(prev => ({
            ...prev,
            ...data
          }));
        } else {
          toast.error('Erro ao atualizar contrato');
        }
      }
    } catch (error) {
      toast.error('Erro ao atualizar contrato');
      throw error;
    }
  };

  const openEditModal = (contrato: any) => {
    console.log('Abrindo modal de edição com contrato:', contrato);
    // Garantir que todos os campos necessários estejam presentes
    const contratoParaEdicao = {
      id: contrato.id,
      clienteId: contrato.clienteId || '',
      bancoId: contrato.bancoId || '',
      tipoContrato: contrato.tipoContrato || '',
      valorTotal: contrato.valorTotal !== undefined ? contrato.valorTotal : 0,
      dataEmprestimo: contrato.dataEmprestimo || '',
      parcelas: contrato.parcelas !== undefined ? contrato.parcelas : 0,
      taxa: contrato.taxa !== undefined ? contrato.taxa : 0,
      observacoes: contrato.observacoes || '',
      // Novos campos
      primeiroVencimento: contrato.primeiroVencimento || '',
      valorOperacao: contrato.valorOperacao !== undefined ? contrato.valorOperacao : 0,
      valorSolicitado: contrato.valorSolicitado !== undefined ? contrato.valorSolicitado : 0,
      valorPrestacao: contrato.valorPrestacao !== undefined ? contrato.valorPrestacao : 0,
      // Campos para PDF
      pdfUrl: contrato.pdfUrl || '',
      pdfName: contrato.pdfName || ''
    };
    
    console.log('Contrato para edição:', contratoParaEdicao);
    setEditingContrato(contratoParaEdicao);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContrato(null);
  };

  // Nova função para fechar o modal explicitamente
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingContrato(null);
  };

  const handleViewContrato = (contrato: any) => {
    setViewingContrato(contrato);
    setIsDetailModalOpen(true);
  };

  const handleDeleteContrato = (contrato: any) => {
    setDeletingContrato(contrato);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteContrato = async () => {
    try {
      if (deletingContrato) {
        deleteContrato(deletingContrato.id);
        toast.success('Contrato excluído com sucesso!');
        setIsDeleteModalOpen(false);
        setDeletingContrato(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir contrato');
    }
  };

  const handleDownloadContrato = (contrato: any) => {
    if (contrato.pdfUrl) {
      // Se tiver PDF anexado, fazer download diretamente
      window.open(contrato.pdfUrl, '_blank');
    } else {
      // Se não tiver PDF, mostrar mensagem
      toast.info('Este contrato não possui documento PDF anexado.');
    }
  };

  const handleTiposChange = async () => {
    // Atualizar os tipos de contrato quando houver mudanças
    const novosTipos = await loadTiposContrato();
    setTiposContrato(novosTipos);
  };

  const filteredContratos = contratos
    .filter(contrato => {
      const matchesSearch = contrato.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.bancoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.valorTotal.toString().includes(searchTerm.replace(/[R$.,\s]/g, ""));
      
      const matchesBanco = bancoFilter ? contrato.bancoId === bancoFilter : true;
      
      return matchesSearch && matchesBanco;
    })
    .sort((a, b) => {
      // Ordenação prioritária por meses restantes (menor para maior)
      // Contratos com 1 mês para vencer primeiro, depois 2, etc.
      const mesesA = a.mesesRestantes;
      const mesesB = b.mesesRestantes;

      // Priorizar contratos com 1 a 6 meses restantes
      const isAEndingSoon = mesesA >= 1 && mesesA <= 6;
      const isBEndingSoon = mesesB >= 1 && mesesB <= 6;

      if (isAEndingSoon && !isBEndingSoon) return -1; // A vem antes de B
      if (!isAEndingSoon && isBEndingSoon) return 1;  // B vem antes de A

      // Se ambos estão no período de 1-6 meses ou ambos fora, ordenar por meses restantes
      if (mesesA !== mesesB) {
        return mesesA - mesesB;
      }
      
      // Se meses restantes forem iguais, ordenar por ID para estabilidade
      return a.id.localeCompare(b.id);
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-success text-success-foreground";
      case "pendente": return "bg-warning text-warning-foreground";
      case "finalizado": return "bg-info text-info-foreground";
      default: return "";
    }
  };

  // Função para determinar a classe de sombreamento do card
  const getCardShadingClass = (mesesRestantes: number) => {
    if (mesesRestantes <= 1 && mesesRestantes > 0) {
      return "bg-destructive/10 border-destructive/20"; // Levemente vermelho
    }
    if (mesesRestantes >= 3 && mesesRestantes <= 6) {
      return "bg-warning/10 border-warning/20"; // Levemente amarelo
    }
    return ""; // Sem sombreamento especial
  };

  // Função para obter a classe do indicador de piscar
  const getBlinkIndicatorClass = (mesesRestantes: number) => {
    if (mesesRestantes <= 0 || mesesRestantes > 6) return null; // Não exibir se já venceu ou muito longe

    let animationClass = '';

    if (mesesRestantes === 1) {
      animationClass = 'animate-blink-fast';
    } else if (mesesRestantes === 2) {
      animationClass = 'animate-blink-medium';
    } else if (mesesRestantes >= 3 && mesesRestantes <= 6) {
      animationClass = 'animate-blink-slow';
    }

    return {
      className: `w-2.5 h-2.5 rounded-full bg-green-500 border border-green-700 ${animationClass}`, // Sempre verde, com borda
      style: {} // Não precisamos mais do inline style para animationDuration
    };
  };

  const totalReceita = contratos
    .filter(c => c.status === "ativo" || c.status === "finalizado")
    .reduce((acc, c) => {
      // Corrigir parsing de moeda brasileira
      const receitaString = c.receitaAgente
        .replace(/[R$\s]/g, '') // Remove R$ e espaços
        .replace(/\./g, '')      // Remove pontos (separadores de milhares)
        .replace(',', '.');      // Substitui vírgula por ponto decimal
      const receita = parseFloat(receitaString);
      return acc + (isNaN(receita) ? 0 : receita);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Contratos</h1>
          <p className="text-muted-foreground">Gerencie todos os contratos de crédito</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsTipoManagerModal(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Tipos de Contrato
          </Button>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contratos</p>
                <p className="text-xl font-bold text-primary-dark">{contratos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-success p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                <p className="text-xl font-bold text-success">
                  {contratos.filter(c => c.status === "ativo").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-warning">
                  {contratos.filter(c => c.status === "pendente").length}
                </p>
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
                  R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro Ativo */}
      {bancoFiltrado && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-primary-dark">
                    Filtro ativo: {bancoFiltrado.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mostrando apenas contratos deste banco
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.history.replaceState({}, '', '/contratos')}
              >
                Remover Filtro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, banco ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                Filtros Avançados
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <div className="grid gap-4">
        {filteredContratos.map((contrato) => {
          const blinkIndicator = getBlinkIndicatorClass(contrato.mesesRestantes);
          return (
            <Card 
              key={contrato.id} 
              className={cn(
                "shadow-card hover:shadow-card-hover transition-all",
                getCardShadingClass(contrato.mesesRestantes)
              )}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-primary-dark">
                          {formatContratoNome(contratos, contrato)}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {contrato.clienteNome}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {contrato.bancoNome}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            {getTipoContratoLabel(contrato.tipoContrato, tiposContrato)}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={getStatusColor(contrato.status)}
                      >
                        {contrato.status === "ativo" ? "Ativo" : 
                         contrato.status === "pendente" ? "Pendente" : "Finalizado"}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-accent/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Data do Empréstimo</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">{contrato.dataEmprestimo}</span>
                        </div>
                      </div>

                      <div className="bg-accent/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="font-bold text-success">
                            R$ {contrato.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="bg-accent/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          Parcelas
                          {blinkIndicator && (
                            <span 
                              className={blinkIndicator.className} 
                              style={blinkIndicator.style}
                              title={`Faltam ${contrato.mesesRestantes} meses para o contrato terminar`}
                            />
                          )}
                        </p>
                        <span className="font-medium">
                          {contrato.parcelasPagas} pagas de {contrato.parcelas} ({contrato.parcelasRestantes} restantes)
                        </span>
                      </div>

                      <div className="bg-accent/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Sua Receita</p>
                        <span className="font-bold text-primary">{contrato.receitaAgente}</span>
                      </div>
                    </div>

                    {contrato.observacoes && (
                      <div className="bg-accent/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                        <p className="text-sm">{contrato.observacoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewContrato(contrato)}
                        title="Visualizar detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openEditModal(contrato)}
                        title="Editar contrato"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteContrato(contrato)}
                        title="Excluir contrato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadContrato(contrato)}
                      disabled={!contrato.pdfUrl}
                      className={contrato.pdfUrl ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                
                  {/* PDF Status Indicator */}
                  {contrato.pdfUrl && (
                    <div className="flex items-center gap-2 text-sm text-success mt-2">
                      <File className="h-4 w-4" />
                      <span>PDF anexado</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContratos.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros de busca ou cadastre um novo contrato.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal para criar/editar contratos */}
      <ContratoFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={editingContrato ? handleEditContrato : handleCreateContrato}
        initialData={editingContrato}
        mode={editingContrato ? 'edit' : 'create'}
      />

      {/* Modal de Detalhes */}
      <ContratoDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingContrato(null);
        }}
        contrato={viewingContrato}
        todosContratos={contratos}
        tiposContrato={tiposContrato}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingContrato(null);
        }}
        onConfirm={confirmDeleteContrato}
        title={deletingContrato?.status === 'ativo' 
          ? "Excluir Contrato Ativo" 
          : "Excluir Contrato"
        }
        description={
          deletingContrato?.status === 'ativo'
            ? "ATENÇÃO: Este contrato ainda está ATIVO! Excluir um contrato ativo pode afetar os cálculos de receita e métricas do sistema. Tem certeza que deseja continuar?"
            : "Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
        }
        itemName={deletingContrato ? `${formatContratoNome(contratos, deletingContrato)} - ${deletingContrato.clienteNome}` : undefined}
      />

      {/* Modal do Gerenciador de Tipos de Contrato */}
      <TipoContratoManagerModal
        isOpen={isTipoManagerModalOpen}
        onClose={() => {
          setIsTipoManagerModal(false);
        }}
        onTiposChange={handleTiposChange}
      />
    </div>
  );
}