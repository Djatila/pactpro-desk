import { describe, it, expect } from 'vitest';
import { clienteSchema, bancoSchema, formatCPF, formatPhone, formatDate, formatCurrency } from './validations';

describe('Validações de Cliente', () => {
  it('deve validar cliente com dados corretos', () => {
    const clienteValido = {
      nome: 'João Silva Santos',
      cpf: '123.456.789-09', // CPF válido
      telefone: '(11) 99999-9999',
      email: 'joao@teste.com',
      endereco: 'Rua das Flores, 123 - São Paulo/SP',
      dataNascimento: '15/03/1985',
      observacoes: 'Cliente preferencial'
    };

    const result = clienteSchema.safeParse(clienteValido);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar CPF inválido', () => {
    const clienteInvalido = {
      nome: 'João Silva',
      cpf: '111.111.111-11',
      telefone: '(11) 99999-9999',
      email: 'joao@teste.com',
      endereco: 'Rua das Flores, 123',
      dataNascimento: '15/03/1985'
    };

    const result = clienteSchema.safeParse(clienteInvalido);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CPF inválido');
    }
  });

  it('deve rejeitar email inválido', () => {
    const clienteInvalido = {
      nome: 'João Silva',
      cpf: '123.456.789-00',
      telefone: '(11) 99999-9999',
      email: 'email-invalido',
      endereco: 'Rua das Flores, 123',
      dataNascimento: '15/03/1985'
    };

    const result = clienteSchema.safeParse(clienteInvalido);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar idade inválida (menor que 18 anos)', () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const dataNascimento = `15/03/${anoAtual - 10}`; // 10 anos

    const clienteInvalido = {
      nome: 'João Silva',
      cpf: '123.456.789-00',
      telefone: '(11) 99999-9999',
      email: 'joao@teste.com',
      endereco: 'Rua das Flores, 123',
      dataNascimento
    };

    const result = clienteSchema.safeParse(clienteInvalido);
    expect(result.success).toBe(false);
  });
});

describe('Validações de Banco', () => {
  it('deve validar banco com dados corretos', () => {
    const bancoValido = {
      nome: 'Banco do Brasil',
      codigo: '001',
      taxaMedia: 2.5,
      contato: 'João Silva',
      telefoneContato: '(11) 99999-9999',
      observacoes: 'Taxa competitiva e bom atendimento ao cliente'
    };

    const result = bancoSchema.safeParse(bancoValido);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar código bancário inválido', () => {
    const bancoInvalido = {
      nome: 'Banco Teste',
      codigo: '999',
      taxaMedia: 2.5,
      contato: 'João Silva',
      telefoneContato: '(11) 99999-9999',
      observacoes: 'Teste de validação'
    };

    const result = bancoSchema.safeParse(bancoInvalido);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar taxa fora do intervalo válido', () => {
    const bancoInvalido = {
      nome: 'Banco do Brasil',
      codigo: '001',
      taxaMedia: 20, // Taxa muito alta
      contato: 'João Silva',
      telefoneContato: '(11) 99999-9999',
      observacoes: 'Taxa muito alta'
    };

    const result = bancoSchema.safeParse(bancoInvalido);
    expect(result.success).toBe(false);
  });
});

describe('Funções de Formatação', () => {
  it('deve formatar CPF corretamente', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00');
    expect(formatCPF('123456789')).toBe('123456789'); // CPF incompleto
  });

  it('deve formatar telefone corretamente', () => {
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
    expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
    expect(formatPhone('119999')).toBe('119999'); // Telefone incompleto
  });

  it('deve formatar data corretamente', () => {
    expect(formatDate('15031985')).toBe('15/03/1985');
    expect(formatDate('1503')).toBe('1503'); // Data incompleta
  });

  it('deve formatar moeda corretamente', () => {
    const formatted1 = formatCurrency(1500.50);
    const formatted2 = formatCurrency(100);
    
    // Verifica se contém os elementos esperados
    expect(formatted1).toContain('R$');
    expect(formatted1).toContain('1.500');
    expect(formatted1).toContain('50');
    
    expect(formatted2).toContain('R$');
    expect(formatted2).toContain('100');
    expect(formatted2).toContain('00');
  });
});