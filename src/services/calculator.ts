import { Championship, Driver, Team, Category, DriverStats } from '../types';

export function calculateChampionshipStandings(
  championship?: Championship | null,
  drivers: Driver[] = [],
  teams: Team[] = [],
  categories: Category[] = [],
  selectedCategoryId?: string
): DriverStats[] {
  if (!championship) return [];

  const registeredIds = Array.isArray(championship.registeredDriverIds)
    ? championship.registeredDriverIds
    : (drivers || []).map((d) => d.id);

  const stages = Array.isArray(championship.stages) ? championship.stages : [];

  // Filter drivers registered in championship and matching category if specified
  const registeredDrivers = (drivers || []).filter(d => {
    const isRegistered = registeredIds.includes(d.id);
    if (!isRegistered) return false;
    const driverCatId = championship.driverCategories?.[d.id] || d.categoryIds?.[championship.id] || d.categoryId || (championship.categories?.[0] || 'cat-geral');
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      return driverCatId === selectedCategoryId;
    }
    return true;
  });

  const statsList: DriverStats[] = registeredDrivers.map(driver => {
    const team = (teams || []).find(t => t.id === driver.teamId);
    const driverCatId = championship.driverCategories?.[driver.id] || driver.categoryIds?.[championship.id] || driver.categoryId || (championship.categories?.[0] || 'cat-geral');
    const category = (categories || []).find(c => c.id === driverCatId);

    const stagePoints: Record<string, number> = {};
    let totalPoints = 0;
    let podiums1st = 0;
    let podiums2nd = 0;
    let podiums3rd = 0;
    let polesCount = 0;
    let fastestLapsCount = 0;
    let bestFinish = 99;

    stages.forEach(stage => {
      if (!stage) return;
      if (championship.type === 'fastest_lap') {
        // In fastest lap mode, stagePoints or calculated lap ranking points
        const count = stage.fastestLapCounts?.[driver.id] || 0;
        const pts = stage.stagePoints?.[driver.id] ?? 0;
        stagePoints[stage.name] = pts;
        totalPoints += pts;

        if (count > 0 || (stage.podium && stage.podium.first === driver.id)) {
          fastestLapsCount += count > 0 ? count : 1;
        }

        if (stage.podium) {
          if (stage.podium.first === driver.id) {
            podiums1st++;
            bestFinish = Math.min(bestFinish, 1);
          } else if (stage.podium.second === driver.id) {
            podiums2nd++;
            bestFinish = Math.min(bestFinish, 2);
          } else if (stage.podium.third === driver.id) {
            podiums3rd++;
            bestFinish = Math.min(bestFinish, 3);
          }
        }
      } else {
        // Standard or multi-race mode
        const pts = stage.stagePoints?.[driver.id] ?? 0;
        stagePoints[stage.name] = pts;
        totalPoints += pts;

        // Check race sessions for poles and fastest laps
        stage.races?.forEach(race => {
          if (race.poleDriverId === driver.id) polesCount++;
          if (race.fastestLapDriverId === driver.id) fastestLapsCount++;
          const res = race.results?.find(r => r.driverId === driver.id);
          if (res && res.position < bestFinish) {
            bestFinish = res.position;
          }
        });

        // Stage podium
        if (stage.podium) {
          if (stage.podium.first === driver.id) podiums1st++;
          else if (stage.podium.second === driver.id) podiums2nd++;
          else if (stage.podium.third === driver.id) podiums3rd++;
        } else if (stage.completed && stage.stagePoints) {
          // If podium not explicitly saved, derive from stagePoints
          const sortedInStage = Object.entries(stage.stagePoints).sort((a, b) => b[1] - a[1]);
          if (sortedInStage[0]?.[0] === driver.id && sortedInStage[0]?.[1] > 0) podiums1st++;
          else if (sortedInStage[1]?.[0] === driver.id && sortedInStage[1]?.[1] > 0) podiums2nd++;
          else if (sortedInStage[2]?.[0] === driver.id && sortedInStage[2]?.[1] > 0) podiums3rd++;
        }
      }
    });

    // Apply Discards if configured (e.g. discard worst N completed stages)
    if (championship.discardWorstCount > 0) {
      const completedStageScores = stages
        .filter(s => s?.completed)
        .map(s => stagePoints[s.name] || 0);

      if (completedStageScores.length > championship.discardWorstCount) {
        completedStageScores.sort((a, b) => a - b);
        const discardSum = completedStageScores
          .slice(0, championship.discardWorstCount)
          .reduce((sum, val) => sum + val, 0);
        totalPoints -= discardSum;
      }
    }

    const totalPodiums = podiums1st + podiums2nd + podiums3rd;

    // Calculate XP and level
    const xp = (totalPoints * 10) +
      (podiums1st * 150) +
      (podiums2nd * 100) +
      (podiums3rd * 60) +
      (polesCount * 40) +
      (fastestLapsCount * 40);

    const level = Math.max(1, Math.floor(xp / 400) + 1);

    return {
      driverId: driver.id,
      name: driver.name,
      kartNumber: driver.kartNumber,
      teamName: team ? team.name : 'Piloto Independente',
      teamColor: team ? team.color : '#6B7280',
      categoryName: category ? category.name : 'Geral',
      totalPoints,
      stagePoints,
      podiums1st,
      podiums2nd,
      podiums3rd,
      totalPodiums,
      polesCount,
      fastestLapsCount,
      bestFinish: bestFinish === 99 ? 0 : bestFinish,
      xp,
      level,
    };
  });

  // Sort by totalPoints desc, then by podiums1st desc, then by podiums2nd desc
  return statsList.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.podiums1st !== a.podiums1st) return b.podiums1st - a.podiums1st;
    if (b.podiums2nd !== a.podiums2nd) return b.podiums2nd - a.podiums2nd;
    return b.podiums3rd - a.podiums3rd;
  });
}

// Global leaderboard across all drivers and seasons
export function calculateGlobalRankings(
  championships: Championship[],
  drivers: Driver[],
  teams: Team[],
  categories: Category[]
) {
  const driverMap: Record<string, {
    driver: Driver;
    totalPointsAllChamps: number;
    podiums1st: number;
    podiums2nd: number;
    podiums3rd: number;
    poles: number;
    fastestLaps: number;
    stagesAttended: number;
    xp: number;
  }> = {};

  drivers.forEach(d => {
    driverMap[d.id] = {
      driver: d,
      totalPointsAllChamps: 0,
      podiums1st: 0,
      podiums2nd: 0,
      podiums3rd: 0,
      poles: 0,
      fastestLaps: 0,
      stagesAttended: 0,
      xp: 0,
    };
  });

  championships.forEach(champ => {
    const standings = calculateChampionshipStandings(champ, drivers, teams, categories);
    standings.forEach(st => {
      const entry = driverMap[st.driverId];
      if (entry) {
        entry.totalPointsAllChamps += st.totalPoints;
        entry.podiums1st += st.podiums1st;
        entry.podiums2nd += st.podiums2nd;
        entry.podiums3rd += st.podiums3rd;
        entry.poles += st.polesCount;
        entry.fastestLaps += st.fastestLapsCount;
        entry.xp += st.xp;

        // count attended stages
        Object.values(st.stagePoints).forEach(pts => {
          if (pts > 0) entry.stagesAttended++;
        });
      }
    });
  });

  return Object.values(driverMap)
    .map(item => {
      const team = teams.find(t => t.id === item.driver.teamId);
      const category = categories.find(c => c.id === item.driver.categoryId);
      const totalPodiums = item.podiums1st + item.podiums2nd + item.podiums3rd;
      const level = Math.max(1, Math.floor(item.xp / 400) + 1);

      return {
        driverId: item.driver.id,
        name: item.driver.name,
        kartNumber: item.driver.kartNumber,
        teamName: team?.name || 'Independente',
        teamColor: team?.color || '#9CA3AF',
        categoryName: category?.name || 'Geral',
        totalPoints: item.totalPointsAllChamps,
        podiums1st: item.podiums1st,
        podiums2nd: item.podiums2nd,
        podiums3rd: item.podiums3rd,
        totalPodiums,
        poles: item.poles,
        fastestLaps: item.fastestLaps,
        stagesAttended: item.stagesAttended,
        xp: item.xp,
        level,
      };
    })
    .sort((a, b) => b.xp - a.xp);
}
