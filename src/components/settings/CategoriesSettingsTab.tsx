import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  Building2,
  Filter,
  Save,
} from 'lucide-react';
import { Category, Driver, Tenant } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudDatabaseService } from '../../services/cloudDatabase';

interface CategoriesSettingsTabProps {
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
  drivers: Driver[];
  tenants: Tenant[];
  activeTenant?: Tenant;
  showNotification: (msg: string) => void;
  showErrorNotification: (msg: string) => void;
}

export const CategoriesSettingsTab: React.FC<CategoriesSettingsTabProps> = ({
  categories,
  onSaveCategories,
  drivers,
  tenants,
  activeTenant,
  showNotification,
  showErrorNotification,
}) => {
  const [filterTenant, setFilterTenant] = useState<string>(activeTenant?.id || 'all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTenantId, setNewTenantId] = useState<string>(activeTenant?.id || 'all');

  // Edit category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const scopedCategories = categories.filter((cat) => {
    if (filterTenant === 'all') return true;
    if (!cat.tenantId || cat.tenantId === 'all') return true;
    return cat.tenantId === filterTenant;
  });

  const handleAddCategory = async () => {
    if (!newName.trim()) {
      showErrorNotification('O nome da categoria é obrigatório.');
      return;
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      tenantId: newTenantId === 'all' ? undefined : newTenantId,
    };

    const updated = [...categories, newCategory];
    onSaveCategories(updated);
    StorageService.saveCategories(updated);
    await CloudDatabaseService.saveToCloud({ categories: updated });

    setNewName('');
    setNewDesc('');
    setShowNewForm(false);
    showNotification(`Categoria "${newCategory.name}" criada com sucesso!`);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name: editName.trim(), description: editDesc.trim() } : c
    );
    onSaveCategories(updated);
    StorageService.saveCategories(updated);
    await CloudDatabaseService.saveToCloud({ categories: updated });

    setEditingId(null);
    showNotification(`Categoria atualizada com sucesso!`);
  };

  const handleDeleteCategory = async (catId: string) => {
    const driversInCat = drivers.filter((d) => d.categoryId === catId);
    if (driversInCat.length > 0) {
      showErrorNotification(
        `Não é possível excluir esta categoria pois existem ${driversInCat.length} piloto(s) vinculados a ela.`
      );
      return;
    }

    if (categories.length <= 1) {
      showErrorNotification('O sistema precisa de pelo menos 1 categoria ativa.');
      return;
    }

    const updated = categories.filter((c) => c.id !== catId);
    onSaveCategories(updated);
    StorageService.saveCategories(updated);
    await CloudDatabaseService.saveToCloud({ categories: updated });
    showNotification('Categoria excluída com sucesso.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-red-500" />
              <span>Categorias do Grid & Divisões</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Defina as categorias e divisões de peso (Graduados, Light, Novatos, Master 95kg, Pesados).
            </p>
          </div>

          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Categoria</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400 font-semibold">Filtrar por Produtora:</span>
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">Todas as Categorias</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-400">
            {scopedCategories.length} categoria(s) cadastrada(s)
          </span>
        </div>

        {/* New Category Form Inline */}
        {showNewForm && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/40 mb-4 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-white">Criar Nova Categoria</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nome da Categoria (Ex: Master 95kg)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Descrição / Regra (Ex: Pilotos acima de 95kg)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <select
                value={newTenantId}
                onChange={(e) => setNewTenantId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="all">🌐 Global (Todas)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Salvar Categoria
              </button>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scopedCategories.map((cat) => {
            const driversInCat = drivers.filter((d) => d.categoryId === cat.id).length;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  {editingId === cat.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-zinc-900 border border-red-500 rounded-lg p-1.5 text-xs text-white font-bold"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 text-xs text-zinc-300"
                      />
                      <div className="flex justify-end space-x-1.5 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-bold"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-white text-sm">{cat.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold">
                          {driversInCat} Piloto(s)
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{cat.description || 'Categoria oficial'}</p>
                      {cat.tenantId && (
                        <span className="inline-block mt-2 text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 text-red-400 border border-red-950 font-bold">
                          {tenants.find((t) => t.id === cat.tenantId)?.name || 'Produtora'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {editingId !== cat.id && (
                  <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-zinc-900">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
