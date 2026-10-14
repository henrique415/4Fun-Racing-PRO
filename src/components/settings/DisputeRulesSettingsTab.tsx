import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  Zap,
  Calendar,
  Flag,
  Shield,
  X,
  Save,
} from 'lucide-react';
import { DisputeRuleConfig, ChampionshipType, User } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudDatabaseService } from '../../services/cloudDatabase';
import { isSupreme } from '../../utils/permissions';

interface DisputeRulesSettingsTabProps {
  currentUser: User | null;
}

export const DisputeRulesSettingsTab: React.FC<DisputeRulesSettingsTabProps> = ({
  currentUser,
}) => {
  const isUserSupreme = isSupreme(currentUser);
  const [rules, setRules] = useState<DisputeRuleConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DisputeRuleConfig | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryType, setCategoryType] = useState<ChampionshipType>('multi_race');
  const [defaultStagesCount, setDefaultStagesCount] = useState<number>(12);
  const [defaultRacesPerStage, setDefaultRacesPerStage] = useState<number>(2);
  const [scheduleMode, setScheduleMode] = useState<'same_day' | 'different_days' | 'weekly_monthly' | 'custom'>('weekly_monthly');
  const [scoringMode, setScoringMode] = useState<'points_sum' | 'best_lap_time' | 'fastest_lap_count' | 'endurance_laps'>('points_sum');
  const [colorTheme, setColorTheme] = useState<'red' | 'amber' | 'blue' | 'purple' | 'emerald'>('red');
  const [active, setActive] = useState(true);

  useEffect(() => {
    const loaded = StorageService.getDisputeRules();
    setRules(loaded);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setName('');
    setDescription('');
    setCategoryType('multi_race');
    setDefaultStagesCount(12);
    setDefaultRacesPerStage(2);
    setScheduleMode('weekly_monthly');
    setScoringMode('points_sum');
    setColorTheme('red');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: DisputeRuleConfig) => {
    setEditingRule(rule);
    setName(rule.name);
    setDescription(rule.description);
    setCategoryType(rule.categoryType);
    setDefaultStagesCount(rule.defaultStagesCount);
    setDefaultRacesPerStage(rule.defaultRacesPerStage);
    setScheduleMode(rule.scheduleMode);
    setScoringMode(rule.scoringMode);
    setColorTheme(rule.colorTheme || 'red');
    setActive(rule.active);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    if (!isUserSupreme) return;
    const updated = rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    setRules(updated);
    StorageService.saveDisputeRules(updated);
    await CloudDatabaseService.saveToCloud({ disputeRules: updated });
    const target = updated.find((r) => r.id === id);
    showNotification(`Regra "${target?.name}" agora está ${target?.active ? 'ATIVA' : 'INATIVA'} para produtoras.`);
  };

  const handleDeleteRule = async (id: string) => {
    if (!isUserSupreme) return;
    if (rules.length <= 1) {
      alert('É necessário manter pelo menos uma regra cadastrada no sistema.');
      return;
    }
    const rule = rules.find((r) => r.id === id);
    if (!window.confirm(`Deseja realmente excluir a regra "${rule?.name}"?`)) return;

    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    StorageService.saveDisputeRules(updated);
    await CloudDatabaseService.saveToCloud({ disputeRules: updated });
    showNotification('Regra de campeonato excluída com sucesso.');
  };

  const handleResetDefaults = async () => {
    if (!isUserSupreme) return;
    if (!window.confirm('Deseja restaurar as regras de disputa para o padrão oficial de fábrica?')) return;
    const defaults = StorageService.getDefaultDisputeRules();
    setRules(defaults);
    StorageService.saveDisputeRules(defaults);
    await CloudDatabaseService.saveToCloud({ disputeRules: defaults });
    showNotification('Regras de disputa restauradas para o padrão oficial.');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserSupreme) return;
    if (!name.trim()) {
      alert('Informe o nome da regra de campeonato.');
      return;
    }

    let updated: DisputeRuleConfig[];

    if (editingRule) {
      updated = rules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              name: name.trim(),
              description: description.trim(),
              categoryType,
              defaultStagesCount,
              defaultRacesPerStage,
              scheduleMode,
              scoringMode,
              colorTheme,
              active,
            }
          : r
      );
      showNotification(`Regra "${name.trim()}" atualizada com sucesso!`);
    } else {
      const newRule: DisputeRuleConfig = {
        id: `rule-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        categoryType,
        defaultStagesCount,
        defaultRacesPerStage,
        scheduleMode,
        scoringMode,
        colorTheme,
        active,
        createdAt: new Date().toISOString(),
      };
      updated = [...rules, newRule];
      showNotification(`Nova regra "${name.trim()}" criada e pronta para os produtores!`);
    }

    setRules(updated);
    StorageService.saveDisputeRules(updated);
    await CloudDatabaseService.saveToCloud({ disputeRules: updated });
    setIsModalOpen(false);
  };

  const getCategoryBadge = (type: ChampionshipType) => {
    switch (type) {
      case 'fastest_lap':
        return { label: 'Volta Rápida', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Zap };
      case 'standard':
        return { label: 'Corrida Direta', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Trophy };
      case 'endurance':
        return { label: 'Endurance', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock };
      case 'multi_race':
      default:
        return { label: 'Multi-Baterias', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Layers };
    }
  };

  const getScheduleLabel = (mode: string) => {
    switch (mode) {
      case 'same_day':
        return 'Baterias no mesmo dia';
      case 'different_days':
        return 'Baterias em dias diferentes';
      case 'weekly_monthly':
        return 'Semanas do mês (4 a 5 por mês)';
      default:
        return 'Cronograma flexível';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Supreme Admin Callout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>Sistemas de Disputa & Regras de Campeonato</span>
              <span className="text-[10px] bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                Administrador Supremo
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Crie e configure aqui os formatos de disputa (Endurance, Volta Rápida, Multi-Baterias, etc.). As regras marcadas como <strong>Ativas</strong> ficam disponíveis para os administradores de produtora/tenants escolherem na criação de novos campeonatos.
            </p>
          </div>
        </div>

        {isUserSupreme && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition flex items-center space-x-1.5 cursor-pointer"
              title="Restaurar regras oficiais originais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Regra de Disputa</span>
            </button>
          </div>
        )}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map((rule) => {
          const badge = getCategoryBadge(rule.categoryType);
          const BadgeIcon = badge.icon;

          return (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between relative group ${
                rule.active
                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-md'
                  : 'bg-zinc-950/50 border-zinc-900 opacity-60'
              }`}
            >
              <div>
                {/* Header: Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${badge.color}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </span>

                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    disabled={!isUserSupreme}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition cursor-pointer flex items-center gap-1 ${
                      rule.active
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                    }`}
                    title="Clique para alternar disponibilidade para produtoras"
                  >
                    {rule.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ativo para Tenants</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Inativo (Oculto)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Rule Title */}
                <h3 className="text-sm font-black text-white leading-tight mb-2">
                  {rule.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                  {rule.description}
                </p>

                {/* Parameters Pill List */}
                <div className="space-y-1.5 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Etapas Padrão:</span>
                    <span className="font-mono font-bold text-white">{rule.defaultStagesCount} etapas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Baterias / Sessões por Etapa:</span>
                    <span className="font-mono font-bold text-amber-400">{rule.defaultRacesPerStage} corridas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Cronograma:</span>
                    <span className="text-zinc-200 font-medium truncate max-w-[170px]" title={getScheduleLabel(rule.scheduleMode)}>
                      {getScheduleLabel(rule.scheduleMode)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {isUserSupreme && (
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Editar parâmetros desta regra"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                    title="Excluir regra de disputa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Regra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingRule ? 'Editar Regra de Campeonato' : 'Criar Nova Regra de Disputa'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Defina o modelo técnico que os gestores de produtora usarão em seus campeonatos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  Nome da Regra de Negócio
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Endurance 6h com Box, Multi-Baterias em Dias Diferentes..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  Tipo / Categoria Base
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['multi_race', 'fastest_lap', 'standard', 'endurance'] as ChampionshipType[]).map((t) => {
                    const badge = getCategoryBadge(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setCategoryType(t);
                          if (t === 'standard') setDefaultRacesPerStage(1);
                          if (t === 'endurance') setDefaultRacesPerStage(1);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                          categoryType === t
                            ? 'bg-red-600 border-red-500 text-white shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  Descrição e Funcionamento da Regra
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique como os pontos são computados, frequência das baterias, paradas de box ou critério de desempate..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Número Padrão de Etapas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={defaultStagesCount}
                    onChange={(e) => setDefaultStagesCount(parseInt(e.target.value, 10) || 12)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Baterias / Corridas por Etapa
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={defaultRacesPerStage}
                    onChange={(e) => setDefaultRacesPerStage(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Formato de Cronograma
                  </label>
                  <select
                    value={scheduleMode}
                    onChange={(e) => setScheduleMode(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs cursor-pointer"
                  >
                    <option value="weekly_monthly">Semanal ao longo do mês (4 a 5 fins de semana)</option>
                    <option value="same_day">Todas as baterias no mesmo dia</option>
                    <option value="different_days">Baterias em dias diferentes (ex: Sáb e Dom)</option>
                    <option value="custom">Cronograma livre / customizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Modo de Apuração
                  </label>
                  <select
                    value={scoringMode}
                    onChange={(e) => setScoringMode(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-red-500 text-xs cursor-pointer"
                  >
                    <option value="points_sum">Soma de Pontos das Baterias</option>
                    <option value="best_lap_time">Melhor Tempo de Volta (Telemetria)</option>
                    <option value="fastest_lap_count">Mais Voltas Rápidas Cravadas</option>
                    <option value="endurance_laps">Total de Voltas / Distância Percorrida</option>
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Status da Regra</span>
                  <span className="text-[11px] text-zinc-400">
                    Se ativa, aparece como opção no momento em que a produtora cria um campeonato
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}
                >
                  {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{active ? 'Ativa' : 'Inativa'}</span>
                </button>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-md shadow-red-950/50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Regra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
