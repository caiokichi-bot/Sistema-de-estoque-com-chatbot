import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EstoqueItem, Categoria } from '../types';

const STORAGE_KEYS = {
  SUPABASE_URL: 'stockmaster_supabase_url',
  SUPABASE_KEY: 'stockmaster_supabase_key',
  ITEMS: 'stockmaster_local_items',
  CATEGORIES: 'stockmaster_local_categories',
  MOVEMENTS: 'stockmaster_local_movements',
};

// Dados padrão iniciais para primeiro uso
const INITIAL_CATEGORIES: Categoria[] = [
  { id: 'cat-1', nome: 'Eletrônicos', cor: '#3b82f6', descricao: 'Equipamentos e cabos' },
  { id: 'cat-2', nome: 'Alimentos & Bebidas', cor: '#10b981', descricao: 'Perecíveis e suprimentos' },
  { id: 'cat-3', nome: 'Material de Escritório', cor: '#8b5cf6', descricao: 'Papelaria e organização' },
  { id: 'cat-4', nome: 'Ferramentas', cor: '#f59e0b', descricao: 'Manutenção e equipamentos' },
  { id: 'cat-5', nome: 'Limpeza', cor: '#06b6d4', descricao: 'Produtos de higiene' },
];

const INITIAL_ITEMS: EstoqueItem[] = [
  {
    id: 'item-1',
    nome: 'Notebook Dell Latitude 5420',
    categoria: 'Eletrônicos',
    quantidade: 4,
    estoque_minimo: 5,
    preco: 4200.0,
    unidade: 'un',
    sku: 'NOTE-DELL-5420',
    observacoes: 'Uso corporativo com garantia até 2027',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 'item-2',
    nome: 'Mouse Sem Fio Logitech M170',
    categoria: 'Eletrônicos',
    quantidade: 18,
    estoque_minimo: 8,
    preco: 69.9,
    unidade: 'un',
    sku: 'LOG-M170-BK',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 'item-3',
    nome: 'Café Torrado em Grãos 1kg',
    categoria: 'Alimentos & Bebidas',
    quantidade: 2,
    estoque_minimo: 6,
    preco: 48.5,
    unidade: 'pct',
    sku: 'ALIM-CAFE-1KG',
    observacoes: 'Ponto crítico de reposição',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 'item-4',
    nome: 'Papel Sulfite A4 75g (500 folhas)',
    categoria: 'Material de Escritório',
    quantidade: 25,
    estoque_minimo: 10,
    preco: 29.9,
    unidade: 'resma',
    sku: 'PAP-A4-500',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 'item-5',
    nome: 'Cabo HDMI 2.0 4K 2 metros',
    categoria: 'Eletrônicos',
    quantidade: 0,
    estoque_minimo: 5,
    preco: 32.0,
    unidade: 'un',
    sku: 'CAB-HDMI-2M',
    observacoes: 'Esgotado - aguardando entrega do fornecedor',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 'item-6',
    nome: 'Kit Chaves de Fenda e Phillips',
    categoria: 'Ferramentas',
    quantidade: 7,
    estoque_minimo: 3,
    preco: 85.0,
    unidade: 'kit',
    sku: 'FER-CHV-SET',
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 'item-7',
    nome: 'Álcool em Gel 70% 500ml',
    categoria: 'Limpeza',
    quantidade: 14,
    estoque_minimo: 10,
    preco: 14.5,
    unidade: 'frasco',
    sku: 'LIMP-ALC-70',
    atualizado_em: new Date().toISOString(),
  },
];

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
  const storedKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (url.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  }

  if (anonKey.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  }

  supabaseInstance = null; // Recreate client next time
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: false,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Erro ao inicializar Supabase client:', e);
      return null;
    }
  }
  return null;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('http')) {
      return { success: false, message: 'URL do Supabase inválida. Deve iniciar com https://' };
    }
    const testClient = createClient(url, anonKey, { auth: { persistSession: false } });
    
    // Tenta consultar itens_estoque ou uma consulta básica
    const { error } = await testClient.from('itens_estoque').select('id').limit(1);
    
    if (error) {
      // Se a tabela ainda não existe, a conexão está OK mas a tabela precisa ser criada
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Conectado ao Supabase! Porém a tabela "itens_estoque" ainda não foi criada. Copie o script SQL abaixo e execute no SQL Editor do Supabase.' 
        };
      }
      return { success: false, message: `Erro ao conectar: ${error.message} (${error.code || ''})` };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na conexão: ${err?.message || 'Verifique sua URL e Chave Anon'}` };
  }
}

// Local Storage Handlers
export function getLocalItems(): EstoqueItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
    return INITIAL_ITEMS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ITEMS;
  }
}

export function saveLocalItems(items: EstoqueItem[]) {
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
}

export function getLocalCategories(): Categoria[] {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveLocalCategories(cats: Categoria[]) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
}

// High Level Storage Operations (Supabase with Local Fallback)
export async function fetchStockData(): Promise<{ items: EstoqueItem[]; categories: Categoria[]; isSupabase: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      items: getLocalItems(),
      categories: getLocalCategories(),
      isSupabase: false,
    };
  }

  try {
    const [itemsRes, catsRes] = await Promise.all([
      client.from('itens_estoque').select('*').order('nome', { ascending: true }),
      client.from('categorias').select('*').order('nome', { ascending: true }),
    ]);

    if (itemsRes.error) {
      console.warn('Erro ao carregar do Supabase:', itemsRes.error);
      return {
        items: getLocalItems(),
        categories: getLocalCategories(),
        isSupabase: false,
        error: `Supabase: ${itemsRes.error.message}. Utilizando modo local.`,
      };
    }

    let items = (itemsRes.data as EstoqueItem[]) || [];
    let categories = (catsRes.data as Categoria[]) || [];

    // Se a tabela do Supabase estiver vazia pela primeira vez, migra dados iniciais
    if (categories.length === 0) {
      categories = getLocalCategories();
    }

    return {
      items,
      categories,
      isSupabase: true,
    };
  } catch (err: any) {
    return {
      items: getLocalItems(),
      categories: getLocalCategories(),
      isSupabase: false,
      error: `Erro de conexão: ${err.message}. Utilizando modo local.`,
    };
  }
}

export async function addStockItem(item: Omit<EstoqueItem, 'id'>): Promise<{ item: EstoqueItem; isSupabase: boolean }> {
  const client = getSupabaseClient();
  const newItemId = 'item-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const itemToSave: EstoqueItem = {
    ...item,
    id: newItemId,
    criado_em: now,
    atualizado_em: now,
  };

  if (client) {
    try {
      const { data, error } = await client.from('itens_estoque').insert([
        {
          nome: item.nome,
          categoria: item.categoria,
          quantidade: item.quantidade,
          estoque_minimo: item.estoque_minimo,
          preco: item.preco,
          unidade: item.unidade,
          sku: item.sku || '',
          observacoes: item.observacoes || '',
          atualizado_em: now,
        }
      ]).select().single();

      if (!error && data) {
        return { item: data as EstoqueItem, isSupabase: true };
      }
    } catch (e) {
      console.warn('Falha ao inserir no Supabase, salvando local:', e);
    }
  }

  // Fallback Local
  const localItems = getLocalItems();
  const updated = [itemToSave, ...localItems];
  saveLocalItems(updated);
  return { item: itemToSave, isSupabase: false };
}

export async function updateStockItem(item: EstoqueItem): Promise<{ success: boolean; isSupabase: boolean }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const updatedItem = { ...item, atualizado_em: now };

  if (client) {
    try {
      const { error } = await client.from('itens_estoque').update({
        nome: item.nome,
        categoria: item.categoria,
        quantidade: item.quantidade,
        estoque_minimo: item.estoque_minimo,
        preco: item.preco,
        unidade: item.unidade,
        sku: item.sku || '',
        observacoes: item.observacoes || '',
        atualizado_em: now,
      }).eq('id', item.id);

      if (!error) {
        return { success: true, isSupabase: true };
      }
    } catch (e) {
      console.warn('Falha ao atualizar no Supabase:', e);
    }
  }

  // Local update
  const localItems = getLocalItems();
  const index = localItems.findIndex((i) => i.id === item.id);
  if (index !== -1) {
    localItems[index] = updatedItem;
    saveLocalItems(localItems);
  }
  return { success: true, isSupabase: false };
}

export async function deleteStockItem(id: string): Promise<{ success: boolean; isSupabase: boolean }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('itens_estoque').delete().eq('id', id);
      if (!error) {
        return { success: true, isSupabase: true };
      }
    } catch (e) {
      console.warn('Falha ao deletar no Supabase:', e);
    }
  }

  // Local delete
  const localItems = getLocalItems();
  const filtered = localItems.filter((i) => i.id !== id);
  saveLocalItems(filtered);
  return { success: true, isSupabase: false };
}

export async function addCategory(categoria: Omit<Categoria, 'id'>): Promise<{ category: Categoria; isSupabase: boolean }> {
  const client = getSupabaseClient();
  const newCatId = 'cat-' + Date.now().toString(36);
  const newCat: Categoria = {
    ...categoria,
    id: newCatId,
    criado_em: new Date().toISOString(),
  };

  if (client) {
    try {
      const { data, error } = await client.from('categorias').insert([
        {
          nome: categoria.nome,
          descricao: categoria.descricao || '',
          cor: categoria.cor || '#3b82f6',
        }
      ]).select().single();

      if (!error && data) {
        return { category: data as Categoria, isSupabase: true };
      }
    } catch (e) {
      console.warn('Erro ao inserir categoria no Supabase:', e);
    }
  }

  const localCats = getLocalCategories();
  const updated = [...localCats, newCat];
  saveLocalCategories(updated);
  return { category: newCat, isSupabase: false };
}

export async function deleteCategory(id: string, name: string): Promise<{ success: boolean }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('categorias').delete().eq('id', id);
    } catch (e) {
      console.warn('Erro ao deletar categoria no Supabase:', e);
    }
  }

  const localCats = getLocalCategories();
  const updated = localCats.filter((c) => c.id !== id && c.nome !== name);
  saveLocalCategories(updated);
  return { success: true };
}

export function getSqlSetupScript(): string {
  return `-- =============================================================================
-- SCRIPT COMPLETO DE BANCO DE DADOS E ARMAZENAMENTO NO SUPABASE
-- Execute no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- 1. CRIAÇÃO DA TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT DEFAULT '#3b82f6',
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. CRIAÇÃO DA TABELA DE ITENS DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.itens_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC NOT NULL DEFAULT 5,
  preco NUMERIC NOT NULL DEFAULT 0.0,
  unidade TEXT DEFAULT 'un',
  sku TEXT,
  observacoes TEXT,
  imagem_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. CRIAÇÃO DA TABELA DE HISTÓRICO DE MOVIMENTAÇÕES
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.itens_estoque(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade NUMERIC NOT NULL,
  motivo TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_itens_estoque_nome ON public.itens_estoque (nome);
CREATE INDEX IF NOT EXISTS idx_itens_estoque_categoria ON public.itens_estoque (categoria);
CREATE INDEX IF NOT EXISTS idx_itens_estoque_sku ON public.itens_estoque (sku);

-- 5. TRIGGER AUTOMÁTICO DE ATUALIZAÇÃO DA DATA (atualizado_em)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_itens_estoque_updated_at ON public.itens_estoque;
CREATE TRIGGER trigger_itens_estoque_updated_at
BEFORE UPDATE ON public.itens_estoque
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. HABILITAR SEGURANÇA EM NÍVEL DE LINHA (RLS) NAS TABELAS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACESSO PARA TABELAS (Permite anon e authenticated)
DROP POLICY IF EXISTS "Permitir leitura de categorias" ON public.categorias;
CREATE POLICY "Permitir leitura de categorias" ON public.categorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de categorias" ON public.categorias;
CREATE POLICY "Permitir insercao de categorias" ON public.categorias FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de categorias" ON public.categorias;
CREATE POLICY "Permitir atualizacao de categorias" ON public.categorias FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir delecao de categorias" ON public.categorias;
CREATE POLICY "Permitir delecao de categorias" ON public.categorias FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir leitura de itens" ON public.itens_estoque;
CREATE POLICY "Permitir leitura de itens" ON public.itens_estoque FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de itens" ON public.itens_estoque;
CREATE POLICY "Permitir insercao de itens" ON public.itens_estoque FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de itens" ON public.itens_estoque;
CREATE POLICY "Permitir atualizacao de itens" ON public.itens_estoque FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir delecao de itens" ON public.itens_estoque;
CREATE POLICY "Permitir delecao de itens" ON public.itens_estoque FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir leitura de movimentacoes" ON public.movimentacoes_estoque;
CREATE POLICY "Permitir leitura de movimentacoes" ON public.movimentacoes_estoque FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de movimentacoes" ON public.movimentacoes_estoque;
CREATE POLICY "Permitir insercao de movimentacoes" ON public.movimentacoes_estoque FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 8. POLÍTICAS DE ARMAZENAMENTO DE ARQUIVOS (SUPABASE STORAGE)
-- =============================================================================

-- Criação do Bucket de Armazenamento para fotos e anexos de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estoque', 
  'estoque', 
  true, 
  5242880, -- Limite de 5MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880;

-- Nota: A tabela storage.objects já possui RLS ativado nativamente no Supabase.
-- Políticas de acesso ao bucket 'estoque':

-- Política 1: Permitir leitura e download público de arquivos do bucket 'estoque'
DROP POLICY IF EXISTS "Permitir visualizacao publica no bucket estoque" ON storage.objects;
CREATE POLICY "Permitir visualizacao publica no bucket estoque"
ON storage.objects FOR SELECT
USING (bucket_id = 'estoque');

-- Política 2: Permitir upload de imagens/arquivos no bucket 'estoque'
DROP POLICY IF EXISTS "Permitir upload no bucket estoque" ON storage.objects;
CREATE POLICY "Permitir upload no bucket estoque"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'estoque');

-- Política 3: Permitir atualização/substituição de arquivos no bucket 'estoque'
DROP POLICY IF EXISTS "Permitir atualizacao no bucket estoque" ON storage.objects;
CREATE POLICY "Permitir atualizacao no bucket estoque"
ON storage.objects FOR UPDATE
USING (bucket_id = 'estoque');

-- Política 4: Permitir exclusão de arquivos no bucket 'estoque'
DROP POLICY IF EXISTS "Permitir exclusao no bucket estoque" ON storage.objects;
CREATE POLICY "Permitir exclusao no bucket estoque"
ON storage.objects FOR DELETE
USING (bucket_id = 'estoque');

-- =============================================================================
-- 9. CARGA DE DADOS INICIAIS (CATEGORIAS PADRÃO)
-- =============================================================================
INSERT INTO public.categorias (nome, cor, descricao) VALUES
  ('Eletrônicos', '#3b82f6', 'Equipamentos e acessórios eletrônicos'),
  ('Alimentos & Bebidas', '#10b981', 'Perecíveis e mantimentos'),
  ('Material de Escritório', '#8b5cf6', 'Papelaria e organização'),
  ('Ferramentas', '#f59e0b', 'Manutenção e equipamentos'),
  ('Limpeza', '#06b6d4', 'Produtos de higienização')
ON CONFLICT (nome) DO NOTHING;
`;
}
