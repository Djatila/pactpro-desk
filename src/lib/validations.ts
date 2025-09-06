import { z } from 'zod';

// Validações para CPF
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const validateCPF = (cpf: string): boolean => {
  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica sequências inválidas
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Algoritmo de validação do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Validações para CNPJ
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Algoritmo de validação do CNPJ
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let checkDigit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  let checkDigit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
};

// Schema para Cliente
export const clienteSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  cpf: z.string()
    .regex(cpfRegex, 'CPF deve estar no formato 000.000.000-00')
    .refine(validateCPF, 'CPF inválido'),
  
  telefone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000'),
  
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  
  endereco: z.string()
    .min(10, 'Endereço deve ter pelo menos 10 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres'),
  
  dataNascimento: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA')
    .refine((date) => {
      const [day, month, year] = date.split('/').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      
      return inputDate >= minDate && inputDate <= maxDate;
    }, 'Cliente deve ter entre 18 e 100 anos'),
  
  observacoes: z.string().optional()
});

// Schema para Banco
export const bancoSchema = z.object({
  nome: z.string()
    .min(3, 'Nome do banco deve ter pelo menos 3 caracteres')
    .max(100, 'Nome do banco deve ter no máximo 100 caracteres'),
  
  codigo: z.string()
    .regex(/^\d{3}$/, 'Código deve ter exatamente 3 dígitos'),
  
  taxaMedia: z.number()
    .min(0.1, 'Taxa deve ser maior que 0.1%')
    .max(15, 'Taxa deve ser menor que 15%'),
  
  contato: z.string()
    .min(5, 'Contato deve ter pelo menos 5 caracteres')
    .max(100, 'Contato deve ter no máximo 100 caracteres'),
  
  telefoneContato: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000'),
  
  observacoes: z.string()
    .min(10, 'Observações devem ter pelo menos 10 caracteres')
    .max(500, 'Observações devem ter no máximo 500 caracteres')
});

// Schema para Contrato
export const contratoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  bancoId: z.string().min(1, 'Banco é obrigatório'),
  tipoContrato: z.string().min(1, 'Tipo de contrato é obrigatório'),
  dataEmprestimo: z.string().min(1, 'Data do empréstimo é obrigatória'),
  valorTotal: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  parcelas: z.number().min(1, 'Número de parcelas deve ser maior que zero'),
  taxa: z.number().min(0, 'Taxa não pode ser negativa'),
  observacoes: z.string().optional(),
  // Novos campos
  primeiroVencimento: z.string().min(1, 'Primeiro vencimento é obrigatório'),
  valorOperacao: z.number().min(0, 'Valor da operação não pode ser negativo'),
  valorSolicitado: z.number().min(0, 'Valor solicitado não pode ser negativo'),
  valorPrestacao: z.number().min(0, 'Valor da prestação não pode ser negativo')
});

export type ContratoFormData = z.infer<typeof contratoSchema>;

// Removemos os campos de PDF do tipo pois eles são gerenciados separadamente
// Tipos TypeScript derivados dos schemas

// Função para obter tipos de contrato do localStorage ou padrão
export const getTiposContrato = () => {
  const savedTipos = localStorage.getItem('tiposContrato');
  if (savedTipos) {
    try {
      const tipos = JSON.parse(savedTipos);
      return tipos.map((tipo: any) => ({ value: tipo.value, label: tipo.label }));
    } catch {
      // Se houver erro no parse, usar tipos padrão
    }
  }
  
  // Tipos padrão
  return [
    { value: 'consignado-previdencia', label: 'Consignado Previdência' },
    { value: 'consignado-clt', label: 'Consignado CLT' },
    { value: 'emprestimo-pessoal', label: 'Empréstimo Pessoal' },
    { value: 'fgts', label: 'FGTS' },
    { value: 'emp-bolsa-familia', label: 'Emp. Bolsa Família' },
    { value: 'emp-conta-energia', label: 'Emp. Conta de Energia' },
    { value: 'emp-bpc-loas', label: 'Emp. BPC LOAS' }
  ];
};

// Opções para tipo de contrato (mantido para compatibilidade)
export const tiposContrato = [
  { value: 'consignado-previdencia', label: 'Consignado Previdência' },
  { value: 'consignado-clt', label: 'Consignado CLT' },
  { value: 'emprestimo-pessoal', label: 'Empréstimo Pessoal' },
  { value: 'fgts', label: 'FGTS' },
  { value: 'emp-bolsa-familia', label: 'Emp. Bolsa Família' },
  { value: 'emp-conta-energia', label: 'Emp. Conta de Energia' },
  { value: 'emp-bpc-loas', label: 'Emp. BPC LOAS' }
] as const;

// Função para obter o label do tipo de contrato
export const getTipoContratoLabel = (value: string): string => {
  const tipos = getTiposContrato();
  const tipo = tipos.find(t => t.value === value);
  return tipo ? tipo.label : value;
};

// Função para formatar CPF
export const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  const match = cleanValue.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }
  return cleanValue;
};

// Função para formatar telefone
export const formatPhone = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 11) {
    const match = cleanValue.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
  } else if (cleanValue.length === 10) {
    const match = cleanValue.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return cleanValue;
};

// Função para formatar data
export const formatDate = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  const match = cleanValue.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  return cleanValue;
};

// Função para formatar valor monetário
export const formatCurrency = (value: number): string => {
  // Verifica se o valor é válido
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};
