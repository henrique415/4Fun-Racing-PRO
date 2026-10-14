import { Championship, Driver, Team, Category, User, NotificationItem, MenuItemConfig, DiscardOptionConfig, Tenant, ConfigTabConfig, SystemUiLabels, DisputeRuleConfig } from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-mp-racing',
    name: 'MP Racing',
    slug: 'mp-racing',
    description: 'Produtora oficial do Campeonato MP Racing 2026',
    primaryColor: '#EF4444',
    adminEmail: 'admin@mpracing.com',
    contactPhone: '+55 11 98888-2026',
    city: 'São Paulo',
    state: 'SP',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    features: {
      allowSelfRegistration: true,
      enableFastestLap: true,
      enableTelemetryPhoto: true,
    },
  },
  {
    id: 'tenant-fkart-brasil',
    name: 'F-Kart Brasil Championship',
    slug: 'fkart-brasil',
    description: 'Liga Interestadual de Kart Rental e Graduados',
    primaryColor: '#3B82F6',
    adminEmail: 'contato@fkartbrasil.com.br',
    contactPhone: '+55 19 97777-1010',
    city: 'Campinas',
    state: 'SP',
    active: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    features: {
      allowSelfRegistration: true,
      enableFastestLap: true,
      enableTelemetryPhoto: true,
    },
  },
  {
    id: 'tenant-speed-league',
    name: 'Speed League Pro',
    slug: 'speed-league',
    description: 'Campeonato Noturno e Pro de Endurance',
    primaryColor: '#F59E0B',
    adminEmail: 'contato@speedleague.com',
    contactPhone: '+55 31 99999-5555',
    city: 'Belo Horizonte',
    state: 'MG',
    active: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    features: {
      allowSelfRegistration: true,
      enableFastestLap: false,
      enableTelemetryPhoto: false,
    },
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-geral', name: 'Geral', description: 'Categoria Principal Geral do Campeonato', tenantId: 'tenant-mp-racing' },
  { id: 'cat-master', name: 'Master / Graduados', description: 'Pilotos experientes e graduados', tenantId: 'tenant-mp-racing' },
  { id: 'cat-light', name: 'Light / Novatos', description: 'Pilotos estreantes e desenvolvimento', tenantId: 'tenant-mp-racing' },
];

export const INITIAL_TEAMS: Team[] = [
  { id: 'team-mp', name: 'MP Scuderia Racing', color: '#EF4444', sponsor: 'MP Parts', tenantId: 'tenant-mp-racing', mechanicName: 'Mestre Zé' },
  { id: 'team-apex', name: 'Apex MotorSport', color: '#3B82F6', sponsor: 'Gulf Oil', tenantId: 'tenant-mp-racing' },
  { id: 'team-kart-pro', name: 'Kart Pro Performance', color: '#10B981', sponsor: 'Birel Art', tenantId: 'tenant-mp-racing' },
  { id: 'team-speed', name: 'Speed Devils', color: '#F59E0B', sponsor: 'Sparco', tenantId: 'tenant-mp-racing' },
  { id: 'team-thunder', name: 'Thunder Motorsport', color: '#8B5CF6', sponsor: 'Pirelli', tenantId: 'tenant-mp-racing' },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd-1', name: 'PATRICK', kartNumber: '21', teamId: 'team-mp', categoryId: 'cat-geral', email: 'patrick@mpracing.com', active: true, bio: 'Líder do campeonato, especialista em ritmo de corrida constante.', tenantId: 'tenant-mp-racing' },
  { id: 'd-2', name: 'MARCELO', kartNumber: '737', teamId: 'team-apex', categoryId: 'cat-geral', email: 'marcelo@apex.com', active: true, bio: 'Piloto arrojado, duas vitórias com pontuação máxima no ano.', tenantId: 'tenant-mp-racing' },
  { id: 'd-3', name: 'VALDIR', kartNumber: '969', teamId: 'team-kart-pro', categoryId: 'cat-geral', email: 'valdir@kartpro.com', active: true, bio: 'Veterano combativo sempre presente no pódio.', tenantId: 'tenant-mp-racing' },
  { id: 'd-4', name: 'JOSÉ', kartNumber: '59', teamId: 'team-speed', categoryId: 'cat-geral', email: 'jose@speeddevils.com', active: true, bio: 'Regularidade máxima, pontuou em todas as 8 etapas disputadas.', tenantId: 'tenant-mp-racing' },
  { id: 'd-5', name: 'RICARDO', kartNumber: '88', teamId: 'team-thunder', categoryId: 'cat-geral', email: 'ricardo@thunder.com', active: true, bio: 'Excelente piloto em pistas técnicas e chuva.', tenantId: 'tenant-mp-racing' },
  { id: 'd-6', name: 'PEDRO', kartNumber: '806', teamId: 'team-mp', categoryId: 'cat-geral', email: 'pedro@mpracing.com', active: true, bio: 'Pódios consecutivos entre Fevereiro e Maio.', tenantId: 'tenant-mp-racing' },
  { id: 'd-7', name: 'ALBERTO', kartNumber: '259', teamId: 'team-apex', categoryId: 'cat-geral', email: 'alberto@apex.com', active: true, bio: 'Vencedor dominante da etapa de Janeiro (60 pts).', tenantId: 'tenant-mp-racing' },
  { id: 'd-8', name: 'FELIPE', kartNumber: '76', teamId: 'team-kart-pro', categoryId: 'cat-geral', email: 'felipe@kartpro.com', active: true, bio: 'Pódio em Janeiro e grande retorno em Agosto.', tenantId: 'tenant-mp-racing' },
  { id: 'd-9', name: 'SERGIO', kartNumber: '11', teamId: 'team-speed', categoryId: 'cat-geral', email: 'sergio@speeddevils.com', active: true, bio: 'Piloto agressivo em ultrapassagens na frenagem.', tenantId: 'tenant-mp-racing' },
  { id: 'd-10', name: 'RUBIN', kartNumber: '38', teamId: 'team-thunder', categoryId: 'cat-geral', email: 'rubin@thunder.com', active: true, bio: 'Vice-campeão da etapa inaugural em Janeiro.', tenantId: 'tenant-mp-racing' },
  { id: 'd-11', name: 'THIAGO P', kartNumber: '15', teamId: 'team-mp', categoryId: 'cat-geral', email: 'thiagop@mpracing.com', active: true, bio: 'Crescimento consistente na reta final do campeonato.', tenantId: 'tenant-mp-racing' },
  { id: 'd-12', name: 'RONI', kartNumber: '886', teamId: 'team-apex', categoryId: 'cat-geral', email: 'roni@apex.com', active: true, bio: 'Especialista em largadas rápidas.', tenantId: 'tenant-mp-racing' },
  { id: 'd-13', name: 'MATHEUS', kartNumber: '281', teamId: 'team-kart-pro', categoryId: 'cat-geral', email: 'matheus@kartpro.com', active: true, bio: 'Grande corrida e pódio em Março (34 pts).', tenantId: 'tenant-mp-racing' },
  { id: 'd-14', name: 'JOSE RICARD', kartNumber: '230', teamId: 'team-speed', categoryId: 'cat-geral', email: 'josericard@speeddevils.com', active: true, bio: 'Estreia de gala em Agosto conquistando 42 pontos.', tenantId: 'tenant-mp-racing' },
  { id: 'd-15', name: 'ELIZANDRO', kartNumber: '187', teamId: 'team-thunder', categoryId: 'cat-geral', email: 'elizandro@thunder.com', active: true, bio: 'Piloto veloz na etapa inaugural de Janeiro.', tenantId: 'tenant-mp-racing' },
  { id: 'd-16', name: 'BRUNO', kartNumber: '886', teamId: 'team-mp', categoryId: 'cat-geral', email: 'bruno@mpracing.com', active: true, bio: 'Top 10 garantido no início da temporada.', tenantId: 'tenant-mp-racing' },
  { id: 'd-17', name: 'MARCOS RO', kartNumber: '7', teamId: 'team-apex', categoryId: 'cat-geral', email: 'marcosro@apex.com', active: true, bio: 'Grande pontuação em sua participação em Agosto.', tenantId: 'tenant-mp-racing' },
  { id: 'd-18', name: 'HENRIQUE', kartNumber: '188', teamId: 'team-kart-pro', categoryId: 'cat-geral', email: 'henrique@g4f.capital', active: true, bio: 'Piloto veloz em ascensão técnica, pontuou nas etapas de Março e Agosto.', tenantId: 'tenant-mp-racing' },
];

export const INITIAL_POINTS_SCALE: Record<number, number> = {
  1: 30,
  2: 25,
  3: 21,
  4: 18,
  5: 16,
  6: 15,
  7: 14,
  8: 13,
  9: 12,
  10: 11,
  11: 10,
  12: 9,
  13: 8,
  14: 7,
  15: 6,
  16: 5,
  17: 4,
  18: 3,
  19: 2,
  20: 1,
};

// Sheet Stage Points exactly mapped:
const SHEET_POINTS: Record<string, number[]> = {
  'd-1': [47, 36, 32, 36, 38, 22, 20, 60, 0, 0, 0, 0], // PATRICK (291)
  'd-2': [62, 38, 38, 31, 20, 0, 18, 62, 0, 0, 0, 0],  // MARCELO (269)
  'd-3': [58, 44, 20, 32, 13, 15, 22, 60, 0, 0, 0, 0], // VALDIR (264)
  'd-4': [38, 28, 30, 31, 34, 13, 15, 39, 0, 0, 0, 0], // JOSÉ (228)
  'd-5': [38, 29, 27, 31, 15, 14, 16, 46, 0, 0, 0, 0], // RICARDO (216)
  'd-6': [28, 40, 22, 44, 40, 20, 16, 0, 0, 0, 0, 0],  // PEDRO (210)
  'd-7': [60, 20, 16, 0, 22, 16, 0, 38, 0, 0, 0, 0],   // ALBERTO (172)
  'd-8': [46, 14, 0, 0, 32, 0, 0, 43, 0, 0, 0, 0],     // FELIPE (135)
  'd-9': [18, 0, 0, 0, 40, 18, 22, 33, 0, 0, 0, 0],    // SERGIO (131)
  'd-10': [59, 0, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0],      // RUBIN (101)
  'd-11': [0, 0, 13, 0, 12, 0, 13, 36, 0, 0, 0, 0],    // THIAGO P (74)
  'd-12': [34, 14, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0],     // RONI (62)
  'd-13': [15, 0, 34, 0, 0, 0, 0, 0, 0, 0, 0, 0],      // MATHEUS (49)
  'd-14': [0, 0, 0, 0, 0, 0, 0, 42, 0, 0, 0, 0],       // JOSE RICARD (42)
  'd-15': [37, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],       // ELIZANDRO (37)
  'd-16': [30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],       // BRUNO (30)
  'd-17': [0, 0, 0, 0, 0, 0, 0, 28, 0, 0, 0, 0],       // MARCOS RO (28)
  'd-18': [0, 0, 13, 0, 0, 0, 0, 14, 0, 0, 0, 0],      // HENRIQUE (27)
};

const STAGE_CONFIGS = [
  { code: 'JAN', name: '1ª Etapa - Janeiro (Interlagos)', track: 'Kartódromo Granja Viana', date: '2026-01-24', completed: true },
  { code: 'FEV', name: '2ª Etapa - Fevereiro (Aldeia)', track: 'Kartódromo Aldeia da Serra', date: '2026-02-21', completed: true },
  { code: 'MAR', name: '3ª Etapa - Março (Speedland)', track: 'Speedland Kartódromo', date: '2026-03-21', completed: true },
  { code: 'ABR', name: '4ª Etapa - Abril (San Marino)', track: 'Kartódromo San Marino', date: '2026-04-18', completed: true },
  { code: 'MAI', name: '5ª Etapa - Maio (Itu Kart)', track: 'Kartódromo Arena Itu', date: '2026-05-16', completed: true },
  { code: 'JUN', name: '6ª Etapa - Junho (Interlagos Sul)', track: 'Kartódromo de Interlagos', date: '2026-06-20', completed: true },
  { code: 'JUL', name: '7ª Etapa - Julho (Granja Invertida)', track: 'Kartódromo Granja Viana', date: '2026-07-18', completed: true },
  { code: 'AGO', name: '8ª Etapa - Agosto (Speed GP)', track: 'Kartódromo Internacional Nova Odessa', date: '2026-08-22', completed: true },
  { code: 'SET', name: '9ª Etapa - Setembro (Super Pole)', track: 'Kartódromo de Betim', date: '2026-09-26', completed: false },
  { code: 'OUT', name: '10ª Etapa - Outubro (Nocturne GP)', track: 'Kartódromo Granja Viana', date: '2026-10-24', completed: false },
  { code: 'NOV', name: '11ª Etapa - Novembro (Endurance)', track: 'Kartódromo San Marino', date: '2026-11-21', completed: false },
  { code: 'DEZ', name: '12ª Etapa - Dezembro (Grande Final)', track: 'Kartódromo de Interlagos', date: '2026-12-12', completed: false },
];

export const INITIAL_MP_CHAMPIONSHIP: Championship = {
  id: 'champ-mp-2026',
  tenantId: 'tenant-mp-racing',
  name: 'MP RACING 2026 - CLASSIFICAÇÃO',
  season: '2026',
  type: 'multi_race', // Multi-corrida / baterias por etapa acumulando para o torneio
  categories: ['cat-geral', 'cat-master', 'cat-light'],
  stagesCount: 12,
  racesPerStage: 2,
  pointsScale: INITIAL_POINTS_SCALE,
  polePoints: 1,
  fastestLapPoints: 1,
  discardWorstCount: 0, // Sem Descarte conforme a planilha
  registeredDriverIds: INITIAL_DRIVERS.map(d => d.id),
  stages: STAGE_CONFIGS.map((conf, index) => {
    const stagePoints: Record<string, number> = {};
    INITIAL_DRIVERS.forEach(d => {
      const pts = SHEET_POINTS[d.id] ? SHEET_POINTS[d.id][index] : 0;
      if (pts > 0) {
        stagePoints[d.id] = pts;
      }
    });

    // Determine top 3 for completed stages
    const sorted = Object.entries(stagePoints).sort((a, b) => b[1] - a[1]);
    const podium = conf.completed && sorted.length >= 3 ? {
      first: sorted[0][0],
      second: sorted[1][0],
      third: sorted[2][0],
    } : undefined;

    return {
      id: `stage-${conf.code.toLowerCase()}`,
      stageNumber: index + 1,
      name: conf.code,
      fullName: conf.name,
      trackName: conf.track,
      date: conf.date,
      completed: conf.completed,
      stagePoints,
      podium,
      races: conf.completed ? [
        {
          id: `race-${conf.code}-b1`,
          name: 'Bateria 1',
          results: sorted.map((s, pos) => ({
            driverId: s[0],
            position: pos + 1,
            points: Math.round(s[1] / 2),
            pole: pos === 0,
          })),
          poleDriverId: sorted[0]?.[0],
        },
        {
          id: `race-${conf.code}-b2`,
          name: 'Bateria 2 (Grid Invertido Top 6)',
          results: sorted.map((s, pos) => ({
            driverId: s[0],
            position: pos + 1,
            points: Math.floor(s[1] / 2),
            fastestLap: pos === 0,
          })),
          fastestLapDriverId: sorted[0]?.[0],
        }
      ] : [],
    };
  }),
};

// Second Championship: Fastest Lap Championship (Torneio de Volta Rápida 2026)
export const INITIAL_FASTEST_LAP_CHAMPIONSHIP: Championship = {
  id: 'champ-fastest-lap-2026',
  tenantId: 'tenant-speed-league',
  name: 'TROFÉU SPEED KING - VOLTA RÁPIDA 2026',
  season: '2026',
  type: 'fastest_lap',
  categories: ['cat-geral'],
  stagesCount: 8,
  racesPerStage: 4,
  pointsScale: { 1: 10, 2: 7, 3: 5, 4: 3, 5: 1 },
  polePoints: 0,
  fastestLapPoints: 0,
  discardWorstCount: 0,
  registeredDriverIds: INITIAL_DRIVERS.slice(0, 12).map(d => d.id),
  stages: [
    {
      id: 'fl-stage-1',
      stageNumber: 1,
      name: 'ETAPA 1 - INTERLAGOS',
      fullName: 'Etapa 1 - Interlagos VR',
      trackName: 'Kartódromo de Interlagos',
      date: '2026-01-24',
      completed: true,
      stagePoints: { 'd-2': 10, 'd-1': 7, 'd-7': 5, 'd-3': 3, 'd-5': 2 },
      fastestLapCounts: { 'd-2': 1 },
      podium: { first: 'd-2', second: 'd-1', third: 'd-7' },
      lapRecords: {
        'd-2': {
          driverId: 'd-2',
          lapTime: '0:52.06',
          lapTimeMs: 52060,
          bestLap: '0:52.08',
          rollingLap: '0:52.06',
          theoreticalLap: '0:52.06',
          selectedSource: 'rolling',
          deviceModel: 'Alfano 6 (Telemetria)',
          sectors: { s1: '0:18.75', s2: '0:22.61', s3: '0:10.70' },
          notes: 'Volta Rolling (0:52.06) foi 0.02s mais rápida que Best Lap (0:52.08) e definida como oficial pela IA',
          recordedAt: '2026-01-24T15:30:00Z',
        },
        'd-1': {
          driverId: 'd-1',
          lapTime: '0:52.08',
          lapTimeMs: 52080,
          bestLap: '0:52.08',
          rollingLap: '0:52.15',
          theoreticalLap: '0:52.08',
          selectedSource: 'best',
          deviceModel: 'Alfano 6',
          sectors: { s1: '0:18.75', s2: '0:22.61', s3: '0:10.72' },
          notes: 'Volta Best selecionada',
          recordedAt: '2026-01-24T15:31:00Z',
        },
        'd-7': {
          driverId: 'd-7',
          lapTime: '0:52.23',
          lapTimeMs: 52230,
          selectedSource: 'manual',
          notes: 'Cronometragem oficial de pista',
          recordedAt: '2026-01-24T15:32:00Z',
        },
        'd-3': {
          driverId: 'd-3',
          lapTime: '0:52.41',
          lapTimeMs: 52410,
          selectedSource: 'manual',
          recordedAt: '2026-01-24T15:33:00Z',
        },
        'd-5': {
          driverId: 'd-5',
          lapTime: '0:52.65',
          lapTimeMs: 52650,
          selectedSource: 'manual',
          recordedAt: '2026-01-24T15:34:00Z',
        },
      },
      races: [],
    },
    {
      id: 'fl-stage-2',
      stageNumber: 2,
      name: 'ETAPA 2 - ALDEIA',
      fullName: 'Etapa 2 - Aldeia da Serra VR',
      trackName: 'Kartódromo Aldeia da Serra',
      date: '2026-02-21',
      completed: true,
      stagePoints: { 'd-3': 10, 'd-6': 7, 'd-2': 5, 'd-1': 3 },
      fastestLapCounts: { 'd-3': 1 },
      podium: { first: 'd-3', second: 'd-6', third: 'd-2' },
      lapRecords: {
        'd-3': {
          driverId: 'd-3',
          lapTime: '0:48.91',
          lapTimeMs: 48910,
          selectedSource: 'rolling',
          deviceModel: 'Mychron 5',
          notes: 'Volta Rolling validada',
          recordedAt: '2026-02-21T14:10:00Z',
        },
        'd-6': {
          driverId: 'd-6',
          lapTime: '0:48.98',
          lapTimeMs: 48980,
          selectedSource: 'manual',
          recordedAt: '2026-02-21T14:11:00Z',
        },
        'd-2': {
          driverId: 'd-2',
          lapTime: '0:49.05',
          lapTimeMs: 49050,
          selectedSource: 'best',
          deviceModel: 'Alfano 6',
          recordedAt: '2026-02-21T14:12:00Z',
        },
      },
      races: [],
    },
    {
      id: 'fl-stage-3',
      stageNumber: 3,
      name: 'ETAPA 3 - SPEEDLAND',
      fullName: 'Etapa 3 - Speedland VR',
      trackName: 'Speedland Kartódromo',
      date: '2026-03-21',
      completed: false,
      stagePoints: {},
      fastestLapCounts: {},
      lapRecords: {},
      races: [],
    },
    {
      id: 'fl-stage-4',
      stageNumber: 4,
      name: 'ETAPA 4 - SAN MARINO',
      fullName: 'Etapa 4 - San Marino VR',
      trackName: 'Kartódromo San Marino',
      date: '2026-04-18',
      completed: false,
      stagePoints: {},
      fastestLapCounts: {},
      lapRecords: {},
      races: [],
    }
  ]
};

// Third Championship: Federação Gaúcha de Automobilismo - Campeonato Gaúcho de Endurance 2025
export const INITIAL_GAUCHO_ENDURANCE_CHAMPIONSHIP: Championship = {
  id: 'champ-gaucho-endurance-2025',
  tenantId: 'tenant-fkart-brasil',
  name: 'Campeonato Gaúcho de Endurance 2025',
  season: '2025',
  location: 'Rio Grande do Sul (Tarumã / Guaporé / Velopark)',
  type: 'endurance',
  disputeRuleId: 'rule-endurance',
  disputeRuleName: 'Endurance Oficial FGA (Provas de 120min / 3 Stints)',
  scheduleFormat: 'weekly_monthly',
  formatDescription: 'Provas de média duração com 120 minutos (3 stints) com janela obrigatória de 4 minutos para troca de pilotos e abastecimento. Grid definido pela melhor volta em treino classificatório de 15 minutos.',
  categories: ['cat-p1', 'cat-p2', 'cat-p3', 'cat-p4', 'cat-gt1', 'cat-gt2', 'cat-gt'],
  customCategories: [
    { id: 'cat-p1', name: 'Categoria P1', description: 'Protótipos nacionais baseados em JLM AJR ou Sigma P1 G5 (Homologados e BoP)', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
    { id: 'cat-p2', name: 'Categoria P2', description: 'Protótipos nacionais de construção mais antiga (MCR, MRX, MR18)', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
    { id: 'cat-p3', name: 'Categoria P3', description: 'Sport Protótipos até 2300cm³ multiválvulas e motor motocicleta até 1507cm³', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
    { id: 'cat-p4', name: 'Categoria P4', description: 'Protótipos Spyder, Aldee, MCR e MRX até 2150cm³', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
    { id: 'cat-gt1', name: 'Categoria GT1', description: 'Veículos FIA GT3 até 2012, Turismo >2500cm³ sobrealimentados, JL G09 e Linea Turbo', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
    { id: 'cat-gt2', name: 'Categoria GT2', description: 'Veículos 1300 a 2100cm³ sobrealimentados, Audi DTCC, Vettore e Turismo até 2500cm³ aspirados', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
    { id: 'cat-gt', name: 'Categoria GT', description: 'Veículos de Turismo até 2100cm³ Multiválvulas e 8V aspirados', tenantId: 'tenant-mp-racing', championshipId: 'champ-gaucho-endurance-2025' },
  ],
  stagesCount: 5,
  racesPerStage: 1,
  pointsScale: {
    1: 100,
    2: 80,
    3: 65,
    4: 55,
    5: 50,
    6: 45,
    7: 40,
    8: 35,
    9: 30,
    10: 25,
    11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
  },
  polePoints: 0,
  fastestLapPoints: 0,
  discardWorstCount: 1, // Descarte obrigatório de uma prova (N-1) conforme Art. 8.5
  registeredDriverIds: INITIAL_DRIVERS.map((d) => d.id),
  driverCategories: {
    'd-1': 'cat-p1',
    'd-2': 'cat-p1',
    'd-3': 'cat-p2',
    'd-4': 'cat-p3',
    'd-5': 'cat-gt1',
    'd-6': 'cat-gt2',
    'd-7': 'cat-p1',
    'd-8': 'cat-gt',
    'd-18': 'cat-p1',
  },
  active: true,
  regulationSummary: 'Regulamento Desportivo e Técnico 2025 oficial homologado pela Federação Gaúcha de Automobilismo (FGA) e Conselho Técnico Desportivo Estadual (CTDE). Válido para provas de 120 minutos (3 stints) com janelas de 4 minutos para reabastecimento e troca de pilotos. Pontuação oficial do 1º ao 10º (100 a 25 pts) e descarte obrigatório de uma prova (N-1).',
  regulations: [
    {
      id: 'doc-fga-2025',
      name: 'Regulamento Desportivo e Técnico 2025 (FGA)',
      fileName: 'Regulamento_Desportivo_e_Tecnico_Endurance_2025_FGA.pdf',
      fileType: 'application/pdf',
      fileSize: 1428500,
      uploadDate: '2025-03-06T12:00:00Z',
      category: 'geral',
      summary: 'Regulamento completo e oficial de 33 páginas contendo normas desportivas e técnicas para protótipos P1, P2, P3, P4 e carros GT, procedimentos de boxes, torres de abastecimento de 200L e vistorias.',
    },
    {
      id: 'doc-fga-adendo-1',
      name: 'Adendo Técnico 01/2025 - Procedimento de Box e Janelas',
      fileName: 'Adendo_Tecnico_01_2025_Janelas_Box.pdf',
      fileType: 'application/pdf',
      fileSize: 420300,
      uploadDate: '2025-03-15T10:00:00Z',
      category: 'adendo',
      summary: 'Esclarecimentos sobre o tempo mínimo de permanência de 4 minutos em box e velocidade limite de 60 km/h no pitlane.',
    }
  ],
  stages: [
    {
      id: 'end-stage-1',
      stageNumber: 1,
      name: 'ETAPA 1 - TARUMÃ',
      fullName: '1ª Etapa - 120 Minutos de Tarumã',
      trackName: 'Autódromo Internacional de Tarumã (Viamão/RS)',
      date: '2025-04-12',
      completed: true,
      stagePoints: {
        'd-1': 100, // Patrick (P1)
        'd-2': 80,  // Marcelo (P1)
        'd-7': 65,  // Alberto (P1)
        'd-3': 100, // Valdir (P2)
        'd-4': 100, // José (P3)
        'd-5': 100, // Ricardo (GT1)
        'd-6': 80,  // Pedro (GT2)
        'd-8': 100, // Felipe (GT)
        'd-18': 55, // Henrique (P1)
      },
      podium: { first: 'd-1', second: 'd-2', third: 'd-7' },
      races: [
        {
          id: 'end-race-1',
          name: 'Prova de 120 Minutos',
          poleDriverId: 'd-2',
          fastestLapDriverId: 'd-1',
          results: [
            { driverId: 'd-1', position: 1, points: 100, fastestLap: true },
            { driverId: 'd-2', position: 2, points: 80, pole: true },
            { driverId: 'd-7', position: 3, points: 65 },
            { driverId: 'd-18', position: 4, points: 55 },
            { driverId: 'd-3', position: 5, points: 50 },
          ],
        },
      ],
    },
    {
      id: 'end-stage-2',
      stageNumber: 2,
      name: 'ETAPA 2 - GUAPORÉ',
      fullName: '2ª Etapa - 120 Minutos de Guaporé',
      trackName: 'Autódromo Internacional de Guaporé (Guaporé/RS)',
      date: '2025-06-07',
      completed: true,
      stagePoints: {
        'd-2': 100,
        'd-1': 80,
        'd-18': 65,
        'd-7': 55,
        'd-3': 80,
        'd-5': 100,
      },
      podium: { first: 'd-2', second: 'd-1', third: 'd-18' },
      races: [
        {
          id: 'end-race-2',
          name: 'Prova de 120 Minutos',
          poleDriverId: 'd-1',
          fastestLapDriverId: 'd-2',
          results: [
            { driverId: 'd-2', position: 1, points: 100, fastestLap: true },
            { driverId: 'd-1', position: 2, points: 80, pole: true },
            { driverId: 'd-18', position: 3, points: 65 },
            { driverId: 'd-7', position: 4, points: 55 },
          ],
        },
      ],
    },
    {
      id: 'end-stage-3',
      stageNumber: 3,
      name: 'ETAPA 3 - VELOPARK',
      fullName: '3ª Etapa - 120 Minutos do Velopark',
      trackName: 'Autódromo Velopark (Nova Santa Rita/RS)',
      date: '2025-08-09',
      completed: false,
      stagePoints: {},
      races: [],
    },
    {
      id: 'end-stage-4',
      stageNumber: 4,
      name: 'ETAPA 4 - TARUMÃ',
      fullName: '4ª Etapa - 120 Minutos Noturno Tarumã',
      trackName: 'Autódromo Internacional de Tarumã (Viamão/RS)',
      date: '2025-10-18',
      completed: false,
      stagePoints: {},
      races: [],
    },
    {
      id: 'end-stage-5',
      stageNumber: 5,
      name: 'ETAPA 5 - GUAPORÉ',
      fullName: '5ª Etapa - Grande Final Endurance RS',
      trackName: 'Autódromo Internacional de Guaporé (Guaporé/RS)',
      date: '2025-11-29',
      completed: false,
      stagePoints: {},
      races: [],
    },
  ],
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-supreme',
    name: 'Henrique (Admin Supremo)',
    email: 'henrique@g4f.capital',
    role: 'supreme_admin',
    tenantId: 'global',
    driverId: 'd-18',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    phone: '+55 11 99999-0001',
    bio: 'Administrador Supremo do Sistema Kart Racing Global',
    active: true,
  },
  {
    id: 'user-admin',
    name: 'Diretoria MP (Admin Produtora)',
    email: 'admin@mpracing.com',
    role: 'producer_admin',
    tenantId: 'tenant-mp-racing',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    phone: '+55 11 98888-2026',
    bio: 'Gestão executiva e administrativa do Tenant MP Racing',
    active: true,
  },
  {
    id: 'user-producer',
    name: 'Carlos Oliveira (Produtor)',
    email: 'produtor@mpracing.com',
    role: 'producer',
    tenantId: 'tenant-mp-racing',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    phone: '+55 11 97777-3333',
    bio: 'Diretor de Prova e Produtor Operacional de Pista',
    active: true,
  },
  {
    id: 'user-patrick',
    name: 'Patrick (Piloto #21 - Líder)',
    email: 'patrick@mpracing.com',
    role: 'pilot',
    tenantId: 'tenant-mp-racing',
    driverId: 'd-1',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    phone: '+55 11 96666-2121',
    bio: 'Piloto titular MP Scuderia Racing #21',
    active: true,
  },
  {
    id: 'user-marcelo',
    name: 'Marcelo (Piloto #737 - Vice)',
    email: 'marcelo@apex.com',
    role: 'pilot',
    tenantId: 'tenant-mp-racing',
    driverId: 'd-2',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    phone: '+55 11 95555-7373',
    bio: 'Piloto Apex MotorSport #737',
    active: true,
  },
  {
    id: 'user-mechanic',
    name: 'Mestre Zé (Mecânico / Equipe MP)',
    email: 'mecanico@mpracing.com',
    role: 'mechanic',
    tenantId: 'tenant-mp-racing',
    teamId: 'team-mp',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    phone: '+55 11 94444-1122',
    bio: 'Chefe de Oficina e Mecânica da MP Scuderia Racing',
    active: true,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '🏆 Resultado Oficial: 8ª Etapa (Agosto) Homologado!',
    message: 'A pontuação da 8ª Etapa foi computada. Patrick assumiu a liderança geral com 291 pontos!',
    timestamp: '2026-08-23 18:30',
    type: 'result',
    read: false,
  },
  {
    id: 'notif-2',
    title: '🏁 Inscrições Abertas: 9ª Etapa - Setembro (Betim)',
    message: 'Pilotos já podem confirmar presença e verificar a bateria classificatória.',
    timestamp: '2026-09-15 09:00',
    type: 'round',
    read: false,
  },
  {
    id: 'notif-3',
    title: '🎖️ Pódio Consagrado - Patrick, Marcelo e Valdir',
    message: 'Parabéns aos três primeiros colocados que conquistaram troféus e badges exclusivas.',
    timestamp: '2026-08-22 20:00',
    type: 'podium',
    read: true,
  },
];

export const DEFAULT_MENU_ITEMS: MenuItemConfig[] = [
  { id: 'standings', label: 'Classificação', visible: true, order: 1, iconName: 'Trophy' },
  { id: 'stages', label: 'Etapas & Baterias', visible: true, order: 2, iconName: 'Calendar' },
  { id: 'gamification', label: 'Pódios & Ranking XP', visible: true, order: 3, iconName: 'Award' },
  { id: 'drivers', label: 'Pilotos & Equipes', visible: true, order: 4, iconName: 'Users' },
  { id: 'config', label: 'Regras & Etapas', visible: true, order: 5, iconName: 'Sliders', adminOnly: false },
  { id: 'system_settings', label: 'Gestão & Configurações', visible: true, order: 6, iconName: 'Settings', adminOnly: true, supremeOnly: false },
];

export const DEFAULT_DISCARD_OPTIONS: DiscardOptionConfig[] = [
  { id: 'discard-0', count: 0, label: '0 (Sem Descarte)', enabled: true },
  { id: 'discard-1', count: 1, label: 'Descartar 1 Pior', enabled: true },
  { id: 'discard-2', count: 2, label: 'Descartar 2 Piores', enabled: true },
  { id: 'discard-3', count: 3, label: 'Descartar 3 Piores', enabled: true },
  { id: 'discard-4', count: 4, label: 'Descartar 4 Piores', enabled: true },
  { id: 'discard-5', count: 5, label: 'Descartar 5 Piores', enabled: true },
];

export const DEFAULT_CONFIG_TABS: ConfigTabConfig[] = [
  { id: 'users', label: 'Usuários', visible: true, order: 1, iconName: 'Users' },
  { id: 'email', label: 'Envio de e-mail', visible: true, order: 2, iconName: 'Mail' },
  { id: 'tenants', label: 'Produtoras e tenants', visible: true, order: 3, iconName: 'Building2' },
  { id: 'menus', label: 'Configurações de menu', visible: true, order: 4, iconName: 'Menu' },
  { id: 'discard', label: 'Regras de descartes', visible: true, order: 5, iconName: 'Flag' },
  { id: 'categories', label: 'Categorias', visible: true, order: 6, iconName: 'Tag' },
  { id: 'dispute_rules', label: 'Sistemas de Disputa', visible: true, order: 7, iconName: 'Trophy' },
  { id: 'database', label: 'Banco de dados oficial', visible: true, order: 8, iconName: 'Database' },
];

export const DEFAULT_DISPUTE_RULES: DisputeRuleConfig[] = [
  {
    id: 'rule-multi-race',
    name: 'Multi-Baterias por Etapa (Semanal / Mensal)',
    description: 'Cada etapa possui mais de uma corrida (ex: 2 a 5 baterias semanais). A pontuação da etapa define o vencedor e acumula na classificação geral da temporada.',
    categoryType: 'multi_race',
    defaultStagesCount: 12,
    defaultRacesPerStage: 2,
    scoringMode: 'points_sum',
    scheduleMode: 'weekly_monthly',
    colorTheme: 'red',
    iconName: 'Flag',
    active: true,
  },
  {
    id: 'rule-fastest-lap',
    name: 'Torneio de Volta Rápida (Telemetria)',
    description: 'Disputa focada no cronômetro oficial: quem cravar mais voltas rápidas na sessão ou fim de semana vence a etapa e acumula pontos na classificação anual.',
    categoryType: 'fastest_lap',
    defaultStagesCount: 12,
    defaultRacesPerStage: 4,
    scoringMode: 'best_lap_time',
    scheduleMode: 'weekly_monthly',
    colorTheme: 'amber',
    iconName: 'Zap',
    active: true,
  },
  {
    id: 'rule-standard',
    name: 'Corrida Direta / Padrão (F1 Style)',
    description: 'Uma corrida direta e decisiva por etapa, com pontuação imediata do 1º ao 20º colocado e suporte completo a regras de descarte de resultados.',
    categoryType: 'standard',
    defaultStagesCount: 10,
    defaultRacesPerStage: 1,
    scoringMode: 'points_sum',
    scheduleMode: 'same_day',
    colorTheme: 'blue',
    iconName: 'Trophy',
    active: true,
  },
  {
    id: 'rule-endurance',
    name: 'Endurance de Longa Duração (Revezamento)',
    description: 'Competição de resistência e longa duração (2h a 12h), com pontuação baseada no total de voltas completadas, paradas de box e revezamento de pilotos por equipe.',
    categoryType: 'endurance',
    defaultStagesCount: 6,
    defaultRacesPerStage: 1,
    scoringMode: 'endurance_laps',
    scheduleMode: 'same_day',
    colorTheme: 'purple',
    iconName: 'Clock',
    active: true,
  },
  {
    id: 'rule-triple-same-day',
    name: '3 Baterias no Mesmo Dia (Rodada Tripla)',
    description: 'Todas as 3 baterias da etapa são realizadas no mesmo dia (ex: Treino/Pole + Bateria 1 + Bateria 2 invertida + Final), pontuando individualmente.',
    categoryType: 'multi_race',
    defaultStagesCount: 8,
    defaultRacesPerStage: 3,
    scoringMode: 'points_sum',
    scheduleMode: 'same_day',
    colorTheme: 'emerald',
    iconName: 'Layers',
    active: true,
  },
  {
    id: 'rule-split-days',
    name: 'Baterias em Dias Diferentes (Mesma Etapa)',
    description: 'Baterias distribuídas ao longo de dias diferentes da mesma semana/etapa (ex: sábado bateria 1, domingo bateria 2), somando pontos para o pódio da etapa.',
    categoryType: 'multi_race',
    defaultStagesCount: 8,
    defaultRacesPerStage: 2,
    scoringMode: 'points_sum',
    scheduleMode: 'different_days',
    colorTheme: 'amber',
    iconName: 'Calendar',
    active: true,
  },
];

export const DEFAULT_SYSTEM_UI_LABELS: SystemUiLabels = {
  appName: 'PITSTOP PRO',
  appSubtitle: 'Plataforma Multi-Produtora de Gestão de Campeonatos',
  standingsTitle: 'Classificação Geral Consolidada',
  standingsSubtitle: 'MP RACING 2026 - CLASSIFICAÇÃO • Temporada 2026 • Multi-Baterias por Etapa',
  stagesTitle: 'Calendário de Etapas & Baterias',
  stagesSubtitle: 'Programação de baterias, tomadas de tempo e resultados oficiais',
  gamificationTitle: 'Pódios, Conquistas & Ranking Global',
  gamificationSubtitle: 'Galeria de troféus, pontuação XP e destaques da temporada',
  driversTitle: 'Mural de Pilotos & Escuderias',
  driversSubtitle: 'Fichas técnicas, histórico de corridas e detalhes dos competidores',
  configTitle: 'Configurações de Campeonato & Regras',
  configSubtitle: 'Regulamentos de pontuação, descartes e parâmetros técnicos',
  systemSettingsTitle: 'Painel de Administração & Configurações Globais',
  systemSettingsSubtitle: 'Multi-Tenant • 5 Perfis RBAC • Gestão Centralizada',
  launchResultsButton: 'Lançar Resultados (IA)',
  editRulesButton: 'Editar Regras',
  exportPdfButton: 'Baixar Tabela (PDF)',
  newChampionshipButton: '+ Novo Campeonato',
  newDriverButton: '+ Novo Piloto',
  newTeamButton: '+ Nova Equipe',
};

