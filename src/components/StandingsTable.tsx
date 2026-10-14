import React, { useState } from 'react';
import {
  Trophy,
  Search,
  Filter,
  FileDown,
  Medal,
  Calendar,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
  UserPlus,
} from 'lucide-react';
import { Championship, DriverStats, Category, User, Stage } from '../types';

interface StandingsTableProps {
  championship?: Championship;
  standings: DriverStats[];
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (catId: string) => void;
  currentUser: User;
  onSelectDriver: (driverId: string) => void;
  onSelectStage: (stage: Stage) => void;
  onExportPdf: () => void;
  onOpenStageManager: (stage: Stage) => void;
  onOpenEnrollment?: () => void;
  onOpenNewChampionship?: () => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  championship,
  standings,
  categories,
  selectedCategoryId,
  onSelectCategory,
  currentUser,
  onSelectDriver,
  onSelectStage,
  onExportPdf,
  onOpenStageManager,
  onOpenEnrollment,
  onOpenNewChampionship,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!championship) {
    return (
      <div className="p-12 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 mx-auto flex items-center justify-center">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Nenhum Campeonato Cadastrado</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
            Esta produtora ainda não possui campeonatos cadastrados. O administrador da produtora pode criar o primeiro campeonato.
          </p>
        </div>
        {onOpenNewChampionship && (
          <button
            onClick={onOpenNewChampionship}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>+ Criar Primeiro Campeonato</span>
          </button>
        )}
      </div>
    );
  }

  const filteredStandings = standings.filter((item) => {
    const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKart = item.kartNumber.includes(searchTerm);
    const matchTeam = item.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchKart || matchTeam;
  });

  const leader = standings[0];
  const lastCompletedStage = [...(championship?.stages || [])].reverse().find((s) => s.completed);
  const nextStage = (championship?.stages || []).find((s) => !s.completed);

  return (
    <div className="space-y-6">
      {/* Top Highlight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leader Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-xl border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-amber-400">
            <Trophy className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Líder do Campeonato
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              1º LUGAR
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              {leader ? leader.name : 'Nenhum'}
              {leader && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  #{leader.kartNumber}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{leader?.teamName}</p>
            <div className="mt-3 flex items-baseline justify-between border-t border-zinc-800/80 pt-2 text-xs">
              <span className="text-zinc-400">Pontos Acumulados:</span>
              <span className="text-base font-mono font-bold text-amber-400">
                {leader?.totalPoints || 0} pts
              </span>
            </div>
          </div>
        </div>

        {/* Last Completed Stage Winner */}
        <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Última Etapa ({lastCompletedStage?.name || 'N/A'})
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">Homologada</span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-sm font-bold text-white truncate">
              {lastCompletedStage?.fullName || 'Aguardando início'}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{lastCompletedStage?.trackName}</p>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 text-xs">
              <span className="text-zinc-400">Pódio da Etapa:</span>
              {lastCompletedStage?.podium ? (
                <span className="text-xs font-bold text-zinc-200">
                  🥇 {standings.find((s) => s.driverId === lastCompletedStage?.podium?.first)?.name || 'Piloto'}
                </span>
              ) : (
                <span className="text-zinc-500">Concluída</span>
              )}
            </div>
          </div>
        </div>

        {/* Next Stage Info */}
        <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Próxima Rodada
            </span>
            <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
              {nextStage?.name || 'Fim da Temporada'}
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-sm font-bold text-white truncate">
              {nextStage?.fullName || 'Campeonato Finalizado'}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              {nextStage ? `${nextStage.trackName} • ${nextStage.date}` : 'Aguardando 2027'}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 text-xs">
              <span className="text-zinc-400">Grid Previsto:</span>
              <span className="text-xs font-bold text-blue-400">
                {championship.registeredDriverIds.length} Pilotos inscritos
              </span>
            </div>
          </div>
        </div>

        {/* Championship Format & Stats */}
        <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-red-500" />
              Formato de Disputa
            </span>
            <span className="text-[11px] font-mono text-zinc-300">
              {championship.stagesCount} Etapas
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-sm font-bold text-white">
              {championship.type === 'fastest_lap'
                ? 'Critério: Volta Mais Rápida'
                : championship.type === 'multi_race'
                ? 'Baterias por Etapa (Soma Geral)'
                : 'Pontuação Padrão F1'}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {championship.discardWorstCount === 0
                ? 'Sem descarte de etapas (Planilha Oficial)'
                : `Descarte das ${championship.discardWorstCount} piores etapas`}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 text-xs">
              <span className="text-zinc-400">Pole / Volta Rápida:</span>
              <span className="font-bold text-red-400">
                +{championship.polePoints} pt / +{championship.fastestLapPoints} pt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search and PDF Export */}
      <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Categoria:
          </span>
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              selectedCategoryId === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            Todas ({championship.registeredDriverIds.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategoryId === cat.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar piloto ou nº kart..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {onOpenEnrollment && (
            <button
              onClick={onOpenEnrollment}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-sm"
              title="Inscrever piloto no campeonato ativo"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inscrever-se</span>
            </button>
          )}

          <button
            onClick={onExportPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-red-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Standings Table Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>{championship.name}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                OFICIAL
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Classificação Geral Consolidada • {championship.stagesCount} Etapas (Janeiro a Dezembro)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const target = championship.stages.find((s) => !s.completed) || championship.stages[0];
                onOpenStageManager(target);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-950/40 transition cursor-pointer"
              title="Lançar resultados da etapa atual ou transcrever telemetria com IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Lançar Resultados (IA)</span>
            </button>

            <select
              onChange={(e) => {
                const stage = championship.stages.find((s) => s.id === e.target.value);
                if (stage) onOpenStageManager(stage);
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>
                Selecionar Etapa...
              </option>
              {championship.stages.map((st) => (
                <option key={st.id} value={st.id}>
                  Etapa {st.stageNumber}: {st.name} {st.completed ? '✓ (Editar)' : '⏱ (Lançar)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-3 text-center w-12">POS</th>
                <th className="py-3 px-4">PILOTO</th>
                <th className="py-3 px-2 text-center w-14">Nº</th>
                <th className="py-3 px-3 hidden md:table-cell">EQUIPE</th>
                <th className="py-3 px-3 hidden lg:table-cell">CAT</th>
                {championship.stages.map((stage) => (
                  <th
                    key={stage.id}
                    onClick={() => onSelectStage(stage)}
                    className={`py-3 px-2 text-center cursor-pointer transition hover:bg-zinc-800/80 ${
                      stage.completed ? 'text-zinc-200' : 'text-zinc-600'
                    }`}
                    title={`${stage.fullName} - Clique para ver detalhes da etapa`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{stage.name}</span>
                      {stage.completed ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-0.5" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center hidden sm:table-cell">PÓDIOS</th>
                <th className="py-3 px-4 text-center bg-zinc-950 text-amber-400 font-mono font-bold text-xs">
                  TOTAL
                </th>
                <th className="py-3 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan={championship.stages.length + 8} className="py-8 text-center text-zinc-500">
                    Nenhum piloto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredStandings.map((item, index) => {
                  const isTop1 = index === 0;
                  const isTop2 = index === 1;
                  const isTop3 = index === 2;
                  const isCurrentUser = currentUser.driverId === item.driverId;

                  return (
                    <tr
                      key={item.driverId}
                      className={`hover:bg-zinc-800/50 transition cursor-pointer group ${
                        isCurrentUser ? 'bg-red-950/20 border-l-4 border-red-500' : ''
                      } ${isTop1 ? 'bg-amber-500/5' : isTop2 ? 'bg-zinc-400/5' : isTop3 ? 'bg-orange-500/5' : ''}`}
                      onClick={() => onSelectDriver(item.driverId)}
                    >
                      {/* Position with Medal */}
                      <td className="py-3 px-3 text-center font-bold">
                        {isTop1 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs shadow-sm">
                            1º
                          </div>
                        ) : isTop2 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-300/20 text-zinc-200 border border-zinc-300/40 text-xs">
                            2º
                          </div>
                        ) : isTop3 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 text-xs">
                            3º
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-mono">{index + 1}º</span>
                        )}
                      </td>

                      {/* Driver Name & Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white group-hover:text-red-400 transition tracking-wide text-sm">
                            {item.name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                              Você
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kart Number */}
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs">
                          {item.kartNumber}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.teamColor }}
                          />
                          <span className="text-zinc-300 truncate max-w-[140px]">
                            {item.teamName}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                          {item.categoryName}
                        </span>
                      </td>

                      {/* Stage Points */}
                      {championship.stages.map((stage) => {
                        const score = item.stagePoints[stage.name];
                        const hasScore = score !== undefined && score > 0;
                        const isStageWinner = stage.podium?.first === item.driverId;

                        return (
                          <td
                            key={stage.id}
                            className={`py-3 px-2 text-center font-mono ${
                              hasScore ? 'text-zinc-200' : 'text-zinc-600'
                            }`}
                          >
                            {hasScore ? (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${
                                  isStageWinner
                                    ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                                    : 'hover:bg-zinc-800'
                                }`}
                              >
                                {score}
                              </span>
                            ) : (
                              <span className="text-zinc-700">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Podiums count */}
                      <td className="py-3 px-3 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center space-x-1 text-xs">
                          {item.podiums1st > 0 && (
                            <span className="text-amber-300 font-semibold" title="1º Lugar">
                              {item.podiums1st}🥇
                            </span>
                          )}
                          {item.podiums2nd > 0 && (
                            <span className="text-zinc-300 font-semibold" title="2º Lugar">
                              {item.podiums2nd}🥈
                            </span>
                          )}
                          {item.podiums3rd > 0 && (
                            <span className="text-amber-600 font-semibold" title="3º Lugar">
                              {item.podiums3rd}🥉
                            </span>
                          )}
                          {item.totalPodiums === 0 && (
                            <span className="text-zinc-600 font-mono">0</span>
                          )}
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="py-3 px-4 text-center font-mono font-black text-sm bg-zinc-950/40 text-amber-400">
                        {item.totalPoints}
                      </td>

                      {/* View Action */}
                      <td className="py-3 px-2 text-center text-zinc-500 group-hover:text-zinc-300">
                        <ChevronRight className="w-4 h-4 inline" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Pontuação oficial da temporada 2026. Clique em qualquer piloto para ver a ficha completa de desempenho.</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Etapa Homologada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-700" /> Etapa Futura
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
