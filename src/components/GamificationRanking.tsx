import React from 'react';
import {
  Trophy,
  Award,
  Zap,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Flame,
  Star,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DriverStats, Driver, Team, Championship, Category } from '../types';
import { calculateGlobalRankings } from '../services/calculator';

interface GamificationRankingProps {
  standings: DriverStats[];
  championship?: Championship;
  championships: Championship[];
  drivers: Driver[];
  teams: Team[];
  categories: Category[];
  onSelectDriver: (driverId: string) => void;
  onOpenEnrollment?: () => void;
}

export const GamificationRanking: React.FC<GamificationRankingProps> = ({
  standings,
  championship,
  championships,
  drivers,
  teams,
  categories,
  onSelectDriver,
  onOpenEnrollment,
}) => {
  const globalRankings = calculateGlobalRankings(championships, drivers, teams, categories);

  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  if (!championship && championships.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Nenhum Pódio Disponível</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
            Cadastre um campeonato e lance os resultados das etapas para gerar o pódio e o ranking de conquistas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Hero: 3D Visual Podium */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
                Pódio de Honra
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Pódio dos Líderes da Temporada 2026
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Premiação oficial para os 3 melhores colocados acumulados no campeonato
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenEnrollment && (
              <button
                onClick={onOpenEnrollment}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition shadow-md cursor-pointer"
                title="Inscrever-se no campeonato ativo"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Inscrever-se</span>
              </button>
            )}

            <button
              onClick={triggerConfetti}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Chuva de Confetes 🎉</span>
            </button>
          </div>
        </div>

        {/* Podium Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6 max-w-4xl mx-auto">
          {/* 2nd Place (Silver) */}
          <div
            onClick={() => top2 && onSelectDriver(top2.driverId)}
            className="order-2 md:order-1 bg-zinc-900/80 rounded-2xl p-5 border border-zinc-700 hover:border-zinc-500 transition cursor-pointer flex flex-col items-center text-center relative group"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-300 flex items-center justify-center font-mono font-black text-xl text-white shadow-md group-hover:scale-105 transition">
              #{top2?.kartNumber || '-'}
            </div>
            <span className="text-xl font-black text-zinc-300 mt-2">🥈 2º LUGAR</span>
            <h3 className="text-lg font-black text-white mt-1 group-hover:text-red-400 transition">
              {top2?.name || 'A definir'}
            </h3>
            <p className="text-xs text-zinc-400">{top2?.teamName}</p>
            <div className="mt-4 w-full pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Pontos:</span>
              <span className="font-mono font-bold text-zinc-200 text-sm">{top2?.totalPoints || 0} pts</span>
            </div>
            {/* Podium step base */}
            <div className="mt-3 w-full py-2 rounded-lg bg-zinc-800 text-zinc-300 font-mono font-black text-sm uppercase">
              Degrau Prata
            </div>
          </div>

          {/* 1st Place (Gold) - Elevated */}
          <div
            onClick={() => top1 && onSelectDriver(top1.driverId)}
            className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 via-zinc-900 to-zinc-950 rounded-2xl p-6 border-2 border-amber-400 hover:border-amber-300 transition cursor-pointer flex flex-col items-center text-center relative shadow-xl shadow-amber-500/10 -mt-4 group"
          >
            <div className="absolute -top-3.5 px-4 py-1 rounded-full bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Líder do Campeonato
            </div>
            <div className="w-20 h-20 rounded-full bg-amber-400/30 border-2 border-amber-400 flex items-center justify-center font-mono font-black text-2xl text-amber-300 shadow-xl group-hover:scale-105 transition mt-2">
              #{top1?.kartNumber || '-'}
            </div>
            <span className="text-2xl font-black text-amber-300 mt-2">🥇 1º LUGAR</span>
            <h3 className="text-xl font-black text-white mt-1 group-hover:text-amber-400 transition">
              {top1?.name || 'A definir'}
            </h3>
            <p className="text-xs text-zinc-300">{top1?.teamName}</p>
            <div className="mt-4 w-full pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-300">Pontos:</span>
              <span className="font-mono font-black text-amber-400 text-base">
                {top1?.totalPoints || 0} pts
              </span>
            </div>
            {/* Podium step base */}
            <div className="mt-3 w-full py-3 rounded-lg bg-amber-400 text-zinc-950 font-mono font-black text-base uppercase shadow-md">
              Campeão da Temporada
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div
            onClick={() => top3 && onSelectDriver(top3.driverId)}
            className="order-3 md:order-3 bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-600 transition cursor-pointer flex flex-col items-center text-center relative group"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-amber-700 flex items-center justify-center font-mono font-black text-xl text-white shadow-md group-hover:scale-105 transition">
              #{top3?.kartNumber || '-'}
            </div>
            <span className="text-xl font-black text-amber-600 mt-2">🥉 3º LUGAR</span>
            <h3 className="text-lg font-black text-white mt-1 group-hover:text-red-400 transition">
              {top3?.name || 'A definir'}
            </h3>
            <p className="text-xs text-zinc-400">{top3?.teamName}</p>
            <div className="mt-4 w-full pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Pontos:</span>
              <span className="font-mono font-bold text-zinc-200 text-sm">{top3?.totalPoints || 0} pts</span>
            </div>
            {/* Podium step base */}
            <div className="mt-3 w-full py-2 rounded-lg bg-zinc-800 text-zinc-400 font-mono font-black text-sm uppercase">
              Degrau Bronze
            </div>
          </div>
        </div>
      </div>

      {/* Global Athlete Ranking (XP Leaderboard) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-black text-white">
                Ranking Global de Pilotos & XP
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pontuação de gamificação consolidando vitórias de etapas, pódios e participações
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 font-mono">
              +150 XP por 🥇 1º Lugar
            </span>
            <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 font-mono">
              +100 XP por 🥈 2º Lugar
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4 text-center w-14">RANK</th>
                <th className="py-3 px-4">PILOTO</th>
                <th className="py-3 px-2 text-center w-16">Nº KART</th>
                <th className="py-3 px-4">EQUIPE</th>
                <th className="py-3 px-4 text-center">NÍVEL DE PILOTO</th>
                <th className="py-3 px-4 text-center">PÓDIOS NA CARREIRA</th>
                <th className="py-3 px-4 text-center">EXPERIÊNCIA (XP)</th>
                <th className="py-3 px-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {globalRankings.map((driver, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <tr
                    key={driver.driverId}
                    onClick={() => onSelectDriver(driver.driverId)}
                    className="hover:bg-zinc-800/50 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center font-bold">
                      {isTop1 ? (
                        <span className="text-amber-300 font-mono text-sm">1º 🥇</span>
                      ) : isTop2 ? (
                        <span className="text-zinc-300 font-mono text-sm">2º 🥈</span>
                      ) : isTop3 ? (
                        <span className="text-amber-600 font-mono text-sm">3º 🥉</span>
                      ) : (
                        <span className="text-zinc-400 font-mono">{index + 1}º</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white group-hover:text-red-400 transition text-sm">
                      {driver.name}
                    </td>

                    <td className="py-3.5 px-2 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                        #{driver.kartNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: driver.teamColor }}
                        />
                        <span className="truncate">{driver.teamName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                        Nv. {driver.level} • {driver.level >= 8 ? 'Lenda do Asfalto' : driver.level >= 5 ? 'Veterano Pro' : 'Graduado'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-xs">
                        {driver.podiums1st > 0 && <span className="text-amber-300 font-bold mr-1">{driver.podiums1st}🥇</span>}
                        {driver.podiums2nd > 0 && <span className="text-zinc-300 font-bold mr-1">{driver.podiums2nd}🥈</span>}
                        {driver.podiums3rd > 0 && <span className="text-amber-600 font-bold mr-1">{driver.podiums3rd}🥉</span>}
                        {driver.totalPodiums === 0 && <span className="text-zinc-600">0</span>}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-black text-amber-400 text-sm">
                      {driver.xp} XP
                    </td>

                    <td className="py-3.5 px-3 text-center text-zinc-500 group-hover:text-zinc-200">
                      <ChevronRight className="w-4 h-4 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
