import React from 'react';
import { Search, X, LayoutGrid, List, Download, SlidersHorizontal } from 'lucide-react';
import { Categoria, EstoqueItem } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: Categoria[];
  items: EstoqueItem[];
  statusFilter: 'all' | 'normal' | 'low' | 'zero';
  onStatusFilterChange: (status: 'all' | 'normal' | 'low' | 'zero') => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onExportCsv: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  items,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onExportCsv,
}) => {
  // Contadores por categoria
  const getCategoryCount = (categoryName: string) => {
    return items.filter((i) => i.categoria === categoryName).length;
  };

  return (
    <div className="space-y-3">
      {/* Barra principal de busca e ferramentas */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome do item, SKU ou observação..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 rounded-lg pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filters & View Mode */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => onStatusFilterChange('normal')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'normal'
                  ? 'bg-slate-800 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OK
            </button>
            <button
              onClick={() => onStatusFilterChange('low')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'low'
                  ? 'bg-amber-950/60 text-amber-300 font-medium border border-amber-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Baixo ({items.filter((i) => i.quantidade > 0 && i.quantidade <= i.estoque_minimo).length})
            </button>
            <button
              onClick={() => onStatusFilterChange('zero')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'zero'
                  ? 'bg-rose-950/60 text-rose-300 font-medium border border-rose-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Zerado ({items.filter((i) => i.quantidade === 0).length})
            </button>
          </div>

          {/* Table vs Grid toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Exportar inventário para CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Categorias - Seleção Horizontal Limpa */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" /> Categorias:
        </span>
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
          }`}
        >
          Todas as Categorias
        </button>

        {categories.map((cat) => {
          const count = getCategoryCount(cat.nome);
          const isSelected = selectedCategory === cat.nome;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.nome)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border border-slate-600 shadow-xs'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.cor || '#3b82f6' }}
              />
              <span>{cat.nome}</span>
              <span className="text-[10px] text-slate-500 ml-0.5">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
