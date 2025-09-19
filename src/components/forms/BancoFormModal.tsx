import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bancoSchema, type BancoFormData, formatPhone } from '@/lib/validations';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface BancoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BancoFormData) => Promise<void>;
  initialData?: Partial<BancoFormData>;
  mode?: 'create' | 'edit';
}

const bancosList = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '356', nome: 'Banco Real' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '748', nome: 'Banco Cooperativo Sicredi' },
  { codigo: '756', nome: 'Banco Cooperativo do Brasil' }
];

export function BancoFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  mode = 'create' 
}: BancoFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [availableBancos, setAvailableBancos] = useState(bancosList);

  // Carregar bancos personalizados do localStorage
  const loadCustomBancos = () => {
    const savedBancos = localStorage.getItem('bancosPersonalizados');
    if (savedBancos) {
      try {
        const customBancos = JSON.parse(savedBancos);
        return [...bancosList, ...customBancos];
      } catch {
        return bancosList;
      }
    }
    return bancosList;
  };

  // Salvar banco personalizado
  const saveCustomBanco = (banco: { codigo: string; nome: string }) => {
    const savedBancos = localStorage.getItem('bancosPersonalizados');
    let customBancos = [];
    
    if (savedBancos) {
      try {
        customBancos = JSON.parse(savedBancos);
      } catch {
        customBancos = [];
      }
    }
    
    // Verificar se já existe
    const exists = customBancos.some((b: any) => b.codigo === banco.codigo);
    if (!exists) {
      customBancos.push(banco);
      localStorage.setItem('bancosPersonalizados', JSON.stringify(customBancos));
      setAvailableBancos(loadCustomBancos());
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control
  } = useForm<BancoFormData>({
    resolver: zodResolver(bancoSchema),
    defaultValues: initialData
  });

  // Reset form quando initialData mudar (para carregar dados de edição)
  useEffect(() => {
    // Carregar lista atualizada de bancos
    setAvailableBancos(loadCustomBancos());
    
    if (initialData) {
      reset(initialData);
      // Se tem dados iniciais (modo edição), verificar se é um banco padrão
      const isStandardBank = bancosList.some(banco => banco.codigo === initialData.codigo);
      setIsManualEntry(!isStandardBank);
    } else {
      reset({
        nome: '',
        codigo: '',
        taxaMedia: 0,
        contato: '',
        telefoneContato: '',
        observacoes: ''
      });
      setIsManualEntry(false);
    }
  }, [initialData, reset, isOpen]);

  const selectedCodigo = watch('codigo');

  const handleFormSubmit = async (data: BancoFormData) => {
    setIsSubmitting(true);
    try {
      // Se for entrada manual e modo criar, salvar como banco personalizado
      if (isManualEntry && mode === 'create') {
        saveCustomBanco({ codigo: data.codigo, nome: data.nome });
      }
      
      await onSubmit(data);
      toast.success(mode === 'create' ? 'Banco cadastrado com sucesso!' : 'Banco atualizado com sucesso!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar banco. Tente novamente.');
      console.error('Erro ao salvar banco:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setIsManualEntry(false);
    onClose();
  };

  const handleBancoSelect = (codigo: string) => {
    const banco = availableBancos.find(b => b.codigo === codigo);
    if (banco) {
      setValue('codigo', codigo);
      setValue('nome', banco.nome);
    }
  };

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    if (!isManualEntry) {
      // Limpar campos quando mudar para entrada manual
      setValue('codigo', '');
      setValue('nome', '');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('telefoneContato', formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Cadastrar Novo Banco' : 'Editar Banco'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados do banco parceiro para cadastrá-lo no sistema.'
              : 'Atualize os dados do banco conforme necessário.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Seleção/Entrada do Banco */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Banco *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleManualEntry}
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                {isManualEntry ? 'Selecionar da Lista' : 'Entrada Manual'}
              </Button>
            </div>
            
            {!isManualEntry ? (
              <Select onValueChange={handleBancoSelect} value={selectedCodigo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {availableBancos.map((banco) => (
                    <SelectItem key={banco.codigo} value={banco.codigo}>
                      {banco.codigo} - {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-accent/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  Modo entrada manual ativado. Preencha os campos abaixo.
                </p>
              </div>
            )}
            
            {errors.codigo && (
              <p className="text-sm text-destructive">{errors.codigo.message}</p>
            )}
          </div>

          {/* Nome e Código */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nome">Nome do Banco *</Label>
              <Input
                id="nome"
                placeholder={isManualEntry ? "Digite o nome da instituição" : "Nome da instituição"}
                {...register('nome')}
                disabled={isSubmitting}
                readOnly={!isManualEntry}
                className={!isManualEntry ? "bg-muted" : ""}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder={isManualEntry ? "Ex: 999" : "000"}
                {...register('codigo')}
                disabled={isSubmitting}
                readOnly={!isManualEntry}
                maxLength={3}
                className={!isManualEntry ? "bg-muted" : ""}
              />
              {errors.codigo && (
                <p className="text-sm text-destructive">{errors.codigo.message}</p>
              )}
              {isManualEntry && (
                <p className="text-xs text-muted-foreground">
                  Use um código único de 3 dígitos
                </p>
              )}
            </div>
          </div>

          {/* Taxa Média */}
          <div className="space-y-2">
            <Label htmlFor="taxaMedia">Taxa Média Mensal (%) *</Label>
            <Input
              id="taxaMedia"
              type="number"
              step="0.01"
              min="0.1"
              max="15"
              placeholder="2.5"
              {...register('taxaMedia', { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {errors.taxaMedia && (
              <p className="text-sm text-destructive">{errors.taxaMedia.message}</p>
            )}
          </div>

          {/* Contato e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contato">Nome do Contato *</Label>
              <Input
                id="contato"
                placeholder="Nome do responsável"
                {...register('contato')}
                disabled={isSubmitting}
              />
              {errors.contato && (
                <p className="text-sm text-destructive">{errors.contato.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefoneContato">Telefone do Contato *</Label>
              <Input
                id="telefoneContato"
                placeholder="(00) 00000-0000"
                {...register('telefoneContato')}
                onChange={handlePhoneChange}
                maxLength={15}
                disabled={isSubmitting}
              />
              {errors.telefoneContato && (
                <p className="text-sm text-destructive">{errors.telefoneContato.message}</p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações *</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações importantes sobre taxas, processos, requisitos, etc."
              rows={4}
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
                mode === 'create' ? 'Cadastrar Banco' : 'Atualizar Banco'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}