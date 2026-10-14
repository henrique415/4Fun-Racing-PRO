import React, { useState } from 'react';
import {
  Menu as MenuIcon,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Shield,
  Save,
  Type,
  LayoutGrid,
} from 'lucide-react';
import { MenuItem, ConfigTabConfig, SystemUiLabels, User } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudDatabaseService } from '../../services/cloudDatabase';
import { isSupreme } from '../../utils/permissions';

interface MenusSettingsTabProps {
  menus: MenuItem[];
  onSaveMenus: (menus: MenuItem[]) => void;
  currentUser: User | null;
  configTabs: ConfigTabConfig[];
  onSaveConfigTabs: (tabs: ConfigTabConfig[]) => void;
  uiLabels: SystemUiLabels;
  onSaveUiLabels: (labels: SystemUiLabels) => void;
  showNotification: (msg: string) => void;
}

export const MenusSettingsTab: React.FC<MenusSettingsTabProps> = ({
  menus,
  onSaveMenus,
  currentUser,
  configTabs,
  onSaveConfigTabs,
  uiLabels,
  onSaveUiLabels,
  showNotification,
}) => {
  const isUserSupreme = isSupreme(currentUser);

  // Local state for sidebar items
  const [localSidebar, setLocalSidebar] = useState<MenuItem[]>(menus);
  const [editingSidebarId, setEditingSidebarId] = useState<string | null>(null);
  const [tempSidebarLabel, setTempSidebarLabel] = useState('');

  // Local state for config tabs
  const [localConfigTabs, setLocalConfigTabs] = useState<ConfigTabConfig[]>(configTabs);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tempTabLabel, setTempTabLabel] = useState('');

  // Local state for UI labels
  const [localUiLabels, setLocalUiLabels] = useState<SystemUiLabels>(uiLabels);

  // Synchronize when props update (only if data actually changed)
  React.useEffect(() => {
    setLocalSidebar((prev) =>
      JSON.stringify(prev) === JSON.stringify(menus) ? prev : menus
    );
  }, [menus]);

  React.useEffect(() => {
    setLocalConfigTabs((prev) =>
      JSON.stringify(prev) === JSON.stringify(configTabs) ? prev : configTabs
    );
  }, [configTabs]);

  React.useEffect(() => {
    setLocalUiLabels((prev) =>
      JSON.stringify(prev) === JSON.stringify(uiLabels) ? prev : uiLabels
    );
  }, [uiLabels]);

  // ================= SIDEBAR MENUS HANDLERS =================
  const handleMoveSidebar = async (index: number, direction: 'up' | 'down') => {
    if (!isUserSupreme) return;
    const newItems = [...localSidebar];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reindexed = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    setLocalSidebar(reindexed);
    onSaveMenus(reindexed);
    StorageService.saveMenuItems(reindexed);
    await CloudDatabaseService.saveToCloud({ menuItems: reindexed });
    showNotification('Ordem dos menus da lateral salva e replicada!');
  };

  const handleStartEditSidebar = (item: MenuItem) => {
    if (!isUserSupreme) return;
    setEditingSidebarId(item.id);
    setTempSidebarLabel(item.label);
  };

  const handleSaveSidebarLabel = async (id: string) => {
    if (!tempSidebarLabel.trim()) return;
    const updated = localSidebar.map((item) =>
      item.id === id ? { ...item, label: tempSidebarLabel.trim() } : item
    );
    setLocalSidebar(updated);
    onSaveMenus(updated);
    StorageService.saveMenuItems(updated);
    await CloudDatabaseService.saveToCloud({ menuItems: updated });
    setEditingSidebarId(null);
    showNotification(`Menu renomeado para "${tempSidebarLabel.trim()}"!`);
  };

  const handleToggleSidebarVisibility = async (id: string) => {
    if (!isUserSupreme) return;
    const updated = localSidebar.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    setLocalSidebar(updated);
    onSaveMenus(updated);
    StorageService.saveMenuItems(updated);
    await CloudDatabaseService.saveToCloud({ menuItems: updated });
    showNotification('Visibilidade do menu alterada com sucesso!');
  };

  const handleResetSidebar = async () => {
    if (!isUserSupreme) return;
    const defaults = StorageService.getDefaultMenuItems();
    setLocalSidebar(defaults);
    onSaveMenus(defaults);
    StorageService.saveMenuItems(defaults);
    await CloudDatabaseService.saveToCloud({ menuItems: defaults });
    showNotification('Menus laterais restaurados para o padrão de fábrica.');
  };

  // ================= CONFIG TABS HANDLERS =================
  const handleMoveConfigTab = async (index: number, direction: 'up' | 'down') => {
    if (!isUserSupreme) return;
    const newItems = [...localConfigTabs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reindexed = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    setLocalConfigTabs(reindexed);
    onSaveConfigTabs(reindexed);
    StorageService.saveConfigTabs(reindexed);
    await CloudDatabaseService.saveToCloud({ configTabs: reindexed });
    showNotification('Ordem das abas de configuração salva e replicada para todos os tenants!');
  };

  const handleStartEditTab = (tab: ConfigTabConfig) => {
    if (!isUserSupreme) return;
    setEditingTabId(tab.id);
    setTempTabLabel(tab.label);
  };

  const handleSaveTabLabel = async (id: string) => {
    if (!tempTabLabel.trim()) return;
    const updated = localConfigTabs.map((item) =>
      item.id === id ? { ...item, label: tempTabLabel.trim() } : item
    );
    setLocalConfigTabs(updated);
    onSaveConfigTabs(updated);
    StorageService.saveConfigTabs(updated);
    await CloudDatabaseService.saveToCloud({ configTabs: updated });
    setEditingTabId(null);
    showNotification(`Aba renomeada para "${tempTabLabel.trim()}"!`);
  };

  const handleToggleTabVisibility = async (id: string) => {
    if (!isUserSupreme) return;
    // Don't allow hiding the "menus" tab itself to prevent lockout
    if (id === 'menus') {
      showNotification('A aba de Configurações de Menus não pode ser ocultada.');
      return;
    }

    const updated = localConfigTabs.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    setLocalConfigTabs(updated);
    onSaveConfigTabs(updated);
    StorageService.saveConfigTabs(updated);
    await CloudDatabaseService.saveToCloud({ configTabs: updated });
    showNotification('Visibilidade da aba de configuração atualizada!');
  };

  const handleResetConfigTabs = async () => {
    if (!isUserSupreme) return;
    const defaults = StorageService.getDefaultConfigTabs();
    setLocalConfigTabs(defaults);
    onSaveConfigTabs(defaults);
    StorageService.saveConfigTabs(defaults);
    await CloudDatabaseService.saveToCloud({ configTabs: defaults });
    showNotification('Abas de configuração restauradas para o padrão oficial.');
  };

  // ================= UI LABELS HANDLERS =================
  const handleSaveUiLabelsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserSupreme) return;

    onSaveUiLabels(localUiLabels);
    StorageService.saveUiLabels(localUiLabels);
    await CloudDatabaseService.saveToCloud({ systemUiLabels: localUiLabels });
    showNotification('Rótulos do sistema e títulos salvos e replicados globalmente!');
  };

  return (
    <div className="space-y-6">
      {/* SUPREME ADMIN CALLOUT */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Módulo de Configurações do Menu & Identidade Global</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                Apenas Supremo
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Alterações de nomes, ordem e visibilidade feitas pelo Administrador Supremo replicam instantaneamente para todos os tenants no banco de dados.
            </p>
          </div>
        </div>
      </div>

      {/* GRUPO 1: ABAS DO PAINEL DE ADMINISTRAÇÃO E CONFIGURAÇÃO GLOBAL */}
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-500" />
              <span>Menu do Painel de Administração & Configuração Global</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalize a ordem, renomeie ou oculte as 7 seções deste próprio painel de controle.
            </p>
          </div>

          {isUserSupreme && (
            <button
              onClick={handleResetConfigTabs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {localConfigTabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                tab.visible
                  ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-950/40 border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs flex items-center justify-center font-bold">
                  {tab.order}
                </span>

                {editingTabId === tab.id ? (
                  <div className="flex items-center space-x-2 flex-1 max-w-sm">
                    <input
                      type="text"
                      value={tempTabLabel}
                      onChange={(e) => setTempTabLabel(e.target.value)}
                      className="bg-zinc-900 border border-red-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none flex-1 font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveTabLabel(tab.id)}
                      className="p-1 rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{tab.label}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({tab.id})</span>
                    {!tab.visible && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900">
                        Oculto para Tenants
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isUserSupreme && (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleMoveConfigTab(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveConfigTab(index, 'down')}
                    disabled={index === localConfigTabs.length - 1}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleStartEditTab(tab)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    title="Renomear aba"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleTabVisibility(tab.id)}
                    disabled={tab.id === 'menus'}
                    className={`p-1.5 rounded-lg cursor-pointer transition ${
                      tab.visible
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-600'
                    }`}
                    title={tab.visible ? 'Ocultar aba para tenants' : 'Exibir aba'}
                  >
                    {tab.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GRUPO 2: MENUS DE NAVEGAÇÃO LATERAL (SIDEBAR) */}
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MenuIcon className="w-4 h-4 text-red-500" />
              <span>Menus de Navegação Lateral (Sidebar Principal)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Altere a ordem, ative/desative itens e renomeie os menus da barra lateral do sistema.
            </p>
          </div>

          {isUserSupreme && (
            <button
              onClick={handleResetSidebar}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {localSidebar.map((item, index) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                item.visible
                  ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-950/40 border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs flex items-center justify-center font-bold">
                  {item.order}
                </span>

                {editingSidebarId === item.id ? (
                  <div className="flex items-center space-x-2 flex-1 max-w-sm">
                    <input
                      type="text"
                      value={tempSidebarLabel}
                      onChange={(e) => setTempSidebarLabel(e.target.value)}
                      className="bg-zinc-900 border border-red-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none flex-1 font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveSidebarLabel(item.id)}
                      className="p-1 rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{item.label}</span>
                    {item.supremeOnly && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                        Exclusivo Supremo
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isUserSupreme && (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleMoveSidebar(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveSidebar(index, 'down')}
                    disabled={index === localSidebar.length - 1}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleStartEditSidebar(item)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    title="Renomear item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleSidebarVisibility(item.id)}
                    className={`p-1.5 rounded-lg cursor-pointer transition ${
                      item.visible
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-600'
                    }`}
                    title={item.visible ? 'Ocultar menu' : 'Exibir menu'}
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GRUPO 3: PERSONALIZAÇÃO DE TÍTULOS E BOTÕES (SYSTEM UI LABELS) */}
      {isUserSupreme && (
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-red-500" />
                <span>Personalização de Títulos e Botões do Sistema</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defina os textos padrão de páginas e botões principais que aparecem para todos os usuários e tenants.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveUiLabelsForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Título da Classificação Geral
                </label>
                <input
                  type="text"
                  value={localUiLabels.standingsTitle}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, standingsTitle: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Título de Etapas & Calendário
                </label>
                <input
                  type="text"
                  value={localUiLabels.racesTitle}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, racesTitle: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Título de Pilotos & Equipes
                </label>
                <input
                  type="text"
                  value={localUiLabels.driversTitle}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, driversTitle: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Rótulo do Botão "Novo Campeonato"
                </label>
                <input
                  type="text"
                  value={localUiLabels.btnNewChampionship}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, btnNewChampionship: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Rótulo do Botão "Exportar Relatório PDF"
                </label>
                <input
                  type="text"
                  value={localUiLabels.btnExportPdf}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, btnExportPdf: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Rótulo do Botão "Editar Regras" (Cabeçalho & Visão Geral)
                </label>
                <input
                  type="text"
                  value={localUiLabels.editRulesButton || 'Editar Regras'}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, editRulesButton: e.target.value })
                  }
                  placeholder="Ex: Editar Regras / Regulamento"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Rótulo do Botão "Cadastrar Piloto"
                </label>
                <input
                  type="text"
                  value={localUiLabels.btnNewDriver}
                  onChange={(e) =>
                    setLocalUiLabels({ ...localUiLabels, btnNewDriver: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-950/40 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar & Replicar Rótulos Globalmente</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
