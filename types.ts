
export interface Setor {
  id: string;
  user_id?: string;
  nome: string;
  data_criacao: string;
}

export interface Casa {
  id: string;
  user_id?: string;
  setor_id: string;
  nome_casa: string;
  data_inicio_obra: string;
  status: 'Planejamento' | 'Em Obra' | 'Pausada' | 'Finalizado' | 'Vendido';
  orcamento_previsto: number;
  data_criacao: string;
  setores?: Setor;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  tipo: string;
}

export interface CentroCusto {
  id: string;
  nome: string;
  descricao: string;
}

export interface Despesa {
  id: string;
  user_id?: string;
  casa_id: string;
  categoria_id: string;
  descricao_normalizada: string;
  descricao_original: string;
  quantidade: number;
  valor_unitario: number;
  valor: number;
  observacao?: string;
  nota_fiscal_url?: string;
  data_lancamento: string;
  casas?: Casa;
  categorias_despesa?: CategoriaDespesa;
}

export interface AuditRecord {
  id: string;
  despesa_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_at: string;
  changed_by: string;
  old_data: Partial<Despesa> | null;
  new_data: Partial<Despesa> | null;
}
