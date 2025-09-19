import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Briefcase, 
  Calendar,
  Shield,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { toast } from 'sonner';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) return null;

  // Verificar se é uma conta personalizada
  const adminCredentials = localStorage.getItem('maiacred_admin_credentials');
  const isCustomAccount = !!adminCredentials;
  let accountInfo = null;

  if (isCustomAccount) {
    try {
      accountInfo = JSON.parse(adminCredentials);
    } catch (error) {
      console.error('Erro ao carregar informações da conta:', error);
    }
  }

  const handleDeleteAccount = () => {
    try {
      // Remover credenciais do localStorage
      localStorage.removeItem('maiacred_admin_credentials');
      localStorage.removeItem('maiacred_user');
      
      // Remover também dados do sistema se desejar reset completo
      // localStorage.removeItem('maiacred_clientes');
      // localStorage.removeItem('maiacred_bancos');
      // localStorage.removeItem('maiacred_contratos');
      
      toast.success('Conta excluída com sucesso!');
      logout();
      onClose();
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Configurações da Conta
            </DialogTitle>
            <DialogDescription>
              Informações e configurações da sua conta de administrador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações da Conta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-dark">Informações da Conta</h3>
                <Badge 
                  variant={isCustomAccount ? "default" : "secondary"}
                  className={isCustomAccount ? "bg-success text-success-foreground" : ""}
                >
                  {isCustomAccount ? "Conta Personalizada" : "Conta Demo"}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{user.nome}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cargo</p>
                        <p className="font-medium">{user.cargo}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {accountInfo && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Conta criada em</p>
                          <p className="font-medium">
                            {new Date(accountInfo.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Separator />

            {/* Configurações de Segurança */}
            {isCustomAccount && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary-dark flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações de Segurança
                </h3>
                
                <Card className="border-destructive/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-destructive">Zona de Perigo</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Excluir sua conta removerá permanentemente todas as suas credenciais de acesso. 
                          Os dados do sistema (clientes, contratos, etc.) serão mantidos.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-3"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Minha Conta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!isCustomAccount && (
              <div className="space-y-4">
                <Card className="bg-info/10 border-info/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-info mt-0.5" />
                      <div>
                        <h4 className="font-medium text-info">Conta de Demonstração</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Você está usando uma conta de demonstração. Para ter controle total do sistema,
                          recomendamos criar sua própria conta de administrador.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir Conta de Administrador"
        description="Tem certeza que deseja excluir sua conta? Esta ação removerá suas credenciais permanentemente e você precisará criar uma nova conta para acessar o sistema."
        itemName={user.nome}
      />
    </>
  );
}