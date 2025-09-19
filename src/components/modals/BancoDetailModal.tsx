import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Phone, 
  User, 
  FileText,
  Percent,
  Hash
} from "lucide-react";

interface Banco {
  id: string;
  nome: string;
  codigo: string;
  taxaMedia: number;
  contato: string;
  telefoneContato: string;
  observacoes: string;
  contratos: number;
  volumeTotal: string;
  status: 'ativo' | 'inativo';
}

interface BancoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  banco: Banco | null;
}

export function BancoDetailModal({ isOpen, onClose, banco }: BancoDetailModalProps) {
  if (!banco) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Detalhes do Banco
          </DialogTitle>
          <DialogDescription>
            Informações completas da instituição financeira cadastrada no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho com nome e status */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary-dark">{banco.nome}</h2>
              <p className="text-sm text-muted-foreground">ID: {banco.id}</p>
            </div>
            <Badge 
              variant={banco.status === "ativo" ? "default" : "secondary"}
              className={banco.status === "ativo" ? "bg-success text-success-foreground" : ""}
            >
              {banco.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <Separator />

          {/* Informações básicas */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Informações Básicas</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Código do Banco</p>
                      <p className="font-medium">{banco.codigo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Percent className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa Média</p>
                      <p className="font-medium">{banco.taxaMedia}% a.m.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Informações de contato */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Contato</h3>
            
            <div className="grid gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pessoa de Contato</p>
                      <p className="font-medium">{banco.contato || 'Não informado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone de Contato</p>
                      <p className="font-medium">{banco.telefoneContato || 'Não informado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Estatísticas */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Estatísticas</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Contratos</p>
                      <p className="font-medium">
                        {banco.contratos} contrato{banco.contratos !== 1 ? 's' : ''} no sistema
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Volume Total</p>
                      <p className="font-medium text-success">{banco.volumeTotal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Observações */}
          {banco.observacoes && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary-dark">Observações</h3>
              
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm leading-relaxed">{banco.observacoes}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}