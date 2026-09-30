export interface EstoqueItem {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoque_minimo: number;
  preco: number;
  unidade: string;
  sku?: string;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  criado_em?: string;
}

export interface MovimentacaoEstoque {
  id: string;
  item_id: string;
  item_nome: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo?: string;
  data: string;
}

export interface SupabaseSettings {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface GroqSettings {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedAction?: {
    type: 'add_item' | 'filter_category' | 'view_low_stock';
    payload?: any;
    label: string;
  };
}
