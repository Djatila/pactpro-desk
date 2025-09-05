import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para gerar nomenclatura de contratos no formato: Contrato 01-02/03/25
export function formatContratoNome(contratos: any[], contratoAtual: any): string {
  // Usar sequência global baseada no total de contratos
  const todosContratos = contratos.sort((a, b) => a.id.localeCompare(b.id));
  const indice = todosContratos.findIndex(c => c.id === contratoAtual.id);
  const numeroContrato = (indice + 1).toString().padStart(2, '0');
  
  // Formatar data no formato dd/mm/aa
  // A dataEmprestimo já vem no formato DD/MM/AAAA
  const [dia, mes, anoCompleto] = contratoAtual.dataEmprestimo.split('/');
  const ano = anoCompleto.slice(-2); // Pegar os últimos 2 dígitos do ano
  
  return `Contrato ${numeroContrato}-${dia}/${mes}/${ano}`;
}

// Função para gerar próximo número de contrato global
export function getProximoNumeroContrato(contratos: any[], dataEmprestimo: string): string {
  // Usar sequência global - próximo número será o total + 1
  const proximoNumero = (contratos.length + 1).toString().padStart(2, '0');
  
  // Formatar data no formato dd/mm/aa
  const [dia, mes, anoCompleto] = dataEmprestimo.split('/');
  const ano = anoCompleto.slice(-2);
  
  return `Contrato ${proximoNumero}-${dia}/${mes}/${ano}`;
}

// Função para gerar nomenclatura simplificada para uso em listas
export function formatContratoNumero(contratos: any[], contratoAtual: any): string {
  const todosContratos = contratos.sort((a, b) => a.id.localeCompare(b.id));
  const indice = todosContratos.findIndex(c => c.id === contratoAtual.id);
  const numeroContrato = (indice + 1).toString().padStart(2, '0');
  
  // A dataEmprestimo já vem no formato DD/MM/AAAA
  const [dia, mes, anoCompleto] = contratoAtual.dataEmprestimo.split('/');
  const ano = anoCompleto.slice(-2);
  
  return `${numeroContrato}-${dia}/${mes}/${ano}`;
}
