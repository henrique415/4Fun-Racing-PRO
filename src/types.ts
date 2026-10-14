export type Role =
  | 'supreme_admin' // Admin Supremo (Admin do Sistema principal e de todos os tenants)
  | 'producer_admin' // Admin Produtora (Admin do tenant)
  | 'producer' // Produtor (Cria, edita e deleta campeonatos, equipes, pilotos, usuários e resultados)
  | 'pilot' // Piloto (Atualiza seu perfil, inscreve-se em campeonatos, vê resultados da produtora)
  | 'mechanic' // Mecânico (Atualiza seu perfil, cadastra e edita equipes, vê resultados da produtora)
  // Aliases legados para compatibilidade
  | 'supreme'
  | 'admin';

export interface Tenant {
  id: string; // Ex: 'tenant-mp-racing'
  name: string; // Ex: 'MP Racing - Produtora Oficial'
  slug: string; // Ex: 'mp-racing'
  description?: string;
  logoUrl?: string;
  primaryColor?: string; // Cor temática da produtora (ex: '#EF4444')
  adminName?: string; // Nome do administrador principal da produtora
  adminEmail: string; // E-mail principal do administrador da produtora
  contactPhone?: string;
  city?: string;
  state?: string;
  active: boolean;
  createdAt: string;
  features?: {
    allowSelfRegistration?: boolean;
    enableFastestLap?: boolean;
    enableTelemetryPhoto?: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha criptografada ou cadastrada no primeiro acesso
  role: Role;
  tenantId: string; // Tenant principal (ou 'global' para supreme_admin)
  tenantIds?: string[]; // Produtoras/Tenants que o usuário tem acesso
  driverId?: string; // Vinculado se for piloto
  teamId?: string; // Vinculado se for mecânico/chefe de equipe
  avatar?: string;
  phone?: string;
  bio?: string;
  active?: boolean;
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  sponsor?: string;
  tenantId?: string;
  logoUrl?: string;
  mechanicName?: string;
  mechanicUserId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  championshipId?: string;
  isDefault?: boolean;
}

export type ChampionshipType = 'multi_race' | 'fastest_lap' | 'standard' | 'endurance';

export interface DisputeRuleConfig {
  id: string;
  name: string;
  description: string;
  categoryType: ChampionshipType;
  defaultStagesCount: number;
  defaultRacesPerStage: number;
  scoringMode: 'points_sum' | 'best_lap_time' | 'fastest_lap_count' | 'endurance_laps';
  scheduleMode: 'same_day' | 'different_days' | 'weekly_monthly' | 'custom';
  colorTheme?: 'red' | 'amber' | 'blue' | 'purple' | 'emerald';
  iconName?: string;
  active: boolean;
  createdAt?: string;
}

export interface PointsRule {
  [position: number]: number; // 1 to 20
}

export interface RaceResult {
  driverId: string;
  position: number;
  points: number;
  pole?: boolean;
  fastestLap?: boolean;
  notes?: string;
}

export interface RaceSession {
  id: string;
  name: string; // e.g., "Bateria 1", "Bateria 2", "Corrida Principal"
  date?: string; // YYYY-MM-DD da corrida específica
  poleDriverId?: string;
  fastestLapDriverId?: string;
  results: RaceResult[];
}

export interface DriverLapRecord {
  driverId: string;
  lapTime: string; // Tempo oficial de volta (ex: "0:52.06")
  lapTimeMs: number; // Em milissegundos para ordenação precisa
  bestLap?: string; // Lap Best da telemetria (ex: "0:52.08")
  bestLapNumber?: string; // Número da melhor volta (ex: "09")
  rollingLap?: string; // Lap Rolling da telemetria (ex: "0:52.06")
  theoreticalLap?: string; // Tempo Teórico da telemetria (ex: "0:52.06")
  selectedSource?: 'best' | 'rolling' | 'manual'; // Qual volta foi mais rápida / escolhida
  sectors?: {
    s1?: string;
    s2?: string;
    s3?: string;
  };
  deviceModel?: string; // Ex: "Alfano 6", "AiM Mychron 5"
  telemetryPhotoUrl?: string; // Base64 ou URL da imagem de telemetria
  notes?: string;
  recordedAt?: string;
}

export interface Stage {
  id: string;
  stageNumber: number;
  name: string; // e.g. "JAN", "FEV", "Etapa 1 - Interlagos"
  fullName: string;
  trackName: string;
  date: string;
  completed: boolean;
  // For multi_race or standard:
  races: RaceSession[];
  // For fastest_lap type: driverId -> count of fastest laps achieved in this stage
  fastestLapCounts?: Record<string, number>;
  // For fastest_lap type: driverId -> detailed lap record with telemetry
  lapRecords?: Record<string, DriverLapRecord>;
  // Calculated or direct points cache per driver for this stage (for easy table rendering)
  stagePoints: Record<string, number>;
  // Stage podium winners (top 3 driver IDs)
  podium?: {
    first: string;
    second: string;
    third: string;
  };
}

export interface ChampionshipDocument {
  id: string;
  name: string; // Ex: "Regulamento Desportivo e Técnico 2025"
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadDate: string;
  category?: 'desportivo' | 'tecnico' | 'geral' | 'adendo';
  dataUrl?: string; // base64 / blob URL for reading or download
  summary?: string; // Summary of rules extracted from document
}

export interface Championship {
  id: string;
  tenantId?: string;
  name: string;
  season: string;
  location?: string; // Local do Campeonato (ex: Kartódromo Granja Viana)
  type: ChampionshipType;
  disputeRuleId?: string;
  disputeRuleName?: string;
  scheduleFormat?: 'same_day' | 'different_days' | 'weekly_monthly' | 'custom';
  formatDescription?: string; // e.g. "Provas de 120min com 3 stints e janela de 4min"
  categories: string[]; // Category IDs associadas a este campeonato
  customCategories?: Category[]; // Categorias criadas ou customizadas para este campeonato
  stagesCount: number;
  racesPerStage?: number; // Number of races/batteries or fastest lap sessions per stage
  pointsScale: PointsRule;
  polePoints: number;
  fastestLapPoints: number;
  discardWorstCount: number;
  discardOptions?: DiscardOptionConfig[]; // Regras de descarte vinculadas a este campeonato
  driverCategories?: Record<string, string>; // driverId -> categoryId para este campeonato
  registeredDriverIds: string[];
  stages: Stage[];
  active?: boolean; // Se false, fica oculto para pilotos e usuários normais
  regulations?: ChampionshipDocument[]; // Documentos anexados
  regulationSummary?: string; // Resumo do regulamento gerado pela IA
}

export interface Driver {
  id: string;
  tenantId?: string;
  userId?: string; // ID do Usuário do sistema atrelado (opcional)
  name: string;
  kartNumber: string;
  teamId?: string;
  categoryId?: string; // Opcional (não mais fixado no cadastro do piloto)
  categoryIds?: Record<string, string>; // championshipId -> categoryId
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  instagram?: string;
  active: boolean;
}

export interface NotificationItem {
  id: string;
  tenantId?: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'round' | 'result' | 'podium' | 'system';
  read: boolean;
}

export interface DriverStats {
  driverId: string;
  name: string;
  kartNumber: string;
  teamName: string;
  teamColor: string;
  categoryName: string;
  totalPoints: number;
  stagePoints: Record<string, number>; // stageId or stageName -> points
  podiums1st: number;
  podiums2nd: number;
  podiums3rd: number;
  totalPodiums: number;
  polesCount: number;
  fastestLapsCount: number;
  bestFinish: number;
  xp: number;
  level: number;
}

export type TabKey =
  | 'standings'
  | 'stages'
  | 'gamification'
  | 'drivers'
  | 'config'
  | 'system_settings'
  | 'tenants_mgmt'
  | 'my_profile'
  | 'my_teams';

export interface MenuItemConfig {
  id: TabKey;
  label: string;
  visible: boolean;
  order: number;
  iconName: string;
  adminOnly?: boolean;
  supremeOnly?: boolean;
}

export interface DiscardOptionConfig {
  id: string;
  count: number;
  label: string;
  enabled: boolean;
  tenantId?: string; // Regra pode ser vinculada ao tenant ou global
  championshipId?: string; // Regra vinculada a um campeonato específico
}

export type MenuItem = MenuItemConfig;
export type DiscardOption = DiscardOptionConfig;

export type ConfigTabKey =
  | 'users'
  | 'email'
  | 'tenants'
  | 'menus'
  | 'discard'
  | 'categories'
  | 'dispute_rules'
  | 'database';

export interface ConfigTabConfig {
  id: ConfigTabKey;
  label: string;
  visible: boolean;
  order: number;
  iconName: string;
}

export interface SystemUiLabels {
  appName?: string;
  appSubtitle?: string;
  // Títulos e subtítulos das páginas principais
  standingsTitle: string;
  standingsSubtitle?: string;
  stagesTitle?: string;
  racesTitle?: string;
  stagesSubtitle?: string;
  gamificationTitle?: string;
  gamificationSubtitle?: string;
  driversTitle: string;
  driversSubtitle?: string;
  configTitle?: string;
  configSubtitle?: string;
  systemSettingsTitle?: string;
  systemSettingsSubtitle?: string;
  // Nomes dos botões de ação
  launchResultsButton?: string;
  editRulesButton?: string;
  exportPdfButton?: string;
  btnExportPdf?: string;
  newChampionshipButton?: string;
  btnNewChampionship?: string;
  newDriverButton?: string;
  btnNewDriver?: string;
  newTeamButton?: string;
}
