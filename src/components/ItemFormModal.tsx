import React, { useState, useEffect } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { EstoqueItem, Categoria } from '../types';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<EstoqueItem, 'id'> | EstoqueItem) => void;
  editingItem: EstoqueItem | null;
  categories: Categoria[];
  onAddNewCategory: (name: string) => Promise<void>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  categories,
  onAddNewCategory,
}) => {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(5);
  const [preco, setPreco] = useState<number>(0);
  const [unidade, setUnidade] = useState('un');
  const [sku, setSku] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setNome(editingItem.nome || '');
      setCategoria(editingItem.categoria || (categories[0]?.nome ?? 'Geral'));
      setQuantidade(editingItem.quantidade || 0);
      setEstoqueMinimo(editingItem.estoque_minimo || 5);
      setPreco(editingItem.preco || 0);
      setUnidade(editingItem.unidade || 'un');
      setSku(editingItem.sku || '');
      setObservacoes(editingItem.observacoes || '');
    } else {
      setNome('');
      setCategoria(categories[0]?.nome || 'Geral');
      setQuantidade(0);
      setEstoqueMinimo(5);
      setPreco(0);
      setUnidade('un');
      setSku('');
      setObservacoes('');
    }
    setError('');
    setIsCreatingNewCat(false);
    setNewCatName('');
  }, [editingItem, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome do item é obrigatório.');
      return;
    }

    let finalCategory = categoria;
    if (isCreatingNewCat && newCatName.trim()) {
      await onAddNewCategory(newCatName.trim());
      finalCategory = newCatName.trim();
    }

    if (!finalCategory) {
      setError('Selecione ou crie uma categoria.');
      return;
    }

    if (editingItem) {
      onSave({
        ...editingItem,
        nome: nome.trim(),
        categoria: finalCategory,
        quantidade: Number(quantidade) || 0,
        estoque_minimo: Number(estoqueMinimo) || 0,
        preco: Number(preco) || 0,
        unidade: unidade.trim() || 'un',
        sku: sku.trim(),
        observacoes: observacoes.trim(),
      });
    } else {
      onSave({
        nome: nome.trim(),
        categoria: finalCategory,
        quantidade: Number(quantidade) || 0,
        estoque_minimo: Number(estoqueMinimo) || 0,
        preco: Number(preco) || 0,
        unidade: unidade.trim() || 'un',
        sku: sku.trim(),
        observacoes: observacoes.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">
                {editingItem ? 'Editar Item de Estoque' : 'Cadastrar Novo Item'}
              </h3>
              <p className="text-xs text-slate-400">
                Preencha os dados do produto para sincronizar no inventário
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Nome do Item */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Item <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Teclado Mecânico RGB, Arroz Tipo 1..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Categoria <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewCat(!isCreatingNewCat)}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                {isCreatingNewCat ? 'Escolher existente' : '+ Nova Categoria'}
              </button>
            </div>

            {isCreatingNewCat ? (
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Digite o nome da nova categoria..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none"
              />
            ) : (
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantidade e Estoque Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantidade Atual
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estoque Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Preço e Unidade de Medida */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unidade de Medida
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              >
                <option value="un">un (Unidade)</option>
                <option value="cx">cx (Caixa)</option>
                <option value="pct">pct (Pacote)</option>
                <option value="kg">kg (Quilograma)</option>
                <option value="g">g (Grama)</option>
                <option value="l">l (Litro)</option>
                <option value="ml">ml (Mililitro)</option>
                <option value="m">m (Metro)</option>
                <option value="resma">resma (Resma)</option>
                <option value="kit">kit (Kit)</option>
              </select>
            </div>
          </div>

          {/* SKU / Código de Barras */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Código SKU / Referência
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ex: ELE-KB-001"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações / Detalhes
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Fornecedor, localização na prateleira, garantia..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
            >
              {editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
