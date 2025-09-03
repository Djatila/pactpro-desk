import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contratoSchema, type ContratoFormData, formatDate, formatCurrency, getTiposContrato } from '@/lib/validations';
import { getProximoNumeroContrato } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface ContratoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContratoFormData) => Promise<void>;
  initialData?: Partial<ContratoFormData>;
  mode?: 'create' | 'edit';
}

export function ContratoFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  mode = 'create' 
}: ContratoFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiposContrato, setTiposContrato] = useState(getTiposContrato());
  const { clientes, bancos, contratos } = useData();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: initialData
  });

  const valorTotal = watch('valorTotal');
  const parcelas = watch('parcelas');
  const taxa = watch('taxa');
  const dataEmprestimo = watch('dataEmprestimo');
  const clienteId = watch('clienteId');
  const bancoId = watch('bancoId');
  const tipoContrato = watch('tipoContrato');

  // Função para obter data atual no formato DD/MM/AAAA
  const getDataAtual = (): string => {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Atualizar tipos de contrato quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setTiposContrato(getTiposContrato());
    }
  }, [isOpen]);

  // Reset do formulário quando initialData mudar ou modal abrir/fechar
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Reset com os dados do contrato para edição
      reset(initialData);
      
      // Pré-selecionar os valores nos Selects
      if (initialData.clienteId) {
        setValue('clienteId', initialData.clienteId);
      }
      if (initialData.bancoId) {
        setValue('bancoId', initialData.bancoId);
      }
      if (initialData.tipoContrato) {
        setValue('tipoContrato', initialData.tipoContrato);
      }
    } else if (mode === 'create') {
      // Reset para formulário vazio quando for criação
      const dataAtual = getDataAtual();
      reset({
        clienteId: '',
        bancoId: '',
        tipoContrato: 'consignado-previdencia' as const,
        valorTotal: 0,
        dataEmprestimo: dataAtual, // Preencher automaticamente com a data atual
        parcelas: 0,
        taxa: 0,
        observacoes: ''
      });
    }
  }, [initialData, reset, setValue, mode, isOpen]);

  // Função para calcular data de término
  const calculateEndDate = (startDate: string, numParcelas: number): string => {
    if (!startDate || !numParcelas || numParcelas <= 0) return '';
    
    try {
      // Converter data DD/MM/AAAA para objeto Date
      const dateParts = startDate.split('/');
      if (dateParts.length !== 3) return '';
      
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JavaScript usa meses 0-11
      const year = parseInt(dateParts[2]);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
      
      const startDateObj = new Date(year, month, day);
      
      // Adicionar número de meses (parcelas são mensais)
      const endDateObj = new Date(startDateObj);
      endDateObj.setMonth(endDateObj.getMonth() + numParcelas);
      
      // Formatar de volta para DD/MM/AAAA
      const endDay = endDateObj.getDate().toString().padStart(2, '0');
      const endMonth = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
      const endYear = endDateObj.getFullYear();
      
      return `${endDay}/${endMonth}/${endYear}`;
    } catch (error) {
      return '';
    }
  };

  // Calcular data de término automaticamente
  const dataTermino = calculateEndDate(dataEmprestimo, parcelas);

  const handleFormSubmit = async (data: ContratoFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(mode === 'create' ? 'Contrato cadastrado com sucesso!' : 'Contrato atualizado com sucesso!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar contrato. Tente novamente.');
      console.error('Erro ao salvar contrato:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setValue('dataEmprestimo', formatted);
  };

  // Cálculos automáticos
  const valorParcela = valorTotal && parcelas ? (valorTotal / parcelas).toFixed(2) : '0';
  const receitaEstimada = valorTotal && taxa ? (valorTotal * (taxa / 100)).toFixed(2) : '0';
  
  // Prévia da nomenclatura do contrato
  const previaContratoNome = dataEmprestimo && mode === 'create' 
    ? getProximoNumeroContrato(contratos, dataEmprestimo)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Cadastrar Novo Contrato' : 'Editar Contrato'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados do contrato para cadastrá-lo no sistema.'
              : 'Atualize os dados do contrato conforme necessário.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Cliente e Banco */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clienteId || ''} onValueChange={(value) => setValue('clienteId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {mode === 'edit'
                    ? clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome} {cliente.status === 'inativo' ? '(Inativo)' : ''}
                        </SelectItem>
                      ))
                    : clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome} {cliente.status === 'inativo' ? '(Inativo)' : ''}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
              {errors.clienteId && (
                <p className="text-sm text-destructive">{errors.clienteId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Banco *</Label>
              <Select value={bancoId || ''} onValueChange={(value) => setValue('bancoId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {mode === 'edit' 
                    ? bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id}>
                          {banco.codigo} - {banco.nome} {banco.status === 'inativo' ? '(Inativo)' : ''}
                        </SelectItem>
                      ))
                    : bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id}>
                          {banco.codigo} - {banco.nome} {banco.status === 'inativo' ? '(Inativo)' : ''}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
              {errors.bancoId && (
                <p className="text-sm text-destructive">{errors.bancoId.message}</p>
              )}
            </div>
          </div>

          {/* Tipo de Contrato */}
          <div className="space-y-2">
            <Label>Tipo de Contrato *</Label>
            <Select value={tipoContrato || ''} onValueChange={(value) => setValue('tipoContrato', value as ContratoFormData['tipoContrato'])}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de contrato" />
              </SelectTrigger>
              <SelectContent>
                {tiposContrato.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoContrato && (
              <p className="text-sm text-destructive">{errors.tipoContrato.message}</p>
            )}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total do Empréstimo (R$) *</Label>
              <Input
                id="valorTotal"
                type="number"
                step="0.01"
                min="1000"
                max="1000000"
                placeholder="15000.00"
                {...register('valorTotal', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.valorTotal && (
                <p className="text-sm text-destructive">{errors.valorTotal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEmprestimo">Data do Empréstimo *</Label>
              <Input
                id="dataEmprestimo"
                placeholder="DD/MM/AAAA"
                {...register('dataEmprestimo')}
                onChange={handleDateChange}
                maxLength={10}
                disabled={isSubmitting}
              />
              {errors.dataEmprestimo && (
                <p className="text-sm text-destructive">{errors.dataEmprestimo.message}</p>
              )}
            </div>
          </div>

          {/* Parcelas e Taxa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parcelas">Número de Parcelas *</Label>
              <Input
                id="parcelas"
                type="number"
                min="6"
                max="96"
                placeholder="24"
                {...register('parcelas', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.parcelas && (
                <p className="text-sm text-destructive">{errors.parcelas.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa">Taxa de Comissão (%) *</Label>
              <Input
                id="taxa"
                type="number"
                step="0.01"
                min="0.1"
                max="15"
                placeholder="2.5"
                {...register('taxa', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.taxa && (
                <p className="text-sm text-destructive">{errors.taxa.message}</p>
              )}
            </div>
          </div>

          {/* Cálculos Automáticos */}
          {(valorTotal && parcelas) || (valorTotal && taxa) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-accent/30 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Valor da Parcela</p>
                <p className="text-lg font-bold text-info">
                  R$ {parseFloat(valorParcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sua Receita Estimada</p>
                <p className="text-lg font-bold text-success">
                  R$ {parseFloat(receitaEstimada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ) : null}

          {/* Data de Término do Empréstimo */}
          {dataEmprestimo && parcelas && dataTermino ? (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Data de Término do Empréstimo</p>
                  <p className="text-lg font-bold text-primary">
                    {dataTermino}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parcelas} parcela{parcelas !== 1 ? 's' : ''} de {dataEmprestimo} até {dataTermino}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Prévia da Nomenclatura do Contrato */}
          {previaContratoNome && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <Hash className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Nomenclatura do Contrato</p>
                  <p className="text-lg font-bold text-primary">
                    {previaContratoNome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sequência global baseada no total de contratos
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais sobre o contrato (opcional)"
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
                mode === 'create' ? 'Cadastrar Contrato' : 'Atualizar Contrato'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}