import React from 'react';
import {
  X,
  Trophy,
  Award,
  Zap,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Flag,
  Share2,
} from 'lucide-react';
import { Driver, Team, Category, Championship, DriverStats, User } from '../types';
import { DriverAvatar } from './DriverAvatar';

interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string | null;
  drivers: Driver[];
  teams: Team[];
  categories: Category[];
  championship?: Championship;
  standings: DriverStats[];
  currentUser: User;
  onToggleEnrollment: (driverId: string) => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  isOpen,
  onClose,
  driverId,
  drivers,
  teams,
  categories,
  championship,
  standings,
  currentUser,
  onToggleEnrollment,
}) => {
  if (!isOpen || !driverId) return null;

  const driver = drivers.find((d) => d.id === driverId);
  if (!driver) return null;

  const team = teams.find((t) => t.id === driver.teamId);
  const category = categories.find((c) => c.id === driver.categoryId);
  const stats = standings.find((s) => s.driverId === driver.id);
  const rank = standings.findIndex((s) => s.driverId === driver.id) + 1;
  const isEnrolled = (championship?.registeredDriverIds || []).includes(driver.id);
  const isCurrentUser = currentUser.driverId === driver.id;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Profile Hero Header */}
        <div className="relative p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800">
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: team?.color || '#EF4444' }}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <DriverAvatar
              name={driver.name}
              avatarUrl={driver.avatarUrl}
              teamColor={team?.color}
              kartNumber={driver.kartNumber}
              size="xl"
              className="border-2 border-zinc-700 shadow-xl"
            />

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{driver.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {category?.name || 'Geral'}
                </span>
                {isCurrentUser && (
                  <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                    Seu Perfil
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1 text-xs text-zinc-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: team?.color || '#6B7280' }}
                />
                <span className="font-semibold text-zinc-300">{team?.name || 'Piloto Independente'}</span>
                {team?.sponsor && <span>• Patrocínio: {team.sponsor}</span>}
              </div>

              {driver.bio && (
                <p className="text-xs text-zinc-400 mt-2 italic bg-zinc-950/60 p-2 rounded-lg border border-zinc-800">
                  "{driver.bio}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gamification & Stats Grid */}
        <div className="p-6 space-y-6 text-xs max-h-[60vh] overflow-y-auto">
          {/* Main Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-zinc-500 uppercase font-bold text-[10px] block">Posição Geral</span>
              <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
                {rank > 0 ? `${rank}º` : '-'}
              </span>
              <span className="text-[10px] text-zinc-400">no Campeonato</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-zinc-500 uppercase font-bold text-[10px] block">Pontos Totais</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">
                {stats?.totalPoints || 0}
              </span>
              <span className="text-[10px] text-zinc-400">pts acumulados</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-zinc-500 uppercase font-bold text-[10px] block">Pódios (Top 3)</span>
              <span className="text-2xl font-black font-mono text-amber-300 mt-1 block">
                {stats?.totalPodiums || 0}
              </span>
              <span className="text-[10px] text-zinc-400">
                {stats?.podiums1st || 0}🥇 {stats?.podiums2nd || 0}🥈 {stats?.podiums3rd || 0}🥉
              </span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-center">
              <span className="text-zinc-500 uppercase font-bold text-[10px] block">Nível XP Piloto</span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                Nv. {stats?.level || 1}
              </span>
              <span className="text-[10px] text-zinc-400">{stats?.xp || 0} XP atleta</span>
            </div>
          </div>

          {/* Stage Points History (Jan - Dez) */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-500" />
                Histórico Etapa por Etapa ({championship?.season || '2026'})
              </span>
              <span className="text-[11px] text-zinc-500">
                {championship?.stagesCount || championship?.stages?.length || 0} etapas programadas
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {(championship?.stages || []).map((stage) => {
                const pts = stats?.stagePoints?.[stage.name];
                const hasScore = pts !== undefined && pts > 0;
                const isWinner = stage.podium?.first === driver.id;

                return (
                  <div
                    key={stage.id}
                    className={`p-2 rounded-lg border text-center ${
                      isWinner
                        ? 'bg-amber-500/15 border-amber-500/40'
                        : hasScore
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-zinc-400">{stage.name}</div>
                    <div className="text-sm font-mono font-bold mt-1 text-white">
                      {hasScore ? `${pts} pts` : stage.completed ? '0 pts' : '-'}
                    </div>
                    {isWinner && (
                      <span className="text-[9px] bg-amber-400 text-zinc-950 px-1 rounded font-black mt-1 inline-block">
                        1º Lugar
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gamification Badges */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Conquistas e Medalhas do Atleta
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                className={`p-2.5 rounded-lg border flex items-center space-x-2.5 ${
                  (stats?.podiums1st || 0) > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-zinc-200'
                    : 'bg-zinc-900/40 border-zinc-800/60 opacity-50'
                }`}
              >
                <div className="text-xl">🏆</div>
                <div>
                  <h5 className="font-bold text-xs text-white">Campeão de Etapa</h5>
                  <p className="text-[10px] text-zinc-400">
                    {(stats?.podiums1st || 0) > 0
                      ? `${stats?.podiums1st} vitórias conquistadas!`
                      : 'Vença ao menos uma etapa'}
                  </p>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center space-x-2.5 ${
                  (stats?.totalPodiums || 0) >= 3
                    ? 'bg-amber-500/10 border-amber-500/30 text-zinc-200'
                    : 'bg-zinc-900/40 border-zinc-800/60 opacity-50'
                }`}
              >
                <div className="text-xl">🎖️</div>
                <div>
                  <h5 className="font-bold text-xs text-white">Colecionador de Pódios</h5>
                  <p className="text-[10px] text-zinc-400">
                    {(stats?.totalPodiums || 0) >= 3
                      ? `${stats?.totalPodiums} pódios alcançados no ano!`
                      : 'Suba ao pódio 3 vezes ou mais'}
                  </p>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center space-x-2.5 ${
                  (stats?.totalPoints || 0) >= 150
                    ? 'bg-red-500/10 border-red-500/30 text-zinc-200'
                    : 'bg-zinc-900/40 border-zinc-800/60 opacity-50'
                }`}
              >
                <div className="text-xl">🔥</div>
                <div>
                  <h5 className="font-bold text-xs text-white">Piloto de Elite (150+ pts)</h5>
                  <p className="text-[10px] text-zinc-400">
                    {(stats?.totalPoints || 0) >= 150
                      ? 'Marca de 150 pontos batida com honras!'
                      : 'Acumule mais de 150 pontos no torneio'}
                  </p>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center space-x-2.5 ${
                  (stats?.stagePoints ? Object.values(stats.stagePoints).filter((p) => p > 0).length : 0) >= 6
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-200'
                    : 'bg-zinc-900/40 border-zinc-800/60 opacity-50'
                }`}
              >
                <div className="text-xl">🛡️</div>
                <div>
                  <h5 className="font-bold text-xs text-white">Regularidade de Aço</h5>
                  <p className="text-[10px] text-zinc-400">
                    Pontuou com consistência em 6 ou mais etapas consecutivas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Enrollment action */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-400 text-xs">
              Inscrição {championship ? `no ${championship.name}` : ''}:
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                isEnrolled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isEnrolled ? 'Ativo no Grid ✓' : 'Não Inscrito'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {(currentUser.role === 'admin' || isCurrentUser) && (
              <button
                onClick={() => onToggleEnrollment(driver.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isEnrolled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                }`}
              >
                {isEnrolled ? 'Remover Inscrição' : 'Inscrever Piloto no Torneio'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
