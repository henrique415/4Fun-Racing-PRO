import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Award,
  Users,
  Settings,
  FileDown,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Flag,
  Menu,
  Crown,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  UserPlus,
} from 'lucide-react';
import {
  Championship,
  Driver,
  Team,
  Category,
  User,
  NotificationItem,
  Stage,
  MenuItemConfig,
  TabKey,
  Tenant,
} from './types';
import { StorageService } from './services/storage';
import { CloudDatabaseService, FirestoreAppData } from './services/cloudDatabase';
import { calculateChampionshipStandings } from './services/calculator';
import { exportStandingsPdf } from './services/pdfExport';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { DriversAndTeamsView } from './components/DriversAndTeamsView';
import { StandingsTable } from './components/StandingsTable';
import { StagesView } from './components/StagesView';
import { GamificationRanking } from './components/GamificationRanking';
import { StageManagerModal } from './components/StageManagerModal';
import { ChampionshipConfigModal } from './components/ChampionshipConfigModal';
import { DriverManagementModal } from './components/DriverManagementModal';
import { DriverProfileModal } from './components/DriverProfileModal';
import { NotificationCenter } from './components/NotificationCenter';
import { AuthModal } from './components/AuthModal';
import { SystemSettingsView } from './components/SystemSettingsView';
import { ChampionshipRulesAndStagesView } from './components/ChampionshipRulesAndStagesView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isSupreme, isAdminOrSupreme, getRoleInfo } from './utils/permissions';

export default function App() {
  // Core Data States
  const [championships, setChampionships] = useState<Championship[]>(() =>
    StorageService.getChampionships()
  );
  const [activeChampionshipId, setActiveChampionshipId] = useState<string>(() =>
    StorageService.getActiveChampionshipId()
  );
  const [drivers, setDrivers] = useState<Driver[]>(() => StorageService.getDrivers());
  const [teams, setTeams] = useState<Team[]>(() => StorageService.getTeams());
  const [categories, setCategories] = useState<Category[]>(() =>
    StorageService.getCategories()
  );
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    StorageService.getCurrentUser()
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    StorageService.getNotifications()
  );
  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(() =>
    StorageService.getMenuItems()
  );
  const [tenants, setTenants] = useState<Tenant[]>(() => StorageService.getTenants());
  const [activeTenantId, setActiveTenantId] = useState<string>(() =>
    StorageService.getActiveTenantId()
  );

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<TabKey>('standings');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Sidebar & Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = StorageService.getAuthSession();
    const user = StorageService.getCurrentUser();
    return (session === 'authenticated' || session === 'guest') && !!user;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pitstop_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('pitstop_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    StorageService.login(user);
    setIsAuthenticated(true);
    showToast(`Bem-vindo, ${user.name}!`);
  };

  const handleRegisterUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);
    setCurrentUser(newUser);
    StorageService.login(newUser);
    setIsAuthenticated(true);
    showToast(`Conta criada com sucesso! Perfil: ${getRoleInfo(newUser.role).label}`);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso.');
  };

  // Inicialização e Sincronização do Banco de Dados Oficial em Nuvem (Firestore)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let unsubscribeAutoSync: (() => void) | null = null;
    let syncTimer: any = null;
    let pendingPayload: Partial<FirestoreAppData> = {};

    // Sincronização automática e persistente em cada ação do usuário no StorageService (com debounce)
    unsubscribeAutoSync = StorageService.onAutoSync((payload) => {
      if (payload) {
        pendingPayload = { ...pendingPayload, ...payload };
      }
      setCloudStatus('syncing');
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(async () => {
        try {
          const payloadToSend = { ...pendingPayload };
          pendingPayload = {};
          await CloudDatabaseService.saveToCloud(payloadToSend);
          setCloudStatus(CloudDatabaseService.isQuotaExceeded() ? 'offline' : 'synced');
        } catch (e) {
          console.warn('Auto-sync Firestore:', e);
          setCloudStatus('offline');
        }
      }, 1200);
    });

    const initCloud = async () => {
      setCloudStatus('syncing');
      try {
        await CloudDatabaseService.loadFromCloud();
        setCloudStatus('synced');

        // Escuta alterações em tempo real de outros administradores
        unsubscribe = CloudDatabaseService.subscribeToCloud(
          (cloudData) => {
            if (cloudData.championships) {
              const incoming = cloudData.championships;
              setChampionships((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            if (cloudData.drivers) {
              const incoming = cloudData.drivers;
              setDrivers((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            if (cloudData.teams) {
              const incoming = cloudData.teams;
              setTeams((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            if (cloudData.categories) {
              const incoming = cloudData.categories;
              setCategories((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            if (cloudData.users) {
              const incoming = cloudData.users;
              setUsers((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            if (cloudData.tenants) {
              const incoming = cloudData.tenants;
              setTenants((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            if (cloudData.menuItems) {
              const incoming = cloudData.menuItems;
              setMenuItems((prev) =>
                JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
              );
            }
            setCloudStatus('synced');
          },
          (err) => {
            console.warn('Conexão Firestore:', err);
            setCloudStatus('offline');
          }
        );
      } catch (err) {
        console.error('Falha ao conectar com banco oficial:', err);
        setCloudStatus('offline');
      }
    };

    initCloud();

    return () => {
      if (syncTimer) clearTimeout(syncTimer);
      if (unsubscribe) unsubscribe();
      if (unsubscribeAutoSync) unsubscribeAutoSync();
    };
  }, []);

  const handleSyncCloud = async () => {
    setCloudStatus('syncing');
    try {
      const ok = await CloudDatabaseService.saveToCloud({
        championships,
        drivers,
        teams,
        categories,
        users,
        menuItems,
        tenants,
      });
      if (ok) {
        setCloudStatus('synced');
        showToast('Banco de dados oficial atualizado na nuvem!');
      } else {
        setCloudStatus('offline');
        showToast('Aviso: Operação salva localmente.');
      }
    } catch {
      setCloudStatus('offline');
    }
  };

  // Modals
  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);
  const [managedStage, setManagedStage] = useState<Stage | null>(null);
  const [isChampionshipConfigOpen, setIsChampionshipConfigOpen] = useState(false);
  const [championshipToEdit, setChampionshipToEdit] = useState<Championship | undefined>(
    undefined
  );
  const [isDriverManagementOpen, setIsDriverManagementOpen] = useState(false);
  const [isDriverProfileOpen, setIsDriverProfileOpen] = useState(false);
  const [selectedProfileDriverId, setSelectedProfileDriverId] = useState<string | null>(
    null
  );
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active Tenant Object
  const activeTenant = useMemo(() => {
    return tenants.find((t) => t.id === activeTenantId) || tenants[0];
  }, [tenants, activeTenantId]);

  // Championships scoped to current tenant
  const tenantChampionships = useMemo(() => {
    return championships.filter((c) => c.tenantId === activeTenantId);
  }, [championships, activeTenantId]);

  // Drivers scoped to current tenant
  const tenantDrivers = useMemo(() => {
    return drivers.filter((d) => d.tenantId === activeTenantId);
  }, [drivers, activeTenantId]);

  // Teams scoped to current tenant
  const tenantTeams = useMemo(() => {
    return teams.filter((t) => t.tenantId === activeTenantId);
  }, [teams, activeTenantId]);

  // Categories scoped to current tenant
  const tenantCategories = useMemo(() => {
    const filtered = categories.filter(
      (c) => !c.tenantId || c.tenantId === 'global' || c.tenantId === activeTenantId
    );
    return filtered.length > 0
      ? filtered
      : [
          {
            id: `cat-geral-${activeTenantId}`,
            name: 'Geral',
            description: 'Categoria Principal',
            tenantId: activeTenantId,
          },
        ];
  }, [categories, activeTenantId]);

  // Active Championship Object
  const activeChampionship = useMemo(() => {
    if (tenantChampionships.length === 0) return undefined;
    return (
      tenantChampionships.find((c) => c.id === activeChampionshipId) ||
      tenantChampionships[0]
    );
  }, [tenantChampionships, activeChampionshipId]);

  // Keep activeChampionshipId synced when tenant changes
  useEffect(() => {
    if (tenantChampionships.length > 0) {
      const exists = tenantChampionships.some((c) => c.id === activeChampionshipId);
      if (!exists) {
        setActiveChampionshipId(tenantChampionships[0].id);
        StorageService.setActiveChampionshipId(tenantChampionships[0].id);
      }
    } else {
      setActiveChampionshipId('');
      StorageService.setActiveChampionshipId('');
    }
  }, [activeTenantId, tenantChampionships, activeChampionshipId]);

  // Active Championship Categories
  const activeChampionshipCategories = useMemo(() => {
    if (!activeChampionship) return tenantCategories;
    if (activeChampionship.customCategories && activeChampionship.customCategories.length > 0) {
      return activeChampionship.customCategories;
    }
    if (activeChampionship.categories && activeChampionship.categories.length > 0) {
      const matched = tenantCategories.filter((c) => activeChampionship.categories.includes(c.id));
      if (matched.length > 0) return matched;
    }
    return tenantCategories;
  }, [activeChampionship, tenantCategories]);

  // Calculated Standings
  const standings = useMemo(() => {
    if (!activeChampionship) return [];
    return calculateChampionshipStandings(
      activeChampionship,
      tenantDrivers,
      tenantTeams,
      activeChampionshipCategories,
      selectedCategoryId
    );
  }, [activeChampionship, tenantDrivers, tenantTeams, activeChampionshipCategories, selectedCategoryId]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync to Storage when state updates (local storage cache only, do not trigger cloud autoSync loop)
  useEffect(() => {
    StorageService.saveChampionships(championships, false);
  }, [championships]);

  useEffect(() => {
    StorageService.saveDrivers(drivers, false);
  }, [drivers]);

  useEffect(() => {
    StorageService.saveTeams(teams, false);
  }, [teams]);

  useEffect(() => {
    StorageService.saveCategories(categories, false);
  }, [categories]);

  useEffect(() => {
    StorageService.saveUsers(users, false);
  }, [users]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    StorageService.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    StorageService.saveMenuItems(menuItems, false);
  }, [menuItems]);

  useEffect(() => {
    StorageService.saveTenants(tenants, false);
  }, [tenants]);

  useEffect(() => {
    if (activeChampionship) {
      StorageService.setActiveChampionshipId(activeChampionship.id);
    }
  }, [activeChampionship]);

  // Handlers
  const handleSelectChampionship = (champId: string) => {
    setActiveChampionshipId(champId);
    showToast('Campeonato alterado com sucesso');
  };

  const handleOpenStageManager = (stage: Stage) => {
    setManagedStage(stage);
    setIsStageManagerOpen(true);
  };

  const handleSaveStage = (
    updatedStage: Stage,
    notifTitle?: string,
    notifMsg?: string
  ) => {
    if (!activeChampionship) return;

    const updatedStages = activeChampionship.stages.map((s) =>
      s.id === updatedStage.id ? updatedStage : s
    );

    const updatedChampionship: Championship = {
      ...activeChampionship,
      stages: updatedStages,
    };

    const updatedChampionships = championships.map((c) =>
      c.id === updatedChampionship.id ? updatedChampionship : c
    );

    setChampionships(updatedChampionships);
    StorageService.triggerAutoSync({ championships: updatedChampionships });

    // Broadcast push notification
    if (notifTitle && notifMsg) {
      const newNotif = StorageService.addNotification({
        title: notifTitle,
        message: notifMsg,
        type: 'result',
      });
      setNotifications([newNotif, ...notifications]);
    }

    showToast(`Resultados da etapa ${updatedStage.name} homologados!`);
  };

  const handleSaveChampionship = (newOrUpdated: Championship) => {
    const champWithTenant: Championship = {
      ...newOrUpdated,
      tenantId: newOrUpdated.tenantId || activeTenantId,
    };
    const exists = championships.some((c) => c.id === champWithTenant.id);
    let updatedChampionships: Championship[];
    if (exists) {
      updatedChampionships = championships.map((c) =>
        c.id === champWithTenant.id ? champWithTenant : c
      );
      setChampionships(updatedChampionships);
      showToast('Configurações do campeonato salvas!');
    } else {
      updatedChampionships = [champWithTenant, ...championships];
      setChampionships(updatedChampionships);
      setActiveChampionshipId(champWithTenant.id);
      showToast(`Campeonato ${champWithTenant.name} criado com sucesso!`);
    }
    StorageService.triggerAutoSync({ championships: updatedChampionships });
  };

  const handleDeleteChampionship = (champId: string) => {
    const champToDelete = championships.find((c) => c.id === champId);
    StorageService.deleteChampionship(champId);
    const updated = championships.filter((c) => c.id !== champId);
    setChampionships(updated);
    if (activeChampionshipId === champId) {
      const remainingInTenant = updated.filter((c) => c.tenantId === activeTenantId);
      setActiveChampionshipId(remainingInTenant[0]?.id || '');
    }
    showToast(`Campeonato "${champToDelete?.name || ''}" excluído com sucesso!`);
  };

  const handleSaveDriver = (driver: Driver) => {
    const driverWithTenant: Driver = {
      ...driver,
      tenantId: driver.tenantId || activeTenantId,
    };
    const exists = drivers.some((d) => d.id === driverWithTenant.id);
    let updatedDrivers: Driver[];
    if (exists) {
      updatedDrivers = drivers.map((d) => (d.id === driverWithTenant.id ? driverWithTenant : d));
      setDrivers(updatedDrivers);
      StorageService.triggerAutoSync({ drivers: updatedDrivers });
      showToast(`Piloto ${driverWithTenant.name} atualizado!`);
    } else {
      updatedDrivers = [...drivers, driverWithTenant];
      setDrivers(updatedDrivers);
      // auto-enroll in active championship
      if (activeChampionship) {
        const updatedChamp = {
          ...activeChampionship,
          registeredDriverIds: [...(activeChampionship.registeredDriverIds || []), driverWithTenant.id],
        };
        const updatedChampionships = championships.map((c) =>
          c.id === updatedChamp.id ? updatedChamp : c
        );
        setChampionships(updatedChampionships);
        StorageService.triggerAutoSync({
          drivers: updatedDrivers,
          championships: updatedChampionships,
        });
      } else {
        StorageService.triggerAutoSync({ drivers: updatedDrivers });
      }
      showToast(`Piloto ${driverWithTenant.name} cadastrado e inscrito no grid!`);
    }
  };

  const handleSaveTeam = (team: Team) => {
    const teamWithTenant: Team = {
      ...team,
      tenantId: team.tenantId || activeTenantId,
    };
    const exists = teams.some((t) => t.id === teamWithTenant.id);
    let updatedTeams: Team[];
    if (exists) {
      updatedTeams = teams.map((t) => (t.id === teamWithTenant.id ? teamWithTenant : t));
      setTeams(updatedTeams);
      showToast(`Equipe ${teamWithTenant.name} atualizada com sucesso!`);
    } else {
      updatedTeams = [...teams, teamWithTenant];
      setTeams(updatedTeams);
      showToast(`Equipe ${teamWithTenant.name} cadastrada com sucesso!`);
    }
    StorageService.triggerAutoSync({ teams: updatedTeams });
  };

  const handleDeleteDriver = (driverId: string) => {
    const driverToDelete = drivers.find((d) => d.id === driverId);
    const updatedDrivers = drivers.filter((d) => d.id !== driverId);
    setDrivers(updatedDrivers);

    if (activeChampionship) {
      const updatedChamp: Championship = {
        ...activeChampionship,
        registeredDriverIds: (activeChampionship.registeredDriverIds || []).filter((id) => id !== driverId),
      };
      const updatedChamps = championships.map((c) => (c.id === updatedChamp.id ? updatedChamp : c));
      setChampionships(updatedChamps);
      StorageService.triggerAutoSync({
        drivers: updatedDrivers,
        championships: updatedChamps,
      });
    } else {
      StorageService.triggerAutoSync({ drivers: updatedDrivers });
    }
    showToast(`Piloto ${driverToDelete?.name || ''} excluído com sucesso!`);
  };

  const handleDeleteTeam = (teamId: string) => {
    const teamToDelete = teams.find((t) => t.id === teamId);
    const updatedTeams = teams.filter((t) => t.id !== teamId);
    setTeams(updatedTeams);
    const updatedDrivers = drivers.map((d) => (d.teamId === teamId ? { ...d, teamId: undefined } : d));
    setDrivers(updatedDrivers);
    StorageService.triggerAutoSync({ teams: updatedTeams, drivers: updatedDrivers });
    showToast(`Equipe ${teamToDelete?.name || ''} excluída com sucesso!`);
  };

  const handleToggleEnrollment = (driverId: string) => {
    if (!activeChampionship) return;

    const isEnrolled = activeChampionship.registeredDriverIds.includes(driverId);
    const updatedRegistered = isEnrolled
      ? activeChampionship.registeredDriverIds.filter((id) => id !== driverId)
      : [...activeChampionship.registeredDriverIds, driverId];

    const updatedChamp: Championship = {
      ...activeChampionship,
      registeredDriverIds: updatedRegistered,
    };

    const updatedChamps = championships.map((c) => (c.id === updatedChamp.id ? updatedChamp : c));
    setChampionships(updatedChamps);
    StorageService.triggerAutoSync({ championships: updatedChamps });

    const drv = drivers.find((d) => d.id === driverId);
    showToast(
      isEnrolled
        ? `Piloto ${drv?.name} removido do grid`
        : `Piloto ${drv?.name} inscrito no campeonato!`
    );
  };

  const handleOpenDriverProfile = (driverId: string) => {
    setSelectedProfileDriverId(driverId);
    setIsDriverProfileOpen(true);
  };

  const handleExportPdf = () => {
    if (!activeChampionship) return;
    const catName =
      selectedCategoryId === 'all'
        ? 'Todas as Categorias'
        : categories.find((c) => c.id === selectedCategoryId)?.name || 'Geral';
    exportStandingsPdf(activeChampionship, standings, catName);
    showToast('Relatório em PDF gerado com sucesso!');
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar os dados oficiais da planilha MP Racing 2026? Suas edições recentes serão redefinidas para o padrão.'
      )
    ) {
      StorageService.resetToDefault();
      setChampionships(StorageService.getChampionships());
      setActiveChampionshipId(StorageService.getActiveChampionshipId());
      setDrivers(StorageService.getDrivers());
      setTeams(StorageService.getTeams());
      setCategories(StorageService.getCategories());
      setUsers(StorageService.getUsers());
      setCurrentUser(StorageService.getCurrentUser());
      setNotifications(StorageService.getNotifications());
      setMenuItems(StorageService.getMenuItems());
      showToast('Dados restaurados com base na planilha anexa!');
    }
  };

  const handleExportBackup = () => {
    const json = StorageService.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitstop_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Backup JSON exportado com sucesso!');
  };

  // Render LoginPage if user is not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        users={users}
        drivers={drivers}
        tenants={tenants}
        activeTenant={tenants.find((t) => t.id === activeTenantId) || tenants[0]}
        onLogin={handleLogin}
        onSelectTenant={(t) => {
          setActiveTenantId(t.id);
          StorageService.setActiveTenantId(t.id);
        }}
      />
    );
  }

  const activeUser = currentUser;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-red-600 selection:text-white">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border-2 border-red-500/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Collapsible Left-Hand Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        championships={tenantChampionships.length > 0 ? tenantChampionships : championships}
        activeChampionship={activeChampionship}
        onSelectChampionship={handleSelectChampionship}
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={(tId) => {
          setActiveTenantId(tId);
          StorageService.setActiveTenantId(tId);
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenNewChampionshipModal={() => {
          setChampionshipToEdit(undefined);
          setIsChampionshipConfigOpen(true);
        }}
        onExportPdf={handleExportPdf}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        menuItems={menuItems}
        cloudStatus={cloudStatus}
        onSyncCloud={handleSyncCloud}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Navigation Strip with Centered Championship Selector */}
        <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-shrink-0 gap-3">
          {/* Left: Mobile Toggle & Context Indicator */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex-shrink-0"
              title="Abrir Menu Lateral"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block truncate">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-zinc-400">
                <span className="text-zinc-300 font-bold truncate">{activeTenant?.name || 'PitStop Pro'}</span>
                <span>/</span>
                <span className="text-red-400 font-bold truncate">
                  {activeTab === 'standings' && 'Classificação'}
                  {activeTab === 'stages' && 'Etapas'}
                  {activeTab === 'gamification' && 'Pódios'}
                  {activeTab === 'drivers' && 'Pilotos'}
                  {activeTab === 'config' && 'Regras'}
                  {activeTab === 'system_settings' && 'Configurações'}
                </span>
              </div>
              <div className="text-xs text-zinc-500 font-medium truncate">
                {activeTab === 'standings' && 'Tabela Geral'}
                {activeTab === 'stages' && 'Calendário Oficial'}
                {activeTab === 'gamification' && 'Ranking & Estatísticas'}
                {activeTab === 'drivers' && 'Grid de Pilotos e Equipes'}
                {activeTab === 'config' && 'Regulamento & Pontos'}
                {activeTab === 'system_settings' && 'Painel Administrativo'}
              </div>
            </div>
          </div>

          {/* Center: Fixed & Harmonic Active Championship Selector */}
          <div className="flex-1 flex items-center justify-center max-w-xl mx-auto px-1 sm:px-4">
            <div className="flex items-center gap-1.5 w-full max-w-md sm:max-w-lg">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                  <Trophy className="w-4 h-4 flex-shrink-0" />
                </div>
                <select
                  id="top-header-championship-select"
                  value={activeChampionship?.id || ''}
                  onChange={(e) => handleSelectChampionship(e.target.value)}
                  disabled={tenantChampionships.length === 0}
                  className="w-full bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-700/80 hover:border-red-500/50 focus:border-red-500 text-white font-bold text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2 shadow-inner transition outline-none cursor-pointer appearance-none truncate disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Campeonato Ativo selecionado para classificação, etapas, pódios, pilotos e regras"
                >
                  {tenantChampionships.length === 0 ? (
                    <option value="" className="bg-zinc-950 text-zinc-400 font-medium py-1">
                      Nenhum campeonato cadastrado nesta produtora
                    </option>
                  ) : (
                    tenantChampionships.map((c) => (
                      <option key={c.id} value={c.id} className="bg-zinc-950 text-white font-medium py-1">
                        🏆 {c.name} ({c.season}) {c.active !== false ? '• Ativo' : ''}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {isAdminOrSupreme(currentUser) && (
                <button
                  onClick={() => {
                    setChampionshipToEdit(undefined);
                    setIsChampionshipConfigOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition flex-shrink-0 cursor-pointer"
                  title="Criar novo campeonato nesta produtora"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Novo</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* User Level Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
              {currentUser.role === 'supreme' ? (
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              ) : currentUser.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="text-zinc-200 font-bold">{getRoleInfo(currentUser.role).label}</span>
            </div>

            {/* Change user / profile button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition"
              title="Trocar de perfil ou ver permissões"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
            </button>

            {/* Cloud Sync Status */}
            <button
              onClick={handleSyncCloud}
              className={`p-2 rounded-lg border text-xs flex items-center space-x-1.5 transition ${
                cloudStatus === 'syncing'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse'
                  : cloudStatus === 'synced'
                  ? 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:bg-zinc-800'
                  : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50'
              }`}
              title="Sincronização em Nuvem (Firestore Oficial)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cloudStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline text-[11px] font-bold">
                {cloudStatus === 'synced' ? 'Nuvem OK' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}
              </span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-300 transition"
              title="Sair da plataforma"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Banner with Active View Context */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeTab === 'standings' && 'Classificação Geral Consolidada'}
                  {activeTab === 'stages' && 'Calendário de Etapas & Baterias'}
                  {activeTab === 'gamification' && 'Pódios, Conquistas & Ranking Global'}
                  {activeTab === 'drivers' && 'Mural de Pilotos & Escuderias'}
                  {activeTab === 'config' && 'Configurações de Campeonato & Regras'}
                  {activeTab === 'system_settings' && 'Configurações Globais do Sistema'}
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeChampionship ? (
                  <>
                    {activeChampionship.name} • Temporada {activeChampionship.season} •{' '}
                    {activeChampionship.type === 'fastest_lap'
                      ? 'Critério: Volta Mais Rápida'
                      : activeChampionship.type === 'multi_race'
                      ? 'Multi-Baterias por Etapa'
                      : 'Pontuação Padrão'}
                  </>
                ) : (
                  `Produtora: ${activeTenant?.name || 'PitStop Pro'} • Sem campeonatos ativos`
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {activeChampionship && (
                <button
                  onClick={() => {
                    const target = activeChampionship.stages.find((s) => !s.completed) || activeChampionship.stages[0];
                    if (target) handleOpenStageManager(target);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Lançar tempos de volta ou baterias com IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lançar Resultados (IA)</span>
                </button>
              )}

              {isAdminOrSupreme(currentUser) && activeChampionship && (
                <button
                  onClick={() => {
                    setChampionshipToEdit(activeChampionship);
                    setIsChampionshipConfigOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Editar Regras</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Views */}
          <ErrorBoundary key={activeTab} fallbackTitle={`Erro ao carregar a tela ${activeTab}`}>
            {activeTab === 'standings' && (
              <StandingsTable
                championship={activeChampionship}
                standings={standings}
                categories={activeChampionshipCategories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                currentUser={currentUser}
                onSelectDriver={handleOpenDriverProfile}
                onSelectStage={() => {
                  setActiveTab('stages');
                }}
                onExportPdf={handleExportPdf}
                onOpenStageManager={handleOpenStageManager}
                onOpenEnrollment={() => setIsDriverManagementOpen(true)}
                onOpenNewChampionship={() => {
                  setChampionshipToEdit(undefined);
                  setIsChampionshipConfigOpen(true);
                }}
              />
            )}

            {activeTab === 'stages' && (
              <StagesView
                championship={activeChampionship}
                drivers={tenantDrivers}
                teams={tenantTeams}
                currentUser={currentUser}
                standings={standings}
                onOpenStageManager={handleOpenStageManager}
                onOpenNewChampionship={() => {
                  setChampionshipToEdit(undefined);
                  setIsChampionshipConfigOpen(true);
                }}
                onOpenEnrollment={() => setIsDriverManagementOpen(true)}
              />
            )}

            {activeTab === 'gamification' && (
              <GamificationRanking
                standings={standings}
                championship={activeChampionship}
                championships={tenantChampionships}
                drivers={tenantDrivers}
                teams={tenantTeams}
                categories={activeChampionshipCategories}
                onSelectDriver={handleOpenDriverProfile}
                onOpenEnrollment={() => setIsDriverManagementOpen(true)}
              />
            )}

            {activeTab === 'drivers' && (
              <DriversAndTeamsView
                drivers={tenantDrivers}
                teams={tenantTeams}
                categories={activeChampionshipCategories}
                championship={activeChampionship!}
                currentUser={currentUser}
                standings={standings}
                onSaveDriver={handleSaveDriver}
                onDeleteDriver={handleDeleteDriver}
                onSaveTeam={handleSaveTeam}
                onDeleteTeam={handleDeleteTeam}
                onToggleEnrollment={handleToggleEnrollment}
                onViewProfile={handleOpenDriverProfile}
                onOpenEnrollment={() => setIsDriverManagementOpen(true)}
              />
            )}

            {activeTab === 'config' && (
              <div className="space-y-6">
                <ChampionshipRulesAndStagesView
                  championship={activeChampionship}
                  onSaveChampionship={handleSaveChampionship}
                  drivers={tenantDrivers}
                  onOpenChampionshipWizard={() => {
                    setChampionshipToEdit(activeChampionship);
                    setIsChampionshipConfigOpen(true);
                  }}
                  onOpenStageManager={(stage) => {
                    setManagedStage(stage);
                    setIsStageManagerOpen(true);
                  }}
                  defaultCategories={tenantCategories}
                  showToast={showToast}
                />

                {/* Data Management & Backup */}
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-base font-black text-white">Dados & Backup do Sistema</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleExportBackup}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Backup (JSON)</span>
                    </button>

                    {isSupreme(currentUser) && (
                      <button
                        onClick={handleResetToDefault}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar Planilha Anexa (MP Racing 2026)</span>
                      </button>
                    )}

                    {isSupreme(currentUser) && (
                      <button
                        onClick={() => setActiveTab('system_settings')}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                      >
                        <Settings className="w-3.5 h-3.5 text-red-400" />
                        <span>Configurar Menus, Descartes & Categorias</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Global System Settings Tab */}
            {activeTab === 'system_settings' && (
              <SystemSettingsView
                menuItems={menuItems}
                onSaveMenuItems={(updated) => {
                  setMenuItems(updated);
                  StorageService.saveMenuItems(updated);
                  showToast('Configurações de menus e navegação atualizadas!');
                }}
                categories={categories}
                onSaveCategories={(updated) => {
                  setCategories(updated);
                  StorageService.saveCategories(updated);
                  showToast('Categorias do sistema atualizadas!');
                }}
                drivers={drivers}
                championships={championships}
                users={users}
                onSaveUsers={(updated) => {
                  setUsers(updated);
                  StorageService.saveUsers(updated);
                }}
                tenants={tenants}
                onSaveTenants={(updated) => {
                  setTenants(updated);
                  StorageService.saveTenants(updated);
                  showToast('Produtoras atualizadas!');
                }}
                activeTenant={tenants.find((t) => t.id === activeTenantId) || tenants[0]}
                onSelectTenant={(t) => {
                  setActiveTenantId(t.id);
                  StorageService.setActiveTenantId(t.id);
                  showToast(`Produtora ativa: ${t.name}`);
                }}
                currentUser={currentUser}
                cloudStatus={cloudStatus}
                onSyncCloud={handleSyncCloud}
              />
            )}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-white">PITSTOP PRO</span>
              <span>•</span>
              <span>Sistema Oficial de Apuração Automobilística & Classificação</span>
            </div>
            <div className="text-zinc-400">
              {activeTenant?.name || 'PitStop Pro'} • {tenantDrivers.length} Pilotos Cadastrados • {tenantTeams.length} Equipes
            </div>
          </div>
        </footer>
      </div>
      {managedStage && activeChampionship && (
        <StageManagerModal
          isOpen={isStageManagerOpen}
          onClose={() => {
            setIsStageManagerOpen(false);
            setManagedStage(null);
          }}
          stage={managedStage}
          championship={activeChampionship}
          drivers={tenantDrivers}
          onSaveStage={handleSaveStage}
        />
      )}

      <ChampionshipConfigModal
        isOpen={isChampionshipConfigOpen}
        onClose={() => setIsChampionshipConfigOpen(false)}
        championship={championshipToEdit}
        categories={tenantCategories}
        activeTenantId={activeTenantId}
        onSaveChampionship={handleSaveChampionship}
        onDeleteChampionship={handleDeleteChampionship}
      />

      <DriverManagementModal
        isOpen={isDriverManagementOpen}
        onClose={() => setIsDriverManagementOpen(false)}
        drivers={tenantDrivers}
        teams={tenantTeams}
        categories={activeChampionshipCategories}
        championship={activeChampionship}
        currentUser={currentUser}
        onSaveDriver={handleSaveDriver}
        onSaveTeam={handleSaveTeam}
        onToggleEnrollment={handleToggleEnrollment}
        onViewProfile={handleOpenDriverProfile}
      />

      <DriverProfileModal
        isOpen={isDriverProfileOpen}
        onClose={() => {
          setIsDriverProfileOpen(false);
          setSelectedProfileDriverId(null);
        }}
        driverId={selectedProfileDriverId}
        drivers={tenantDrivers}
        teams={tenantTeams}
        categories={activeChampionshipCategories}
        championship={activeChampionship}
        standings={standings}
        currentUser={currentUser}
        onToggleEnrollment={handleToggleEnrollment}
      />

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        currentUser={currentUser}
        onMarkAllAsRead={() => {
          setNotifications(notifications.map((n) => ({ ...n, read: true })));
          showToast('Todas as notificações foram lidas.');
        }}
        onSendPushNotification={(title, msg, type) => {
          const newItem = StorageService.addNotification({
            title,
            message: msg,
            type,
          });
          setNotifications([newItem, ...notifications]);
          showToast('Notificação push disparada para os pilotos!');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={activeUser}
        users={users}
        drivers={drivers}
        tenants={tenants}
        onSelectUser={(user) => {
          setCurrentUser(user);
          showToast(`Sessão iniciada como ${user.name}`);
        }}
        onCreatePilotUser={(name, email, driverId, role, tenantId) => {
          const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: role || 'pilot',
            driverId,
            tenantId: tenantId || activeTenantId,
            active: true,
          };
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          StorageService.saveUsers(updatedUsers);
          setCurrentUser(newUser);
          showToast(`Conta de ${getRoleInfo(newUser.role).label} criada para ${name}!`);
        }}
      />
    </div>
  );
}
