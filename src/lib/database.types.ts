export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nome: string;
          cargo: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nome: string;
          cargo: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string;
          cargo?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          cpf: string;
          telefone: string;
          email: string;
          endereco: string;
          data_nascimento: string;
          observacoes?: string;
          status: 'ativo' | 'inativo';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf: string;
          telefone: string;
          email: string;
          endereco: string;
          data_nascimento: string;
          observacoes?: string;
          status?: 'ativo' | 'inativo';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cpf?: string;
          telefone?: string;
          email?: string;
          endereco?: string;
          data_nascimento?: string;
          observacoes?: string;
          status?: 'ativo' | 'inativo';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bancos: {
        Row: {
          id: string;
          nome: string;
          codigo: string;
          taxa_media: number;
          contato: string;
          telefone_contato: string;
          observacoes: string;
          status: 'ativo' | 'inativo';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          codigo: string;
          taxa_media: number;
          contato: string;
          telefone_contato: string;
          observacoes: string;
          status?: 'ativo' | 'inativo';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          codigo?: string;
          taxa_media?: number;
          contato?: string;
          telefone_contato?: string;
          observacoes?: string;
          status?: 'ativo' | 'inativo';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      contratos: {
        Row: {
          id: string;
          cliente_id: string;
          banco_id: string;
          tipo_contrato: string;
          data_emprestimo: string;
          valor_total: number;
          parcelas: number;
          taxa: number;
          status: 'ativo' | 'pendente' | 'finalizado';
          observacoes?: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          // Novos campos
          primeiro_vencimento: string;
          valor_operacao: number;
          valor_solicitado: number;
          valor_prestacao: number;
          // Campos para PDF (tornados opcionais)
          pdf_url?: string;
          pdf_name?: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          banco_id: string;
          tipo_contrato: string;
          data_emprestimo: string;
          valor_total: number;
          parcelas: number;
          taxa: number;
          status?: 'ativo' | 'pendente' | 'finalizado';
          observacoes?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          // Novos campos
          primeiro_vencimento: string;
          valor_operacao: number;
          valor_solicitado: number;
          valor_prestacao: number;
          // Campos para PDF (opcionais na inserção)
          pdf_url?: string;
          pdf_name?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          banco_id?: string;
          tipo_contrato?: string;
          data_emprestimo?: string;
          valor_total?: number;
          parcelas?: number;
          taxa?: number;
          status?: 'ativo' | 'pendente' | 'finalizado';
          observacoes?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          // Novos campos
          primeiro_vencimento?: string;
          valor_operacao?: number;
          valor_solicitado?: number;
          valor_prestacao?: number;
          // Campos para PDF (opcionais na atualização)
          pdf_url?: string;
          pdf_name?: string;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          meta_anual: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meta_anual: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meta_anual?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tipos_contrato: {
        Row: {
          id: string;
          user_id: string;
          value: string;
          label: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          value: string;
          label: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          value?: string;
          label?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Tipos convenientes para uso na aplicação
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update'];

export type Banco = Database['public']['Tables']['bancos']['Row'];
export type BancoInsert = Database['public']['Tables']['bancos']['Insert'];
export type BancoUpdate = Database['public']['Tables']['bancos']['Update'];

export type Contrato = Database['public']['Tables']['contratos']['Row'];
export type ContratoInsert = Database['public']['Tables']['contratos']['Insert'];
export type ContratoUpdate = Database['public']['Tables']['contratos']['Update'];

export type Configuracao = Database['public']['Tables']['configuracoes']['Row'];
export type ConfiguracaoInsert = Database['public']['Tables']['configuracoes']['Insert'];
export type ConfiguracaoUpdate = Database['public']['Tables']['configuracoes']['Update'];

export type TipoContrato = Database['public']['Tables']['tipos_contrato']['Row'];
export type TipoContratoInsert = Database['public']['Tables']['tipos_contrato']['Insert'];
export type TipoContratoUpdate = Database['public']['Tables']['tipos_contrato']['Update'];
