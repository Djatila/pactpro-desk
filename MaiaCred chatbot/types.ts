export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  role: Role;
  text: string;
  toolCalls?: any[];
  toolResponse?: any;
}

export interface DatabaseQueryTool {
  tableName: 'clientes' | 'bancos' | 'contratos' | 'configuracoes' | 'tipos_contrato';
  filters?: Record<string, any>;
}