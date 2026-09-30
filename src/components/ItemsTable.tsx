import React from 'react';
import { Edit2, Trash2, Plus, Minus, AlertCircle, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';
import { EstoqueItem, Categoria } from '../types';

interface ItemsTableProps {
  items: EstoqueItem[];
  categories: Categoria[];
  onEdit: (item: EstoqueItem) => void;
  onDelete: (id: string, nome: string) => void;
  onQuickQuantityChange: (item: EstoqueItem, delta: number) => void;
  onOpenMovementModal: (item: EstoqueItem) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
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
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-medium text-slate-200">Nenhum item encontrado</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
          Nenhum produto corresponde aos filtros ou pesquisa selecionados. Tente alterar os termos ou adicione um novo item.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="py-3 px-4">Item & Identificação</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Quantidade</th>
              <th className="py-3 px-4">Preço Unitário</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {items.map((item) => {
              const catColor = getCategoryColor(item.categoria);
              const isZero = item.quantidade === 0;
              const isLow = !isZero && item.quantidade <= item.estoque_minimo;
              const totalVal = item.quantidade * item.preco;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Nome e SKU */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{item.nome}</span>
                      {item.sku && (
                        <span className="text-[11px] font-mono font-normal text-slate-400">
                          [{item.sku}]
                        </span>
                      )}
                    </div>
                    {item.observacoes && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.observacoes}
                      </p>
                    )}
                  </td>

                  {/* Categoria */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-200">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span>{item.categoria}</span>
                    </span>
                  </td>

                  {/* Quantidade com Stepper Rápido */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-700 rounded-md bg-slate-950/60 overflow-hidden">
                        <button
                          onClick={() => onQuickQuantityChange(item, -1)}
                          disabled={item.quantidade <= 0}
                          className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-200 cursor-pointer"
                          title="Diminuir 1 unidade"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-semibold text-white min-w-[2.5rem] text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => onQuickQuantityChange(item, 1)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                          title="Aumentar 1 unidade"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs text-slate-400">{item.unidade}</span>

                      {/* Botão de movimentação detalhada */}
                      <button
                        onClick={() => onOpenMovementModal(item)}
                        className="text-xs text-slate-500 hover:text-emerald-400 underline ml-1 cursor-pointer"
                        title="Registrar entrada ou saída"
                      >
                        Ajustar
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Mínimo: {item.estoque_minimo} {item.unidade}
                    </div>
                  </td>

                  {/* Preço Unitário */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                    {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>

                  {/* Valor Total */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-200 font-mono font-medium text-xs">
                    {totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {isZero ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Esgotado</span>
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Estoque Baixo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Normal</span>
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id, item.nome)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Excluir item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
