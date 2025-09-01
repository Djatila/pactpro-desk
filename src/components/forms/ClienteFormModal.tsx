import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema, type ClienteFormData, formatCPF, formatPhone, formatDate } from '@/lib/validations';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData) => Promise<void>;
  initialData?: Partial<ClienteFormData>;
  mode?: 'create' | 'edit';
}

export function ClienteFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  mode = 'create' 
}: ClienteFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData
  });

  // Reset form quando initialData mudar (para carregar dados de edição)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        dataNascimento: '',
        endereco: '',
        observacoes: ''
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(mode === 'create' ? 'Cliente cadastrado com sucesso!' : 'Cliente atualizado com sucesso!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar cliente. Tente novamente.');
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Formatação automática dos campos
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue('cpf', formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('telefone', formatted);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setValue('dataNascimento', formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Cadastrar Novo Cliente' : 'Editar Cliente'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados do cliente para cadastrá-lo no sistema.'
              : 'Atualize os dados do cliente conforme necessário.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              placeholder="Digite o nome completo"
              {...register('nome')}
              disabled={isSubmitting}
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              {...register('cpf')}
              onChange={handleCPFChange}
              maxLength={14}
              disabled={isSubmitting}
            />
            {errors.cpf && (
              <p className="text-sm text-destructive">{errors.cpf.message}</p>
            )}
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                {...register('telefone')}
                onChange={handlePhoneChange}
                maxLength={15}
                disabled={isSubmitting}
              />
              {errors.telefone && (
                <p className="text-sm text-destructive">{errors.telefone.message}</p>
              )}
            </div>
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
            <Input
              id="dataNascimento"
              placeholder="DD/MM/AAAA"
              {...register('dataNascimento')}
              onChange={handleDateChange}
              maxLength={10}
              disabled={isSubmitting}
            />
            {errors.dataNascimento && (
              <p className="text-sm text-destructive">{errors.dataNascimento.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <Input
              id="endereco"
              placeholder="Rua, número, bairro, cidade - UF"
              {...register('endereco')}
              disabled={isSubmitting}
            />
            {errors.endereco && (
              <p className="text-sm text-destructive">{errors.endereco.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais sobre o cliente (opcional)"
              rows={3}
              {...register('observacoes')}
              disabled={isSubmitting}
            />
            {errors.observacoes && (
              <p className="text-sm text-destructive">{errors.observacoes.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                mode === 'create' ? 'Cadastrar Cliente' : 'Atualizar Cliente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}