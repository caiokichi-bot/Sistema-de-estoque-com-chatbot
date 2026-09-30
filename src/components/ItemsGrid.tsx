import React from 'react';
import { Edit2, Trash2, Plus, Minus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { EstoqueItem, Categoria } from '../types';

interface ItemsGridProps {
  items: EstoqueItem[];
  categories: Categoria[];
  onEdit: (item: EstoqueItem) => void;
  onDelete: (id: string, nome: string) => void;
  onQuickQuantityChange: (item: EstoqueItem, delta: number) => void;
  onOpenMovementModal: (item: EstoqueItem) => void;
}

export const ItemsGrid: React.FC<ItemsGridProps> = ({
  items,
  categories,
  onEdit,
  onDelete,
  onQuickQuantityChange,
  onOpenMovementModal,
}) => {
  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find((c) => c.nome.toLowerCase() === categoryName.toLowerCase());
    return cat?.cor || '#64748b';
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-sm text-slate-400">Nenhum item encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const catColor = getCategoryColor(item.categoria);
        const isZero = item.quantidade === 0;
        const isLow = !isZero && item.quantidade <= item.estoque_minimo;
        const totalVal = item.quantidade * item.preco;
        const percentage = item.estoque_minimo > 0 ? Math.min(100, Math.round((item.quantidade / (item.estoque_minimo * 2)) * 100)) : 100;

        return (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
          >
            <div>
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catColor }}
                  />
                  <span>{item.categoria}</span>
                </div>
                <div>
                  {isZero ? (
                    <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Esgotado
                    </span>
                  ) : isLow ? (
                    <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Baixo Estoque
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  )}
                </div>
              </div>

              {/* Nome do Item e SKU */}
              <h4 className="font-semibold text-slate-100 text-sm">{item.nome}</h4>
              {item.sku && (
                <span className="text-[11px] font-mono text-slate-500">
                  SKU: {item.sku}
                </span>
              )}
              {item.observacoes && (
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {item.observacoes}
                </p>
              )}
            </div>

            {/* Barra de Estoque vs Mínimo */}
            <div className="my-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">
                    {item.quantidade} <span className="text-xs font-normal text-slate-400">{item.unidade}</span>
                  </span>
                  <div className="flex items-center border border-slate-700 rounded bg-slate-950 overflow-hidden">
                    <button
                      onClick={() => onQuickQuantityChange(item, -1)}
                      disabled={item.quantidade <= 0}
                      className="p-1 hover:bg-slate-800 disabled:opacity-30 text-slate-400 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onQuickQuantityChange(item, 1)}
                      className="p-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isZero ? 'bg-rose-500 w-0' : isLow ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                <span>Mínimo: {item.estoque_minimo} {item.unidade}</span>
                <button
                  onClick={() => onOpenMovementModal(item)}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  Movimentar
                </button>
              </div>
            </div>

            {/* Preço e Ações */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">Valor Unitário</div>
                <div className="text-xs font-mono font-medium text-slate-200">
                  {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(item.id, item.nome)}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
