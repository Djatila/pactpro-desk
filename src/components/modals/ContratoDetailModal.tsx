import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTipoContratoLabel } from "@/lib/validations";
import { formatContratoNome } from "@/lib/utils";
import { 
  FileText, 
  User, 
  Building2, 
  Calendar,
  DollarSign,
  Percent,
  Hash,
  CreditCard,
  Tag,
  File,
  Download
} from "lucide-react";

// Funções auxiliares para status
const getStatusColor = (status: string) => {
  switch (status) {
    case "ativo": return "bg-success text-success-foreground";
    case "pendente": return "bg-warning text-warning-foreground";
    case "finalizado": return "bg-info text-info-foreground";
    default: return "";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "ativo": return "Ativo";
    case "pendente": return "Pendente";
    case "finalizado": return "Finalizado";
    default: return status;
  }
};

interface Contrato {
  id: string;
  clienteId: string;
  clienteNome: string;
  bancoId: string;
  bancoNome: string;
  tipoContrato: string;
  dataEmprestimo: string;
  valorTotal: number;
  parcelas: number;
  valorParcela: string;
  taxa: number;
  receitaAgente: string;
  status: 'ativo' | 'pendente' | 'finalizado';
  observacoes?: string;
  // Novos campos (tornados opcionais para compatibilidade com contratos antigos)
  primeiroVencimento?: string;
  valorOperacao?: number;
  valorSolicitado?: number;
  valorPrestacao?: number;
  // Campos para PDF (tornados opcionais)
  pdfUrl?: string;
  pdfName?: string;
}

interface ContratoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: Contrato | null;
  todosContratos: Contrato[]; // Adicionar todos os contratos para gerar nomenclatura
  tiposContrato?: { value: string; label: string }[]; // Adicionar tipos de contrato
}

export function ContratoDetailModal({ isOpen, onClose, contrato, todosContratos, tiposContrato }: ContratoDetailModalProps) {
  if (!contrato) return null;

  // Calcular data de término com base na data do empréstimo e número de parcelas
  const dataTermino = contrato.dataEmprestimo && contrato.parcelas 
    ? new Date(new Date(contrato.dataEmprestimo).setMonth(new Date(contrato.dataEmprestimo).getMonth() + contrato.parcelas - 1))
        .toLocaleDateString('pt-BR') 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes do Contrato
          </DialogTitle>
          <DialogDescription>
            Informações completas do contrato de crédito cadastrado no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho com número e status */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary-dark">
                {formatContratoNome(todosContratos, contrato)}
              </h2>
              <p className="text-sm text-muted-foreground">ID: {contrato.id}</p>
            </div>
            <Badge 
              variant="secondary"
              className={getStatusColor(contrato.status)}
            >
              {getStatusText(contrato.status)}
            </Badge>
          </div>

          <Separator />

          {/* Informações das partes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Partes Envolvidas</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{contrato.clienteNome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Banco</p>
                      <p className="font-medium">{contrato.bancoNome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Tipo de Contrato */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Tipo de Contrato</h3>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Natureza</p>
                    <p className="font-medium text-primary">{getTipoContratoLabel(contrato.tipoContrato, tiposContrato)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Informações financeiras */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Informações Financeiras</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-success">
                        R$ {contrato.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Percent className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa Aplicada</p>
                      <p className="font-medium">{contrato.taxa}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Parcelas</p>
                      <span className="font-medium">{contrato.parcelas}x {contrato.valorParcela}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sua Receita</p>
                      <p className="font-bold text-primary">{contrato.receitaAgente}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Informações do contrato */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Detalhes do Contrato</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Empréstimo</p>
                      <p className="font-medium">{contrato.dataEmprestimo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">1° Vencimento</p>
                      <p className="font-medium">{contrato.primeiroVencimento || 'Não informado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {dataTermino && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data Final</p>
                        <p className="font-medium text-success">{dataTermino}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Valores financeiros adicionais */}
            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor da Operação</p>
                      <p className="font-medium">
                        {contrato.valorOperacao !== undefined 
                          ? `R$ ${contrato.valorOperacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                      <p className="font-medium">
                        {contrato.valorSolicitado !== undefined
                          ? `R$ ${contrato.valorSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor da Prestação</p>
                      <p className="font-medium">
                        {contrato.valorPrestacao !== undefined
                          ? `R$ ${contrato.valorPrestacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {contrato.observacoes && (
              <Card>
                <CardContent className="p-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm leading-relaxed">{contrato.observacoes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Documento PDF */}
            {contrato.pdfUrl && (
              <Card className="border-success">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Documento Anexado</p>
                        <p className="font-medium text-success">{contrato.pdfName || 'Documento PDF'}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(contrato.pdfUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}