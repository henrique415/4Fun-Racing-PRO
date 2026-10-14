import React, { useState, useMemo, useRef } from 'react';
import {
  Sliders,
  Tag,
  Flag,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Calendar,
  Save,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  FileText,
  Download,
  UploadCloud,
  Paperclip,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  Championship,
  Category,
  Driver,
  Stage,
  DiscardOptionConfig,
  ChampionshipDocument,
} from '../types';
import { StorageService } from '../services/storage';
import { INITIAL_POINTS_SCALE } from '../data/initialData';
import { RegulationAiService } from '../services/regulationAiService';

interface ChampionshipRulesAndStagesViewProps {
  championship?: Championship;
  onSaveChampionship: (updated: Championship) => void;
  drivers: Driver[];
  onOpenChampionshipWizard: () => void;
  onOpenStageManager: (stage: Stage) => void;
  defaultCategories: Category[];
  showToast: (msg: string) => void;
}

export const ChampionshipRulesAndStagesView: React.FC<ChampionshipRulesAndStagesViewProps> = ({
  championship,
  onSaveChampionship,
  drivers,
  onOpenChampionshipWizard,
  onOpenStageManager,
  defaultCategories,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'regulations' | 'categories' | 'discards' | 'scoring' | 'stages'>(
    'regulations'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // CATEGORIES STATE
  const currentCategories: Category[] = useMemo(() => {
    if (!championship) return defaultCategories;
    if (championship.customCategories && championship.customCategories.length > 0) {
      return championship.customCategories;
    }
    if (championship.categories && championship.categories.length > 0) {
      const matched = defaultCategories.filter((c) => championship.categories.includes(c.id));
      if (matched.length > 0) return matched;
    }
    return defaultCategories.length > 0 ? defaultCategories : StorageService.getCategories();
  }, [championship, defaultCategories]);

  const [categoriesList, setCategoriesList] = useState<Category[]>(currentCategories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  if (!championship) {
    return (
      <div className="p-12 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 mx-auto flex items-center justify-center">
          <Sliders className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Nenhum Campeonato Selecionado</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
            Crie um campeonato para configurar seu regulamento técnico, escala de pontuação e critérios de descarte.
          </p>
        </div>
        <button
          onClick={onOpenChampionshipWizard}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition shadow-lg shadow-red-950/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Primeiro Campeonato</span>
        </button>
      </div>
    );
  }
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Keep categories in sync if championship changes externally
  React.useEffect(() => {
    setCategoriesList(currentCategories);
  }, [currentCategories]);

  // DISCARD RULES STATE
  const currentDiscardOptions: DiscardOptionConfig[] = useMemo(() => {
    if (championship.discardOptions && championship.discardOptions.length > 0) {
      return championship.discardOptions;
    }
    return StorageService.getDiscardOptions();
  }, [championship]);

  const [discardOptionsList, setDiscardOptionsList] = useState<DiscardOptionConfig[]>(
    currentDiscardOptions
  );
  const [activeDiscardWorst, setActiveDiscardWorst] = useState<number>(
    championship.discardWorstCount ?? 0
  );
  const [manualDiscardInput, setManualDiscardInput] = useState<number>(
    championship.discardWorstCount ?? 0
  );
  const [isAddingDiscardOption, setIsAddingDiscardOption] = useState(false);
  const [newDiscardLabel, setNewDiscardLabel] = useState('');
  const [newDiscardCount, setNewDiscardCount] = useState<number>(1);

  React.useEffect(() => {
    setDiscardOptionsList(currentDiscardOptions);
    setActiveDiscardWorst(championship.discardWorstCount ?? 0);
    setManualDiscardInput(championship.discardWorstCount ?? 0);
  }, [currentDiscardOptions, championship.discardWorstCount]);

  // SCORING SCALE STATE
  const [pointsScale, setPointsScale] = useState<{ [pos: number]: number }>(
    championship.pointsScale || INITIAL_POINTS_SCALE
  );
  const [polePoints, setPolePoints] = useState<number>(championship.polePoints ?? 1);
  const [fastestLapPoints, setFastestLapPoints] = useState<number>(
    championship.fastestLapPoints ?? 1
  );

  React.useEffect(() => {
    setPointsScale(championship.pointsScale || INITIAL_POINTS_SCALE);
    setPolePoints(championship.polePoints ?? 1);
    setFastestLapPoints(championship.fastestLapPoints ?? 1);
  }, [championship]);

  // CATEGORY ACTIONS
  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      showToast('O nome da categoria é obrigatório.');
      return;
    }
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim().toUpperCase(),
      description: newCatDesc.trim() || undefined,
      championshipId: championship.id,
      tenantId: championship.tenantId,
    };

    const updated = [...categoriesList, newCategory];
    setCategoriesList(updated);
    setNewCatName('');
    setNewCatDesc('');
    setIsAddingCategory(false);

    const updatedChamp: Championship = {
      ...championship,
      customCategories: updated,
      categories: updated.map((c) => c.id),
    };
    onSaveChampionship(updatedChamp);
    showToast(`Categoria ${newCategory.name} criada para este campeonato!`);
  };

  const handleSaveEditCategory = (catId: string) => {
    if (!editCatName.trim()) {
      showToast('O nome da categoria não pode ficar vazio.');
      return;
    }
    const updated = categoriesList.map((c) =>
      c.id === catId
        ? {
            ...c,
            name: editCatName.trim().toUpperCase(),
            description: editCatDesc.trim() || undefined,
          }
        : c
    );
    setCategoriesList(updated);
    setEditingCatId(null);

    const updatedChamp: Championship = {
      ...championship,
      customCategories: updated,
      categories: updated.map((c) => c.id),
    };
    onSaveChampionship(updatedChamp);
    showToast('Categoria renomeada com sucesso!');
  };

  const handleDeleteCategory = (catId: string) => {
    if (categoriesList.length <= 1) {
      showToast('O campeonato precisa ter no mínimo uma categoria.');
      return;
    }
    const toDelete = categoriesList.find((c) => c.id === catId);
    if (
      window.confirm(
        `Tem certeza que deseja excluir a categoria "${toDelete?.name}" deste campeonato?`
      )
    ) {
      const updated = categoriesList.filter((c) => c.id !== catId);
      setCategoriesList(updated);

      const updatedChamp: Championship = {
        ...championship,
        customCategories: updated,
        categories: updated.map((c) => c.id),
      };
      onSaveChampionship(updatedChamp);
      showToast(`Categoria ${toDelete?.name} removida deste campeonato!`);
    }
  };

  const handleResetToDefaultCategories = () => {
    if (
      window.confirm(
        'Deseja carregar as categorias padrões do sistema para este campeonato?'
      )
    ) {
      const templates =
        defaultCategories.length > 0 ? defaultCategories : StorageService.getCategories();
      setCategoriesList(templates);

      const updatedChamp: Championship = {
        ...championship,
        customCategories: templates,
        categories: templates.map((c) => c.id),
      };
      onSaveChampionship(updatedChamp);
      showToast('Categorias restauradas com base no padrão do sistema!');
    }
  };

  // DISCARD ACTIONS
  const handleApplyDiscardRule = (count: number) => {
    setActiveDiscardWorst(count);
    setManualDiscardInput(count);

    const updatedChamp: Championship = {
      ...championship,
      discardWorstCount: count,
      discardOptions: discardOptionsList,
    };
    onSaveChampionship(updatedChamp);
    showToast(
      count === 0
        ? 'Regra salva: Sem descarte de etapas.'
        : `Regra salva: Descarte das ${count} piores etapas!`
    );
  };

  const handleAddDiscardOption = () => {
    if (!newDiscardLabel.trim()) {
      showToast('O rótulo da opção de descarte é obrigatório.');
      return;
    }
    const newOption: DiscardOptionConfig = {
      id: `disc-${Date.now()}`,
      count: Math.max(0, newDiscardCount),
      label: newDiscardLabel.trim(),
      enabled: true,
      championshipId: championship.id,
      tenantId: championship.tenantId,
    };

    const updated = [...discardOptionsList, newOption];
    setDiscardOptionsList(updated);
    setNewDiscardLabel('');
    setNewDiscardCount(1);
    setIsAddingDiscardOption(false);

    const updatedChamp: Championship = {
      ...championship,
      discardOptions: updated,
    };
    onSaveChampionship(updatedChamp);
    showToast(`Opção de descarte "${newOption.label}" adicionada!`);
  };

  const handleDeleteDiscardOption = (optionId: string) => {
    const updated = discardOptionsList.filter((o) => o.id !== optionId);
    setDiscardOptionsList(updated);

    const updatedChamp: Championship = {
      ...championship,
      discardOptions: updated,
    };
    onSaveChampionship(updatedChamp);
    showToast('Opção de descarte removida deste campeonato.');
  };

  // SCORING SCALE ACTIONS
  const handlePointChange = (pos: number, val: number) => {
    setPointsScale((prev) => ({
      ...prev,
      [pos]: Math.max(0, val),
    }));
  };

  const handleSaveScoring = () => {
    const updatedChamp: Championship = {
      ...championship,
      pointsScale,
      polePoints,
      fastestLapPoints,
    };
    onSaveChampionship(updatedChamp);
    showToast('Tabela de pontuação e bônus salva para este campeonato!');
  };

  const handleResetPointsToStandard = () => {
    const standard: { [pos: number]: number } = {};
    for (let i = 1; i <= 20; i++) {
      standard[i] = 21 - i;
    }
    setPointsScale(standard);
  };

  const handleResetPointsToOriginal = () => {
    setPointsScale(INITIAL_POINTS_SCALE);
  };

  // Count drivers per category in this championship
  const getDriverCountForCategory = (catId: string) => {
    const enrolledIds = championship.registeredDriverIds || [];
    return enrolledIds.filter((drvId) => {
      const driverCatId =
        championship.driverCategories?.[drvId] ||
        drivers.find((d) => d.id === drvId)?.categoryIds?.[championship.id] ||
        drivers.find((d) => d.id === drvId)?.categoryId;
      return driverCatId === catId;
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Context Banner: Active Championship */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center font-black shadow-lg shadow-red-950/50 flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-red-950/60 border border-red-800 text-red-300">
                  {championship.season}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 border border-zinc-700 text-zinc-300">
                  {championship.type === 'multi_race'
                    ? 'Sistema Multi-Baterias'
                    : championship.type === 'fastest_lap'
                    ? 'Volta Rápida'
                    : championship.type === 'endurance'
                    ? 'Endurance'
                    : 'Corrida Padrão'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/50 border border-emerald-800 text-emerald-300">
                  {championship.active ? 'Campeonato Ativo' : 'Concluído'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {championship.name}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>{championship.location || 'Kartódromo Granja Viana'}</span>
                <span>•</span>
                <span>{championship.stages?.length || 0} Etapas</span>
                <span>•</span>
                <span>{championship.registeredDriverIds?.length || 0} Pilotos Inscritos</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={onOpenChampionshipWizard}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer shadow-sm"
              title="Abrir o assistente completo de 3 passos deste campeonato"
            >
              <Sliders className="w-4 h-4 text-red-400" />
              <span>Editar Calendário Completo</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-t border-zinc-800 mt-5 pt-4 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('regulations')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'regulations'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-white border border-zinc-800/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Regulamento Oficial & Anexos ({championship.regulations?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categorias & Grids ({categoriesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('discards')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'discards'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>
              Regras de Descarte (
              {activeDiscardWorst === 0 ? 'Sem Descarte' : `${activeDiscardWorst} Piores`})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'scoring'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabela de Pontuação & Bônus</span>
          </button>

          <button
            onClick={() => setActiveTab('stages')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'stages'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'bg-zinc-950/70 text-zinc-400 hover:text-white border border-zinc-800/80'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Etapas & Lançamentos ({championship.stages?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* TAB: REGULAMENTO OFICIAL & ANEXOS */}
      {activeTab === 'regulations' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                <span>Regulamento Desportivo & Técnico Oficial</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Consulte as diretrizes, homologações, pontuações e documentos anexados deste campeonato.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingDoc(true);
                  try {
                    const { data, document } = await RegulationAiService.parseRegulationFile(file, 'geral');
                    const updatedDocs = [...(championship.regulations || []), document];
                    const updated: Championship = {
                      ...championship,
                      formatDescription: data.formatDescription || championship.formatDescription,
                      regulationSummary: data.regulationsSummary || championship.regulationSummary,
                      regulations: updatedDocs,
                    };
                    onSaveChampionship(updated);
                    showToast(`✅ Documento "${file.name}" anexado e processado com sucesso!`);
                  } catch (err: any) {
                    showToast(`Erro ao processar: ${err.message || 'Falha no upload'}`);
                  } finally {
                    setIsUploadingDoc(false);
                    if (e.target) e.target.value = '';
                  }
                }}
              />
              <button
                type="button"
                disabled={isUploadingDoc}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-950/50"
              >
                {isUploadingDoc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando IA...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Anexar PDF / Regulamento</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cards: Formato de Disputa & Resumo Oficial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Formato da Competição & Duração</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {championship.type === 'endurance'
                    ? 'Endurance (Longa Duração)'
                    : championship.type === 'multi_race'
                    ? 'Multi-Baterias'
                    : 'Padrão'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {championship.formatDescription ||
                  'Provas disputadas conforme calendário oficial com pontuação por etapa e bônus de performance.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Resumo do Regulamento & Particularidades</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  Temporada {championship.season}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {championship.regulationSummary ||
                  'Regulamento desportivo oficial homologado. Critérios de desempate, pontuação de pole position e volta mais rápida aplicáveis.'}
              </p>
            </div>
          </div>

          {/* Documentos Anexados / Downloads */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5 text-red-500" />
              <span>Documentos Oficiais Disponíveis para Download</span>
            </h4>

            {(!championship.regulations || championship.regulations.length === 0) ? (
              <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">
                  Nenhum arquivo PDF de regulamento anexado a este campeonato ainda.
                </p>
                <p className="text-[11px] text-zinc-500">
                  Admins podem anexar PDFs oficiais clicando no botão "Anexar PDF / Regulamento".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {championship.regulations.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-red-950/60 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-white text-xs truncate" title={doc.name || doc.fileName}>
                          {doc.name || doc.fileName}
                        </h5>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Documento PDF'} • {new Date(doc.uploadDate || Date.now()).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono">
                        {doc.category || 'Geral'}
                      </span>
                      {doc.dataUrl && (
                        <a
                          href={doc.dataUrl}
                          download={doc.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 font-bold text-xs transition border border-red-500/30"
                        >
                          <Download className="w-3 h-3" />
                          <span>Baixar PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: CATEGORIES & GRIDS OF THIS CHAMPIONSHIP */}
      {activeTab === 'categories' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-red-500" />
                <span>Categorias Exclusivas deste Campeonato</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cada campeonato possui suas próprias divisões e grids. Crie, renomeie ou exclua as
                categorias deste campeonato sem interferir nos demais.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefaultCategories}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer border border-zinc-700"
                title="Copiar as categorias globais definidas nas configurações para cá"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Importar Padrões</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-950/50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Categoria</span>
              </button>
            </div>
          </div>

          {/* Form to Add New Category */}
          {isAddingCategory && (
            <div className="bg-zinc-950 border border-red-500/40 rounded-xl p-4 space-y-3 animate-fade-in shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-red-500" />
                  <span>Cadastrar Nova Categoria no Campeonato</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: GRADUADOS, SENIOR, SPEED, LIGHT, MASTER"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Descrição / Restrição de Peso (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pilotos experientes acima de 85kg"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow"
                >
                  Salvar Categoria
                </button>
              </div>
            </div>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesList.map((category) => {
              const isEditing = editingCatId === category.id;
              const driverCount = getDriverCountForCategory(category.id);

              if (isEditing) {
                return (
                  <div
                    key={category.id}
                    className="bg-zinc-950 border border-red-500/60 rounded-xl p-4 space-y-3 shadow-lg"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Nome da Categoria
                      </label>
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white uppercase font-bold focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={editCatDesc}
                        onChange={(e) => setEditCatDesc(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditCategory(category.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={category.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-red-950/40 border border-red-800/60 text-red-300">
                        {category.name}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {driverCount} piloto(s)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {category.description || 'Categoria regular do campeonato.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-4 text-xs text-zinc-500">
                    <span className="text-[10px] font-mono">ID: {category.id}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(category.id);
                          setEditCatName(category.name);
                          setEditCatDesc(category.description || '');
                        }}
                        className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition cursor-pointer"
                        title="Editar / Renomear"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                        title="Excluir Categoria deste Campeonato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DISCARD RULES OF THIS CHAMPIONSHIP */}
      {activeTab === 'discards' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" />
                <span>Regras de Descarte deste Campeonato</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defina quantas piores etapas serão desconsideradas no cálculo da classificação final
                especificamente para este campeonato.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-800/50 px-3 py-1.5 rounded-xl">
                Regra Atual:{' '}
                {activeDiscardWorst === 0
                  ? 'Nenhum descarte (todas somam)'
                  : `Descarta as ${activeDiscardWorst} piores etapas`}
              </span>
            </div>
          </div>

          {/* Selector of Quick Discard Options */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <label className="block text-xs font-bold text-zinc-300">
              Opções Rápidas de Descarte Pré-Configuradas:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {discardOptionsList.map((opt) => {
                const isSelected = activeDiscardWorst === opt.count;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleApplyDiscardRule(opt.count)}
                    className={`p-3 rounded-xl font-bold text-xs border transition cursor-pointer text-center flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-mono text-base font-black">
                      {opt.count === 0 ? '0' : `-${opt.count}`}
                    </span>
                    <span className="truncate w-full text-[11px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Manual Numeric Discard Input */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">
                  Definir Manualmente a Quantidade de Descartes:
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  Digite qualquer número de etapas a descartar (Ex: 1, 2, 3, 4 etapas)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={championship.stages?.length ? championship.stages.length - 1 : 20}
                  value={manualDiscardInput}
                  onChange={(e) =>
                    setManualDiscardInput(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-24 bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl p-2.5 text-center font-mono font-black text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyDiscardRule(manualDiscardInput)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Aplicar Descarte</span>
                </button>
              </div>
            </div>
          </div>

          {/* Discard Options Library for this Championship */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Biblioteca de Opções de Descarte do Campeonato
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingDiscardOption(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-red-400" />
                <span>Adicionar Nova Opção</span>
              </button>
            </div>

            {isAddingDiscardOption && (
              <div className="bg-zinc-950 border border-red-500/40 rounded-xl p-4 space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Rótulo da Opção *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Descartar 4 Piores Etapas"
                      value={newDiscardLabel}
                      onChange={(e) => setNewDiscardLabel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Quantidade de Etapas a Descartar *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={newDiscardCount}
                      onChange={(e) => setNewDiscardCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingDiscardOption(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDiscardOption}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                  >
                    Salvar Opção
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {discardOptionsList.map((opt) => (
                <div
                  key={opt.id}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{opt.label}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Qtd descartada: {opt.count}
                    </span>
                  </div>
                  {opt.count > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDiscardOption(opt.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                      title="Remover opção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCORING RULES */}
      {activeTab === 'scoring' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-red-500" />
                <span>Tabela de Pontuação & Pontos Extras</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ajuste a pontuação de cada colocação do grid (1º ao 20º) e os bônus de Pole Position
                e Volta Mais Rápida deste campeonato.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPointsToStandard}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition border border-zinc-700 cursor-pointer"
              >
                Padrão 20 a 1
              </button>
              <button
                type="button"
                onClick={handleResetPointsToOriginal}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition border border-zinc-700 cursor-pointer"
              >
                Padrão MP 30-25-21...
              </button>
              <button
                type="button"
                onClick={handleSaveScoring}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Pontuação</span>
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
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isPodium
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
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
                      onChange={(e) => handlePointChange(pos, parseInt(e.target.value, 10) || 0)}
                      className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-red-500"
                    />
                    <span className="text-[10px] text-zinc-500">pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bonus Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div>
                <label className="block text-purple-400 font-bold text-xs">Pole Position</label>
                <span className="text-[11px] text-zinc-400">Pontos extras para o piloto na pole</span>
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
                <span className="text-zinc-500 font-bold text-xs">pts</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div>
                <label className="block text-amber-400 font-bold text-xs">Volta Mais Rápida</label>
                <span className="text-[11px] text-zinc-400">Pontos extras para a volta mais veloz</span>
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
                <span className="text-zinc-500 font-bold text-xs">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STAGES OF THIS CHAMPIONSHIP */}
      {activeTab === 'stages' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>Etapas e Calendário deste Campeonato</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Acesse diretamente as etapas para homologar baterias ou lançar resultados.
              </p>
            </div>

            <button
              onClick={onOpenChampionshipWizard}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-zinc-700 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              <span>Editar Calendário no Assistente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {championship.stages?.map((stage, idx) => (
              <div
                key={stage.id}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4.5 flex flex-col justify-between space-y-4 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition">
                        {stage.name}
                      </h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        <span>{stage.trackName || championship.location}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      stage.completed
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {stage.completed ? '✓ Homologada' : 'Pendente'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{stage.date}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenStageManager(stage)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white transition font-bold text-xs cursor-pointer border border-red-500/30"
                  >
                    <span>Lançar / Gerenciar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
