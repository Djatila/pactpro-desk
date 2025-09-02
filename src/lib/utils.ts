import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para gerar nomenclatura de contratos no formato: Contrato 01-02/03/25
export function formatContratoNome(contratos: any[], contratoAtual: any): string {
  // Filtrar contratos pela mesma data de empréstimo
  const contratosNaData = contratos
    .filter(c => c.dataEmprestimo === contratoAtual.dataEmprestimo)
    .sort((a, b) => a.id.localeCompare(b.id)); // Ordenar por ID para consistência
  
  // Encontrar o índice do contrato atual
  const indice = contratosNaData.findIndex(c => c.id === contratoAtual.id);
  const numeroContrato = (indice + 1).toString().padStart(2, '0');
  
  // Formatar data no formato dd/mm/aa
  const data = new Date(contratoAtual.dataEmprestimo);
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear().toString().slice(-2);
  
  return `Contrato ${numeroContrato}-${dia}/${mes}/${ano}`;
}

// Função para gerar nomenclatura simplificada para uso em listas
export function formatContratoNumero(contratos: any[], contratoAtual: any): string {
  const contratosNaData = contratos
    .filter(c => c.dataEmprestimo === contratoAtual.dataEmprestimo)
    .sort((a, b) => a.id.localeCompare(b.id));
  
  const indice = contratosNaData.findIndex(c => c.id === contratoAtual.id);
  const numeroContrato = (indice + 1).toString().padStart(2, '0');
  
  const data = new Date(contratoAtual.dataEmprestimo);
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear().toString().slice(-2);
  
  return `${numeroContrato}-${dia}/${mes}/${ano}`;
}
