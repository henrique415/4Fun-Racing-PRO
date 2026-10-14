import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Sliders,
  Flag,
  Calendar,
  Zap,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Check,
  CalendarDays,
  Trophy,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  FileText,
  UploadCloud,
  Bot,
  Paperclip,
  AlertTriangle,
  Eye,
  Loader2,
  Download,
} from 'lucide-react';
import { Championship, ChampionshipType, Category, PointsRule, Stage, RaceSession, DisputeRuleConfig, ChampionshipDocument } from '../types';
import { INITIAL_POINTS_SCALE } from '../data/initialData';
import { getWeekendsCountInMonth, MONTH_CODES, MONTH_FULL_NAMES } from '../utils/calendar';
import { StorageService } from '../services/storage';
import { RegulationAiService } from '../services/regulationAiService';

interface ChampionshipConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  championship?: Championship;
  categories: Category[];
  activeTenantId?: string;
  onSaveChampionship: (championship: Championship) => void;
  onDeleteChampionship?: (id: string) => void;
}

const DEFAULT_TRACK_SUGGESTIONS = [
  'Kartódromo Granja Viana',
  'Kartódromo Aldeia da Serra',
  'Kartódromo Internacional de Interlagos',
  'Speedland Kartódromo',
  'Kartódromo San Marino',
  'Kartódromo Arena Itu',
  'Kartódromo Betim',
  'Kartódromo Nova Odessa',
];

// Helper: Calculate all Saturdays of a specific month in a year
function getSaturdaysOfMonth(year: number, monthIndex: number): string[] {
  const saturdays: string[] = [];
  const date = new Date(year, monthIndex, 1);
  while (date.getMonth() === monthIndex) {
    if (date.getDay() === 6) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      saturdays.push(`${y}-${m}-${d}`);
    }
    date.setDate(date.getDate() + 1);
  }
  return saturdays;
}

export const ChampionshipConfigModal: React.FC<ChampionshipConfigModalProps> = ({
  isOpen,
  onClose,
  championship,
  categories,
  activeTenantId,
  onSaveChampionship,
  onDeleteChampionship,
}) => {
  const isEditing = !!championship;

  // Tabs inside modal for pristine layout
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'pontuacao' | 'etapas'>('geral');

  // General state
  const [name, setName] = useState(championship?.name || 'Novo Campeonato de Kart 2026');
  const [season, setSeason] = useState(championship?.season || '2026');
  const [location, setLocation] = useState(championship?.location || 'Kartódromo Granja Viana');
  const [type, setType] = useState<ChampionshipType>(championship?.type || 'multi_race');
  const [active, setActive] = useState<boolean>(championship?.active !== false);
  const [formatDescription, setFormatDescription] = useState<string>(championship?.formatDescription || '');
  const [regulationSummary, setRegulationSummary] = useState<string>(championship?.regulationSummary || '');
  const [regulations, setRegulations] = useState<ChampionshipDocument[]>(() => championship?.regulations || []);

  // AI Regulation Parsing State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Schedule Format (weekly_monthly, same_day, different_days, custom)
  const [scheduleFormat, setScheduleFormat] = useState<'weekly_monthly' | 'same_day' | 'different_days' | 'custom'>(
    championship?.scheduleFormat || 'weekly_monthly'
  );

  // Local list of categories specific to this championship
  const [localCategories, setLocalCategories] = useState<Category[]>(() => {
    if (championship?.customCategories && championship.customCategories.length > 0) {
      return championship.customCategories;
    }
    if (championship?.categories && championship.categories.length > 0) {
      const found = categories.filter((c) => championship.categories.includes(c.id));
      if (found.length > 0) return found;
    }
    return categories.length > 0 ? categories : StorageService.getCategories();
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (championship?.categories && championship.categories.length > 0) {
      return championship.categories;
    }
    return localCategories.map((c) => c.id);
  });

  // Category inline management state
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Sync when championship changes
  useEffect(() => {
    if (isOpen) {
      setName(championship?.name || 'Novo Campeonato 2026');
      setSeason(championship?.season || '2026');
      setLocation(championship?.location || 'Kartódromo Principal');
      setType(championship?.type || 'multi_race');
      setActive(championship?.active !== false);
      setFormatDescription(championship?.formatDescription || '');
      setRegulationSummary(championship?.regulationSummary || '');
      setRegulations(championship?.regulations || []);
      setConfirmDelete(false);
      setParseStatus(null);

      if (championship?.customCategories && championship.customCategories.length > 0) {
        setLocalCategories(championship.customCategories);
        setSelectedCategories(
          championship.categories && championship.categories.length > 0
            ? championship.categories
            : championship.customCategories.map((c) => c.id)
        );
      } else if (championship?.categories && championship.categories.length > 0) {
        const found = categories.filter((c) => championship.categories.includes(c.id));
        const list = found.length > 0 ? found : categories;
        setLocalCategories(list);
        setSelectedCategories(championship.categories);
      } else {
        const list = categories.length > 0 ? categories : StorageService.getCategories();
        setLocalCategories(list);
        setSelectedCategories(list.map((c) => c.id));
      }
    }
  }, [isOpen, championship, categories]);

  // Handle AI Regulation File Upload & Parsing
  const handleRegulationFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setParseStatus('Lendo documento e extraindo regras com Inteligência Artificial...');

    try {
      const result = await RegulationAiService.parseRegulationFile(file, 'geral');
      const { data, document } = result;

      // Update name, season, location, type if extracted
      if (data.name) setName(data.name);
      if (data.season) setSeason(data.season);
      if (data.location) setLocation(data.location);
      if (data.type) setType(data.type);
      if (data.formatDescription) setFormatDescription(data.formatDescription);
      if (data.regulationsSummary) setRegulationSummary(data.regulationsSummary);

      if (data.stagesCount) setStagesCount(data.stagesCount);
      if (data.racesPerStage) setRacesPerStage(data.racesPerStage);
      if (data.discardWorstCount !== undefined) setDiscardWorstCount(data.discardWorstCount);
      if (data.polePoints !== undefined) setPolePoints(data.polePoints);
      if (data.fastestLapPoints !== undefined) setFastestLapPoints(data.fastestLapPoints);

      // Points scale update
      if (data.pointsScale && Object.keys(data.pointsScale).length > 0) {
        setPointsScale((prev) => ({ ...prev, ...data.pointsScale }));
      }

      // Categories update
      if (data.categories && data.categories.length > 0) {
        const newCats: Category[] = data.categories.map((c, idx) => ({
          id: c.id || `cat-extracted-${idx}-${Date.now()}`,
          name: c.name,
          description: c.description,
          championshipId: championship?.id,
        }));
        setLocalCategories(newCats);
        setSelectedCategories(newCats.map((c) => c.id));
      }

      // Add document to list
      setRegulations((prev) => {
        const filtered = prev.filter((d) => d.fileName !== file.name);
        return [...filtered, document];
      });

      setParseStatus(`✅ Sucesso! Regulamento "${file.name}" analisado e parâmetros aplicados automaticamente.`);
    } catch (err: any) {
      console.error('Erro ao analisar regulamento:', err);
      setParseStatus(`⚠️ Não foi possível analisar automaticamente: ${err.message || 'Erro desconhecido'}. Você pode preencher manualmente.`);
    } finally {
      setIsParsingFile(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleRemoveRegulationDoc = (docId: string) => {
    setRegulations((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleAddLocalCategory = () => {
    if (!newCatName.trim()) return;
    const cat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim().toUpperCase(),
      championshipId: championship?.id,
    };
    setLocalCategories((prev) => [...prev, cat]);
    setSelectedCategories((prev) => [...prev, cat.id]);
    setNewCatName('');
    setIsAddingCat(false);
  };

  const handleRenameLocalCategory = (id: string) => {
    if (!editingCatName.trim()) {
      setEditingCatId(null);
      return;
    }
    setLocalCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editingCatName.trim().toUpperCase() } : c))
    );
    setEditingCatId(null);
  };

  const handleDeleteLocalCategory = (id: string) => {
    if (localCategories.length <= 1) {
      alert('O campeonato precisa ter no mínimo uma categoria.');
      return;
    }
    setLocalCategories((prev) => prev.filter((c) => c.id !== id));
    setSelectedCategories((prev) => prev.filter((catId) => catId !== id));
  };

  const [stagesCount, setStagesCount] = useState<number>(championship?.stagesCount || 12);
  const [racesPerStage, setRacesPerStage] = useState<number>(
    championship?.racesPerStage || 2
  );
  const [polePoints, setPolePoints] = useState<number>(championship?.polePoints ?? 1);
  const [fastestLapPoints, setFastestLapPoints] = useState<number>(
    championship?.fastestLapPoints ?? 1
  );
  const [discardWorstCount, setDiscardWorstCount] = useState<number>(
    championship?.discardWorstCount ?? 0
  );

  // Regras de Sistema de Disputa criadas e ativadas pelo Administrador Supremo
  const availableDisputeRules = useMemo(() => {
    const list = StorageService.getDisputeRules().filter((r) => r.active);
    return list.length > 0 ? list : StorageService.getDefaultDisputeRules();
  }, []);

  const [selectedRuleId, setSelectedRuleId] = useState<string>(() => {
    if (championship?.disputeRuleId) return championship.disputeRuleId;
    const matched = availableDisputeRules.find((r) => r.categoryType === (championship?.type || 'multi_race'));
    return matched?.id || availableDisputeRules[0]?.id || 'rule-multi-race';
  });

  const handleSelectDisputeRule = (rule: DisputeRuleConfig) => {
    setSelectedRuleId(rule.id);
    setType(rule.categoryType);
    setStagesCount(rule.defaultStagesCount);
    if (rule.scheduleMode) {
      setScheduleFormat(rule.scheduleMode);
    }
    if (rule.scheduleMode === 'weekly_monthly') {
      setRacesPerStage(4);
    } else {
      setRacesPerStage(rule.defaultRacesPerStage || 2);
    }
  };

  // Season Year parsed
  const seasonYear = useMemo(() => {
    const parsed = parseInt(season, 10);
    return isNaN(parsed) || parsed < 2000 || parsed > 2100 ? 2026 : parsed;
  }, [season]);

  // Points scale for 1 to 20
  const [pointsScale, setPointsScale] = useState<PointsRule>(
    championship?.pointsScale ? { ...championship.pointsScale } : { ...INITIAL_POINTS_SCALE }
  );

  const handlePointsChange = (pos: number, value: number) => {
    setPointsScale((prev) => ({
      ...prev,
      [pos]: Math.max(0, value),
    }));
  };

  // Preenchimento Proporcional Baseado no 1º, 2º e 3º colocado
  const handleAutoFillProportional = () => {
    const p1 = pointsScale[1] ?? 20;
    const p2 = pointsScale[2] ?? 19;
    const p3 = pointsScale[3] ?? 18;

    const diff1 = p1 - p2;
    const diff2 = p2 - p3;
    const step = Math.max(1, Math.round((diff1 + diff2) / 2));

    const newScale: PointsRule = { ...pointsScale };
    newScale[1] = p1;
    newScale[2] = p2;
    newScale[3] = p3;

    let current = p3;
    for (let pos = 4; pos <= 20; pos++) {
      current = Math.max(0, current - step);
      newScale[pos] = current;
    }
    setPointsScale(newScale);
  };

  const handleResetPointsToStandard20 = () => {
    const scale: PointsRule = {};
    for (let i = 1; i <= 20; i++) {
      scale[i] = 21 - i; // 20, 19, 18, 17 ... 1
    }
    setPointsScale(scale);
  };

  const handleResetPointsToOriginal = () => {
    setPointsScale({ ...INITIAL_POINTS_SCALE });
  };

  const availableDiscardOptions = useMemo(() => {
    return StorageService.getDiscardOptions().filter((o) => o.enabled);
  }, []);

  // State for Stages and Race Sessions with Date fields
  const [stagesDraft, setStagesDraft] = useState<Stage[]>(() => {
    if (championship?.stages && championship.stages.length > 0) {
      return JSON.parse(JSON.stringify(championship.stages));
    }
    return [];
  });

  // Re-generate stagesDraft when stagesCount, seasonYear, scheduleFormat or racesPerStage changes (if not editing an existing one or if count mismatch)
  useEffect(() => {
    if (isEditing && stagesDraft.length === stagesCount) return;

    const newStages: Stage[] = [];
    for (let i = 0; i < stagesCount; i++) {
      const stageNum = i + 1;
      const monthIndex = i % 12;
      const code = MONTH_CODES[monthIndex] || `ETP${stageNum}`;
      const monthFull = MONTH_FULL_NAMES[monthIndex] || `Mês ${stageNum}`;
      const track = location || DEFAULT_TRACK_SUGGESTIONS[i % DEFAULT_TRACK_SUGGESTIONS.length];

      let numRaces = racesPerStage;
      let sessionDates: string[] = [];

      if (scheduleFormat === 'weekly_monthly') {
        const saturdays = getSaturdaysOfMonth(seasonYear, monthIndex);
        numRaces = saturdays.length > 0 ? saturdays.length : getWeekendsCountInMonth(seasonYear, monthIndex);
        sessionDates = saturdays;
      } else {
        const defaultDate = `${seasonYear}-${String(monthIndex + 1).padStart(2, '0')}-15`;
        sessionDates = Array(numRaces).fill(defaultDate);
      }

      const stageRaces: RaceSession[] = [];
      for (let r = 1; r <= numRaces; r++) {
        const rDate = sessionDates[r - 1] || `${seasonYear}-${String(monthIndex + 1).padStart(2, '0')}-15`;
        const sessionName =
          scheduleFormat === 'weekly_monthly'
            ? `Semana ${r} (${type === 'fastest_lap' ? 'Volta Rápida' : 'Bateria'})`
            : numRaces === 1
            ? 'Corrida Principal'
            : `Bateria ${r}`;

        stageRaces.push({
          id: `race-${stageNum}-${r}-${Date.now()}`,
          name: sessionName,
          date: rDate,
          results: [],
        });
      }

      newStages.push({
        id: `stage-${stageNum}-${Date.now()}`,
        stageNumber: stageNum,
        name: code,
        fullName: `${stageNum}ª Etapa - ${monthFull}`,
        trackName: track,
        date: sessionDates[0] || `${seasonYear}-${String(monthIndex + 1).padStart(2, '0')}-01`,
        completed: false,
        stagePoints: {},
        races: stageRaces,
      });
    }

    setStagesDraft(newStages);
  }, [stagesCount, seasonYear, scheduleFormat, racesPerStage, location]);

  const handleStageTrackChange = (stageIdx: number, val: string) => {
    setStagesDraft((prev) => {
      const copy = [...prev];
      if (copy[stageIdx]) {
        copy[stageIdx] = { ...copy[stageIdx], trackName: val };
      }
      return copy;
    });
  };

  const handleStageDateChange = (stageIdx: number, val: string) => {
    setStagesDraft((prev) => {
      const copy = [...prev];
      if (copy[stageIdx]) {
        copy[stageIdx] = { ...copy[stageIdx], date: val };
      }
      return copy;
    });
  };

  const handleRaceDateChange = (stageIdx: number, raceIdx: number, val: string) => {
    setStagesDraft((prev) => {
      const copy = [...prev];
      if (copy[stageIdx] && copy[stageIdx].races[raceIdx]) {
        const updatedRaces = [...copy[stageIdx].races];
        updatedRaces[raceIdx] = { ...updatedRaces[raceIdx], date: val };
        copy[stageIdx] = { ...copy[stageIdx], races: updatedRaces };
      }
      return copy;
    });
  };

  const handleSave = () => {
    const chosenRule = availableDisputeRules.find((r) => r.id === selectedRuleId);

    const saved: Championship = {
      id: championship?.id || `champ-${Date.now()}`,
      tenantId: championship?.tenantId || activeTenantId || 'tenant-mp-racing',
      name,
      season,
      location,
      type,
      active,
      formatDescription,
      regulationSummary,
      regulations,
      scheduleFormat,
      disputeRuleId: chosenRule?.id || selectedRuleId,
      disputeRuleName: chosenRule?.name || (type === 'multi_race' ? 'Multi-Baterias por Etapa' : type === 'fastest_lap' ? 'Torneio de Volta Rápida' : type === 'endurance' ? 'Endurance' : 'Corrida Padrão'),
      categories: selectedCategories.length > 0 ? selectedCategories : localCategories.map((c) => c.id),
      customCategories: localCategories,
      stagesCount,
      racesPerStage: scheduleFormat === 'weekly_monthly' ? 4 : racesPerStage,
      pointsScale,
      polePoints,
      fastestLapPoints,
      discardWorstCount,
      registeredDriverIds: championship?.registeredDriverIds || [],
      stages: stagesDraft,
    };

    onSaveChampionship(saved);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isEditing ? 'Configurar Campeonato & Regras' : 'Criar Novo Campeonato'}
              </h2>
              <p className="text-xs text-zinc-400">
                {name} • Temporada {season} • {location || 'Sem local definido'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 gap-2 flex-shrink-0 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('geral')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'geral'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-red-500" />
            <span>1. Informações & Sistema de Disputa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pontuacao')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'pontuacao'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Escala de Pontos (1º ao 20º) & Bônus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('etapas')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'etapas'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>3. Calendário & Datas das Corridas ({stagesDraft.length} Etapas)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: GERAL & REGRAS DE DISPUTA */}
          {activeSubTab === 'geral' && (
            <div className="space-y-6">
              {/* AI Regulation Importer Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-950 to-zinc-900 border border-red-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5 text-red-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                        <span>Preenchimento Automático por Regulamento Oficial (IA)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 font-mono border border-red-500/30">
                          Gemini 2.5 Pro
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Envie o PDF ou documento de regulamento do campeonato (ex: Regulamento FGA Endurance, Kartodromo). A IA extrairá nome, categorias, formato, pontuação e calendário automaticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleRegulationFileUpload}
                    />
                    <button
                      type="button"
                      disabled={isParsingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-bold transition cursor-pointer shadow-lg shadow-red-950/40 text-xs"
                    >
                      {isParsingFile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analisando PDF...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Importar Regulamento</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {parseStatus && (
                  <div className={`p-2.5 rounded-lg text-[11px] font-medium border ${
                    parseStatus.startsWith('✅')
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : parseStatus.startsWith('⚠️')
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                  }`}>
                    {parseStatus}
                  </div>
                )}
              </div>

              {/* General Information: Name, Season, Location & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-zinc-300 font-bold mb-1">Nome do Campeonato</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Gaúcho de Endurance 2025"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 font-bold mb-1">Temporada (Ano)</label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white font-mono font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-zinc-300 font-bold mb-1">Sede / Autódromo / Circuito</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Tarumã, Guaporé, Velopark"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 font-bold mb-1">Status de Exibição</label>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`w-full p-2.5 rounded-lg border font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <span>{active ? 'Ativo (Público)' : 'Oculto / Inativo'}</span>
                  </button>
                </div>
              </div>

              {/* Format Description & Regulation Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Descrição do Formato & Duração das Provas
                  </label>
                  <textarea
                    rows={3}
                    value={formatDescription}
                    onChange={(e) => setFormatDescription(e.target.value)}
                    placeholder="Ex: Provas de longa duração (120 minutos), janelas de pit-stop obrigatórias de 2 minutos, parada para troca de pilotos e reabastecimento."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Resumo do Regulamento & Particularidades
                  </label>
                  <textarea
                    rows={3}
                    value={regulationSummary}
                    onChange={(e) => setRegulationSummary(e.target.value)}
                    placeholder="Ex: Regulamento oficial FGA / CBA. Pontuação diferenciada por categoria, descarte da pior etapa, bônus de pole position e volta mais rápida."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>
              </div>

              {/* Attached Regulations Documents List */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-red-400" />
                      <span>Documentos & PDFs do Regulamento Anexados ({regulations.length})</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Arquivos disponíveis para consulta pública e download por pilotos, mecânicos e equipes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Anexar Arquivo</span>
                  </button>
                </div>

                {regulations.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">
                    Nenhum documento PDF ou regulamento anexado a este campeonato ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {regulations.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800"
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate text-xs">{doc.name || doc.fileName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'PDF'} • {new Date(doc.uploadDate || Date.now()).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {doc.dataUrl && (
                            <a
                              href={doc.dataUrl}
                              download={doc.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition"
                              title="Baixar Documento"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveRegulationDoc(doc.id)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                            title="Remover anexo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dispute Rule Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-zinc-300 font-bold">
                    Sistema de Disputa & Regras de Negócio
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {availableDisputeRules.length} regras disponíveis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableDisputeRules.map((rule) => {
                    const isSelected = selectedRuleId === rule.id;
                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => handleSelectDisputeRule(rule)}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-950/30 border-red-500 text-white shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold border bg-zinc-800 text-zinc-300 border-zinc-700">
                              {rule.categoryType === 'multi_race'
                                ? 'Multi-Baterias'
                                : rule.categoryType === 'fastest_lap'
                                ? 'Volta Rápida'
                                : rule.categoryType === 'endurance'
                                ? 'Endurance'
                                : 'Corrida Padrão'}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                          </div>
                          <h4 className="font-bold text-white text-xs leading-tight mb-1">
                            {rule.name}
                          </h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                            {rule.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>{rule.defaultStagesCount} Etapas</span>
                          <span className="text-amber-400 font-bold">
                            {rule.scheduleMode === 'weekly_monthly'
                              ? '4 a 5 fins de semana/mês'
                              : `${rule.defaultRacesPerStage} baterias/etapa`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formato do Cronograma (Crucial Requirement) */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Formato do Cronograma de Disputa
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Define como as corridas são distribuídas em cada etapa da temporada
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleFormat('weekly_monthly')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleFormat === 'weekly_monthly'
                        ? 'bg-red-950/40 border-red-500 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        Semanal ao longo do mês (4 a 5 fins de semana)
                      </span>
                      {scheduleFormat === 'weekly_monthly' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-normal">
                      Cada final de semana é uma corrida. O sistema calcula automaticamente 4 ou 5 semanas conforme o mês.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleFormat('same_day')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleFormat === 'same_day'
                        ? 'bg-red-950/40 border-red-500 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        Todas as baterias no mesmo dia
                      </span>
                      {scheduleFormat === 'same_day' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-normal">
                      Ex: 2 ou 3 baterias disputadas no mesmo sábado ou domingo da etapa.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleFormat('different_days')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleFormat === 'different_days'
                        ? 'bg-red-950/40 border-red-500 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        Baterias em dias diferentes (ex: Sáb e Dom)
                      </span>
                      {scheduleFormat === 'different_days' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-normal">
                      Bateria 1 no sábado, Bateria 2 no domingo, permitindo datas distintas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleFormat('custom')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleFormat === 'custom'
                        ? 'bg-red-950/40 border-red-500 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        Cronograma livre / customizado
                      </span>
                      {scheduleFormat === 'custom' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-normal">
                      Datas e baterias totalmente flexíveis por etapa.
                    </p>
                  </button>
                </div>

                {/* Stages count & Races per stage inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">Número de Etapas</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={stagesCount}
                      onChange={(e) => setStagesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono font-bold text-center"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-1">Geralmente 12 etapas (JAN a DEZ)</span>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Baterias / Corridas por Etapa
                    </label>
                    {scheduleFormat === 'weekly_monthly' ? (
                      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2 text-amber-400 font-mono text-center font-bold">
                        Calculado automaticamente (4 a 5 semanas)
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={racesPerStage}
                        onChange={(e) => setRacesPerStage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono font-bold text-center"
                      />
                    )}
                    <span className="text-[10px] text-zinc-400 block mt-1">
                      {scheduleFormat === 'weekly_monthly'
                        ? 'Bloqueado: o sistema determina conforme o calendário do mês'
                        : 'Quantidade de corridas/baterias em cada etapa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories of this Championship */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <label className="block text-zinc-200 font-bold text-xs">
                      Categorias deste Campeonato (Grids & Divisões)
                    </label>
                    <span className="text-[11px] text-zinc-400 block">
                      Crie, renomeie, exclua e determine quais categorias competem neste campeonato
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingCat(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Categoria</span>
                  </button>
                </div>

                {/* Inline New Category Form */}
                {isAddingCat && (
                  <div className="flex items-center gap-2 p-3 bg-zinc-900 rounded-xl border border-zinc-700 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Nome da categoria (Ex: GRADUADOS, SENIOR, SPEED)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocalCategory()}
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-red-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddLocalCategory}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCat(false);
                        setNewCatName('');
                      }}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Categories Pills & Controls */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {localCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    const isEditingThis = editingCatId === cat.id;

                    if (isEditingThis) {
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center gap-1.5 bg-zinc-900 border border-red-500/60 rounded-lg p-1"
                        >
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameLocalCategory(cat.id)}
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-white uppercase focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameLocalCategory(cat.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300 transition"
                            title="Salvar Nome"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center space-x-1.5 pl-3 pr-1.5 py-1 rounded-lg font-bold text-xs border transition ${
                          isSelected
                            ? 'bg-red-600/20 text-red-200 border-red-500/40'
                            : 'bg-zinc-900/80 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (selectedCategories.length > 1) {
                                setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                              }
                            } else {
                              setSelectedCategories([...selectedCategories, cat.id]);
                            }
                          }}
                          className="cursor-pointer tracking-wide flex items-center space-x-1"
                          title={isSelected ? 'Clique para desativar no campeonato' : 'Clique para ativar'}
                        >
                          <span>{cat.name}</span>
                          {isSelected && <span className="text-red-400 text-[10px]">✓</span>}
                        </button>

                        <div className="flex items-center space-x-0.5 border-l border-zinc-700/60 pl-1.5 ml-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                            }}
                            className="p-1 text-zinc-400 hover:text-amber-400 transition"
                            title="Renomear categoria"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocalCategory(cat.id)}
                            className="p-1 text-zinc-400 hover:text-red-400 transition"
                            title="Excluir categoria deste campeonato"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PONTUAÇÃO & BÔNUS */}
          {activeSubTab === 'pontuacao' && (
            <div className="space-y-6">
              {/* Scoring Rules: 1st to 20th */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-xs">
                      Regra de Pontuação Oficial (1º ao 20º Colocado)
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Informe a pontuação dos 3 primeiros e utilize o cálculo proporcional para preencher de 4º a 20º
                    </p>
                  </div>

                  {/* Auto-fill buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFillProportional}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-950/40"
                      title="Calcula posições 4 a 20 baseado nos valores de 1º, 2º e 3º"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preencher Proporcional (1º, 2º e 3º)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetPointsToStandard20}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Padrão 20 a 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetPointsToOriginal}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Padrão 30-25-21...</span>
                    </button>
                  </div>
                </div>

                {/* 20 Positions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {Array.from({ length: 20 }, (_, idx) => idx + 1).map((pos) => {
                    const isPodium = pos <= 3;
                    return (
                      <div
                        key={pos}
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          isPodium
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span className="font-bold font-mono text-xs">
                          {pos}º {isPodium && (pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉')}
                        </span>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={pointsScale[pos] !== undefined ? pointsScale[pos] : 0}
                            onChange={(e) => handlePointsChange(pos, parseInt(e.target.value, 10) || 0)}
                            className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-center font-mono font-bold text-white focus:outline-none focus:border-red-500"
                          />
                          <span className="text-[10px] text-zinc-500">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bonus Points: Pole Position & Volta Mais Rápida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div>
                    <label className="block text-purple-400 font-bold text-xs">Pole Position</label>
                    <span className="text-[11px] text-zinc-400">Pontos extras para quem largar na pole</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={polePoints}
                      onChange={(e) => setPolePoints(parseInt(e.target.value, 10) || 0)}
                      className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-purple-300 font-mono font-bold text-center text-sm focus:outline-none"
                    />
                    <span className="text-zinc-500 font-bold">pts</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div>
                    <label className="block text-amber-400 font-bold text-xs">Volta Mais Rápida</label>
                    <span className="text-[11px] text-zinc-400">Pontos extras para o giro mais veloz</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={fastestLapPoints}
                      onChange={(e) => setFastestLapPoints(parseInt(e.target.value, 10) || 0)}
                      className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-amber-300 font-mono font-bold text-center text-sm focus:outline-none"
                    />
                    <span className="text-zinc-500 font-bold">pts</span>
                  </div>
                </div>
              </div>

              {/* Discard Rules */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="font-bold text-white text-xs">Descarte de Piores Etapas</h3>
                  <span className="text-amber-400 font-bold">
                    {discardWorstCount === 0 ? 'Sem Descarte' : `Descarta as ${discardWorstCount} piores`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableDiscardOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDiscardWorstCount(opt.count)}
                      className={`py-2 px-2.5 rounded-lg font-bold text-xs border transition cursor-pointer text-center truncate ${
                        discardWorstCount === opt.count
                          ? 'bg-red-600 border-red-500 text-white shadow'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Digitar número de descartes manualmente */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      Ou digite manualmente o número de descartes:
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Permite definir livremente quantas etapas serão desconsideradas
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      max={stagesCount > 0 ? stagesCount - 1 : 12}
                      value={discardWorstCount}
                      onChange={(e) => setDiscardWorstCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-lg p-2 text-center font-mono font-bold text-sm text-white outline-none"
                    />
                    <span className="text-xs text-zinc-400 font-bold">descarte(s)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALENDÁRIO & DATAS DAS CORRIDAS */}
          {activeSubTab === 'etapas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                <div>
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                    <span>Datas das Etapas e Baterias ({seasonYear})</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {scheduleFormat === 'weekly_monthly'
                      ? 'Datas pré-sugeridas nos sábados de cada mês. Você pode ajustar dia, mês e ano livremente.'
                      : 'Configure a pista e a data exata de cada bateria/etapa.'}
                  </p>
                </div>
                <div className="text-[11px] text-zinc-300 font-mono bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  Total de Etapas: <strong>{stagesDraft.length}</strong>
                </div>
              </div>

              {/* Stages List */}
              <div className="space-y-3">
                {stagesDraft.map((stage, stageIdx) => (
                  <div
                    key={stage.id || stageIdx}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs font-mono">
                          {stage.stageNumber}
                        </span>
                        <span className="font-bold text-white text-xs">{stage.fullName}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={stage.trackName}
                          onChange={(e) => handleStageTrackChange(stageIdx, e.target.value)}
                          placeholder="Local / Kartódromo da Etapa"
                          list="trackSuggestionsEtapas"
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-red-500 w-48 sm:w-64"
                        />
                        <datalist id="trackSuggestionsEtapas">
                          {DEFAULT_TRACK_SUGGESTIONS.map((t) => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Races / Sessions with Date Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {stage.races.map((race, raceIdx) => (
                        <div
                          key={race.id || raceIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                        >
                          <span className="font-semibold text-zinc-300 truncate mr-2">
                            {race.name}
                          </span>
                          <input
                            type="date"
                            value={race.date || stage.date || ''}
                            onChange={(e) => handleRaceDateChange(stageIdx, raceIdx, e.target.value)}
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3 text-xs text-zinc-400">
            <div>
              <span>Passo:</span>{' '}
              <span className="text-white font-bold">
                {activeSubTab === 'geral' && '1 de 3 (Geral)'}
                {activeSubTab === 'pontuacao' && '2 de 3 (Pontos)'}
                {activeSubTab === 'etapas' && '3 de 3 (Calendário)'}
              </span>
            </div>

            {isEditing && onDeleteChampionship && championship && (
              <div className="border-l border-zinc-800 pl-3">
                {confirmDelete ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400 font-bold text-xs">Excluir este campeonato?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteChampionship(championship.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Campeonato</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition cursor-pointer text-xs"
            >
              Cancelar
            </button>

            {activeSubTab !== 'geral' && (
              <button
                type="button"
                onClick={() => {
                  if (activeSubTab === 'etapas') setActiveSubTab('pontuacao');
                  else if (activeSubTab === 'pontuacao') setActiveSubTab('geral');
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition cursor-pointer text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}

            {activeSubTab !== 'etapas' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeSubTab === 'geral') setActiveSubTab('pontuacao');
                  else if (activeSubTab === 'pontuacao') setActiveSubTab('etapas');
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition cursor-pointer text-xs"
              >
                <span>Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-950/50 transition cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Campeonato & Regras</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
