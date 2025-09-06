import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contratoSchema, type ContratoFormData, formatDate, formatCurrency, getTiposContrato } from '@/lib/validations';
import { getProximoNumeroContrato } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { ContratoPdfManager } from '@/components/ContratoPdfManager';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Calendar, Hash, Percent } from 'lucide-react';
import { toast } from 'sonner';

interface ContratoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContratoFormData) => Promise<void>;
  initialData?: Partial<ContratoFormData> & {
    pdfUrl?: string;
    pdfName?: string;
    id?: string;
  };
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
  // Novos campos
  const primeiroVencimento = watch('primeiroVencimento');
  const valorOperacao = watch('valorOperacao');
  const valorSolicitado = watch('valorSolicitado');
  const valorPrestacao = watch('valorPrestacao');

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
    console.log('useEffect do formulário executado', { initialData, mode, isOpen });
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
        observacoes: '',
        // Novos campos com valores padrão apropriados
        primeiroVencimento: dataAtual,
        valorOperacao: 0,
        valorSolicitado: 0,
        valorPrestacao: 0
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
    console.log('Submetendo formulário de contrato', { data, mode });
    setIsSubmitting(true);
    try {
      // Remover campos de PDF dos dados do formulário antes de enviar
      const { pdfUrl, pdfName, ...formDataWithoutPdf } = data as any;
      
      await onSubmit(formDataWithoutPdf as ContratoFormData);
      toast.success(mode === 'create' ? 'Contrato cadastrado com sucesso!' : 'Contrato atualizado com sucesso!');
      // Não fechamos o modal automaticamente para permitir upload de PDF
      // O fechamento será feito pelo usuário quando clicar no botão "Fechar" ou "Concluir"
      if (mode === 'create') {
        // Resetar o formulário para criar um novo contrato
        reset({
          clienteId: '',
          bancoId: '',
          tipoContrato: 'consignado-previdencia' as const,
          valorTotal: 0,
          dataEmprestimo: getDataAtual(),
          parcelas: 0,
          taxa: 0,
          observacoes: '',
          primeiroVencimento: getDataAtual(),
          valorOperacao: 0,
          valorSolicitado: 0,
          valorPrestacao: 0
        });
      }
    } catch (error) {
      toast.error('Erro ao salvar contrato. Tente novamente.');
      console.error('Erro ao salvar contrato:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('Fechando modal de contrato via handleClose');
    reset();
    onClose();
  };

  // Nova função para fechar o modal após conclusão
  const handleComplete = () => {
    console.log('Fechando modal de contrato via handleComplete');
    reset();
    onClose();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setValue('dataEmprestimo', formatted);
  };

  const handlePrimeiroVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setValue('primeiroVencimento', formatted);
  };

  // Função para parsear valores monetários (600000 → 6000.00)
  const parseRawCurrency = (value: string): number => {
    if (!value) return 0;
    
    // Remove tudo que não é número
    const cleanValue = value.replace(/\D/g, '');
    
    // Converte o valor digitado (600000) para formato decimal (6000.00)
    const numericValue = parseInt(cleanValue) || 0;
    return numericValue / 100;
  };

  // Função para formatar valores no padrão brasileiro (6000.00 → 6.000,00)
  const formatToBrazilianCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para formatar valor ao perder o foco
  const handleCurrencyBlur = (field: keyof ContratoFormData, rawValue: string) => {
    if (rawValue) {
      const numericValue = parseRawCurrency(rawValue);
      const formattedValue = formatToBrazilianCurrency(numericValue);
      
      // Atualiza o valor formatado no input
      const input = document.getElementById(field) as HTMLInputElement;
      if (input) {
        input.value = formattedValue;
      }
      // Atualiza o valor no formulário como número
      setValue(field, numericValue);
    }
  };

  // Função para lidar com a mudança de valor (mantém apenas números durante a digitação)
  const handleCurrencyChange = (field: keyof ContratoFormData, value: string) => {
    // Remove tudo que não é número
    const cleanValue = value.replace(/\D/g, '');
    
    // Atualiza o input para mostrar apenas números
    const input = document.getElementById(field) as HTMLInputElement;
    if (input) {
      input.value = cleanValue;
    }
    
    // Atualiza o valor no formulário como string temporariamente
    setValue(field, cleanValue as any);
  };

  // Função para formatar valores ao carregar dados iniciais (sem formatação em tempo real)
  const formatInitialCurrency = (value: number | undefined): string => {
    if (!value || value === 0) return '';
    // Converte para string com 2 casas decimais
    return value.toFixed(2).replace('.', ',');
  };

  // Função para converter valor formatado brasileiro para número
  const parseFormattedValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto decimal
    return parseFloat(value.toString().replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Função para formatar número para padrão brasileiro
  const formatToBrazilian = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Cálculos automáticos corrigidos
  const valorTotalNumerico = parseFormattedValue(valorTotal);
  const valorParcela = valorTotalNumerico && parcelas ? (valorTotalNumerico / parcelas).toFixed(2) : '0';
  const receitaEstimada = valorTotalNumerico && taxa ? (valorTotalNumerico * (taxa / 100)).toFixed(2) : '0';
  
  // Prévia da nomenclatura do contrato
  const previaContratoNome = dataEmprestimo && mode === 'create' 
    ? getProximoNumeroContrato(contratos, dataEmprestimo)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('ContratoFormModal onOpenChange:', open);
      if (!open) {
        handleClose();
      }
    }}>
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
              <Label htmlFor="valorTotal">Valor Total Liberado para o cliente (R$) *</Label>
              <Input
                id="valorTotal"
                type="text"
                value={typeof valorTotal === 'number' ? formatToBrazilian(valorTotal) : (valorTotal || '')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setValue('valorTotal', value as any);
                }}
                onBlur={(e) => {
                  const numericValue = parseFormattedValue(e.target.value);
                  if (numericValue > 0) {
                    // Salva como número para validação
                    setValue('valorTotal', numericValue);
                  }
                }}
                placeholder="Ex: 15.000,50"
              />
              {errors.valorTotal && (
                <p className="text-sm text-destructive">{errors.valorTotal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEmprestimo">Data do Empréstimo *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="dataEmprestimo"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  className="pl-9"
                  value={dataEmprestimo}
                  onChange={handleDateChange}
                />
              </div>
              {errors.dataEmprestimo && (
                <p className="text-sm text-destructive">{errors.dataEmprestimo.message}</p>
              )}
            </div>
          </div>

          {/* Parcelas e Taxa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parcelas">Número de Parcelas *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="parcelas"
                  type="number"
                  min="1"
                  className="pl-9"
                  {...register('parcelas', { valueAsNumber: true })}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setValue('parcelas', value);
                  }}
                />
              </div>
              {errors.parcelas && (
                <p className="text-sm text-destructive">{errors.parcelas.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorParcela">Valor da Parcela</Label>
              <Input
                id="valorParcela"
                type="text"
                readOnly
                value={valorParcela ? formatToBrazilian(parseFloat(valorParcela)) : 'R$ 0,00'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa">Taxa de comissão (%) *</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="taxa"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-9"
                  {...register('taxa', { valueAsNumber: true })}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setValue('taxa', value);
                  }}
                />
              </div>
              {errors.taxa && (
                <p className="text-sm text-destructive">{errors.taxa.message}</p>
              )}
            </div>
          </div>

          {/* Receita Estimada */}
          <div className="space-y-2">
            <Label>Minha Comissão</Label>
            <Input
              type="text"
              readOnly
              value={receitaEstimada ? formatToBrazilian(parseFloat(receitaEstimada)) : 'R$ 0,00'}
            />
          </div>

          {/* Novos campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primeiroVencimento">1° Vencimento *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="primeiroVencimento"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  className="pl-9"
                  value={primeiroVencimento}
                  onChange={handlePrimeiroVencimentoChange}
                />
              </div>
              {errors.primeiroVencimento && (
                <p className="text-sm text-destructive">{errors.primeiroVencimento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataTermino">Data Final</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="dataTermino"
                  type="text"
                  readOnly
                  className="pl-9"
                  value={dataTermino}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorOperacao">Valor da Operação (R$)</Label>
              <Input
                id="valorOperacao"
                type="text"
                placeholder="Ex: 12.500,75"
                value={typeof valorOperacao === 'number' ? formatToBrazilian(valorOperacao) : (valorOperacao || '')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setValue('valorOperacao', value as any);
                }}
                onBlur={(e) => {
                  const numericValue = parseFormattedValue(e.target.value);
                  if (numericValue >= 0) {
                    setValue('valorOperacao', numericValue);
                  }
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorSolicitado">Valor Solicitado (R$)</Label>
              <Input
                id="valorSolicitado"
                type="text"
                placeholder="Ex: 8.750,25"
                value={typeof valorSolicitado === 'number' ? formatToBrazilian(valorSolicitado) : (valorSolicitado || '')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setValue('valorSolicitado', value as any);
                }}
                onBlur={(e) => {
                  const numericValue = parseFormattedValue(e.target.value);
                  if (numericValue >= 0) {
                    setValue('valorSolicitado', numericValue);
                  }
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorPrestacao">Valor da Prestação (R$)</Label>
              <Input
                id="valorPrestacao"
                type="text"
                placeholder="Ex: 1.250,00"
                value={typeof valorPrestacao === 'number' ? formatToBrazilian(valorPrestacao) : (valorPrestacao || '')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setValue('valorPrestacao', value as any);
                }}
                onBlur={(e) => {
                  const numericValue = parseFormattedValue(e.target.value);
                  if (numericValue >= 0) {
                    setValue('valorPrestacao', numericValue);
                  }
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Adicione observações relevantes sobre o contrato..."
            />
          </div>

          {/* Seção de Upload de PDF */}
          {mode === 'edit' && initialData && initialData.id && (
            <ContratoPdfManager 
              contratoId={initialData.id}
              pdfUrl={initialData.pdfUrl}
              pdfName={initialData.pdfName}
            />
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {mode === 'edit' && (
              <Button type="button" variant="outline" onClick={handleComplete}>
                Concluir
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
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
