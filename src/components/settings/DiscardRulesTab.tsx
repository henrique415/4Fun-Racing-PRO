import React, { useState } from 'react';
import {
  Flag,
  Plus,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  Building2,
  Filter,
  Save,
} from 'lucide-react';
import { DiscardOption, Tenant } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudDatabaseService } from '../../services/cloudDatabase';

interface DiscardRulesTabProps {
  discardOptions: DiscardOption[];
  onSaveDiscardOptions: (options: DiscardOption[]) => void;
  tenants: Tenant[];
  activeTenant?: Tenant;
  showNotification: (msg: string) => void;
}

export const DiscardRulesTab: React.FC<DiscardRulesTabProps> = ({
  discardOptions,
  onSaveDiscardOptions,
  tenants,
  activeTenant,
  showNotification,
}) => {
  const [filterTenant, setFilterTenant] = useState<string>(activeTenant?.id || 'all');
  const [newCount, setNewCount] = useState<number>(1);
  const [newLabel, setNewLabel] = useState<string>('Descartar 1 Pior');
  const [newTenantId, setNewTenantId] = useState<string>(activeTenant?.id || 'all');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCount, setEditCount] = useState(0);

  const scopedOptions = discardOptions.filter((opt) => {
    if (filterTenant === 'all') return true;
    if (!opt.tenantId || opt.tenantId === 'all') return true;
    return opt.tenantId === filterTenant;
  });

  const handleToggle = async (id: string) => {
    const updated = discardOptions.map((opt) =>
      opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
    );
    onSaveDiscardOptions(updated);
    StorageService.saveDiscardOptions(updated);
    await CloudDatabaseService.saveToCloud({ discardOptions: updated });
    showNotification('Regra de descarte atualizada!');
  };

  const handleStartEdit = (opt: DiscardOption) => {
    setEditingId(opt.id);
    setEditLabel(opt.label);
    setEditCount(opt.count);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    const updated = discardOptions.map((opt) =>
      opt.id === id ? { ...opt, label: editLabel.trim(), count: editCount } : opt
    );
    onSaveDiscardOptions(updated);
    StorageService.saveDiscardOptions(updated);
    await CloudDatabaseService.saveToCloud({ discardOptions: updated });
    setEditingId(null);
    showNotification('Regra de descarte salva com sucesso!');
  };

  const handleDelete = async (id: string) => {
    const updated = discardOptions.filter((opt) => opt.id !== id);
    onSaveDiscardOptions(updated);
    StorageService.saveDiscardOptions(updated);
    await CloudDatabaseService.saveToCloud({ discardOptions: updated });
    showNotification('Regra de descarte removida.');
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const newOption: DiscardOption = {
      id: `discard-${Date.now()}`,
      count: newCount,
      label: newLabel.trim(),
      enabled: true,
      tenantId: newTenantId === 'all' ? undefined : newTenantId,
    };

    const updated = [...discardOptions, newOption];
    onSaveDiscardOptions(updated);
    StorageService.saveDiscardOptions(updated);
    await CloudDatabaseService.saveToCloud({ discardOptions: updated });

    setNewLabel('Descartar 1 Pior');
    setNewCount(1);
    showNotification(`Regra "${newOption.label}" adicionada com sucesso!`);
  };

  const handleReset = async () => {
    const defaults = StorageService.getDefaultDiscardOptions();
    onSaveDiscardOptions(defaults);
    StorageService.saveDiscardOptions(defaults);
    await CloudDatabaseService.saveToCloud({ discardOptions: defaults });
    showNotification('Regras de descarte restauradas para o padrão.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              <span>Regras de Descarte de Piores Resultados</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Defina as opções de descarte de etapas nos campeonatos (globais ou específicas por produtora).
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        {/* Tenant Filter */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400 font-semibold">Filtrar por Produtora:</span>
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">Todas as Regras (Globais e Produtoras)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-400">
            {scopedOptions.length} regra(s) disponível(is)
          </span>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {scopedOptions.map((opt) => (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                opt.enabled ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-950/40 border-zinc-900 opacity-60'
              }`}
            >
              <div>
                {editingId === opt.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full bg-zinc-900 border border-red-500 rounded-lg p-1.5 text-xs text-white font-bold"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-zinc-400">Descartes:</span>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={editCount}
                        onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg p-1 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="flex justify-end space-x-1.5 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(opt.id)}
                        className="px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-bold"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-sm block">{opt.label}</span>
                      {opt.tenantId && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/40 font-bold">
                          {tenants.find((t) => t.id === opt.tenantId)?.name || 'Produtora'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block">
                      {opt.count === 0 ? 'Soma integral' : `Desconsidera ${opt.count} pior(es) etapa(s)`}
                    </span>
                  </div>
                )}
              </div>

              {editingId !== opt.id && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <button
                    onClick={() => handleToggle(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                      opt.enabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                  >
                    {opt.enabled ? 'Ativa' : 'Inativa'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartEdit(opt)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                      title="Editar regra"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {opt.id.startsWith('discard-') && (
                      <button
                        onClick={() => handleDelete(opt.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                        title="Excluir regra"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Discard Option */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-end gap-3">
          <div className="w-24">
            <label className="block text-[11px] text-zinc-400 font-bold mb-1">
              Qtd. Descartes
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={newCount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setNewCount(val);
                setNewLabel(val === 0 ? 'Sem Descarte' : `Descartar ${val} Pior${val > 1 ? 'es' : ''}`);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500 font-bold text-center"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[11px] text-zinc-400 font-bold mb-1">
              Rótulo Visual da Regra
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="w-48">
            <label className="block text-[11px] text-zinc-400 font-bold mb-1">
              Vincular a Produtora
            </label>
            <select
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">🌐 Global (Todas)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAdd}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Regra</span>
          </button>
        </div>
      </div>
    </div>
  );
};
