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
  const [tiposContrato, setTiposContrato] = useState<{value: string, label: string}[]>([]);
  const dataContext = useData();
  
  const { clientes, bancos, contratos, loadTiposContrato } = dataContext;

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
    defaultValues: {
      clienteId: '',
      bancoId: '',
      tipoContrato: '',
      valorTotal: 0,
      dataEmprestimo: '',
      parcelas: 0,
      taxa: 0,
      observacoes: '',
      primeiroVencimento: '',
      valorOperacao: 0,
      valorSolicitado: 0,
      valorPrestacao: 0
    }
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
  
  // Efeito para monitorar mudanças nos valores
  useEffect(() => {
    console.log('Valores do formulário:', {
      clienteId,
      bancoId,
      tipoContrato,
      valorTotal,
      dataEmprestimo,
      parcelas,
      taxa,
      observacoes: watch('observacoes'),
      primeiroVencimento,
      valorOperacao,
      valorSolicitado,
      valorPrestacao
    });
  }, [clienteId, bancoId, tipoContrato, valorTotal, dataEmprestimo, parcelas, taxa, primeiroVencimento, valorOperacao, valorSolicitado, valorPrestacao]);

  // Função para obter data atual no formato DD/MM/AAAA
  const getDataAtual = (): string => {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataAtual = `${dia}/${mes}/${ano}`;
    console.log('Data atual:', dataAtual);
    return dataAtual;
  };

  // Função para formatar valor monetário no padrão brasileiro (1.000,00)
  const formatCurrencyInput = (value: number | string): string => {
    if (value === '' || value === undefined || value === null) return '';
    console.log('Formatando valor monetário:', value);
    
    // Converter para número se for string
    let numValue: number;
    if (typeof value === 'string') {
      // Remover pontos e substituir vírgula por ponto para parse
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      numValue = parseFloat(cleanValue);
    } else {
      numValue = value;
    }
    
    if (isNaN(numValue)) return '';
    
    // Formatar com separador de milhar e decimal
    const formattedValue = numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    console.log('Valor formatado:', formattedValue);
    return formattedValue;
  };

  // Função para parsear valor monetário do formato brasileiro para número
  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    console.log('Parseando valor monetário:', value);
    // Remover pontos e substituir vírgula por ponto para parse
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    const parsedValue = parseFloat(cleanValue) || 0;
    console.log('Valor parseado:', parsedValue);
    return parsedValue;
  };

  // Função para lidar com entrada de valores monetários em tempo real
  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ContratoFormData) => {
    const inputValue = e.target.value;
    console.log(`Alterando campo ${fieldName} para:`, inputValue);
    // Atualizar o valor no formulário mantendo exatamente como digitado
    setValue(fieldName, inputValue as any);
  };

  // Função para formatar o valor ao sair do campo
  const handleCurrencyBlur = (fieldName: keyof ContratoFormData, value: string | number) => {
    console.log(`Saindo do campo ${fieldName} com valor:`, value);
    // Converter o valor para número e aplicar formatação
    const numericValue = typeof value === 'string' ? parseCurrencyInput(value) : value;
    setValue(fieldName, numericValue);
  };

  // Reset do formulário quando initialData mudar ou modal abrir/fechar
  useEffect(() => {
    const initializeForm = async () => {
      if (isOpen) {
        // Carregar tipos de contrato
        try {
          let tipos: {value: string, label: string}[] = [];
          
          // Verificar se loadTiposContrato está disponível e é uma função
          if (typeof loadTiposContrato === 'function') {
            // Passar os contratos atuais para garantir que tipos personalizados sejam incluídos
            tipos = await loadTiposContrato(contratos);
          } else {
            // Usar tipos padrão se loadTiposContrato não estiver disponível
            tipos = getTiposContrato();
          }
          
          // Verificar se o tipo de contrato do contrato sendo editado está nos tipos carregados
          if (mode === 'edit' && initialData && initialData.tipoContrato) {
            const tipoExiste = tipos.some(tipo => tipo.value === initialData.tipoContrato);
            
            // Se o tipo não existir, adicionar uma opção temporária
            if (!tipoExiste && initialData.tipoContrato) {
              tipos = [
                ...tipos,
                { value: initialData.tipoContrato, label: initialData.tipoContrato }
              ];
            }
          }
          
          setTiposContrato(tipos);
        } catch (error) {
          console.error('Erro ao carregar tipos de contrato:', error);
          // Usar tipos padrão em caso de erro
          setTiposContrato(getTiposContrato());
        }

        // Preencher o formulário com os dados iniciais
        if (initialData && mode === 'edit') {
          console.log('Dados iniciais para edição:', initialData);
          // Reset com os dados do contrato para edição
          reset({
            clienteId: initialData.clienteId || '',
            bancoId: initialData.bancoId || '',
            tipoContrato: initialData.tipoContrato || '',
            valorTotal: initialData.valorTotal !== undefined ? initialData.valorTotal : 0,
            dataEmprestimo: initialData.dataEmprestimo || getDataAtual(),
            parcelas: initialData.parcelas !== undefined ? initialData.parcelas : 0,
            taxa: initialData.taxa !== undefined ? initialData.taxa : 0,
            observacoes: initialData.observacoes || '',
            // Novos campos
            primeiroVencimento: initialData.primeiroVencimento || getDataAtual(),
            valorOperacao: initialData.valorOperacao !== undefined ? initialData.valorOperacao : 0,
            valorSolicitado: initialData.valorSolicitado !== undefined ? initialData.valorSolicitado : 0,
            valorPrestacao: initialData.valorPrestacao !== undefined ? initialData.valorPrestacao : 0
          });
          
          // Definir valores individuais também para garantir que todos os campos sejam preenchidos
          setTimeout(() => {
            setValue('clienteId', initialData.clienteId || '');
            setValue('bancoId', initialData.bancoId || '');
            setValue('tipoContrato', initialData.tipoContrato || '');
            setValue('valorTotal', initialData.valorTotal !== undefined ? initialData.valorTotal : 0);
            setValue('dataEmprestimo', initialData.dataEmprestimo || getDataAtual());
            setValue('parcelas', initialData.parcelas !== undefined ? initialData.parcelas : 0);
            setValue('taxa', initialData.taxa !== undefined ? initialData.taxa : 0);
            setValue('observacoes', initialData.observacoes || '');
            // Novos campos
            setValue('primeiroVencimento', initialData.primeiroVencimento || getDataAtual());
            setValue('valorOperacao', initialData.valorOperacao !== undefined ? initialData.valorOperacao : 0);
            setValue('valorSolicitado', initialData.valorSolicitado !== undefined ? initialData.valorSolicitado : 0);
            setValue('valorPrestacao', initialData.valorPrestacao !== undefined ? initialData.valorPrestacao : 0);
          }, 0);
        } else if (mode === 'create') {
          // Reset para formulário vazio quando for criação
          const dataAtual = getDataAtual();
          reset({
            clienteId: '',
            bancoId: '',
            tipoContrato: '',
            valorTotal: 0,
            dataEmprestimo: dataAtual,
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
      }
    };
    
    initializeForm();
  }, [isOpen, initialData, reset, mode, loadTiposContrato, contratos, setValue]);
  
  // Atualizar tipos de contrato quando o modal abrir
  useEffect(() => {
    const loadTipos = async () => {
      if (isOpen) {
        try {
          let tipos: {value: string, label: string}[] = [];
          
          // Verificar se loadTiposContrato está disponível e é uma função
          if (typeof loadTiposContrato === 'function') {
            // Passar os contratos atuais para garantir que tipos personalizados sejam incluídos
            tipos = await loadTiposContrato(contratos);
          } else {
            // Usar tipos padrão se loadTiposContrato não estiver disponível
            tipos = getTiposContrato();
          }
          
          // Verificar se o tipo de contrato do contrato sendo editado está nos tipos carregados
          if (mode === 'edit' && initialData && initialData.tipoContrato) {
            const tipoExiste = tipos.some(tipo => tipo.value === initialData.tipoContrato);
            
            // Se o tipo não existir, adicionar uma opção temporária
            if (!tipoExiste && initialData.tipoContrato) {
              tipos = [
                ...tipos,
                { value: initialData.tipoContrato, label: initialData.tipoContrato }
              ];
            }
          }
          
          setTiposContrato(tipos);
          
          // Se estivermos em modo de edição, garantir que o valor do tipo de contrato esteja definido
          if (mode === 'edit' && initialData && initialData.tipoContrato) {
            // Aguardar um tick para garantir que o estado foi atualizado antes de definir o valor
            setTimeout(() => {
              setValue('tipoContrato', initialData.tipoContrato);
            }, 0);
          }
        } catch (error) {
          console.error('Erro ao carregar tipos de contrato:', error);
          // Usar tipos padrão em caso de erro
          setTiposContrato(getTiposContrato());
        }
      }
    };
    
    loadTipos();
  }, [isOpen, initialData?.tipoContrato, loadTiposContrato, contratos, mode, setValue]);

  const handleClose = () => {
    onClose();
  };

  const handleComplete = () => {
    onClose();
  };

  const handleFormSubmit = async (data: ContratoFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // Não fechamos o modal automaticamente para permitir upload de PDF
      // O fechamento será feito pelo usuário quando clicar no botão "Concluir"
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Alterando data de empréstimo para:', value);
    // Aplicar máscara de data
    const maskedValue = formatDate(value);
    setValue('dataEmprestimo', maskedValue);
  };

  const handlePrimeiroVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Alterando primeiro vencimento para:', value);
    // Aplicar máscara de data
    const maskedValue = formatDate(value);
    setValue('primeiroVencimento', maskedValue);
  };

  // Calcular valor da parcela
  const valorParcela = valorTotal && parcelas ? (valorTotal / parcelas).toString() : '0';

  // Calcular receita estimada
  const receitaEstimada = valorTotal && taxa ? (valorTotal * (taxa / 100)).toString() : '0';

  // Calcular data de término
  const dataTermino = dataEmprestimo && parcelas ? 
    new Date(
      parseInt(dataEmprestimo.split('/')[2]),
      parseInt(dataEmprestimo.split('/')[1]) - 1,
      parseInt(dataEmprestimo.split('/')[0])
    ).setMonth(
      new Date(
        parseInt(dataEmprestimo.split('/')[2]),
        parseInt(dataEmprestimo.split('/')[1]) - 1,
        parseInt(dataEmprestimo.split('/')[0])
      ).getMonth() + parcelas - 1
    ) : null;

  const dataTerminoFormatada = dataTermino ? 
    new Date(dataTermino).toLocaleDateString('pt-BR') : '';

  // Prévia da nomenclatura do contrato
  const previaContratoNome = mode === 'create' ? 
    getProximoNumeroContrato(contratos, getDataAtual()) : 
    initialData?.id ? 
      contratos.find(c => c.id === initialData.id)?.id || '' : 
      '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
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
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.status === 'inativo' ? '(Inativo)' : ''}
                    </SelectItem>
                  ))}
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
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.codigo} - {banco.nome} {banco.status === 'inativo' ? '(Inativo)' : ''}
                    </SelectItem>
                  ))}
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
            <Select 
              value={tipoContrato || ''} 
              onValueChange={(value) => setValue('tipoContrato', value as ContratoFormData['tipoContrato'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de contrato" />
              </SelectTrigger>
              <SelectContent>
                {tiposContrato.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
                {/* Adicionar opção temporária se o tipo de contrato não estiver na lista */}
                {tipoContrato && !tiposContrato.some(tipo => tipo.value === tipoContrato) && (
                  <SelectItem value={tipoContrato} className="text-warning">
                    {tipoContrato} (Tipo não encontrado)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.tipoContrato && (
              <p className="text-sm text-destructive">{errors.tipoContrato.message}</p>
            )}
            {/* Mensagem de aviso se o tipo de contrato não estiver disponível */}
            {tipoContrato && !tiposContrato.some(tipo => tipo.value === tipoContrato) && (
              <p className="text-sm text-warning">
                O tipo de contrato "{tipoContrato}" não está disponível na lista de tipos cadastrados. 
                Por favor, selecione um tipo válido ou adicione este tipo no gerenciador de tipos de contrato.
              </p>
            )}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total Liberado para o cliente (R$) *</Label>
              <Input
                id="valorTotal"
                type="text"
                {...register('valorTotal')}
                value={typeof valorTotal === 'number' && valorTotal !== 0 ? formatCurrencyInput(valorTotal) : (valorTotal || '')}
                onChange={(e) => handleCurrencyInput(e, 'valorTotal')}
                onBlur={() => handleCurrencyBlur('valorTotal', valorTotal || 0)}
              />
              {errors.valorTotal && (
                <p className="text-sm text-destructive">{errors.valorTotal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEmprestimo">Data Base *</Label>
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
                value={valorParcela ? formatCurrencyInput(parseFloat(valorParcela)) : '0,00'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa">Taxa de Comissão (%) *</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="taxa"
                  type="text"
                  className="pl-9"
                  {...register('taxa')}
                  value={typeof taxa === 'number' && taxa !== 0 ? formatCurrencyInput(taxa) : (taxa || '')}
                  onChange={(e) => handleCurrencyInput(e, 'taxa')}
                  onBlur={() => handleCurrencyBlur('taxa', taxa || 0)}
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
              value={receitaEstimada ? formatCurrencyInput(parseFloat(receitaEstimada)) : '0,00'}
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
                  value={dataTerminoFormatada}
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
                {...register('valorOperacao')}
                value={typeof valorOperacao === 'number' && valorOperacao !== 0 ? formatCurrencyInput(valorOperacao) : (valorOperacao || '')}
                onChange={(e) => handleCurrencyInput(e, 'valorOperacao')}
                onBlur={() => handleCurrencyBlur('valorOperacao', valorOperacao || 0)}
              />
              {errors.valorOperacao && (
                <p className="text-sm text-destructive">{errors.valorOperacao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorSolicitado">Valor Solicitado (R$)</Label>
              <Input
                id="valorSolicitado"
                type="text"
                {...register('valorSolicitado')}
                value={typeof valorSolicitado === 'number' && valorSolicitado !== 0 ? formatCurrencyInput(valorSolicitado) : (valorSolicitado || '')}
                onChange={(e) => handleCurrencyInput(e, 'valorSolicitado')}
                onBlur={() => handleCurrencyBlur('valorSolicitado', valorSolicitado || 0)}
              />
              {errors.valorSolicitado && (
                <p className="text-sm text-destructive">{errors.valorSolicitado.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorPrestacao">Valor da Prestação (R$)</Label>
              <Input
                id="valorPrestacao"
                type="text"
                {...register('valorPrestacao')}
                value={typeof valorPrestacao === 'number' && valorPrestacao !== 0 ? formatCurrencyInput(valorPrestacao) : (valorPrestacao || '')}
                onChange={(e) => handleCurrencyInput(e, 'valorPrestacao')}
                onBlur={() => handleCurrencyBlur('valorPrestacao', valorPrestacao || 0)}
              />
              {errors.valorPrestacao && (
                <p className="text-sm text-destructive">{errors.valorPrestacao.message}</p>
              )}
            </div>
          </div>

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