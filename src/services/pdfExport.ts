import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Championship, DriverStats, Stage } from '../types';

export function exportStandingsPdf(
  championship: Championship,
  standings: DriverStats[],
  categoryName: string = 'Todas'
): void {
  // Landscape is best for multi-stage tables
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [220, 38, 38]; // Racing Red
  const darkBg: [number, number, number] = [24, 24, 27];

  // Header Banner
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 842, 60, 'F');

  // Racing accent bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 60, 842, 4, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(championship.name.toUpperCase(), 30, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(212, 212, 216);
  const typeLabel = championship.type === 'fastest_lap'
    ? 'CAMPEONATO DE VOLTA RÁPIDA'
    : championship.type === 'multi_race'
    ? 'CAMPEONATO MULTI-BATERIAS'
    : 'CAMPEONATO PADRÃO';
  doc.text(
    `Temporada ${championship.season}  •  ${typeLabel}  •  Categoria: ${categoryName}  •  Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
    30,
    48
  );

  // Stage columns
  const stageHeaders = championship.stages.map(s => s.name);
  const head = [
    ['POS', 'PILOTO', 'Nº', 'EQUIPE', ...stageHeaders, 'PÓDIOS', 'TOTAL'],
  ];

  const body = standings.map((item, index) => {
    const pos = `${index + 1}º`;
    const stageScores = championship.stages.map(s => {
      const val = item.stagePoints[s.name];
      return val !== undefined && val > 0 ? String(val) : '-';
    });

    const podiumsFormatted = `${item.podiums1st}🥇 ${item.podiums2nd}🥈 ${item.podiums3rd}🥉`;

    return [
      pos,
      item.name,
      item.kartNumber,
      item.teamName,
      ...stageScores,
      podiumsFormatted,
      `${item.totalPoints} pts`,
    ];
  });

  autoTable(doc, {
    head: head,
    body: body,
    startY: 75,
    margin: { left: 25, right: 25 },
    styles: {
      fontSize: 8.5,
      cellPadding: 4.5,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 35 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 95 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'left', cellWidth: 100 },
      // The total column is the last column
      [head[0].length - 1]: { fontStyle: 'bold', halign: 'center', fillColor: [244, 244, 245], cellWidth: 50 },
    },
    didParseCell: (data) => {
      // Highlight Top 3 rows
      if (data.section === 'body') {
        if (data.row.index === 0) {
          data.cell.styles.fillColor = [254, 249, 195]; // Gold accent
        } else if (data.row.index === 1) {
          data.cell.styles.fillColor = [241, 245, 249]; // Silver accent
        } else if (data.row.index === 2) {
          data.cell.styles.fillColor = [255, 237, 213]; // Bronze accent
        } else if (data.row.index % 2 === 1) {
          data.cell.styles.fillColor = [250, 250, 250];
        }
      }
    },
  });

  // Footer note
  const finalY = (doc as any).lastAutoTable?.finalY || 500;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text(
    `* Sistema Oficial de Apuração Automotiva PitStop Pro • Documento Homologado`,
    30,
    Math.min(finalY + 20, 565)
  );

  doc.save(`${championship.name.replace(/\s+/g, '_')}_Classificacao_${championship.season}.pdf`);
}

export function exportStageSummaryPdf(
  championship: Championship,
  stage: Stage,
  driversStats: DriverStats[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 595, 70, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 70, 595, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`RELATÓRIO OFICIAL DE ETAPA - ${stage.fullName.toUpperCase()}`, 30, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text(
    `Circuito: ${stage.trackName}  •  Data: ${stage.date}  •  Status: ${stage.completed ? 'HOMOLOGADA' : 'PENDENTE'}`,
    30,
    52
  );

  // Podium Section
  const sortedInStage = driversStats
    .filter(d => (d.stagePoints[stage.name] || 0) > 0)
    .sort((a, b) => (b.stagePoints[stage.name] || 0) - (a.stagePoints[stage.name] || 0));

  const head = [['POS', 'PILOTO', 'Nº KART', 'EQUIPE', 'CATEGORIA', 'PONTOS NA ETAPA']];
  const body = sortedInStage.map((d, idx) => [
    `${idx + 1}º`,
    d.name,
    d.kartNumber,
    d.teamName,
    d.categoryName,
    `${d.stagePoints[stage.name] || 0} pts`,
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 95,
    margin: { left: 30, right: 30 },
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 120 },
      3: { halign: 'left' },
      5: { fontStyle: 'bold', fillColor: [244, 244, 245] },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.row.index === 0) data.cell.styles.fillColor = [254, 249, 195];
        else if (data.row.index === 1) data.cell.styles.fillColor = [241, 245, 249];
        else if (data.row.index === 2) data.cell.styles.fillColor = [255, 237, 213];
      }
    },
  });

  doc.save(`Etapa_${stage.name}_${championship.name.replace(/\s+/g, '_')}.pdf`);
}
