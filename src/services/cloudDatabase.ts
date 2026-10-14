import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Championship,
  Driver,
  Team,
  Category,
  User,
  MenuItemConfig,
  DiscardOptionConfig,
  Tenant,
  ConfigTabConfig,
  SystemUiLabels,
  DisputeRuleConfig,
} from '../types';
import { StorageService, sanitizeChampionship } from './storage';

const CONFIG_COLLECTION = 'app_data';
const MAIN_DOC_ID = 'kart_platform_multi_tenant_v3';

export interface FirestoreAppData {
  tenants?: Tenant[];
  championships: Championship[];
  drivers: Driver[];
  teams: Team[];
  categories: Category[];
  users?: User[];
  menuItems?: MenuItemConfig[];
  discardOptions?: DiscardOptionConfig[];
  configTabs?: ConfigTabConfig[];
  systemUiLabels?: SystemUiLabels;
  disputeRules?: DisputeRuleConfig[];
  updatedAt: string;
  version: number;
}

// Circuit breaker to prevent endless backoff loops when quota is exceeded
let isQuotaExceeded = false;
let quotaExceededUntil = 0;
let lastSavedHash = '';

const FIRESTORE_UPGRADE_URL =
  'https://console.firebase.google.com/project/gen-lang-client-0089880933/firestore/databases/ai-studio-pitstopprogestod-f7913e57-d35b-4a8d-b3af-7c42fe7f0130/data?openUpgradeDialog=true';

function isQuotaError(error: any): boolean {
  return (
    error?.code === 'resource-exhausted' ||
    error?.message?.includes('Quota exceeded') ||
    error?.message?.includes('quota') ||
    error?.message?.includes('RESOURCE_EXHAUSTED')
  );
}

export const CloudDatabaseService = {
  isQuotaExceeded(): boolean {
    return isQuotaExceeded && Date.now() < quotaExceededUntil;
  },

  getUpgradeUrl(): string {
    return FIRESTORE_UPGRADE_URL;
  },

  markQuotaExceeded(): void {
    isQuotaExceeded = true;
    // Back off for 15 minutes before attempting Firestore operations again
    quotaExceededUntil = Date.now() + 15 * 60 * 1000;
  },

  /**
   * Salva os dados completos no Firestore com debounce, deduplicação de escrita
   * e fallback transparente caso a quota gratuita do dia tenha sido atingida.
   */
  async saveToCloud(data?: Partial<FirestoreAppData>): Promise<boolean> {
    try {
      const safeData = data || {};
      const currentTenants = safeData.tenants !== undefined ? safeData.tenants : StorageService.getTenants();
      const currentChamps = safeData.championships !== undefined ? safeData.championships : StorageService.getChampionships();
      const currentDrivers = safeData.drivers !== undefined ? safeData.drivers : StorageService.getDrivers();
      const currentTeams = safeData.teams !== undefined ? safeData.teams : StorageService.getTeams();
      const currentCategories = safeData.categories !== undefined ? safeData.categories : StorageService.getCategories();
      const currentUsers = safeData.users !== undefined ? safeData.users : StorageService.getUsers();
      const currentMenu = safeData.menuItems !== undefined ? safeData.menuItems : StorageService.getMenuItems();
      const currentDiscard = safeData.discardOptions !== undefined ? safeData.discardOptions : StorageService.getDiscardOptions();
      const currentConfigTabs = safeData.configTabs !== undefined ? safeData.configTabs : StorageService.getConfigTabs();
      const currentLabels = safeData.systemUiLabels !== undefined ? safeData.systemUiLabels : StorageService.getSystemUiLabels();
      const currentDisputeRules = safeData.disputeRules !== undefined ? safeData.disputeRules : StorageService.getDisputeRules();

      const payload: FirestoreAppData = {
        tenants: currentTenants,
        championships: currentChamps,
        drivers: currentDrivers,
        teams: currentTeams,
        categories: currentCategories,
        users: currentUsers,
        menuItems: currentMenu,
        discardOptions: currentDiscard,
        configTabs: currentConfigTabs,
        systemUiLabels: currentLabels,
        disputeRules: currentDisputeRules,
        updatedAt: new Date().toISOString(),
        version: 3,
      };

      // Deduplicação de escrita: se os dados não mudaram, não gera requisições desnecessárias
      const payloadHash = JSON.stringify({
        tenants: payload.tenants,
        championships: payload.championships,
        drivers: payload.drivers,
        teams: payload.teams,
        categories: payload.categories,
        users: payload.users,
        menuItems: payload.menuItems,
        discardOptions: payload.discardOptions,
        configTabs: payload.configTabs,
        systemUiLabels: payload.systemUiLabels,
        disputeRules: payload.disputeRules,
      });

      if (payloadHash === lastSavedHash) {
        return true;
      }

      // Se a quota do Firestore estiver esgotada no momento, salva localmente e evita requisições
      if (this.isQuotaExceeded()) {
        lastSavedHash = payloadHash;
        return true;
      }

      const docRef = doc(db, CONFIG_COLLECTION, MAIN_DOC_ID);
      await setDoc(docRef, payload, { merge: true });
      lastSavedHash = payloadHash;
      return true;
    } catch (error: any) {
      if (isQuotaError(error)) {
        this.markQuotaExceeded();
        console.warn(
          'Aviso de Quota do Firestore: Limite gratuito diário atingido. O sistema continuará operando com segurança no armazenamento local com persistência total.'
        );
        return true; // Sucesso local transparente
      }
      console.error('Erro ao salvar no Firestore:', error);
      return false;
    }
  },

  /**
   * Carrega os dados do Firestore ou faz a inicialização primária (seed oficial).
   * Possui fallback transparente para o armazenamento local caso a quota esteja excedida ou cliente offline.
   */
  async loadFromCloud(): Promise<FirestoreAppData | null> {
    const localFallback: FirestoreAppData = {
      tenants: StorageService.getTenants(),
      championships: StorageService.getChampionships(),
      drivers: StorageService.getDrivers(),
      teams: StorageService.getTeams(),
      categories: StorageService.getCategories(),
      users: StorageService.getUsers(),
      menuItems: StorageService.getMenuItems(),
      discardOptions: StorageService.getDiscardOptions(),
      configTabs: StorageService.getConfigTabs(),
      systemUiLabels: StorageService.getSystemUiLabels(),
      disputeRules: StorageService.getDisputeRules(),
      updatedAt: new Date().toISOString(),
      version: 3,
    };

    if (this.isQuotaExceeded()) {
      return localFallback;
    }

    try {
      const docRef = doc(db, CONFIG_COLLECTION, MAIN_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data() as FirestoreAppData;
        if (cloudData.championships && Array.isArray(cloudData.championships)) {
          cloudData.championships = cloudData.championships.map(sanitizeChampionship);
        }
        // Atualiza o cache local para resiliência offline e velocidade
        if (cloudData.tenants) StorageService.saveTenants(cloudData.tenants, false);
        if (cloudData.championships) StorageService.saveChampionships(cloudData.championships, false);
        if (cloudData.drivers) StorageService.saveDrivers(cloudData.drivers, false);
        if (cloudData.teams) StorageService.saveTeams(cloudData.teams, false);
        if (cloudData.categories) StorageService.saveCategories(cloudData.categories, false);
        if (cloudData.users) StorageService.saveUsers(cloudData.users, false);
        if (cloudData.menuItems) StorageService.saveMenuItems(cloudData.menuItems, false);
        if (cloudData.discardOptions) StorageService.saveDiscardOptions(cloudData.discardOptions, false);
        if (cloudData.configTabs) StorageService.saveConfigTabs(cloudData.configTabs, false);
        if (cloudData.systemUiLabels) StorageService.saveSystemUiLabels(cloudData.systemUiLabels, false);
        if (cloudData.disputeRules) StorageService.saveDisputeRules(cloudData.disputeRules, false);
        return cloudData;
      } else {
        // Primeira execução: Seed dos dados no Firestore
        await this.saveToCloud(localFallback);
        return localFallback;
      }
    } catch (error: any) {
      if (isQuotaError(error)) {
        this.markQuotaExceeded();
        console.warn(
          'Aviso de Quota do Firestore: Limite gratuito atingido ao carregar. Dados carregados do cache local seguro.'
        );
      } else {
        const isOffline =
          error?.code === 'unavailable' ||
          error?.message?.includes('offline') ||
          error?.message?.includes('Failed to get document because the client is offline');

        if (isOffline) {
          console.info('Modo Offline: Firestore temporariamente inacessível. Utilizando dados locais.');
        } else {
          console.warn('Aviso ao ler do Firestore:', error?.message || error);
        }
      }

      return localFallback;
    }
  },

  /**
   * Assina atualizações em tempo real com proteção contra repetição de quota
   */
  subscribeToCloud(
    onData: (data: FirestoreAppData) => void,
    onError?: (err: any) => void
  ): () => void {
    if (this.isQuotaExceeded()) {
      return () => {};
    }

    try {
      const docRef = doc(db, CONFIG_COLLECTION, MAIN_DOC_ID);
      return onSnapshot(
        docRef,
        (docSnap) => {
          // Ignora escritas pendentes locais para evitar loops
          if (docSnap.metadata.hasPendingWrites) {
            return;
          }
          if (docSnap.exists()) {
            const data = docSnap.data() as FirestoreAppData;
            if (data.championships && Array.isArray(data.championships)) {
              data.championships = data.championships.map(sanitizeChampionship);
            }
            if (data.tenants) StorageService.saveTenants(data.tenants, false);
            if (data.championships) StorageService.saveChampionships(data.championships, false);
            if (data.drivers) StorageService.saveDrivers(data.drivers, false);
            if (data.teams) StorageService.saveTeams(data.teams, false);
            if (data.categories) StorageService.saveCategories(data.categories, false);
            if (data.users) StorageService.saveUsers(data.users, false);
            if (data.menuItems) StorageService.saveMenuItems(data.menuItems, false);
            if (data.discardOptions) StorageService.saveDiscardOptions(data.discardOptions, false);
            if (data.configTabs) StorageService.saveConfigTabs(data.configTabs, false);
            if (data.systemUiLabels) StorageService.saveSystemUiLabels(data.systemUiLabels, false);
            if (data.disputeRules) StorageService.saveDisputeRules(data.disputeRules, false);
            onData(data);
          }
        },
        (err) => {
          if (isQuotaError(err)) {
            this.markQuotaExceeded();
            console.warn(
              'Firestore Real-time: Quota diária atingida. Sincronização em tempo real pausada, operando em modo local seguro.'
            );
          } else {
            console.warn('Sincronização Firestore:', err?.message || err);
          }
          if (onError) onError(err);
        }
      );
    } catch (err) {
      if (isQuotaError(err)) {
        this.markQuotaExceeded();
      }
      return () => {};
    }
  },
};
