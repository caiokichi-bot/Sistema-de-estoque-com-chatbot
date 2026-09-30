import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { EstoqueItem } from '../types';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EstoqueItem | null;
  onConfirm: (item: EstoqueItem, newQuantity: number, reason: string) => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
}) => {
  const [type, setType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState('Compra de Reposição');
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  const currentQty = item.quantidade;
  let simulatedQty = currentQty;
  if (type === 'entrada') simulatedQty = currentQty + amount;
  if (type === 'saida') simulatedQty = Math.max(0, currentQty - amount);
  if (type === 'ajuste') simulatedQty = Math.max(0, amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = `${type.toUpperCase()}: ${reason}${notes ? ` - ${notes}` : ''}`;
    onConfirm(item, simulatedQty, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-100">Movimentação de Estoque</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{item.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Movimentação */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('entrada');
                setReason('Compra de Fornecedor');
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                type === 'entrada'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mb-1 text-emerald-400" />
              <span>Entrada (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('saida');
                setReason('Venda / Saída de Estoque');
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                type === 'saida'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 mb-1 text-rose-400" />
              <span>Saída (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('ajuste');
                setAmount(currentQty);
                setReason('Balanço / Inventário');
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                type === 'ajuste'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4 mb-1 text-blue-400" />
              <span>Ajustar Balanço</span>
            </button>
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {type === 'ajuste' ? 'Nova Quantidade Absoluta' : 'Quantidade a Movimentar'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              />
              <span className="text-xs text-slate-400 font-mono px-2">
                {item.unidade}
              </span>
            </div>
          </div>

          {/* Comparativo Visual */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Atual:</span>
              <span className="font-semibold text-slate-300">{currentQty} {item.unidade}</span>
            </div>
            <div className="text-slate-600 font-bold">→</div>
            <div>
              <span className="text-slate-500 block">Resultado:</span>
              <span className={`font-bold text-sm ${simulatedQty <= item.estoque_minimo ? 'text-amber-400' : 'text-emerald-400'}`}>
                {simulatedQty} {item.unidade}
              </span>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo da Movimentação
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
            >
              {type === 'entrada' && (
                <>
                  <option value="Compra de Reposição">Compra de Reposição</option>
                  <option value="Devolução de Cliente">Devolução de Cliente</option>
                  <option value="Bonificação / Brinde">Bonificação / Brinde</option>
                  <option value="Transferência entre Filiais">Transferência entre Filiais</option>
                </>
              )}
              {type === 'saida' && (
                <>
                  <option value="Venda ao Cliente">Venda ao Cliente</option>
                  <option value="Consumo Interno">Consumo Interno</option>
                  <option value="Perda / Danificado">Perda / Danificado</option>
                  <option value="Devolução ao Fornecedor">Devolução ao Fornecedor</option>
                  <option value="Descarte / Vencido">Descarte / Vencido</option>
                </>
              )}
              {type === 'ajuste' && (
                <>
                  <option value="Balanço Físico de Inventário">Balanço Físico de Inventário</option>
                  <option value="Correção de Erro de Lançamento">Correção de Erro de Lançamento</option>
                </>
              )}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nota Fiscal / Observação Adicional
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: NF 14209 ou Lote A"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
