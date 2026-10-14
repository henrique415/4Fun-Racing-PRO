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
  Gauge,
  Sliders,
  Cloud,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';
import { Championship, User, NotificationItem, MenuItemConfig, TabKey } from '../types';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  championships: Championship[];
  activeChampionship: Championship;
  onSelectChampionship: (champId: string) => void;
  currentUser: User;
  onOpenAuthModal: () => void;
  onOpenNewChampionshipModal: () => void;
  onExportPdf: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  menuItems: MenuItemConfig[];
  cloudStatus?: 'synced' | 'syncing' | 'offline';
  onSyncCloud?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  championships,
  activeChampionship,
  onSelectChampionship,
  currentUser,
  onOpenAuthModal,
  onOpenNewChampionshipModal,
  onExportPdf,
  notifications,
  onOpenNotifications,
  menuItems,
  cloudStatus = 'synced',
  onSyncCloud,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filter visible items according to user role and visibility flag, sorted by order
  const visibleMenuItems = menuItems
    .filter((item) => {
      if (!item.visible) return false;
      if (item.adminOnly && currentUser.role !== 'admin') return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  // Helper to render icon by name
  const renderIcon = (iconName: string, className: string = 'w-4 h-4') => {
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

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-zinc-800/60 text-xs">
        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-600/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
            Automobilismo Oficial
          </span>
          <span className="hidden sm:inline text-zinc-500">•</span>
          <span className="hidden sm:inline text-zinc-300 font-medium">Temporada 2026</span>
          <span className="hidden md:inline text-zinc-500">•</span>
          <span className="hidden md:inline text-zinc-400">Sistema de Apuração & Gamificação de Grid</span>
        </div>

        {/* User Badge & Quick Switch */}
        <div className="flex items-center space-x-3">
          {/* Cloud Database Indicator */}
          <button
            onClick={onSyncCloud}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
              cloudStatus === 'synced'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : cloudStatus === 'syncing'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
            title="Banco de dados oficial na nuvem (Firestore). Clique para sincronizar agora."
          >
            {cloudStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span className="hidden sm:inline">Sincronizando</span>
              </>
            ) : cloudStatus === 'synced' ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Nuvem Conectada</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition cursor-pointer"
            title="Alterar perfil ou fazer login"
          >
            {currentUser.role === 'admin' ? (
              <span className="flex items-center text-amber-400 font-semibold gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </span>
            ) : (
              <span className="flex items-center text-emerald-400 font-semibold gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{currentUser.name}</span>
              </span>
            )}
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 hover:text-white">
              Trocar
            </span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Centro de Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-900 flex items-center justify-center shadow-lg shadow-red-950/50 border border-red-500/40">
            <Flag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white font-mono">
                PITSTOP<span className="text-red-500">PRO</span>
              </span>
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-bold border border-zinc-700">
                v2.6
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Gestão de Pontuação, Etapas & Classificação
            </p>
          </div>
        </div>

        {/* Championship Selector */}
        <div className="hidden lg:flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 px-3">
          <Gauge className="w-4 h-4 text-red-400" />
          <span className="text-xs text-zinc-400 font-medium">Campeonato:</span>
          <select
            value={activeChampionship.id}
            onChange={(e) => onSelectChampionship(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-2"
          >
            {championships.map((c) => (
              <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                {c.name} ({c.type === 'fastest_lap' ? 'Volta Rápida' : 'Multi-Baterias'})
              </option>
            ))}
          </select>
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenNewChampionshipModal}
              className="ml-2 p-1 text-zinc-400 hover:text-red-400 transition"
              title="Criar novo campeonato"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Desktop Navigation Tabs (ordered and customized) */}
        <nav className="hidden md:flex items-center space-x-1">
          {visibleMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {renderIcon(item.iconName)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Button: PDF Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onExportPdf}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 hover:border-zinc-600 transition shadow-sm cursor-pointer"
            title="Exportar classificação consolidada em PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-red-400" />
            <span>Exportar PDF</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Dynamic ordering and visibility) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-5 space-y-3">
          <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
            <label className="text-xs text-zinc-400 block mb-1">Selecione o Campeonato:</label>
            <select
              value={activeChampionship.id}
              onChange={(e) => {
                onSelectChampionship(e.target.value);
                setMobileMenuOpen(false);
              }}
              className="w-full bg-zinc-950 text-white text-sm p-2 rounded border border-zinc-700"
            >
              {championships.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {visibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold text-left flex items-center space-x-2 ${
                    isActive ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {renderIcon(item.iconName)}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              onExportPdf();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-lg bg-zinc-800 text-white text-xs font-bold border border-zinc-700"
          >
            <FileDown className="w-4 h-4 text-red-400" />
            <span>Baixar Relatório em PDF</span>
          </button>
        </div>
      )}
    </header>
  );
};
