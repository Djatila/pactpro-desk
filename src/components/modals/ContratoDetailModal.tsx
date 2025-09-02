import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  Tag
} from "lucide-react";

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
}

interface ContratoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: Contrato | null;
  todosContratos: Contrato[]; // Adicionar todos os contratos para gerar nomenclatura
}

export function ContratoDetailModal({ isOpen, onClose, contrato, todosContratos }: ContratoDetailModalProps) {
  if (!contrato) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                    <p className="font-medium text-primary">{getTipoContratoLabel(contrato.tipoContrato)}</p>
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
                      <p className="font-medium">{contrato.parcelas}x de {contrato.valorParcela}</p>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}