import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { ItemsTable } from './components/ItemsTable';
import { ItemsGrid } from './components/ItemsGrid';
import { ItemFormModal } from './components/ItemFormModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MovementModal } from './components/MovementModal';
import { SupabaseModal } from './components/SupabaseModal';
import { FloatingChatbot } from './components/FloatingChatbot';
import { EstoqueItem, Categoria } from './types';
import { 
  fetchStockData, 
  addStockItem, 
  updateStockItem, 
  deleteStockItem, 
  addCategory, 
  deleteCategory,
  getSupabaseCredentials
} from './lib/supabase';
import { getGroqSettings } from './lib/groq';

export default function App() {
  const [items, setItems] = useState<EstoqueItem[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'low' | 'zero'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movingItem, setMovingItem] = useState<EstoqueItem | null>(null);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchStockData();
      setItems(data.items);
      setCategories(data.categories);
      setIsSupabaseConnected(data.isSupabase);
      if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Items Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search filter
      const matchesSearch =
        !searchQuery ||
        item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.observacoes && item.observacoes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.categoria.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && item.categoria.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 3. Status filter
      if (statusFilter === 'zero') {
        return item.quantidade === 0;
      }
      if (statusFilter === 'low') {
        return item.quantidade > 0 && item.quantidade <= item.estoque_minimo;
      }
      if (statusFilter === 'normal') {
        return item.quantidade > item.estoque_minimo;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, statusFilter]);

  // Handlers for Items
  const handleSaveItem = async (itemData: Omit<EstoqueItem, 'id'> | EstoqueItem) => {
    try {
      if ('id' in itemData && itemData.id) {
        await updateStockItem(itemData as EstoqueItem);
      } else {
        await addStockItem(itemData);
      }
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar item:', err);
    }
  };

  const handleDeleteItem = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir "${nome}" do estoque?`)) {
      return;
    }
    try {
      await deleteStockItem(id);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao deletar item:', err);
    }
  };

  const handleQuickQuantityChange = async (item: EstoqueItem, delta: number) => {
    const newQty = Math.max(0, item.quantidade + delta);
    const updated = { ...item, quantidade: newQty };
    // Optimistic UI update
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    await updateStockItem(updated);
  };

  const handleMovementConfirm = async (item: EstoqueItem, newQuantity: number) => {
    const updated = { ...item, quantidade: newQuantity };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    await updateStockItem(updated);
  };

  // Handlers for Categories
  const handleAddCategory = async (categoryData: Omit<Categoria, 'id'>) => {
    await addCategory(categoryData);
    await loadData();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    await deleteCategory(id, name);
    await loadData();
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (items.length === 0) return;

    const headers = ['ID', 'Nome', 'Categoria', 'Quantidade', 'Unidade', 'Estoque Minimo', 'Preco Unitario', 'Valor Total', 'SKU', 'Observacoes'];
    const rows = items.map((item) => [
      `"${item.id}"`,
      `"${item.nome.replace(/"/g, '""')}"`,
      `"${item.categoria.replace(/"/g, '""')}"`,
      item.quantidade,
      `"${item.unidade}"`,
      item.estoque_minimo,
      item.preco.toFixed(2),
      (item.quantidade * item.preco).toFixed(2),
      `"${(item.sku || '').replace(/"/g, '""')}"`,
      `"${(item.observacoes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estoque_stockmaster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groqSettings = getGroqSettings();
  const isGroqConfigured = Boolean(groqSettings.apiKey && groqSettings.apiKey.startsWith('gsk_'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation */}
      <Navbar
        isSupabaseConnected={isSupabaseConnected}
        isGroqConfigured={isGroqConfigured}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenNewItemModal={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 text-xs text-rose-300 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:underline cursor-pointer ml-2"
            >
              Dispensar
            </button>
          </div>
        )}

        {/* Stats Metrics Cards */}
        <StatsCards
          items={items}
          categories={categories}
          activeFilter={statusFilter}
          onFilterLowStock={() => setStatusFilter('low')}
          onFilterZeroStock={() => setStatusFilter('zero')}
          onClearFilter={() => setStatusFilter('all')}
        />

        {/* Search, Categories and View Controls */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categories}
          items={items}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExportCsv={handleExportCsv}
        />

        {/* Inventory View (Table or Grid) */}
        {viewMode === 'table' ? (
          <ItemsTable
            items={filteredItems}
            categories={categories}
            onEdit={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDelete={handleDeleteItem}
            onQuickQuantityChange={handleQuickQuantityChange}
            onOpenMovementModal={(item) => {
              setMovingItem(item);
              setIsMovementModalOpen(true);
            }}
          />
        ) : (
          <ItemsGrid
            items={filteredItems}
            categories={categories}
            onEdit={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDelete={handleDeleteItem}
            onQuickQuantityChange={handleQuickQuantityChange}
            onOpenMovementModal={(item) => {
              setMovingItem(item);
              setIsMovementModalOpen(true);
            }}
          />
        )}

        {/* Subtle Footer */}
        <footer className="pt-6 pb-4 text-center text-xs text-slate-600 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockMaster &middot; Controle de Estoque &amp; IA</span>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-[11px]"
          >
            Configurações do Banco de Dados
          </button>
        </footer>
      </main>

      {/* Floating Groq Chatbot Agent */}
      <FloatingChatbot items={items} categories={categories} />

      {/* Item Form Modal (Add / Edit) */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
        categories={categories}
        onAddNewCategory={async (catName) => {
          await handleAddCategory({ nome: catName, cor: '#3b82f6' });
        }}
      />

      {/* Categories Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        items={items}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Stock Movement Modal */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        item={movingItem}
        onConfirm={handleMovementConfirm}
      />

      {/* Supabase Settings Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isCurrentlyConnected={isSupabaseConnected}
        onConnected={() => loadData()}
      />
    </div>
  );
}
