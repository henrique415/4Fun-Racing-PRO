import React, { useState, useMemo } from 'react';
import {
  Camera,
  Trophy,
  Sparkles,
  Zap,
  Trash2,
  Search,
  ArrowUpDown,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { Driver, DriverLapRecord } from '../types';
import {
  parseLapTimeToMs,
  formatMsToLapTime,
  calculateFastestLapRanking,
  RankedLapItem,
} from '../utils/lapTimeUtils';

interface FastestLapBatchEditorProps {
  drivers: Driver[];
  lapRecords: Record<string, DriverLapRecord>;
  onChangeLapRecords: (newRecords: Record<string, DriverLapRecord>) => void;
  pointsScale: Record<number, number>;
  onOpenSinglePilotTelemetry: (driver: Driver) => void;
}

export const FastestLapBatchEditor: React.FC<FastestLapBatchEditorProps> = ({
  drivers,
  lapRecords,
  onChangeLapRecords,
  pointsScale,
  onOpenSinglePilotTelemetry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate live ranking
  const rankedItems = useMemo(() => {
    return calculateFastestLapRanking(drivers, lapRecords, pointsScale);
  }, [drivers, lapRecords, pointsScale]);

  // Filtered drivers for search
  const filteredItems = rankedItems.filter((item) => {
    const matchName = item.driver.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKart = item.driver.kartNumber.includes(searchTerm);
    return matchName || matchKart;
  });

  // Handle direct manual time change in the bulk table
  const handleTimeChange = (driverId: string, newTimeStr: string) => {
    const cleanTime = newTimeStr.trim();
    const ms = parseLapTimeToMs(cleanTime) || 0;

    const existing = lapRecords[driverId] || {
      driverId,
      lapTime: '',
      lapTimeMs: 0,
    };

    const updated = {
      ...lapRecords,
      [driverId]: {
        ...existing,
        driverId,
        lapTime: cleanTime,
        lapTimeMs: ms,
        selectedSource: existing.selectedSource || 'manual',
        recordedAt: new Date().toISOString(),
      },
    };

    onChangeLapRecords(updated);
  };

  // Clear a specific driver's time
  const handleClearTime = (driverId: string) => {
    const updated = { ...lapRecords };
    delete updated[driverId];
    onChangeLapRecords(updated);
  };

  // Simulate / Fill with realistic times (including the Alfano 6 reference)
  const handleSimulateTimes = () => {
    const sampleTimes = [
      '0:52.06', // Alfano 6 rolling reference
      '0:52.08', // Alfano 6 best reference
      '0:52.23',
      '0:52.41',
      '0:52.65',
      '0:52.88',
      '0:53.12',
      '0:53.30',
      '0:53.54',
      '0:53.79',
      '0:54.02',
      '0:54.40',
    ];

    const updated: Record<string, DriverLapRecord> = {};
    drivers.forEach((driver, idx) => {
      const timeStr = sampleTimes[idx % sampleTimes.length];
      const ms = parseLapTimeToMs(timeStr) || 0;
      updated[driver.id] = {
        driverId: driver.id,
        lapTime: timeStr,
        lapTimeMs: ms,
        selectedSource: idx === 0 ? 'rolling' : idx === 1 ? 'best' : 'manual',
        deviceModel: idx <= 1 ? 'Alfano 6 (Telemetria)' : undefined,
        notes: idx === 0 ? 'Volta Rolling mais rápida que Best por 0.02s' : undefined,
        recordedAt: new Date().toISOString(),
      };
    });

    onChangeLapRecords(updated);
  };

  // Clear all times
  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja limpar todos os tempos cadastrados para esta etapa?')) {
      onChangeLapRecords({});
    }
  };

  const top3 = rankedItems.filter((i) => i.lapMs > 0).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 p-3.5 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Cadastro em Massa de Voltas Rápidas</span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            Insira os tempos de volta diretamente na tabela abaixo ou clique no ícone de câmera para lançar via foto de telemetria com IA (Alfano 6 / Mychron).
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSimulateTimes}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Tempos</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 text-[11px] transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpar Todos</span>
          </button>
        </div>
      </div>

      {/* Live Podium Preview if any times exist */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 text-xs">
          {top3.map((item, idx) => (
            <div
              key={item.driver.id}
              className={`p-2.5 rounded-lg border flex items-center justify-between ${
                idx === 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : idx === 1
                  ? 'bg-zinc-800/40 border-zinc-700 text-zinc-300'
                  : 'bg-amber-900/15 border-amber-800/40 text-amber-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black">
                  {idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : '🥉 3º'}
                </span>
                <div>
                  <div className="font-bold truncate max-w-[120px]">{item.driver.name}</div>
                  <div className="text-[10px] opacity-80">#{item.driver.kartNumber}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black">{item.officialTime}</div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {idx === 0 ? 'Melhor Volta' : item.gapStr}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por piloto ou kart..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
          <span>Total de pilotos: <strong className="text-white">{drivers.length}</strong></span>
          <span>•</span>
          <span>Com tempo: <strong className="text-amber-400">{top3.length > 0 ? rankedItems.filter(i => i.lapMs > 0).length : 0}</strong></span>
        </div>
      </div>

      {/* Bulk Drivers Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
              <th className="py-2.5 px-3 text-center w-12">POS</th>
              <th className="py-2.5 px-3">PILOTO</th>
              <th className="py-2.5 px-2 text-center w-14">KART</th>
              <th className="py-2.5 px-3 text-center w-40">TEMPO DE VOLTA</th>
              <th className="py-2.5 px-3 text-center w-28">GAP / DIF</th>
              <th className="py-2.5 px-3 text-center w-24">PONTOS</th>
              <th className="py-2.5 px-3 text-center w-32">ORIGEM</th>
              <th className="py-2.5 px-3 text-center w-28">AÇÃO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-medium">
            {filteredItems.map((item) => {
              const hasTime = item.lapMs > 0;
              const isFirst = item.position === 1 && hasTime;
              const source = item.record?.selectedSource;

              return (
                <tr
                  key={item.driver.id}
                  className={`hover:bg-zinc-900/50 transition ${
                    isFirst ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Position */}
                  <td className="py-2.5 px-3 text-center font-bold">
                    {hasTime ? (
                      item.position === 1 ? (
                        <span className="text-amber-300 font-black">1º 🥇</span>
                      ) : item.position === 2 ? (
                        <span className="text-zinc-300 font-black">2º 🥈</span>
                      ) : item.position === 3 ? (
                        <span className="text-amber-600 font-black">3º 🥉</span>
                      ) : (
                        <span className="text-zinc-400 font-mono">{item.position}º</span>
                      )
                    ) : (
                      <span className="text-zinc-600 font-mono">-</span>
                    )}
                  </td>

                  {/* Driver Name */}
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {item.driver.name}
                      {isFirst && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black">
                          VR
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Kart Number */}
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]">
                      #{item.driver.kartNumber}
                    </span>
                  </td>

                  {/* Lap Time Input */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <input
                        type="text"
                        placeholder="0:52.06"
                        value={item.record?.lapTime || ''}
                        onChange={(e) => handleTimeChange(item.driver.id, e.target.value)}
                        className={`w-28 bg-zinc-900 border rounded px-2 py-1 text-center font-mono font-bold text-xs focus:outline-none transition ${
                          hasTime
                            ? isFirst
                              ? 'border-amber-500/60 text-amber-300 bg-amber-950/20 focus:border-amber-400'
                              : 'border-zinc-700 text-white focus:border-red-500'
                            : 'border-zinc-800 text-zinc-400 placeholder-zinc-600 focus:border-red-500'
                        }`}
                      />
                      {hasTime && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Gap to Leader */}
                  <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                    {hasTime ? (
                      <span className={isFirst ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                        {item.gapStr}
                      </span>
                    ) : (
                      <span className="text-zinc-600">--</span>
                    )}
                  </td>

                  {/* Points */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">
                    {item.points > 0 ? `${item.points} pts` : '-'}
                  </td>

                  {/* Source Badge */}
                  <td className="py-2.5 px-3 text-center">
                    {source === 'rolling' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 inline-flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Rolling (IA)
                      </span>
                    ) : source === 'best' ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 inline-flex items-center gap-1">
                        <Camera className="w-2.5 h-2.5" /> Best (IA)
                      </span>
                    ) : hasTime ? (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-semibold">
                        Manual
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">Sem Registro</span>
                    )}
                  </td>

                  {/* Actions: Open specific driver telemetry or clear */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenSinglePilotTelemetry(item.driver)}
                        title="Tirar foto ou transcrever telemetria com IA deste piloto"
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-red-400 group-hover:text-white" />
                        <span>Foto / IA</span>
                      </button>

                      {hasTime && (
                        <button
                          type="button"
                          onClick={() => handleClearTime(item.driver.id)}
                          title="Limpar tempo deste piloto"
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
