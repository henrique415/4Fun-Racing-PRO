import {
  Championship,
  Driver,
  Team,
  Category,
  User,
  NotificationItem,
  MenuItemConfig,
  DiscardOptionConfig,
  Tenant,
  ConfigTabConfig,
  SystemUiLabels,
  DisputeRuleConfig,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_CATEGORIES,
  INITIAL_TEAMS,
  INITIAL_DRIVERS,
  INITIAL_MP_CHAMPIONSHIP,
  INITIAL_GAUCHO_ENDURANCE_CHAMPIONSHIP,
  INITIAL_FASTEST_LAP_CHAMPIONSHIP,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_MENU_ITEMS,
  DEFAULT_DISCARD_OPTIONS,
  DEFAULT_CONFIG_TABS,
  DEFAULT_SYSTEM_UI_LABELS,
  DEFAULT_DISPUTE_RULES,
} from '../data/initialData';

const STORAGE_KEYS = {
  TENANTS: 'pitstop_tenants_v3',
  ACTIVE_TENANT_ID: 'pitstop_active_tenant_id_v3',
  CHAMPIONSHIPS: 'pitstop_championships_v3',
  DRIVERS: 'pitstop_drivers_v3',
  TEAMS: 'pitstop_teams_v3',
  CATEGORIES: 'pitstop_categories_v3',
  USERS: 'pitstop_users_v3',
  CURRENT_USER: 'pitstop_current_user_v3',
  AUTH_SESSION: 'pitstop_auth_session_v3',
  NOTIFICATIONS: 'pitstop_notifications_v3',
  ACTIVE_CHAMPIONSHIP_ID: 'pitstop_active_champ_id_v3',
  MENU_ITEMS: 'pitstop_menu_items_v3',
  DISCARD_OPTIONS: 'pitstop_discard_options_v3',
  CONFIG_TABS: 'pitstop_config_tabs_v3',
  SYSTEM_UI_LABELS: 'pitstop_system_ui_labels_v3',
  DISPUTE_RULES: 'pitstop_dispute_rules_v3',
};

let autoSyncListeners: Array<(data?: any) => void> = [];

export function sanitizeChampionship(c: Championship): Championship {
  return {
    ...c,
    tenantId: c?.tenantId || '',
    active: c?.active !== false,
    regulations: Array.isArray(c?.regulations) ? c.regulations : [],
    regulationSummary: c?.regulationSummary || '',
    registeredDriverIds: Array.isArray(c?.registeredDriverIds)
      ? c.registeredDriverIds
      : [],
    stages: Array.isArray(c?.stages) ? c.stages : [],
    categories: Array.isArray(c?.categories) && c.categories.length > 0 ? c.categories : ['cat-geral'],
    pointsScale: c?.pointsScale || {},
    stagesCount: c?.stagesCount || 12,
    racesPerStage: c?.racesPerStage || 2,
    discardWorstCount: c?.discardWorstCount ?? 0,
    polePoints: c?.polePoints ?? 0,
    fastestLapPoints: c?.fastestLapPoints ?? 0,
  };
}

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const StorageService = {
  // AUTO SYNC HOOK (Immediately persists changes to cloud database)
  onAutoSync(listener: (data?: any) => void): () => void {
    autoSyncListeners.push(listener);
    return () => {
      autoSyncListeners = autoSyncListeners.filter((l) => l !== listener);
    };
  },

  triggerAutoSync(data?: any): void {
    autoSyncListeners.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.warn('Auto sync trigger error:', err);
      }
    });
  },

  // TENANTS MANAGEMENT
  getTenants(): Tenant[] {
    const list = safeGet<Tenant[]>(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
    if (!Array.isArray(list) || list.length === 0) {
      return INITIAL_TENANTS;
    }
    return list;
  },

  saveTenants(tenants: Tenant[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.TENANTS, tenants);
    if (triggerSync) this.triggerAutoSync({ tenants });
  },

  getActiveTenantId(): string {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_TENANT_ID, 'tenant-mp-racing');
  },

  setActiveTenantId(id: string): void {
    safeSet(STORAGE_KEYS.ACTIVE_TENANT_ID, id);
  },

  getActiveTenant(): Tenant {
    const tenants = this.getTenants();
    const activeId = this.getActiveTenantId();
    return tenants.find((t) => t.id === activeId) || tenants[0] || INITIAL_TENANTS[0];
  },

  addTenant(newTenant: Tenant): void {
    const tenants = this.getTenants();
    const updated = [...tenants.filter((t) => t.id !== newTenant.id), newTenant];
    this.saveTenants(updated, true);
  },

  deleteTenantCompletely(tenantId: string): void {
    // 1. Remove tenant from tenants list
    const currentTenants = this.getTenants();
    const updatedTenants = currentTenants.filter((t) => t.id !== tenantId);
    this.saveTenants(updatedTenants, false);

    // 2. Remove all championships belonging to tenant
    const currentChamps = this.getChampionships('all');
    const updatedChamps = currentChamps.filter((c) => c.tenantId !== tenantId);
    this.saveChampionships(updatedChamps, false);

    // 3. Remove all drivers belonging to tenant
    const currentDrivers = this.getDrivers('all');
    const updatedDrivers = currentDrivers.filter((d) => d.tenantId !== tenantId);
    this.saveDrivers(updatedDrivers, false);

    // 4. Remove all teams belonging to tenant
    const currentTeams = this.getTeams('all');
    const updatedTeams = currentTeams.filter((t) => t.tenantId !== tenantId);
    this.saveTeams(updatedTeams, false);

    // 5. Clean up users: remove tenantId from tenantIds, or remove single-tenant non-supreme users
    const currentUsers = this.getUsers();
    const updatedUsers = currentUsers
      .map((u) => {
        const remainingIds = (u.tenantIds || [u.tenantId]).filter((id) => id !== tenantId);
        return {
          ...u,
          tenantIds: remainingIds,
          tenantId: u.tenantId === tenantId ? (remainingIds[0] || 'tenant-mp-racing') : u.tenantId,
        };
      })
      .filter((u) => u.role === 'supreme_admin' || (u.tenantIds && u.tenantIds.length > 0));
    this.saveUsers(updatedUsers, false);

    // 6. If deleted tenant was active tenant, switch to another
    if (this.getActiveTenantId() === tenantId) {
      const nextId = updatedTenants[0]?.id || 'tenant-mp-racing';
      this.setActiveTenantId(nextId);
    }

    // 7. Auto-sync full state to cloud
    this.triggerAutoSync({
      tenants: updatedTenants,
      championships: updatedChamps,
      drivers: updatedDrivers,
      teams: updatedTeams,
      users: updatedUsers,
    });
  },

  // CHAMPIONSHIPS
  getChampionships(tenantId?: string): Championship[] {
    const defaultList = [
      INITIAL_MP_CHAMPIONSHIP,
      INITIAL_GAUCHO_ENDURANCE_CHAMPIONSHIP,
      INITIAL_FASTEST_LAP_CHAMPIONSHIP,
    ];
    const list = safeGet<Championship[]>(STORAGE_KEYS.CHAMPIONSHIPS, defaultList);
    const cleanList = (!Array.isArray(list) || list.length === 0
      ? defaultList
      : list
    ).map(sanitizeChampionship);

    if (tenantId && tenantId !== 'global' && tenantId !== 'all') {
      return cleanList.filter((c) => c.tenantId === tenantId);
    }
    return cleanList;
  },

  saveChampionships(championships: Championship[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.CHAMPIONSHIPS, (championships || []).map(sanitizeChampionship));
    if (triggerSync) this.triggerAutoSync({ championships });
  },

  deleteChampionship(id: string, triggerSync = true): void {
    const list = this.getChampionships('all');
    const updated = list.filter((c) => c.id !== id);
    this.saveChampionships(updated, triggerSync);
    const activeId = this.getActiveChampionshipId();
    if (activeId === id && updated.length > 0) {
      this.setActiveChampionshipId(updated[0].id);
    }
  },

  // DRIVERS
  getDrivers(tenantId?: string): Driver[] {
    const list = safeGet<Driver[]>(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    const clean = (!Array.isArray(list) || list.length === 0 ? INITIAL_DRIVERS : list).map((d) => ({
      ...d,
      tenantId: d.tenantId || 'tenant-mp-racing',
      active: d.active !== false,
      kartNumber: String(d.kartNumber || '00'),
      name: d.name || 'Piloto Sem Nome',
      categoryId: d.categoryId || 'cat-geral',
    }));

    if (tenantId && tenantId !== 'global' && tenantId !== 'all') {
      return clean.filter((d) => d.tenantId === tenantId);
    }
    return clean;
  },

  saveDrivers(drivers: Driver[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.DRIVERS, drivers);
    if (triggerSync) this.triggerAutoSync({ drivers });
  },

  // TEAMS
  getTeams(tenantId?: string): Team[] {
    const list = safeGet<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    const clean = list.map((t) => ({
      ...t,
      tenantId: t.tenantId || 'tenant-mp-racing',
    }));
    if (tenantId && tenantId !== 'global' && tenantId !== 'all') {
      return clean.filter((t) => t.tenantId === tenantId);
    }
    return clean;
  },

  saveTeams(teams: Team[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.TEAMS, teams);
    if (triggerSync) this.triggerAutoSync({ teams });
  },

  // CATEGORIES
  getCategories(tenantId?: string): Category[] {
    const list = safeGet<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const clean = list.map((c) => ({
      ...c,
      tenantId: c.tenantId || 'tenant-mp-racing',
    }));
    if (tenantId && tenantId !== 'global' && tenantId !== 'all') {
      const filtered = clean.filter((c) => c.tenantId === tenantId || c.tenantId === 'global');
      if (filtered.length === 0) {
        return [
          {
            id: `cat-geral-${tenantId}`,
            name: 'Geral',
            description: 'Categoria Principal',
            tenantId,
          },
        ];
      }
      return filtered;
    }
    return clean;
  },

  saveCategories(categories: Category[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.CATEGORIES, categories);
    if (triggerSync) this.triggerAutoSync({ categories });
  },

  // MENU ITEMS & CONFIG (Sidebar Navigation)
  getMenuItems(): MenuItemConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (raw === null) {
      safeSet(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU_ITEMS);
      return DEFAULT_MENU_ITEMS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            // Regras & Etapas is open to all users
            if (item.id === 'config') {
              return { ...item, adminOnly: false };
            }
            // Gestão & Configurações is accessible by tenant admins and supreme admins
            if (item.id === 'system_settings') {
              return { ...item, label: 'Gestão & Configurações', adminOnly: true, supremeOnly: false };
            }
            return item;
          })
          .sort((a, b) => a.order - b.order);
      }
    } catch {}
    return DEFAULT_MENU_ITEMS;
  },

  saveMenuItems(items: MenuItemConfig[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.MENU_ITEMS, items);
    if (triggerSync) this.triggerAutoSync({ menuItems: items });
  },

  getDefaultMenuItems(): MenuItemConfig[] {
    return DEFAULT_MENU_ITEMS;
  },

  // CONFIG TABS (Tabs within Global Administration Panel)
  getDefaultConfigTabs(): ConfigTabConfig[] {
    return DEFAULT_CONFIG_TABS;
  },

  getConfigTabs(): ConfigTabConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG_TABS);
    if (raw === null) {
      safeSet(STORAGE_KEYS.CONFIG_TABS, DEFAULT_CONFIG_TABS);
      return DEFAULT_CONFIG_TABS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    } catch {}
    return DEFAULT_CONFIG_TABS;
  },

  saveConfigTabs(tabs: ConfigTabConfig[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.CONFIG_TABS, tabs);
    if (triggerSync) this.triggerAutoSync({ configTabs: tabs });
  },

  // SYSTEM UI LABELS (Custom page titles and action buttons)
  getSystemUiLabels(): SystemUiLabels {
    const stored = safeGet<SystemUiLabels>(STORAGE_KEYS.SYSTEM_UI_LABELS, DEFAULT_SYSTEM_UI_LABELS);
    return { ...DEFAULT_SYSTEM_UI_LABELS, ...(stored || {}) };
  },

  getUiLabels(): SystemUiLabels {
    return this.getSystemUiLabels();
  },

  saveSystemUiLabels(labels: SystemUiLabels, triggerSync = true): void {
    safeSet(STORAGE_KEYS.SYSTEM_UI_LABELS, labels);
    if (triggerSync) this.triggerAutoSync({ systemUiLabels: labels });
  },

  saveUiLabels(labels: SystemUiLabels, triggerSync = true): void {
    this.saveSystemUiLabels(labels, triggerSync);
  },

  // DISPUTE RULES (Regras de Tipo de Campeonato / Sistema de Disputa)
  getDefaultDisputeRules(): DisputeRuleConfig[] {
    return DEFAULT_DISPUTE_RULES;
  },

  getDisputeRules(): DisputeRuleConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPUTE_RULES);
    if (raw === null) {
      safeSet(STORAGE_KEYS.DISPUTE_RULES, DEFAULT_DISPUTE_RULES);
      return DEFAULT_DISPUTE_RULES;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return DEFAULT_DISPUTE_RULES;
  },

  saveDisputeRules(rules: DisputeRuleConfig[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.DISPUTE_RULES, rules);
    if (triggerSync) this.triggerAutoSync({ disputeRules: rules });
  },

  getDefaultDiscardOptions(): DiscardOptionConfig[] {
    return DEFAULT_DISCARD_OPTIONS;
  },

  // DISCARD OPTIONS
  getDiscardOptions(tenantId?: string): DiscardOptionConfig[] {
    const list = safeGet<DiscardOptionConfig[]>(STORAGE_KEYS.DISCARD_OPTIONS, DEFAULT_DISCARD_OPTIONS);
    if (tenantId && tenantId !== 'global') {
      const filtered = list.filter((d) => !d.tenantId || d.tenantId === 'global' || d.tenantId === tenantId);
      return filtered.length > 0 ? filtered : list;
    }
    return list;
  },

  saveDiscardOptions(options: DiscardOptionConfig[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.DISCARD_OPTIONS, options);
    if (triggerSync) this.triggerAutoSync({ discardOptions: options });
  },

  // USERS
  getUsers(tenantId?: string, onlyAdmins = false): User[] {
    const list = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const clean = (!Array.isArray(list) || list.length === 0 ? INITIAL_USERS : list).map((u) => ({
      ...u,
      tenantId: u.tenantId || 'tenant-mp-racing',
      active: u.active !== false,
    }));

    let result = clean;
    if (onlyAdmins) {
      result = result.filter(
        (u) =>
          u.role === 'supreme_admin' ||
          u.role === 'supreme' ||
          u.role === 'producer_admin' ||
          u.role === 'admin'
      );
    }

    if (tenantId && tenantId !== 'global') {
      return result.filter(
        (u) =>
          u.role === 'supreme_admin' ||
          u.role === 'supreme' ||
          u.tenantId === 'global' ||
          u.tenantId === tenantId ||
          (u.tenantIds && u.tenantIds.includes(tenantId))
      );
    }
    return result;
  },

  saveUsers(users: User[], triggerSync = true): void {
    safeSet(STORAGE_KEYS.USERS, users);
    if (triggerSync) this.triggerAutoSync({ users });
  },

  // AUTH SESSION (Default is logged_out, closed system)
  getAuthSession(): 'authenticated' | 'guest' | 'logged_out' {
    return safeGet<'authenticated' | 'guest' | 'logged_out'>(STORAGE_KEYS.AUTH_SESSION, 'logged_out');
  },

  setAuthSession(status: 'authenticated' | 'guest' | 'logged_out'): void {
    safeSet(STORAGE_KEYS.AUTH_SESSION, status);
  },

  getCurrentUser(): User | null {
    const user = safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (user && user.id) return user;
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      safeSet(STORAGE_KEYS.CURRENT_USER, user);
    }
  },

  login(user: User): void {
    this.setCurrentUser(user);
    this.setAuthSession('authenticated');
    if (user.tenantId && user.tenantId !== 'global') {
      this.setActiveTenantId(user.tenantId);
    }
  },

  logout(): void {
    this.setAuthSession('logged_out');
    this.setCurrentUser(null);
  },

  // NOTIFICATIONS
  getNotifications(tenantId?: string): NotificationItem[] {
    const list = safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (tenantId && tenantId !== 'global') {
      return list.filter((n) => !n.tenantId || n.tenantId === tenantId);
    }
    return list;
  },

  saveNotifications(notifications: NotificationItem[]): void {
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const list = this.getNotifications();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newItem: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: dateStr,
      read: false,
    };
    this.saveNotifications([newItem, ...list]);
    return newItem;
  },

  getActiveChampionshipId(): string {
    return safeGet<string>(STORAGE_KEYS.ACTIVE_CHAMPIONSHIP_ID, INITIAL_MP_CHAMPIONSHIP.id);
  },

  setActiveChampionshipId(id: string): void {
    safeSet(STORAGE_KEYS.ACTIVE_CHAMPIONSHIP_ID, id);
  },

  resetToDefault(): void {
    safeSet(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
    safeSet(STORAGE_KEYS.ACTIVE_TENANT_ID, 'tenant-mp-racing');
    safeSet(STORAGE_KEYS.CHAMPIONSHIPS, [INITIAL_MP_CHAMPIONSHIP, INITIAL_FASTEST_LAP_CHAMPIONSHIP]);
    safeSet(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    safeSet(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
    safeSet(STORAGE_KEYS.CURRENT_USER, null);
    safeSet(STORAGE_KEYS.AUTH_SESSION, 'logged_out');
    safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    safeSet(STORAGE_KEYS.ACTIVE_CHAMPIONSHIP_ID, INITIAL_MP_CHAMPIONSHIP.id);
    safeSet(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU_ITEMS);
    safeSet(STORAGE_KEYS.DISCARD_OPTIONS, DEFAULT_DISCARD_OPTIONS);
  },

  exportBackupJson(): string {
    const backup = {
      tenants: this.getTenants(),
      championships: this.getChampionships(),
      drivers: this.getDrivers(),
      teams: this.getTeams(),
      categories: this.getCategories(),
      users: this.getUsers(),
      notifications: this.getNotifications(),
      menuItems: this.getMenuItems(),
      discardOptions: this.getDiscardOptions(),
      configTabs: this.getConfigTabs(),
      systemUiLabels: this.getSystemUiLabels(),
      disputeRules: this.getDisputeRules(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;
      if (Array.isArray(data.tenants)) this.saveTenants(data.tenants);
      if (Array.isArray(data.championships)) this.saveChampionships(data.championships);
      if (Array.isArray(data.drivers)) this.saveDrivers(data.drivers);
      if (Array.isArray(data.teams)) this.saveTeams(data.teams);
      if (Array.isArray(data.categories)) this.saveCategories(data.categories);
      if (Array.isArray(data.users)) this.saveUsers(data.users);
      if (Array.isArray(data.notifications)) this.saveNotifications(data.notifications);
      if (Array.isArray(data.menuItems)) this.saveMenuItems(data.menuItems);
      if (Array.isArray(data.discardOptions)) this.saveDiscardOptions(data.discardOptions);
      if (Array.isArray(data.configTabs)) this.saveConfigTabs(data.configTabs);
      if (Array.isArray(data.disputeRules)) this.saveDisputeRules(data.disputeRules);
      if (data.systemUiLabels && typeof data.systemUiLabels === 'object') this.saveSystemUiLabels(data.systemUiLabels);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },
};

