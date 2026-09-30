import React from 'react';
import { Package, AlertTriangle, Boxes, DollarSign, Layers } from 'lucide-react';
import { EstoqueItem, Categoria } from '../types';

interface StatsCardsProps {
  items: EstoqueItem[];
  categories: Categoria[];
  onFilterLowStock: () => void;
  onFilterZeroStock: () => void;
  onClearFilter: () => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  items,
  categories,
  onFilterLowStock,
  onFilterZeroStock,
  onClearFilter,
  activeFilter,
}) => {
  const totalItemsCount = items.length;
  const totalUnits = items.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0);
  const totalValue = items.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0) * (Number(curr.preco) || 0), 0);

  const lowStockCount = items.filter((item) => item.quantidade > 0 && item.quantidade <= item.estoque_minimo).length;
  const zeroStockCount = items.filter((item) => item.quantidade === 0).length;
  const criticalTotal = lowStockCount + zeroStockCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total de Produtos Cadastrados */}
      <div 
        onClick={onClearFilter}
        className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer ${
          activeFilter === 'all'
            ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Produtos</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-emerald-400">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalItemsCount}</span>
          <span className="text-xs text-slate-400">itens cadastrados</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Distribuídos em {categories.length} categorias</span>
        </div>
      </div>

      {/* 2. Unidades em Estoque */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Volume Físico</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-blue-400">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalUnits.toLocaleString('pt-BR')}</span>
          <span className="text-xs text-slate-400">unidades totais</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Média de {(totalItemsCount ? (totalUnits / totalItemsCount).toFixed(1) : 0)} un. por produto
        </div>
      </div>

      {/* 3. Valor Total em Estoque */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Valor do Inventário</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400 tracking-tight">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Calculado com base no preço cadastrado
        </div>
      </div>

      {/* 4. Alertas de Reposição */}
      <div
        onClick={criticalTotal > 0 ? (lowStockCount > 0 ? onFilterLowStock : onFilterZeroStock) : undefined}
        className={`bg-slate-900 border rounded-xl p-4 transition-all ${
          criticalTotal > 0 ? 'cursor-pointer hover:border-amber-600/70' : ''
        } ${
          activeFilter === 'low' || activeFilter === 'zero'
            ? 'border-amber-500/80 ring-1 ring-amber-500/30'
            : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Atenção ao Estoque</span>
          <div className={`p-2 rounded-lg ${criticalTotal > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${criticalTotal > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {criticalTotal}
          </span>
          <span className="text-xs text-slate-400">produtos críticos</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
          <span className="text-amber-300 font-medium">{lowStockCount} abaixo do mín.</span>
          <span>·</span>
          <span className="text-rose-400 font-medium">{zeroStockCount} zerados</span>
        </div>
      </div>
    </div>
  );
};
