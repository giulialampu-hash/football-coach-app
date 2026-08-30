import { AppState } from './types';

export const demoState = (): AppState => ({
  players: [
    ['p1', 'Marco', 'Riva'], ['p2', 'Luca', 'Bassi'], ['p3', 'Davide', 'Serra'],
    ['p4', 'Paolo', 'Conti'], ['p5', 'Nico', 'Ferri'], ['p6', 'Elia', 'Fontana'],
    ['p7', 'Samir', 'Costa'], ['p8', 'Andrea', 'Gallo'],
  ].map(([id, firstName, lastName]) => ({ id, firstName, lastName })),
  board: {
    id: 'board-main', title: 'Schema gara', revisions: [],
    draftTokens: [
      ['t1', 'p1', 'MR', '#B22626', 'Guida la linea', 'board', .5, .87],
      ['t2', 'p2', 'LB', '#1756A9', '', 'board', .22, .66],
      ['t3', 'p3', 'DS', '#1756A9', 'Stringe in possesso', 'board', .5, .63],
      ['t4', 'p4', 'PC', '#1756A9', '', 'board', .78, .66],
      ['t5', 'p5', 'NF', '#D18B00', 'Tra le linee', 'board', .5, .37],
      ['t6', 'p6', 'EF', '#D18B00', '', 'board', .28, .24],
      ['t7', 'p7', 'SC', '#D18B00', 'Attacca profondità', 'board', .71, .2],
      ['t8', 'p8', 'AG', '#6F3CA0', '', 'reserve', .3, .62],
    ].map(([id, playerId, label, color, note, zone, x, y]) => ({
      id: id as string, playerId: playerId as string, label: label as string,
      color: color as string, note: note as string, zone: zone as 'board' | 'reserve',
      x: x as number, y: y as number,
    })),
  },
  trainings: [
    {
      id: 'tr1', date: '2026-08-31',
      notes: 'Progressione: analitico, situazionale, partita.',
      exercises: [
        { id: 'e1', label: 'Rondo 5 contro 2', minutes: 15 },
        { id: 'e2', label: 'Costruzione 7 contro 5', minutes: 25 },
        { id: 'e3', label: 'Partita a tema', minutes: 30 },
      ],
    },
    {
      id: 'tr2', date: '2026-09-03',
      notes: 'Alta intensità, recuperi completi.',
      exercises: [
        { id: 'e4', label: 'Attivazione a coppie', minutes: 10 },
        { id: 'e5', label: 'Gioco di posizione', minutes: 25 },
        { id: 'e6', label: 'Partita libera', minutes: 25 },
      ],
    },
  ],
});
