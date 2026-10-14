import React, { useState, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Trophy,
  CheckCircle2,
  Clock,
  Edit3,
  FileDown,
  Sparkles,
  Zap,
  Flag,
  Camera,
  X,
  SlidersHorizontal,
  Plus,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Championship, Stage, Driver, Team, User, DriverStats, DriverLapRecord } from '../types';
import { isAdminOrSupreme } from '../utils/permissions';
import { exportStageSummaryPdf } from '../services/pdfExport';
import { calculateFastestLapRanking } from '../utils/lapTimeUtils';

interface StagesViewProps {
  championship?: Championship;
  drivers: Driver[];
  teams: Team[];
  currentUser: User;
  standings: DriverStats[];
  onOpenStageManager: (stage: Stage) => void;
  selectedStageId?: string;
  onOpenNewChampionship?: () => void;
  onOpenEnrollment?: () => void;
}

export const StagesView: React.FC<StagesViewProps> = ({
  championship,
  drivers,
  teams,
  currentUser,
  standings,
  onOpenStageManager,
  selectedStageId,
  onOpenNewChampionship,
  onOpenEnrollment,
}) => {
  const [activeStageId, setActiveStageId] = useState<string>(
    selectedStageId || championship?.stages?.[0]?.id || ''
  );
  const [activeRaceTab, setActiveRaceTab] = useState<number>(0);
  const [previewPhotoRecord, setPreviewPhotoRecord] = useState<{
    driver: Driver;
    record: DriverLapRecord;
  } | null>(null);

  if (!championship) {
    return (
      <div className="p-12 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 mx-auto flex items-center justify-center">
          <Calendar className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Nenhum Calendário Disponível</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
            Cadastre um campeonato para visualizar o calendário oficial de etapas, baterias e pistas.
          </p>
        </div>
        {onOpenNewChampionship && (
          <button
            onClick={onOpenNewChampionship}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Primeiro Campeonato</span>
          </button>
        )}
      </div>
    );
  }

  const activeStage =
    championship.stages.find((s) => s.id === activeStageId) || championship.stages[0];

  const getDriverName = (id?: string) => {
    if (!id) return '-';
    const d = drivers.find((drv) => drv.id === id);
    return d ? `${d.name} (#${d.kartNumber})` : id;
  };

  const getDriver = (id?: string) => drivers.find((drv) => drv.id === id);

  const triggerPodiumConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Calculate fastest lap rankings for fastest_lap championship
  const fastestLapRanked = useMemo(() => {
    if (!activeStage) return [];
    const registered = drivers.filter((d) => championship.registeredDriverIds.includes(d.id));
    return calculateFastestLapRanking(
      registered,
      activeStage.lapRecords || {},
      championship.pointsScale
    );
  }, [activeStage, drivers, championship]);

  // Stage classification: sort drivers by their points in this stage
  const stageResults = Object.entries(activeStage?.stagePoints || {})
    .filter(([_, pts]) => pts > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([driverId, points], idx) => {
      const driver = getDriver(driverId);
      const team = teams.find((t) => t.id === driver?.teamId);
      return {
        position: idx + 1,
        driver,
        team,
        points,
      };
    });

  const firstDriver = getDriver(activeStage?.podium?.first || stageResults[0]?.driver?.id);
  const secondDriver = getDriver(activeStage?.podium?.second || stageResults[1]?.driver?.id);
  const thirdDriver = getDriver(activeStage?.podium?.third || stageResults[2]?.driver?.id);

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Criar Campeonato & Inscrever-se */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>{championship.name}</span>
              <span className="text-[10px] bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                Temporada {championship.season}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {championship.disputeRuleName || (championship.type === 'fastest_lap' ? 'Torneio de Volta Rápida' : 'Multi-Baterias por Etapa')} • {championship.stagesCount} etapas programadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botão Inscrever-se no Campeonato */}
          {onOpenEnrollment && (
            <button
              onClick={onOpenEnrollment}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition shadow-md cursor-pointer"
              title="Inscrever piloto no grid deste campeonato"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Inscrever-se</span>
            </button>
          )}

          {/* Botão Criar Novo Campeonato */}
          {onOpenNewChampionship && (
            <button
              onClick={onOpenNewChampionship}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 cursor-pointer"
              title="Criar um novo campeonato neste tenant"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Campeonato</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Stage Selector Carousel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-md overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          {championship.stages.map((stage) => {
            const isSelected = stage.id === activeStage?.id;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStageId(stage.id);
                  setActiveRaceTab(0);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/40'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold">Etapa {stage.stageNumber}</span>
                  {stage.completed ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </div>
                <div className="mt-1 font-mono font-bold text-sm">
                  {stage.name}
                </div>
                <div className="text-[10px] opacity-80 truncate max-w-[90px]">
                  {stage.completed ? 'Homologada' : 'Aguardando'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stage Detail Card */}
      {activeStage && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 font-bold text-xs">
                    Etapa {activeStage.stageNumber} de {championship.stagesCount}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded font-bold text-xs flex items-center gap-1 ${
                    activeStage.completed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {activeStage.completed ? 'Etapa Homologada' : 'Aguardando Realização'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeStage.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400" />
                    {activeStage.trackName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {new Date(activeStage.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onOpenStageManager(activeStage)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-950/40 cursor-pointer"
                  title="Lançar tempos de volta, baterias ou transcrever foto de telemetria"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {activeStage.completed ? 'Editar Resultados / IA' : '⚡ Lançar Resultados / Telemetria IA'}
                  </span>
                </button>

                {activeStage.completed && (
                  <>
                    <button
                      onClick={triggerPodiumConfetti}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Celebrar Pódio 🎉</span>
                    </button>

                    <button
                      onClick={() => exportStageSummaryPdf(championship, activeStage, standings)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-red-400" />
                      <span>Relatório da Etapa (PDF)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Podium Visual Cards (1st, 2nd, 3rd) */}
          {activeStage.completed && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Pódio Oficial da Etapa {activeStage.name}
                  </h3>
                </div>
                <span className="text-xs text-zinc-400">
                  Total acumulado para o Campeonato
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 bg-zinc-950/70 rounded-xl p-4 border border-zinc-800 flex flex-col items-center text-center relative">
                  <span className="text-2xl font-black text-zinc-400 mb-1">🥈 2º LUGAR</span>
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-400 flex items-center justify-center font-black text-lg text-white my-2">
                    #{secondDriver?.kartNumber || '-'}
                  </div>
                  <h4 className="text-lg font-black text-white">{secondDriver?.name || 'A definir'}</h4>
                  <p className="text-xs text-zinc-400">{teams.find((t) => t.id === secondDriver?.teamId)?.name || '-'}</p>
                  <div className="mt-3 px-3 py-1 rounded bg-zinc-800/80 font-mono font-bold text-sm text-zinc-200">
                    {stageResults[1]?.points || activeStage.stagePoints[secondDriver?.id || ''] || 0} pts na etapa
                  </div>
                </div>

                {/* 1st Place - Winner */}
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 to-zinc-950 rounded-xl p-5 border-2 border-amber-500/50 flex flex-col items-center text-center relative shadow-lg shadow-amber-500/10 -mt-2">
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider shadow">
                    Campeão da Etapa
                  </div>
                  <span className="text-3xl font-black text-amber-300 mb-1 mt-2">🥇 1º LUGAR</span>
                  <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center font-black text-xl text-amber-300 my-2 shadow-inner">
                    #{firstDriver?.kartNumber || '-'}
                  </div>
                  <h4 className="text-xl font-black text-white">{firstDriver?.name || 'A definir'}</h4>
                  <p className="text-xs text-zinc-300">{teams.find((t) => t.id === firstDriver?.teamId)?.name || '-'}</p>
                  <div className="mt-3 px-4 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 font-mono font-black text-base text-amber-300">
                    {stageResults[0]?.points || activeStage.stagePoints[firstDriver?.id || ''] || 0} pts na etapa
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 md:order-3 bg-zinc-950/70 rounded-xl p-4 border border-zinc-800 flex flex-col items-center text-center relative">
                  <span className="text-2xl font-black text-amber-600 mb-1">🥉 3º LUGAR</span>
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-amber-700 flex items-center justify-center font-black text-lg text-white my-2">
                    #{thirdDriver?.kartNumber || '-'}
                  </div>
                  <h4 className="text-lg font-black text-white">{thirdDriver?.name || 'A definir'}</h4>
                  <p className="text-xs text-zinc-400">{teams.find((t) => t.id === thirdDriver?.teamId)?.name || '-'}</p>
                  <div className="mt-3 px-3 py-1 rounded bg-zinc-800/80 font-mono font-bold text-sm text-zinc-200">
                    {stageResults[2]?.points || activeStage.stagePoints[thirdDriver?.id || ''] || 0} pts na etapa
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Race Sessions Breakdown or Stage Points */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-500" />
                  <span>
                    {championship.type === 'fastest_lap'
                      ? 'Voltas Rápidas da Etapa'
                      : activeStage.races && activeStage.races.length > 0
                      ? 'Baterias & Desempenho na Etapa'
                      : 'Classificação da Etapa'}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  {championship.type === 'multi_race'
                    ? 'A soma de pontos das baterias define o campeão da etapa e pontua para o torneio'
                    : 'Resultados registrados para a pontuação da temporada'}
                </p>
              </div>

              {/* Race session tabs if multi_race */}
              {activeStage.races && activeStage.races.length > 0 && (
                <div className="flex items-center space-x-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setActiveRaceTab(0)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeRaceTab === 0 ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Consolidado da Etapa
                  </button>
                  {activeStage.races.map((race, rIdx) => (
                    <button
                      key={race.id}
                      onClick={() => setActiveRaceTab(rIdx + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeRaceTab === rIdx + 1
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {race.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content for Consolidated Stage or Individual Race */}
            {activeRaceTab === 0 ? (
              championship.type === 'fastest_lap' ? (
                /* Specialized Fastest Lap Stage Ranking Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="py-3 px-3 text-center w-12">POS</th>
                        <th className="py-3 px-4">PILOTO</th>
                        <th className="py-3 px-2 text-center w-14">Nº KART</th>
                        <th className="py-3 px-3">EQUIPE</th>
                        <th className="py-3 px-4 text-center w-36">TEMPO OFICIAL</th>
                        <th className="py-3 px-3 text-center w-24">GAP / DIF</th>
                        <th className="py-3 px-3 text-center w-36">SETORES</th>
                        <th className="py-3 px-3 text-center w-32">ORIGEM / VISOR</th>
                        <th className="py-3 px-3 text-center w-24">PONTOS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {fastestLapRanked.filter((item) => item.lapMs > 0).length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-zinc-500">
                            {activeStage.completed
                              ? 'Nenhum tempo de volta registrado para esta etapa.'
                              : 'Etapa ainda sem tomadas registradas. Use "Gerenciar Etapa" para cadastrar os tempos manualmente ou via foto de telemetria com IA.'}
                          </td>
                        </tr>
                      ) : (
                        fastestLapRanked
                          .filter((item) => item.lapMs > 0)
                          .map((item) => {
                            const team = teams.find((t) => t.id === item.driver.teamId);
                            const rec = item.record;
                            const isP1 = item.position === 1;

                            return (
                              <tr
                                key={item.driver.id}
                                className={`hover:bg-zinc-800/40 transition ${
                                  isP1 ? 'bg-amber-500/5' : ''
                                }`}
                              >
                                <td className="py-3 px-3 text-center font-bold">
                                  {item.position === 1 ? (
                                    <span className="text-amber-300 font-black">1º 🥇</span>
                                  ) : item.position === 2 ? (
                                    <span className="text-zinc-300 font-black">2º 🥈</span>
                                  ) : item.position === 3 ? (
                                    <span className="text-amber-600 font-black">3º 🥉</span>
                                  ) : (
                                    <span className="text-zinc-400 font-mono">{item.position}º</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-white">
                                  <div className="flex items-center gap-1.5">
                                    {item.driver.name}
                                    {isP1 && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/30">
                                        ⚡ VOLTA MAIS RÁPIDA
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                    #{item.driver.kartNumber}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-zinc-400">
                                  {team?.name || 'Independente'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`font-mono font-black text-sm px-2.5 py-0.5 rounded ${
                                      isP1
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'text-white'
                                    }`}
                                  >
                                    {item.officialTime}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-zinc-400">
                                  {isP1 ? (
                                    <span className="text-amber-400 font-bold">Líder</span>
                                  ) : (
                                    item.gapStr
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-400">
                                  {rec?.sectors ? (
                                    <div className="space-x-1">
                                      <span>S1: {rec.sectors.s1 || '-'}</span>
                                      <span>S2: {rec.sectors.s2 || '-'}</span>
                                      <span>S3: {rec.sectors.s3 || '-'}</span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-600">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {rec?.selectedSource === 'rolling' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                        Rolling (IA)
                                      </span>
                                    ) : rec?.selectedSource === 'best' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                                        Best (IA)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px]">
                                        Manual
                                      </span>
                                    )}

                                    {rec?.telemetryPhotoUrl && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewPhotoRecord({
                                            driver: item.driver,
                                            record: rec,
                                          })
                                        }
                                        title="Ver foto do painel de telemetria"
                                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                                      >
                                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-amber-400 text-sm">
                                  {item.points > 0 ? `${item.points} pts` : '-'}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Standard Stage Classification Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                        <th className="py-3 px-4 text-center w-14">POS</th>
                        <th className="py-3 px-4">PILOTO</th>
                        <th className="py-3 px-2 text-center w-16">Nº KART</th>
                        <th className="py-3 px-4">EQUIPE</th>
                        <th className="py-3 px-4 text-center">PONTOS NA ETAPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {stageResults.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500">
                            {activeStage.completed
                              ? 'Nenhum resultado registrado para esta etapa.'
                              : 'Etapa ainda não realizada. Aguardando a largada!'}
                          </td>
                        </tr>
                      ) : (
                        stageResults.map((item) => (
                          <tr
                            key={item.driver?.id}
                            className="hover:bg-zinc-800/40 transition"
                          >
                            <td className="py-3 px-4 text-center font-bold">
                              {item.position === 1 ? (
                                <span className="text-amber-300">1º 🥇</span>
                              ) : item.position === 2 ? (
                                <span className="text-zinc-300">2º 🥈</span>
                              ) : item.position === 3 ? (
                                <span className="text-amber-600">3º 🥉</span>
                              ) : (
                                <span className="text-zinc-400 font-mono">{item.position}º</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {item.driver?.name}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {item.driver?.kartNumber}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              {item.team?.name || 'Independente'}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-amber-400 text-sm">
                              {item.points} pts
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // Individual Race Session View
              <div className="overflow-x-auto">
                {(() => {
                  const race = activeStage.races[activeRaceTab - 1];
                  if (!race) return null;

                  return (
                    <div className="p-4 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{race.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          {race.poleDriverId && (
                            <span className="flex items-center gap-1.5 text-zinc-300">
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                                Pole Position
                              </span>
                              <span>{getDriverName(race.poleDriverId)}</span>
                            </span>
                          )}
                          {race.fastestLapDriverId && (
                            <span className="flex items-center gap-1.5 text-zinc-300">
                              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                                Volta Mais Rápida
                              </span>
                              <span>{getDriverName(race.fastestLapDriverId)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                            <th className="py-2.5 px-3 text-center w-12">POS</th>
                            <th className="py-2.5 px-3">PILOTO</th>
                            <th className="py-2.5 px-2 text-center w-16">Nº</th>
                            <th className="py-2.5 px-3 text-center">DESTAQUES</th>
                            <th className="py-2.5 px-3 text-center">PONTOS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-medium">
                          {race.results?.map((res) => {
                            const driver = getDriver(res.driverId);
                            return (
                              <tr key={res.driverId} className="hover:bg-zinc-800/40">
                                <td className="py-2.5 px-3 text-center font-bold text-zinc-300 font-mono">
                                  {res.position}º
                                </td>
                                <td className="py-2.5 px-3 font-bold text-white">
                                  {driver?.name}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className="font-mono font-bold text-zinc-400">
                                    {driver?.kartNumber}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {res.pole && (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                                        POLE
                                      </span>
                                    )}
                                    {res.fastestLap && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                        VR
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-200">
                                  {res.points} pts
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Telemetry Photo & Analysis Lightbox Modal */}
      {previewPhotoRecord && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span>{previewPhotoRecord.driver.name}</span>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      #{previewPhotoRecord.driver.kartNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Visor de Telemetria • {previewPhotoRecord.record.deviceModel || 'Alfano 6'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewPhotoRecord(null)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {previewPhotoRecord.record.telemetryPhotoUrl && (
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center max-h-72">
                  <img
                    src={previewPhotoRecord.record.telemetryPhotoUrl}
                    alt="Visor Alfano 6"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold">Best Lap</div>
                  <div className="font-mono font-black text-white text-sm mt-0.5">
                    {previewPhotoRecord.record.bestLap || '-'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 font-bold">Rolling Lap</div>
                  <div className="font-mono font-black text-emerald-300 text-sm mt-0.5">
                    {previewPhotoRecord.record.rollingLap || '-'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold">Teórico</div>
                  <div className="font-mono font-black text-zinc-300 text-sm mt-0.5">
                    {previewPhotoRecord.record.theoreticalLap || '-'}
                  </div>
                </div>
              </div>

              {previewPhotoRecord.record.notes && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                  ✨ {previewPhotoRecord.record.notes}
                </div>
              )}
            </div>

            <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-right">
              <button
                onClick={() => setPreviewPhotoRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
