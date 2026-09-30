import React, { useState } from 'react';
import { X, FolderKanban, Plus, Trash2, Tag } from 'lucide-react';
import { Categoria, EstoqueItem } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categoria[];
  items: EstoqueItem[];
  onAddCategory: (category: Omit<Categoria, 'id'>) => Promise<void>;
  onDeleteCategory: (id: string, name: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  items,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }

    if (categories.some((c) => c.nome.toLowerCase() === newCatName.trim().toLowerCase())) {
      setError('Já existe uma categoria com esse nome.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAddCategory({
        nome: newCatName.trim(),
        descricao: newCatDesc.trim(),
        cor: selectedColor,
      });
      setNewCatName('');
      setNewCatDesc('');
    } catch (err: any) {
      setError(err?.message || 'Erro ao adicionar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = (categoryName: string) => {
    return items.filter((i) => i.categoria === categoryName).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Gerenciar Categorias</h3>
              <p className="text-xs text-slate-400">
                Organize seu estoque por grupos de produtos
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

        <div className="p-6 space-y-6">
          {/* Adicionar Nova Categoria */}
          <form onSubmit={handleAdd} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Nova Categoria
            </h4>

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Utilidades, Embalagens..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        selectedColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Descrição Breve (Opcional)
              </label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Ex: Insumos de produção e caixas de papelão"
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Categoria</span>
            </button>
          </form>

          {/* Lista de Categorias Existentes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Categorias Cadastradas ({categories.length})
            </h4>

            <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const count = getItemCount(cat.nome);
                return (
                  <div
                    key={cat.id}
                    className="py-2.5 flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.cor || '#3b82f6' }}
                      />
                      <div>
                        <div className="font-medium text-slate-200">{cat.nome}</div>
                        {cat.descricao && (
                          <div className="text-[11px] text-slate-500">{cat.descricao}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {count} {count === 1 ? 'item' : 'itens'}
                      </span>

                      <button
                        onClick={() => {
                          if (count > 0) {
                            if (!window.confirm(`Esta categoria possui ${count} produtos vinculados. Deseja realmente excluí-la?`)) {
                              return;
                            }
                          }
                          onDeleteCategory(cat.id, cat.nome);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
