import React, { useState } from 'react';
import {
  X,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Trophy,
  Award,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Championship, Stage, Driver, RaceSession, DriverLapRecord } from '../types';
import { FastestLapBatchEditor } from './FastestLapBatchEditor';
import { TelemetryPhotoModal } from './TelemetryPhotoModal';
import { calculateFastestLapRanking } from '../utils/lapTimeUtils';

interface StageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Stage;
  championship: Championship;
  drivers: Driver[];
  onSaveStage: (updatedStage: Stage, pushNotificationTitle?: string, pushNotificationMsg?: string) => void;
}

export const StageManagerModal: React.FC<StageManagerModalProps> = ({
  isOpen,
  onClose,
  stage,
  championship,
  drivers,
  onSaveStage,
}) => {
  // Local state initialized with current stage data
  const [trackName, setTrackName] = useState(stage.trackName);
  const [date, setDate] = useState(stage.date);
  const [completed, setCompleted] = useState(stage.completed);
  const [entryMode, setEntryMode] = useState<'direct' | 'races'>(
    championship.type === 'fastest_lap'
      ? 'direct'
      : stage.races && stage.races.length > 0
      ? 'races'
      : 'direct'
  );

  // Direct points: driverId -> points
  const [directPoints, setDirectPoints] = useState<Record<string, number>>({
    ...stage.stagePoints,
  });

  // Fastest lap counts: driverId -> count
  const [fastestLaps, setFastestLaps] = useState<Record<string, number>>({
    ...(stage.fastestLapCounts || {}),
  });

  // Detailed Fastest Lap Records (with lap times, best vs rolling comparison, and telemetry)
  const [lapRecords, setLapRecords] = useState<Record<string, DriverLapRecord>>({
    ...(stage.lapRecords || {}),
  });

  // Driver selected for single telemetry photo capture / AI transcription modal
  const [selectedTelemetryDriver, setSelectedTelemetryDriver] = useState<Driver | null>(null);

  // Races: list of sessions
  const [races, setRaces] = useState<RaceSession[]>(() => {
    if (stage.races && stage.races.length > 0) {
      return JSON.parse(JSON.stringify(stage.races));
    }
    const count = championship.racesPerStage || (championship.type === 'standard' ? 1 : 2);
    const initial: RaceSession[] = [];
    for (let i = 1; i <= count; i++) {
      initial.push({
        id: `race-${stage.id}-${i}-${Date.now()}`,
        name: count === 1 ? 'Corrida Principal' : `Bateria ${i} (Fim de Semana ${i})`,
        results: drivers.slice(0, 15).map((d, idx) => ({
          driverId: d.id,
          position: idx + 1,
          points: championship.pointsScale[idx + 1] || 0,
        })),
      });
    }
    return initial;
  });

  const registeredDrivers = drivers.filter((d) =>
    championship.registeredDriverIds.includes(d.id)
  );

  // Helper to calculate total points for direct or races
  const calculateTotalStagePoints = (): Record<string, number> => {
    if (championship.type === 'fastest_lap') {
      const ranked = calculateFastestLapRanking(
        registeredDrivers,
        lapRecords,
        championship.pointsScale
      );
      const points: Record<string, number> = {};
      ranked.forEach((item) => {
        if (item.lapMs > 0 && item.points > 0) {
          points[item.driver.id] = item.points;
        }
      });
      return points;
    }

    if (entryMode === 'direct') {
      return { ...directPoints };
    }

    // Sum from all races
    const totals: Record<string, number> = {};
    races.forEach((race) => {
      race.results.forEach((res) => {
        let pts = res.points || 0;
        if (race.poleDriverId === res.driverId) pts += championship.polePoints;
        if (race.fastestLapDriverId === res.driverId) pts += championship.fastestLapPoints;
        totals[res.driverId] = (totals[res.driverId] || 0) + pts;
      });
    });
    return totals;
  };

  const handleSave = () => {
    const stagePoints = calculateTotalStagePoints();

    // Determine top 3 podium
    let podiumToSave: { first: string; second: string; third: string } | undefined = undefined;
    let fastestLapCountsToSave = fastestLaps;

    if (championship.type === 'fastest_lap') {
      const ranked = calculateFastestLapRanking(
        registeredDrivers,
        lapRecords,
        championship.pointsScale
      );
      const validLaps = ranked.filter((r) => r.lapMs > 0);
      if (validLaps.length >= 3 && completed) {
        podiumToSave = {
          first: validLaps[0].driver.id,
          second: validLaps[1].driver.id,
          third: validLaps[2].driver.id,
        };
      }
      fastestLapCountsToSave = {};
      if (validLaps[0]) {
        fastestLapCountsToSave[validLaps[0].driver.id] = 1;
      }
    } else {
      const sorted = Object.entries(stagePoints)
        .filter(([_, pts]) => pts > 0)
        .sort((a, b) => b[1] - a[1]);

      if (sorted.length >= 3 && completed) {
        podiumToSave = {
          first: sorted[0][0],
          second: sorted[1][0],
          third: sorted[2][0],
        };
      }
    }

    const updatedStage: Stage = {
      ...stage,
      trackName,
      date,
      completed,
      stagePoints,
      podium: podiumToSave,
      races: entryMode === 'races' ? races : [],
      lapRecords: championship.type === 'fastest_lap' ? lapRecords : stage.lapRecords,
      fastestLapCounts: championship.type === 'fastest_lap' ? fastestLapCountsToSave : undefined,
    };

    const firstDriverId = podiumToSave?.first || Object.keys(stagePoints)[0];
    const firstDriver = drivers.find((d) => d.id === firstDriverId);
    const notifTitle = completed
      ? `🏁 Resultado Homologado: Etapa ${stage.name}`
      : `📅 Etapa ${stage.name} Atualizada`;
    const notifMsg =
      completed && firstDriver
        ? `Parabéns ao piloto ${firstDriver.name} (#${firstDriver.kartNumber}) pela vitória na etapa de ${stage.name}!`
        : `A programação e detalhes da etapa ${stage.fullName} foram atualizados.`;

    onSaveStage(updatedStage, notifTitle, notifMsg);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase">
                Administrador
              </span>
              <h2 className="text-lg font-black text-white">
                Gerenciar Etapa {stage.stageNumber}: {stage.name}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Insira os resultados das corridas para calcular a pontuação automaticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Stage Metadata form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Circuito / Kartódromo</label>
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Data da Etapa</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Status da Etapa</label>
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className={`w-full py-2 px-3 rounded-lg font-bold border transition flex items-center justify-center space-x-2 ${
                  completed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{completed ? 'Etapa Homologada' : 'Pendente / Não Realizada'}</span>
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          {championship.type !== 'fastest_lap' && (
            <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <span className="text-zinc-400 font-bold">Modo de Inserção:</span>
              <button
                type="button"
                onClick={() => setEntryMode('direct')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  entryMode === 'direct'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Pontuação Direta por Piloto (Tabela Consolidada)
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('races')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  entryMode === 'races'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Múltiplas Baterias (Bateria 1, Bateria 2)
              </button>
            </div>
          )}

          {/* DIRECT POINTS MODE */}
          {entryMode === 'direct' && championship.type !== 'fastest_lap' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-bold">Pontuação Final de cada Piloto nesta Etapa:</span>
                <span className="text-[11px] text-zinc-500">
                  Valores que compõem o somatório da classificação geral
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {registeredDrivers.map((driver) => {
                  const pts = directPoints[driver.id] || 0;
                  return (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-8 font-mono text-center font-bold px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          #{driver.kartNumber}
                        </span>
                        <span className="font-bold text-white">{driver.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={pts}
                          onChange={(e) =>
                            setDirectPoints({
                              ...directPoints,
                              [driver.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-red-500"
                        />
                        <span className="text-zinc-500 font-mono">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FASTEST LAP CHAMPIONSHIP MODE */}
          {championship.type === 'fastest_lap' && (
            <FastestLapBatchEditor
              drivers={registeredDrivers}
              lapRecords={lapRecords}
              onChangeLapRecords={setLapRecords}
              pointsScale={championship.pointsScale}
              onOpenSinglePilotTelemetry={(driver) => setSelectedTelemetryDriver(driver)}
            />
          )}

          {/* MULTI-RACE BATERIAS MODE */}
          {entryMode === 'races' && championship.type !== 'fastest_lap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Baterias da Etapa:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = races.length + 1;
                    setRaces([
                      ...races,
                      {
                        id: `race-${stage.id}-${nextNum}`,
                        name: `Bateria ${nextNum}`,
                        results: registeredDrivers.slice(0, 10).map((d, i) => ({
                          driverId: d.id,
                          position: i + 1,
                          points: championship.pointsScale[i + 1] || 0,
                        })),
                      },
                    ]);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Bateria</span>
                </button>
              </div>

              {races.map((race, rIdx) => (
                <div
                  key={race.id}
                  className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={race.name}
                      onChange={(e) => {
                        const updated = [...races];
                        updated[rIdx].name = e.target.value;
                        setRaces(updated);
                      }}
                      className="bg-zinc-900 border border-zinc-700 px-3 py-1 rounded font-bold text-white"
                    />

                    {races.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setRaces(races.filter((_, i) => i !== rIdx));
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Pole & Fastest Lap Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <div>
                      <label className="block text-purple-400 font-bold mb-1">
                        🎯 Pole Position (+{championship.polePoints} pt)
                      </label>
                      <select
                        value={race.poleDriverId || ''}
                        onChange={(e) => {
                          const updated = [...races];
                          updated[rIdx].poleDriverId = e.target.value || undefined;
                          setRaces(updated);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-white"
                      >
                        <option value="">Nenhum / Não atribuído</option>
                        {registeredDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (#{d.kartNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-amber-400 font-bold mb-1">
                        ⚡ Volta Mais Rápida (+{championship.fastestLapPoints} pt)
                      </label>
                      <select
                        value={race.fastestLapDriverId || ''}
                        onChange={(e) => {
                          const updated = [...races];
                          updated[rIdx].fastestLapDriverId = e.target.value || undefined;
                          setRaces(updated);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-white"
                      >
                        <option value="">Nenhum / Não atribuído</option>
                        {registeredDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (#{d.kartNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Race Finishing Grid Results */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {registeredDrivers.map((driver) => {
                      const res = race.results.find((r) => r.driverId === driver.id);
                      const pos = res?.position || 0;
                      const pts = res?.points ?? 0;

                      return (
                        <div
                          key={driver.id}
                          className="flex items-center justify-between p-2 bg-zinc-900/80 rounded border border-zinc-800/80"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-zinc-400 w-8">#{driver.kartNumber}</span>
                            <span className="font-bold text-white">{driver.name}</span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-zinc-500">Pos:</span>
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={pos || ''}
                                placeholder="DNF"
                                onChange={(e) => {
                                  const newPos = parseInt(e.target.value) || 0;
                                  const autoPts =
                                    newPos > 0 && championship.pointsScale[newPos]
                                      ? championship.pointsScale[newPos]
                                      : 0;

                                  const updated = [...races];
                                  const existingIdx = updated[rIdx].results.findIndex(
                                    (r) => r.driverId === driver.id
                                  );
                                  if (existingIdx >= 0) {
                                    updated[rIdx].results[existingIdx].position = newPos;
                                    updated[rIdx].results[existingIdx].points = autoPts;
                                  } else {
                                    updated[rIdx].results.push({
                                      driverId: driver.id,
                                      position: newPos,
                                      points: autoPts,
                                    });
                                  }
                                  setRaces(updated);
                                }}
                                className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-center text-white font-mono font-bold"
                              />
                            </div>

                            <div className="flex items-center space-x-1">
                              <span className="text-zinc-500">Pts:</span>
                              <input
                                type="number"
                                min={0}
                                value={pts}
                                onChange={(e) => {
                                  const newPts = parseInt(e.target.value) || 0;
                                  const updated = [...races];
                                  const existingIdx = updated[rIdx].results.findIndex(
                                    (r) => r.driverId === driver.id
                                  );
                                  if (existingIdx >= 0) {
                                    updated[rIdx].results[existingIdx].points = newPts;
                                  } else {
                                    updated[rIdx].results.push({
                                      driverId: driver.id,
                                      position: pos || 99,
                                      points: newPts,
                                    });
                                  }
                                  setRaces(updated);
                                }}
                                className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-center text-amber-400 font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-950/50 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar e Homologar Etapa</span>
          </button>
        </div>
      </div>

      {/* Telemetry Photo & AI Transcription Modal for a Specific Driver */}
      {selectedTelemetryDriver && (
        <TelemetryPhotoModal
          isOpen={!!selectedTelemetryDriver}
          onClose={() => setSelectedTelemetryDriver(null)}
          driver={selectedTelemetryDriver}
          currentRecord={lapRecords[selectedTelemetryDriver.id]}
          onSaveRecord={(record) => {
            setLapRecords((prev) => ({
              ...prev,
              [selectedTelemetryDriver.id]: record,
            }));
          }}
        />
      )}
    </div>
  );
};
