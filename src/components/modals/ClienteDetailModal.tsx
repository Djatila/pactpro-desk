import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  CreditCard
} from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  dataNascimento: string;
  observacoes?: string;
  contratos: number;
  status: 'ativo' | 'inativo';
}

interface ClienteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

export function ClienteDetailModal({ isOpen, onClose, cliente }: ClienteDetailModalProps) {
  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Informações completas do cliente cadastrado no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho com nome e status */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary-dark">{cliente.nome}</h2>
              <p className="text-sm text-muted-foreground">ID: {cliente.id}</p>
            </div>
            <Badge 
              variant={cliente.status === "ativo" ? "default" : "secondary"}
              className={cliente.status === "ativo" ? "bg-success text-success-foreground" : ""}
            >
              {cliente.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <Separator />

          {/* Informações pessoais */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Informações Pessoais</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{cliente.cpf}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{cliente.dataNascimento}</p>
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
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{cliente.telefone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="font-medium">{cliente.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{cliente.endereco}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Informações do sistema */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary-dark">Informações do Sistema</h3>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contratos</p>
                    <p className="font-medium">
                      {cliente.contratos} contrato{cliente.contratos !== 1 ? 's' : ''} no sistema
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {cliente.observacoes && (
              <Card>
                <CardContent className="p-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm leading-relaxed">{cliente.observacoes}</p>
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