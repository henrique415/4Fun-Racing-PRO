import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Building2,
  Menu as MenuIcon,
  Flag,
  Tag,
  Database,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trophy,
} from 'lucide-react';
import {
  MenuItemConfig,
  DiscardOptionConfig,
  Category,
  Driver,
  Championship,
  User,
  Tenant,
  ConfigTabConfig,
  SystemUiLabels,
} from '../types';
import { StorageService } from '../services/storage';
import { isSupreme } from '../utils/permissions';
import { UsersSettingsTab } from './settings/UsersSettingsTab';
import { EmailSettingsTab } from './settings/EmailSettingsTab';
import { TenantsSettingsTab } from './settings/TenantsSettingsTab';
import { MenusSettingsTab } from './settings/MenusSettingsTab';
import { DiscardRulesTab } from './settings/DiscardRulesTab';
import { CategoriesSettingsTab } from './settings/CategoriesSettingsTab';
import { DisputeRulesSettingsTab } from './settings/DisputeRulesSettingsTab';
import { DatabaseSettingsTab } from './settings/DatabaseSettingsTab';
import { generateWelcomeEmailHtml } from '../services/gmailService';

interface SystemSettingsViewProps {
  menuItems: MenuItemConfig[];
  onSaveMenuItems: (items: MenuItemConfig[]) => void;
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
  drivers: Driver[];
  championships: Championship[];
  users: User[];
  onSaveUsers: (users: User[]) => void;
  tenants?: Tenant[];
  onSaveTenants?: (tenants: Tenant[]) => void;
  activeTenant?: Tenant;
  onSelectTenant?: (tenant: Tenant) => void;
  currentUser: User | null;
  cloudStatus?: 'synced' | 'syncing' | 'offline';
  onSyncCloud?: () => Promise<void> | void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  menuItems,
  onSaveMenuItems,
  categories,
  onSaveCategories,
  drivers,
  championships,
  users,
  onSaveUsers,
  tenants,
  onSaveTenants,
  activeTenant,
  onSelectTenant,
  currentUser,
  cloudStatus = 'synced',
  onSyncCloud,
}) => {
  const currentTenants = tenants || [];
  // Config tabs state (loaded from Storage / Cloud)
  const [configTabs, setConfigTabs] = useState<ConfigTabConfig[]>(() =>
    StorageService.getConfigTabs()
  );

  // System UI labels state (loaded from Storage / Cloud)
  const [uiLabels, setUiLabels] = useState<SystemUiLabels>(() =>
    StorageService.getUiLabels()
  );

  // Discard options state
  const [discardOptions, setDiscardOptions] = useState<DiscardOptionConfig[]>(() =>
    StorageService.getDiscardOptions()
  );

  // Active Tab state (defaults to first visible tab or 'users')
  const [activeTab, setActiveTab] = useState<string>('users');

  // Preview email modal user
  const [previewEmailUser, setPreviewEmailUser] = useState<User | null>(null);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isUserSupreme = isSupreme(currentUser);

  useEffect(() => {
    // Keep local tabs in sync with storage
    setConfigTabs(StorageService.getConfigTabs());
    setUiLabels(StorageService.getUiLabels());
    setDiscardOptions(StorageService.getDiscardOptions());
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showErrorNotification = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleSaveConfigTabs = (newTabs: ConfigTabConfig[]) => {
    setConfigTabs(newTabs);
  };

  const handleSaveUiLabels = (newLabels: SystemUiLabels) => {
    setUiLabels(newLabels);
  };

  const handleSaveDiscardOptions = (newOptions: DiscardOptionConfig[]) => {
    setDiscardOptions(newOptions);
  };

  const handleSaveTenantsSafe = (newTenants: Tenant[]) => {
    if (onSaveTenants) {
      onSaveTenants(newTenants);
    }
  };

  // Helper icon selector for tab
  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'tenants':
        return <Building2 className="w-4 h-4" />;
      case 'menus':
        return <MenuIcon className="w-4 h-4" />;
      case 'discard':
        return <Flag className="w-4 h-4" />;
      case 'categories':
        return <Tag className="w-4 h-4" />;
      case 'dispute_rules':
        return <Trophy className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  // Filter tabs: Supreme admin sees all tabs.
  // Tenant admin/producer only sees tenant-scoped tabs (users, email, categories, discard, dispute_rules).
  const visibleTabs = configTabs
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((tab) => {
      if (isUserSupreme) return true;
      // Prohibit global architecture tabs from tenant admins
      if (tab.id === 'tenants' || tab.id === 'database' || tab.id === 'menus') return false;
      return tab.visible;
    });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>
                  {isUserSupreme
                    ? 'Painel de Administração Global (Admin Supremo)'
                    : `Painel de Gestão - ${activeTenant?.name || 'Produtora'}`}
                </span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase">
                  {isUserSupreme ? 'Multi-Tenant Master' : 'Produtora'}
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                {isUserSupreme
                  ? 'Gerencie usuários globais, produtoras, menus de navegação, regras de descarte e banco de dados oficial.'
                  : `Gerencie os usuários autorizados, categorias e regras da produtora ${activeTenant?.name || ''}.`}
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-950/90 border border-red-500/60 text-red-300 text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* DYNAMIC CONFIG TABS SELECTOR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        {visibleTabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {getTabIcon(tab.id)}
              <span>{tab.label}</span>
              {!tab.visible && isUserSupreme && (
                <span className="text-[9px] px-1 py-0.2 bg-zinc-950/80 text-amber-300 rounded border border-amber-500/30">
                  Oculto
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: USUÁRIOS */}
      {activeTab === 'users' && (
        <UsersSettingsTab
          users={users}
          onSaveUsers={onSaveUsers}
          tenants={currentTenants}
          activeTenant={activeTenant}
          drivers={drivers}
          currentUser={currentUser}
          onPreviewEmail={(u) => setPreviewEmailUser(u)}
          showNotification={showNotification}
          showErrorNotification={showErrorNotification}
        />
      )}

      {/* TAB 2: ENVIO DE E-MAIL */}
      {activeTab === 'email' && (
        <EmailSettingsTab
          users={users}
          drivers={drivers}
          showNotification={showNotification}
          showErrorNotification={showErrorNotification}
        />
      )}

      {/* TAB 3: PRODUTORAS E TENANTS */}
      {activeTab === 'tenants' && (
        <TenantsSettingsTab
          tenants={currentTenants}
          onSaveTenants={handleSaveTenantsSafe}
          activeTenant={activeTenant}
          onSelectTenant={(t) => {
            if (onSelectTenant) onSelectTenant(t);
          }}
          championships={championships}
          drivers={drivers}
          users={users}
          onSaveUsers={onSaveUsers}
          showNotification={showNotification}
          showErrorNotification={showErrorNotification}
        />
      )}

      {/* TAB 4: CONFIGURAÇÕES DE MENU */}
      {activeTab === 'menus' && (
        <MenusSettingsTab
          menus={menuItems}
          onSaveMenus={onSaveMenuItems}
          currentUser={currentUser}
          configTabs={configTabs}
          onSaveConfigTabs={handleSaveConfigTabs}
          uiLabels={uiLabels}
          onSaveUiLabels={handleSaveUiLabels}
          showNotification={showNotification}
        />
      )}

      {/* TAB 5: REGRAS DE DESCARTES */}
      {activeTab === 'discard' && (
        <DiscardRulesTab
          discardOptions={discardOptions}
          onSaveDiscardOptions={handleSaveDiscardOptions}
          tenants={currentTenants}
          activeTenant={activeTenant}
          showNotification={showNotification}
        />
      )}

      {/* TAB 6: CATEGORIAS */}
      {activeTab === 'categories' && (
        <CategoriesSettingsTab
          categories={categories}
          onSaveCategories={onSaveCategories}
          drivers={drivers}
          tenants={currentTenants}
          activeTenant={activeTenant}
          showNotification={showNotification}
          showErrorNotification={showErrorNotification}
        />
      )}

      {/* TAB 7: SISTEMAS DE DISPUTA / REGRAS DE CAMPEONATO */}
      {activeTab === 'dispute_rules' && (
        <DisputeRulesSettingsTab
          currentUser={currentUser}
        />
      )}

      {/* TAB 8: BANCO DE DADOS OFICIAL */}
      {activeTab === 'database' && (
        <DatabaseSettingsTab
          tenants={currentTenants}
          championships={championships}
          users={users}
          onSyncCloud={onSyncCloud as any}
          showNotification={showNotification}
          showErrorNotification={showErrorNotification}
        />
      )}

      {/* PREVIEW EMAIL MODAL */}
      {previewEmailUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-white text-sm">
                  Modelo Oficial do E-mail (Primeiro Acesso)
                </h3>
              </div>
              <button
                onClick={() => setPreviewEmailUser(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-950">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateWelcomeEmailHtml({
                    toEmail: previewEmailUser.email,
                    userName: previewEmailUser.name,
                    role: previewEmailUser.role,
                    kartNumber: '18',
                    driverName: previewEmailUser.name,
                  }),
                }}
              />
            </div>

            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Disparado via Gmail oficial para o usuário {previewEmailUser.email}.
              </span>
              <button
                onClick={() => setPreviewEmailUser(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
