import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Settings,
  Bell,
  FileDown,
  UserCheck,
  ShieldCheck,
  Flag,
  PlusCircle,
  Menu,
  X,
  Sliders,
  Cloud,
  CloudCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  Shield,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { Championship, User, NotificationItem, MenuItemConfig, TabKey, Tenant } from '../types';
import { getRoleInfo, isSupreme, isAdminOrSupreme } from '../utils/permissions';

interface SidebarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  championships: Championship[];
  activeChampionship?: Championship;
  onSelectChampionship?: (champId: string) => void;
  tenants?: Tenant[];
  activeTenant?: Tenant;
  onSelectTenant?: (tenantId: string) => void;
  currentUser: User;
  onOpenAuthModal: () => void;
  onOpenNewChampionshipModal: () => void;
  onExportPdf: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  menuItems: MenuItemConfig[];
  cloudStatus?: 'synced' | 'syncing' | 'offline';
  onSyncCloud?: () => void;
  onLogout?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  championships,
  activeChampionship,
  onSelectChampionship,
  tenants = [],
  activeTenant,
  onSelectTenant,
  currentUser,
  onOpenAuthModal,
  onOpenNewChampionshipModal,
  onExportPdf,
  notifications,
  onOpenNotifications,
  menuItems,
  cloudStatus = 'synced',
  onSyncCloud,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleInfo = getRoleInfo(currentUser.role);
  const isSup = isSupreme(currentUser);
  const isAdmin = isAdminOrSupreme(currentUser);

  // Multi-tenant accessibility logic: Supreme admin has access to all; users with multiple tenantIds see their list
  const accessibleTenants = (tenants || []).filter((t) => {
    if (isSup) return true;
    if (currentUser?.tenantIds && currentUser.tenantIds.includes(t.id)) return true;
    if (currentUser?.tenantId && currentUser.tenantId === t.id) return true;
    return false;
  });
  const canSwitchTenant = isSup || accessibleTenants.length > 1;

  // Filter visible items according to user role and visibility flag, sorted by order
  const visibleMenuItems = menuItems
    .filter((item) => {
      if (!item.visible) return false;
      // supremeOnly: only supreme role
      if (item.supremeOnly && !isSup) return false;
      // adminOnly: admin or supreme role
      if (item.adminOnly && !isAdmin) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  // Helper to render icon by name
  const renderIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Calendar':
        return <Calendar className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Sliders':
        return <Sliders className={className} />;
      case 'Settings':
      default:
        return <Settings className={className} />;
    }
  };

  const renderRoleIcon = (role?: string, className: string = 'w-3.5 h-3.5') => {
    if (role === 'supreme') return <Crown className={`${className} text-amber-400`} />;
    if (role === 'admin') return <Shield className={`${className} text-red-400`} />;
    return <Flag className={`${className} text-emerald-400`} />;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950 text-white select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-950/60 flex-shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-white text-base tracking-tight leading-tight">
                  PitStop Pro
                </span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  2026
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold block truncate">
                {activeTenant?.name || 'Produtora Oficial'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-950/60">
              <Flag className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Toggle Collapse Button (Desktop) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title={isCollapsed ? 'Expandir menu lateral' : 'Ocultar menu lateral (apenas ícones)'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close Button (Mobile) */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {!isCollapsed && (
          <span className="px-3 text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-1">
            Navegação Principal
          </span>
        )}

        {visibleMenuItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition cursor-pointer relative group ${
                isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80 font-medium'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r" />
              )}

              {renderIcon(item.iconName, isCollapsed ? 'w-5 h-5' : 'w-4 h-4 flex-shrink-0')}

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="text-xs truncate">{item.label}</span>
                  {item.supremeOnly && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                      Supremo
                    </span>
                  )}
                  {item.adminOnly && !item.supremeOnly && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-bold">
                      Admin
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cloud Sync Widget */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    cloudStatus === 'synced'
                      ? 'bg-emerald-400'
                      : cloudStatus === 'syncing'
                      ? 'bg-amber-400'
                      : 'bg-zinc-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    cloudStatus === 'synced'
                      ? 'bg-emerald-500'
                      : cloudStatus === 'syncing'
                      ? 'bg-amber-500'
                      : 'bg-zinc-500'
                  }`}
                />
              </span>
              <div className="truncate">
                <span className="text-[11px] font-bold text-zinc-200 block truncate">
                  {cloudStatus === 'synced'
                    ? 'Nuvem Firestore'
                    : cloudStatus === 'syncing'
                    ? 'Sincronizando...'
                    : 'Modo Local'}
                </span>
                <span className="text-[9px] text-zinc-400">Banco oficial ativo</span>
              </div>
            </div>
            {onSyncCloud && (
              <button
                onClick={onSyncCloud}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Forçar sincronização com a nuvem"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${cloudStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`}
                />
              </button>
            )}
          </div>
        ) : (
          <div
            className="flex justify-center cursor-pointer"
            onClick={onSyncCloud}
            title={`Nuvem Firestore: ${cloudStatus === 'synced' ? 'Conectado e Sincronizado' : cloudStatus}`}
          >
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700">
              <CloudCheck
                className={`w-4 h-4 ${
                  cloudStatus === 'synced'
                    ? 'text-emerald-400'
                    : cloudStatus === 'syncing'
                    ? 'text-amber-400 animate-pulse'
                    : 'text-zinc-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Tools: PDF & Notifications */}
      <div className="px-3 py-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
        {!isCollapsed ? (
          <>
            <button
              onClick={onExportPdf}
              className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition cursor-pointer"
              title="Baixar Tabela de Classificação em PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-red-500" />
              <span>PDF</span>
            </button>

            <button
              onClick={onOpenNotifications}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 relative transition cursor-pointer"
              title="Central de Notificações"
            >
              <Bell className="w-4 h-4 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </>
        ) : (
          <div className="flex flex-col space-y-2 w-full items-center">
            <button
              onClick={onExportPdf}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="Baixar Tabela PDF"
            >
              <FileDown className="w-4 h-4 text-red-500" />
            </button>

            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 relative transition cursor-pointer"
              title="Notificações"
            >
              <Bell className="w-4 h-4 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Multi-Tenant / Produtora Selector (Discreetly at the bottom) */}
      {canSwitchTenant && accessibleTenants.length > 0 && (
        <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-950/70">
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Produtora</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                  {accessibleTenants.length}
                </span>
              </div>
              <select
                value={activeTenant?.id}
                onChange={(e) => onSelectTenant && onSelectTenant(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold transition outline-none cursor-pointer truncate"
              >
                {accessibleTenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              onClick={() => {
                if (accessibleTenants.length > 1 && onSelectTenant && activeTenant) {
                  const idx = accessibleTenants.findIndex((t) => t.id === activeTenant.id);
                  const nextTenant = accessibleTenants[(idx + 1) % accessibleTenants.length];
                  onSelectTenant(nextTenant.id);
                }
              }}
              className="flex justify-center cursor-pointer group"
              title={`Produtora Ativa: ${activeTenant?.name || 'Selecione'} (Clique para alternar)`}
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-red-500/50 flex items-center justify-center text-red-500 transition">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div
              onClick={onOpenAuthModal}
              className="flex items-center space-x-2.5 overflow-hidden cursor-pointer group flex-1 mr-2"
              title="Clique para alternar usuário ou ver perfis"
            >
              <div className="relative flex-shrink-0">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 font-black text-xs flex items-center justify-center">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-zinc-950">
                  {renderRoleIcon(currentUser.role, 'w-2.5 h-2.5')}
                </span>
              </div>

              <div className="truncate">
                <span className="font-bold text-xs text-white group-hover:text-red-400 transition block truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeBorder} ${roleInfo.badgeText}`}
                >
                  {roleInfo.shortLabel}
                </span>
              </div>
            </div>

            {/* Logout / Switch Button */}
            <button
              onClick={onLogout || onOpenAuthModal}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition cursor-pointer"
              title="Trocar usuário / Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={onOpenAuthModal}
            className="flex justify-center cursor-pointer"
            title={`${currentUser.name} (${roleInfo.label}) - Clique para trocar`}
          >
            <div className="relative">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 font-black text-xs flex items-center justify-center">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-zinc-950">
                {renderRoleIcon(currentUser.role, 'w-2.5 h-2.5')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block flex-shrink-0 transition-all duration-300 border-r border-zinc-800/80 sticky top-0 h-screen z-40 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-out) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-zinc-950 z-50 border-r border-zinc-800 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
