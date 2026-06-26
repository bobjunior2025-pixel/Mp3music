import { Track } from './types';

export const PRELOADED_TRACKS: Track[] = [
  {
    id: 'chopin-nocturne',
    title: 'Nocturne in E-Flat Major, Op. 9 No. 2',
    artist: 'Frédéric Chopin',
    album: 'Nocturnes',
    duration: '04:26',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Chopin_Nocturne_Op_9_No_2_by_Florian_Noack.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=400&auto=format&fit=crop',
    genre: 'Clássica',
    description: 'Composto por Chopin entre 1830 e 1832, este Noturno é uma de suas obras de piano solo mais conhecidas e amadas, famosa por seu lirismo e ornamentação delicada.',
    lyrics: [
      '[00:00] (Instrumental - Solo de Piano)',
      '[00:30] Melodia suave principal se desenvolve com elegância...',
      '[01:15] Transição expressiva com delicados trinados pianísticos.',
      '[02:00] Repetição lírica enriquecida com pequenas variações emotivas.',
      '[02:50] Clímax apaixonado com modulações dinâmicas de Chopin.',
      '[03:40] Cadência final virtuosa e extremamente expressiva.',
      '[04:10] Notas finais decrescentes em pianíssimo sussurrado.'
    ]
  },
  {
    id: 'bach-cello',
    title: 'Cello Suite No. 1 in G Major - Prelude',
    artist: 'Johann Sebastian Bach',
    album: 'Cello Suites',
    duration: '02:31',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/John_Michel_-_Bach_Cello_Suite_1_-_prelude.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&auto=format&fit=crop',
    genre: 'Clássica',
    description: 'A Suíte nº 1 para Violoncelo em Sol Maior é possivelmente a peça mais famosa de todo o repertório barroco de violoncelo solo, caracterizada por seus arpejos fluidos e contínuos.',
    lyrics: [
      '[00:00] (Instrumental - Solo de Violoncelo)',
      '[00:20] Progressão harmônica em arpejos contínuos característicos.',
      '[00:50] Pedal de nota grave que ancora a melodia intermediária.',
      '[01:25] Tensão ascendente com modulações cromáticas barrocas.',
      '[01:55] Resolução da tensão em direção à cadência de pedal.',
      '[02:15] Acordes arpejados amplos brilhando no registro agudo.',
      '[02:25] Resolução final no acorde de Sol Maior.'
    ]
  },
  {
    id: 'mozart-symphony',
    title: 'Sinfonia No. 40 - I. Molto Allegro',
    artist: 'Wolfgang Amadeus Mozart',
    album: 'Symphony No. 40 in G minor',
    duration: '05:40',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Mozart_-_Symphony_No._40_in_G_minor%2C_K._550_-_I._Molto_allegro.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop',
    genre: 'Clássica',
    description: 'Composta no verão de 1788, a Sinfonia nº 40 em Sol Menor é uma das obras sinfônicas mais tocadas, conhecida pela sua intensidade dramática e beleza melancólica.',
    lyrics: [
      '[00:00] (Instrumental - Orquestral Completa)',
      '[00:05] Tema principal icônico introduzido pelas cordas com agitação.',
      '[00:45] Entrada triunfal do naipe de sopros (oboés e trompas).',
      '[01:20] Segundo tema contrastante, lírico e mais calmo em Si bemol maior.',
      '[02:10] Seção de desenvolvimento iniciando com ricas modulações harmônicas.',
      '[03:30] Reexposição do tema principal em sol menor, com maior urgência.',
      '[04:40] Clímax com contrapontos dinâmicos em toda a orquestra.',
      '[05:25] Coda final dramática culminando em fortes acordes orquestrais.'
    ]
  },
  {
    id: 'ambient-chill-1',
    title: 'Ethereal Journey (Song 1)',
    artist: 'SoundHelix Audio',
    album: 'Ambient Waves',
    duration: '06:12',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=400&auto=format&fit=crop',
    genre: 'Ambient',
    description: 'Uma trilha sonora eletrônica e progressiva com sintetizadores espaciais e batida cadenciada, perfeita para focar, relaxar ou programar.',
    lyrics: [
      '[00:00] (Instrumental - Sintetizador Ambient)',
      '[00:45] Batida sutil entra para dar ritmo e andamento à jornada.',
      '[01:30] Linha de baixo synth encorpada preenche a atmosfera.',
      '[02:45] Elementos melódicos digitais começam a ecoar no estéreo.',
      '[04:00] Ponte suave com suspensão temporária dos graves principais.',
      '[04:50] Retorno da batida com arranjo melódico completo e envolvente.',
      '[05:40] Fade-out gradual das texturas e batidas eletrônicas.'
    ]
  },
  {
    id: 'ambient-chill-2',
    title: 'Cosmic Reflections (Song 2)',
    artist: 'SoundHelix Audio',
    album: 'Nebula Sounds',
    duration: '07:05',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
    genre: 'Ambient',
    description: 'Uma atmosfera envolvente com grooves relaxados e guitarras sintéticas flutuantes que levam o ouvinte a um estado meditativo profundo.',
    lyrics: [
      '[00:00] (Instrumental - Synth Atmosférico)',
      '[00:30] Introdução de batida downtempo macia.',
      '[01:20] Linhas melódicas de guitarra processada adicionam calor e textura.',
      '[02:30] Progressão rítmica marcante com percussão detalhada.',
      '[04:15] Solo melódico de teclado analógico flutuando sobre a base.',
      '[05:45] Seção rítmica desacelera e os timbres espaciais prevalecem.',
      '[06:40] Atmosfera residual encerra lentamente em eco.'
    ]
  },
  {
    id: 'ambient-chill-4',
    title: 'Neon Horizon (Song 4)',
    artist: 'SoundHelix Audio',
    album: 'Retro Future',
    duration: '05:02',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop',
    genre: 'Ambient',
    description: 'Groove eletro-sintético animado que combina a nostalgia do synthwave dos anos 80 com elementos de chillout modernos de alta fidelidade.',
    lyrics: [
      '[00:00] (Instrumental - Arpejador Neon)',
      '[00:20] Batida retrô pulsante de caixa e bumbo é introduzida.',
      '[01:00] Lead de sintetizador brilhante lidera o tema principal.',
      '[01:50] Contrapontos harmônicos dinâmicos elevam a energia da faixa.',
      '[03:00] Pequena pausa rítmica com foco nos arpejos flutuantes.',
      '[03:40] Reentrada explosiva do arranjo principal com brilho retrô.',
      '[04:30] Finalização gradual com sintetizadores pulsando em estéreo.'
    ]
  }
];
