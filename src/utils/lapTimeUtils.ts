import { Driver, DriverLapRecord } from '../types';

/**
 * Converte string de tempo de volta em milissegundos
 * Formatos suportados:
 * - "0:52.08" -> 52080 ms
 * - "0:52.06" -> 52060 ms
 * - "52.06" -> 52060 ms
 * - "1:03.450" -> 63450 ms
 * - "01:03.45" -> 63450 ms
 */
export function parseLapTimeToMs(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().replace(/^[^\d]+/, '').replace(/s$/, '');
  if (!clean) return null;

  if (clean.includes(':')) {
    const parts = clean.split(':');
    const min = parseInt(parts[0], 10);
    const secParts = parts[1].split('.');
    const sec = parseInt(secParts[0] || '0', 10);
    const fracStr = secParts[1] || '0';
    // Se tiver 2 dígitos (centésimos), ex: 08 -> 80ms; 06 -> 60ms; se 3 (milésimos), ex: 450 -> 450ms
    const fracMs = Math.round(parseFloat(`0.${fracStr}`) * 1000);

    if (isNaN(min) || isNaN(sec)) return null;
    return min * 60000 + sec * 1000 + fracMs;
  } else {
    // Apenas segundos e frações: "52.08"
    const parts = clean.split('.');
    const sec = parseInt(parts[0] || '0', 10);
    const fracStr = parts[1] || '0';
    const fracMs = Math.round(parseFloat(`0.${fracStr}`) * 1000);
    if (isNaN(sec)) return null;
    return sec * 1000 + fracMs;
  }
}

/**
 * Formata milissegundos em string legível de tempo de volta (ex: "0:52.060" ou "0:52.06")
 */
export function formatMsToLapTime(ms?: number | null, keepTwoDecimals = false): string {
  if (ms === null || ms === undefined || ms <= 0 || isNaN(ms)) {
    return '--:--.---';
  }

  const minutes = Math.floor(ms / 60000);
  const rem = ms % 60000;
  const seconds = Math.floor(rem / 1000);
  const millis = rem % 1000;

  if (keepTwoDecimals) {
    const hundredths = Math.floor(millis / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

/**
 * Compara o Lap Best com o Lap Rolling e determina qual é mais rápido
 */
export function compareBestAndRolling(bestTimeStr?: string, rollingTimeStr?: string): {
  faster: 'best' | 'rolling' | 'manual';
  officialTime: string;
  officialMs: number;
  diffMs: number;
  diffSecondsStr: string;
  notes: string;
} {
  const bestMs = parseLapTimeToMs(bestTimeStr);
  const rollingMs = parseLapTimeToMs(rollingTimeStr);

  if (bestMs && rollingMs) {
    if (rollingMs <= bestMs) {
      const diff = bestMs - rollingMs;
      const diffSec = (diff / 1000).toFixed(2);
      return {
        faster: 'rolling',
        officialTime: rollingTimeStr!,
        officialMs: rollingMs,
        diffMs: diff,
        diffSecondsStr: `${diffSec}s`,
        notes: diff > 0
          ? `Volta Rolling (${rollingTimeStr}) é ${diffSec}s mais rápida que Best Lap (${bestTimeStr})`
          : `Volta Rolling e Best Lap possuem tempos idênticos (${rollingTimeStr})`,
      };
    } else {
      const diff = rollingMs - bestMs;
      const diffSec = (diff / 1000).toFixed(2);
      return {
        faster: 'best',
        officialTime: bestTimeStr!,
        officialMs: bestMs,
        diffMs: diff,
        diffSecondsStr: `${diffSec}s`,
        notes: `Best Lap (${bestTimeStr}) é ${diffSec}s mais rápida que Volta Rolling (${rollingTimeStr})`,
      };
    }
  }

  if (rollingMs) {
    return {
      faster: 'rolling',
      officialTime: rollingTimeStr!,
      officialMs: rollingMs,
      diffMs: 0,
      diffSecondsStr: '0.00s',
      notes: `Apenas Volta Rolling (${rollingTimeStr}) registrada`,
    };
  }

  if (bestMs) {
    return {
      faster: 'best',
      officialTime: bestTimeStr!,
      officialMs: bestMs,
      diffMs: 0,
      diffSecondsStr: '0.00s',
      notes: `Apenas Best Lap (${bestTimeStr}) registrada`,
    };
  }

  return {
    faster: 'manual',
    officialTime: '',
    officialMs: 0,
    diffMs: 0,
    diffSecondsStr: '0.00s',
    notes: 'Nenhum tempo válido registrado',
  };
}

export interface RankedLapItem {
  position: number;
  driver: Driver;
  record?: DriverLapRecord;
  officialTime: string;
  lapMs: number;
  gapMs: number;
  gapStr: string;
  points: number;
  isLeader: boolean;
}

/**
 * Calcula o Ranking Oficial de Volta Rápida de uma etapa / sessão
 */
export function calculateFastestLapRanking(
  drivers: Driver[],
  lapRecords: Record<string, DriverLapRecord> = {},
  pointsScale: Record<number, number> = { 1: 10, 2: 7, 3: 5, 4: 3, 5: 1 }
): RankedLapItem[] {
  // Coletar tempos de cada piloto
  const items = drivers.map((driver) => {
    const record = lapRecords[driver.id];
    const ms = record?.lapTimeMs || parseLapTimeToMs(record?.lapTime) || 0;
    return {
      driver,
      record,
      officialTime: record?.lapTime || '',
      lapMs: ms,
    };
  });

  // Separar pilotos com tempo válido (> 0) dos pilotos sem tempo
  const withTime = items.filter((i) => i.lapMs > 0).sort((a, b) => a.lapMs - b.lapMs);
  const withoutTime = items.filter((i) => i.lapMs <= 0);

  const leaderMs = withTime[0]?.lapMs || 0;

  const rankedWithTime: RankedLapItem[] = withTime.map((item, idx) => {
    const pos = idx + 1;
    const gapMs = item.lapMs - leaderMs;
    const gapStr = pos === 1 ? 'Líder / Melhor Volta' : `+${(gapMs / 1000).toFixed(3)}s`;
    const points = pointsScale[pos] || 0;

    return {
      position: pos,
      driver: item.driver,
      record: item.record,
      officialTime: item.officialTime,
      lapMs: item.lapMs,
      gapMs,
      gapStr,
      points,
      isLeader: pos === 1,
    };
  });

  const rankedWithoutTime: RankedLapItem[] = withoutTime.map((item, idx) => {
    const pos = withTime.length + idx + 1;
    return {
      position: pos,
      driver: item.driver,
      record: item.record,
      officialTime: 'Sem Tempo',
      lapMs: 0,
      gapMs: 0,
      gapStr: '--',
      points: 0,
      isLeader: false,
    };
  });

  return [...rankedWithTime, ...rankedWithoutTime];
}

/**
 * Dados de referência calibrados da foto do Alfano 6 (IMG_9682.jpeg)
 * Fornecidos pelo usuário para calibração e teste instantâneo
 */
export const ALFANO_6_CALIBRATION_REFERENCE = {
  deviceModel: 'Alfano 6 (Painel Digital de Telemetria)',
  bestLap: '0:52.08',
  bestLapNumber: '09',
  rollingLap: '0:52.06',
  theoreticalLap: '0:52.06',
  sectors: {
    s1: '0:18.75',
    s2: '0:22.61',
    s3: '0:10.70',
  },
  selectedSource: 'rolling' as const,
  officialLapTime: '0:52.06',
  officialLapMs: 52060,
  comparisonNotes: 'A Volta Rolling (0:52.06) foi selecionada automaticamente como volta oficial por ser 0.02s mais rápida que a Best Lap (0:52.08).',
  confidence: 99,
};
