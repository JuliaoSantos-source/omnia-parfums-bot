const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://evolution-api-production-e0f4.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'omnia-parfums';
const NUMERO_HUMANO = process.env.NUMERO_HUMANO || '244930300694@s.whatsapp.net';
const DESCONTO_SEMANA = parseFloat(process.env.DESCONTO_SEMANA || '0');

// ===================================================
// CATALOGO — 133 perfumes com EDT/EDP/Parfum/Elixir
// Campo: preco (sem s)
// ===================================================
const CATALOGO = {
  'dior sauvage edt': { nome: 'Dior Sauvage EDT', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDT', preco: {'60ml': 164500, '100ml': 219500, '200ml': 284500}, notas: 'Bergamota, Ambroxan, Pimenta Rosa' },
  'dior sauvage edp': { nome: 'Dior Sauvage EDP', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDP', preco: {'60ml': 205000, '100ml': 248400, '200ml': 320700}, notas: 'Bergamota, Lavanda, Baunilha' },
  'dior sauvage parfum': { nome: 'Dior Sauvage Parfum', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'Parfum', preco: {'60ml': 270100}, notas: 'Bergamota, Sândalo, Baunilha' },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', nomeBase: 'Dior Sauvage Elixir', genero: 'M', conc: 'Extrait', preco: {'60ml': 294700}, notas: 'Cardamomo, Lavanda, Patchouli' },
  'dior j\'adore edp': { nome: 'Dior J\'adore EDP', nomeBase: 'Dior J\'adore', genero: 'F', conc: 'EDP', preco: {'30ml': 154400, '50ml': 190500, '100ml': 255600, '150ml': 327900}, notas: 'Magnólia, Rosa, Jasmim' },
  'dior miss dior edp': { nome: 'Dior Miss Dior EDP', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'EDP', preco: {'30ml': 150000, '50ml': 187600, '100ml': 248400}, notas: 'Peónia, Rosa, Patchouli' },
  'dior miss dior parfum': { nome: 'Dior Miss Dior Parfum', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'Parfum', preco: {'35ml': 168800, '80ml': 251300}, notas: 'Rosa de Grasse, Almíscar Branco' },
  'dior homme intense edp': { nome: 'Dior Homme Intense EDP', nomeBase: 'Dior Homme Intense', genero: 'M', conc: 'EDP', preco: {'50ml': 176100, '100ml': 236800}, notas: 'Íris, Cedro, Âmbar' },
  'bleu de chanel edt': { nome: 'Bleu de Chanel EDT', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDT', preco: {'50ml': 190500, '100ml': 248400, '150ml': 327900}, notas: 'Citrus, Incenso, Sândalo' },
  'bleu de chanel edp': { nome: 'Bleu de Chanel EDP', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDP', preco: {'50ml': 216600, '100ml': 294700, '150ml': 375600}, notas: 'Citrus, Noz-moscada, Sândalo' },
  'bleu de chanel parfum': { nome: 'Bleu de Chanel Parfum', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'Parfum', preco: {'50ml': 267200, '100ml': 355400}, notas: 'Citrus, Bétula, Âmbar' },
  'chanel coco mademoiselle edp': { nome: 'Chanel Coco Mademoiselle EDP', nomeBase: 'Chanel Coco Mademoiselle', genero: 'F', conc: 'EDP', preco: {'50ml': 228100, '100ml': 317800, '150ml': 395900}, notas: 'Bergamota, Rosa, Patchouli' },
  'chanel coco mademoiselle intense': { nome: 'Chanel Coco Mademoiselle Intense', nomeBase: 'Chanel Coco Mademoiselle Intense', genero: 'F', conc: 'EDP', preco: {'50ml': 255600, '100ml': 348200}, notas: 'Bergamota, Rosa, Vetiver' },
  'chanel n°5 edp': { nome: 'Chanel N°5 EDP', nomeBase: 'Chanel N°5', genero: 'F', conc: 'EDP', preco: {'35ml': 176100, '50ml': 232500, '100ml': 327900}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar' },
  'chanel chance edp': { nome: 'Chanel Chance EDP', nomeBase: 'Chanel Chance', genero: 'F', conc: 'EDP', preco: {'50ml': 228100, '100ml': 316300}, notas: 'Cítrico, Rosa, Almíscar Branco' },
  'chanel chance eau tendre edp': { nome: 'Chanel Chance Eau Tendre EDP', nomeBase: 'Chanel Chance Eau Tendre', genero: 'F', conc: 'EDP', preco: {'50ml': 228100, '100ml': 316300}, notas: 'Toranja, Quéssia, Almíscar Branco' },
  'ysl black opium edp': { nome: 'YSL Black Opium EDP', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'EDP', preco: {'30ml': 145700, '50ml': 187600, '90ml': 238300, '150ml': 327900}, notas: 'Café, Baunilha, Patchouli, Flor Branca' },
  'ysl black opium parfum': { nome: 'YSL Black Opium Parfum', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'Parfum', preco: {'50ml': 222300}, notas: 'Café Intenso, Açafrão, Âmbar' },
  'ysl libre edp': { nome: 'YSL Libre EDP', nomeBase: 'YSL Libre', genero: 'F', conc: 'EDP', preco: {'30ml': 152900, '50ml': 196300, '90ml': 255600}, notas: 'Lavanda, Flor de Laranjeira, Cedro' },
  'ysl libre parfum': { nome: 'YSL Libre Parfum', nomeBase: 'YSL Libre', genero: 'F', conc: 'Parfum', preco: {'50ml': 232500}, notas: 'Lavanda Africana, Âmbar, Baunilha' },
  'ysl y edp': { nome: 'YSL Y EDP', nomeBase: 'YSL Y', genero: 'M', conc: 'EDP', preco: {'60ml': 187600, '100ml': 248400, '200ml': 330800}, notas: 'Bergamota, Gengibre, Cedro' },
  'ysl y parfum': { nome: 'YSL Y Parfum', nomeBase: 'YSL Y', genero: 'M', conc: 'Parfum', preco: {'60ml': 222300}, notas: 'Bergamota, Coriandro, Vetiver' },
  'ysl l\'homme edp': { nome: 'YSL L\'Homme EDP', nomeBase: 'YSL L\'Homme', genero: 'M', conc: 'EDP', preco: {'60ml': 181800, '100ml': 236800}, notas: 'Bergamota, Cedro, Âmbar' },
  'rabanne 1 million edt': { nome: 'Rabanne 1 Million EDT', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDT', preco: {'50ml': 165900, '100ml': 218000, '200ml': 297500}, notas: 'Mandarina, Canela, Âmbar, Couro' },
  'rabanne 1 million edp': { nome: 'Rabanne 1 Million EDP', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDP', preco: {'50ml': 181800, '100ml': 238300}, notas: 'Toranja, Canela, Couro, Patchouli' },
  'rabanne 1 million parfum': { nome: 'Rabanne 1 Million Parfum', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'Parfum', preco: {'50ml': 197800, '100ml': 265700}, notas: 'Tonka, Baunilha, Salgado' },
  'rabanne invictus edt': { nome: 'Rabanne Invictus EDT', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDT', preco: {'50ml': 151500, '100ml': 202100, '200ml': 280200}, notas: 'Toranja, Louro, Âmbar' },
  'rabanne invictus edp': { nome: 'Rabanne Invictus EDP', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDP', preco: {'50ml': 171700, '100ml': 228100}, notas: 'Louro, Patchouli, Âmbar, Madeira' },
  'rabanne invictus parfum': { nome: 'Rabanne Invictus Parfum', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'Parfum', preco: {'50ml': 186200, '100ml': 258500}, notas: 'Madeira, Âmbar, Musk' },
  'rabanne phantom edt': { nome: 'Rabanne Phantom EDT', nomeBase: 'Rabanne Phantom', genero: 'M', conc: 'EDT', preco: {'50ml': 155800, '100ml': 207900}, notas: 'Limão, Lavanda, Vetiver' },
  'rabanne fame edp': { nome: 'Rabanne Fame EDP', nomeBase: 'Rabanne Fame', genero: 'F', conc: 'EDP', preco: {'30ml': 142800, '50ml': 177500, '80ml': 232500}, notas: 'Mandarina, Jasmim, Patchouli' },
  'armani acqua di giò edt': { nome: 'Armani Acqua di Giò EDT', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDT', preco: {'50ml': 151500, '100ml': 202100, '200ml': 275900}, notas: 'Citrus, Alga Marinha, Patchouli' },
  'armani acqua di giò edp': { nome: 'Armani Acqua di Giò EDP', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDP', preco: {'75ml': 212200, '125ml': 271500}, notas: 'Bergamota, Incenso, Patchouli' },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', nomeBase: 'Armani Acqua di Giò Profumo', genero: 'M', conc: 'Parfum', preco: {'75ml': 235400, '125ml': 301900}, notas: 'Incenso, Madeira, Cipreste' },
  'armani sì edp': { nome: 'Armani Sì EDP', nomeBase: 'Armani Sì', genero: 'F', conc: 'EDP', preco: {'30ml': 145700, '50ml': 187600, '100ml': 248400}, notas: 'Groselha, Rosa, Almíscar, Âmbar' },
  'armani sì passione edp': { nome: 'Armani Sì Passione EDP', nomeBase: 'Armani Sì Passione', genero: 'F', conc: 'EDP', preco: {'50ml': 196300, '100ml': 261400}, notas: 'Bergamota, Rosa, Baunilha' },
  'lancôme la vie est belle edp': { nome: 'Lancôme La Vie est Belle EDP', nomeBase: 'Lancôme La Vie est Belle', genero: 'F', conc: 'EDP', preco: {'30ml': 125400, '50ml': 157300, '75ml': 177500, '100ml': 197800, '150ml': 228100, '200ml': 365500}, notas: 'Íris, Pralinê, Baunilha' },
  'lancôme idôle edp': { nome: 'Lancôme Idôle EDP', nomeBase: 'Lancôme Idôle', genero: 'F', conc: 'EDP', preco: {'25ml': 122600, '50ml': 167400, '100ml': 226700}, notas: 'Rosa de Grasse, Almíscar, Âmbar' },
  'lancôme trésor edp': { nome: 'Lancôme Trésor EDP', nomeBase: 'Lancôme Trésor', genero: 'F', conc: 'EDP', preco: {'30ml': 118200, '50ml': 151500, '100ml': 207900}, notas: 'Pêssego, Rosa, Almíscar, Âmbar' },
  'versace eros edt': { nome: 'Versace Eros EDT', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDT', preco: {'50ml': 145700, '100ml': 196300, '200ml': 267200}, notas: 'Menta, Tonka, Âmbar' },
  'versace eros edp': { nome: 'Versace Eros EDP', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDP', preco: {'50ml': 165900, '100ml': 222300}, notas: 'Bergamota, Néroli, Fava de Tonka' },
  'versace eros parfum': { nome: 'Versace Eros Parfum', nomeBase: 'Versace Eros', genero: 'M', conc: 'Parfum', preco: {'50ml': 192000}, notas: 'Lichia, Néroli, Âmbar, Vetiver' },
  'versace eros flame edp': { nome: 'Versace Eros Flame EDP', nomeBase: 'Versace Eros Flame', genero: 'M', conc: 'EDP', preco: {'50ml': 155800, '100ml': 212200}, notas: 'Toranja, Romã, Patchouli' },
  'versace bright crystal edt': { nome: 'Versace Bright Crystal EDT', nomeBase: 'Versace Bright Crystal', genero: 'F', conc: 'EDT', preco: {'30ml': 112400, '50ml': 142800, '90ml': 187600}, notas: 'Romã, Peónia, Almíscar' },
  'versace dylan blue pour femme edp': { nome: 'Versace Dylan Blue Pour Femme EDP', nomeBase: 'Versace Dylan Blue Pour Femme', genero: 'F', conc: 'EDP', preco: {'50ml': 148600, '100ml': 202100}, notas: 'Groselha, Peónia, Âmbar Branco' },
  'hugo boss bottled edt': { nome: 'Hugo Boss Bottled EDT', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDT', preco: {'50ml': 128300, '100ml': 165900}, notas: 'Maçã, Madeira de Sândalo, Cedro' },
  'hugo boss bottled edp': { nome: 'Hugo Boss Bottled EDP', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDP', preco: {'50ml': 145700, '100ml': 192000}, notas: 'Maçã, Lavanda, Sândalo' },
  'hugo boss the scent edt': { nome: 'Hugo Boss The Scent EDT', nomeBase: 'Hugo Boss The Scent', genero: 'M', conc: 'EDT', preco: {'50ml': 135600, '100ml': 177500}, notas: 'Gengibre, Osmanthus, Couro' },
  'hugo boss the scent for her edp': { nome: 'Hugo Boss The Scent For Her EDP', nomeBase: 'Hugo Boss The Scent For Her', genero: 'F', conc: 'EDP', preco: {'30ml': 115300, '50ml': 148600}, notas: 'Framboesa, Osmanthus, Âmbar' },
  'narciso rodriguez for her edp': { nome: 'Narciso Rodriguez For Her EDP', nomeBase: 'Narciso Rodriguez For Her', genero: 'F', conc: 'EDP', preco: {'30ml': 125400, '50ml': 165900, '100ml': 222300}, notas: 'Rosa, Almíscar, Âmbar' },
  'narciso rodriguez musc noir rose edp': { nome: 'Narciso Rodriguez Musc Noir Rose EDP', nomeBase: 'Narciso Rodriguez Musc Noir Rose', genero: 'F', conc: 'EDP', preco: {'30ml': 135600, '50ml': 177500}, notas: 'Rosa, Almíscar Negro, Sândalo' },
  'issey miyake l\'eau d\'issey h edt': { nome: 'Issey Miyake L\'Eau d\'Issey H EDT', nomeBase: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', conc: 'EDT', preco: {'50ml': 131200, '100ml': 171700}, notas: 'Yuzu, Coriandro, Almíscar' },
  'issey miyake l\'eau d\'issey h edp': { nome: 'Issey Miyake L\'Eau d\'Issey H EDP', nomeBase: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', conc: 'EDP', preco: {'50ml': 151500}, notas: 'Yuzu, Cedro, Âmbar' },
  'issey miyake l\'eau d\'issey f edp': { nome: 'Issey Miyake L\'Eau d\'Issey F EDP', nomeBase: 'Issey Miyake L\'Eau d\'Issey F', genero: 'F', conc: 'EDP', preco: {'25ml': 108100, '50ml': 142800}, notas: 'Lótus, Peónia, Cedro' },
  'calvin klein ck one edt': { nome: 'Calvin Klein CK One EDT', nomeBase: 'Calvin Klein CK One', genero: 'U', conc: 'EDT', preco: {'50ml': 98000, '100ml': 122600, '200ml': 148600}, notas: 'Bergamota, Chá Verde, Almíscar' },
  'calvin klein eternity edp': { nome: 'Calvin Klein Eternity EDP', nomeBase: 'Calvin Klein Eternity', genero: 'F', conc: 'EDP', preco: {'30ml': 102300, '50ml': 131200, '100ml': 171700}, notas: 'Orquídea, Almíscar, Sândalo' },
  'calvin klein obsession edp': { nome: 'Calvin Klein Obsession EDP', nomeBase: 'Calvin Klein Obsession', genero: 'F', conc: 'EDP', preco: {'50ml': 135600, '100ml': 177500}, notas: 'Especiarias, Almíscar, Baunilha' },
  'tom ford oud wood edp': { nome: 'Tom Ford Oud Wood EDP', nomeBase: 'Tom Ford Oud Wood', genero: 'U', conc: 'EDP', preco: {'50ml': 355400, '100ml': 520300}, notas: 'Oud, Sândalo, Vetiver' },
  'tom ford black orchid edp': { nome: 'Tom Ford Black Orchid EDP', nomeBase: 'Tom Ford Black Orchid', genero: 'U', conc: 'EDP', preco: {'50ml': 307700, '100ml': 436400}, notas: 'Trufa, Orquídea Preta, Patchouli' },
  'tom ford tobacco vanille edp': { nome: 'Tom Ford Tobacco Vanille EDP', nomeBase: 'Tom Ford Tobacco Vanille', genero: 'U', conc: 'EDP', preco: {'50ml': 542000, '100ml': 776300}, notas: 'Tabaco, Baunilha, Madeira de Cedro' },
  'tom ford neroli portofino edp': { nome: 'Tom Ford Neroli Portofino EDP', nomeBase: 'Tom Ford Neroli Portofino', genero: 'U', conc: 'EDP', preco: {'50ml': 482700}, notas: 'Bergamota, Néroli, Âmbar' },
  'tom ford lost cherry edp': { nome: 'Tom Ford Lost Cherry EDP', nomeBase: 'Tom Ford Lost Cherry', genero: 'U', conc: 'EDP', preco: {'50ml': 537600}, notas: 'Cereja, Âmbar, Baunilha' },
  'tom ford rose prick edp': { nome: 'Tom Ford Rose Prick EDP', nomeBase: 'Tom Ford Rose Prick', genero: 'U', conc: 'EDP', preco: {'50ml': 537600}, notas: 'Rosa, Pimenta, Fava de Tonka' },
  'guerlain mon guerlain edp': { nome: 'Guerlain Mon Guerlain EDP', nomeBase: 'Guerlain Mon Guerlain', genero: 'F', conc: 'EDP', preco: {'30ml': 142800, '50ml': 187600, '100ml': 255600}, notas: 'Lavanda, Baunilha, Almíscar' },
  'guerlain l\'homme idéal edt': { nome: 'Guerlain L\'Homme Idéal EDT', nomeBase: 'Guerlain L\'Homme Idéal', genero: 'M', conc: 'EDT', preco: {'50ml': 148600}, notas: 'Amêndoa, Lavanda, Couro' },
  'guerlain l\'homme idéal edp': { nome: 'Guerlain L\'Homme Idéal EDP', nomeBase: 'Guerlain L\'Homme Idéal', genero: 'M', conc: 'EDP', preco: {'50ml': 167400}, notas: 'Amêndoa, Vetiver, Âmbar' },
  'guerlain la petite robe noire edp': { nome: 'Guerlain La Petite Robe Noire EDP', nomeBase: 'Guerlain La Petite Robe Noire', genero: 'F', conc: 'EDP', preco: {'30ml': 131200, '50ml': 171700, '100ml': 232500}, notas: 'Bergamota, Rosa, Alcaçuz, Patchouli' },
  'mugler angel edp': { nome: 'Mugler Angel EDP', nomeBase: 'Mugler Angel', genero: 'F', conc: 'EDP', preco: {'25ml': 131200, '50ml': 181800, '100ml': 248400}, notas: 'Caramelo, Patchouli, Baunilha' },
  'mugler angel nova edp': { nome: 'Mugler Angel Nova EDP', nomeBase: 'Mugler Angel Nova', genero: 'F', conc: 'EDP', preco: {'50ml': 187600}, notas: 'Lavanda, Pralinê, Almíscar' },
  'mugler alien edp': { nome: 'Mugler Alien EDP', nomeBase: 'Mugler Alien', genero: 'F', conc: 'EDP', preco: {'30ml': 142800, '60ml': 197800}, notas: 'Jasmim, Âmbar Branco, Madeira de Caxemira' },
  'mugler a*men edt': { nome: 'Mugler A*Men EDT', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'EDT', preco: {'50ml': 151500}, notas: 'Café, Patchouli, Âmbar' },
  'mugler a*men parfum': { nome: 'Mugler A*Men Parfum', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'Parfum', preco: {'50ml': 192000}, notas: 'Café, Patchouli, Baunilha, Âmbar' },
  'mancera cedrat boise': { nome: 'Mancera Cedrat Boise', nomeBase: 'Mancera Cedrat Boise', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Limão, Cassis, Vetiver, Cedro' },
  'mancera instant crush': { nome: 'Mancera Instant Crush', nomeBase: 'Mancera Instant Crush', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Laranja, Rosa, Baunilha, Âmbar' },
  'mancera roses vanille': { nome: 'Mancera Roses Vanille', nomeBase: 'Mancera Roses Vanille', genero: 'F', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Rosa, Baunilha, Patchouli' },
  'mancera red tobacco': { nome: 'Mancera Red Tobacco', nomeBase: 'Mancera Red Tobacco', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Tabaco, Rosa, Especiarias, Âmbar' },
  'mancera amore caffè': { nome: 'Mancera Amore Caffè', nomeBase: 'Mancera Amore Caffè', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Café, Baunilha, Patchouli' },
  'mancera french riviera': { nome: 'Mancera French Riviera', nomeBase: 'Mancera French Riviera', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Bergamota, Cedro, Âmbar Branco' },
  'mancera tonka cola': { nome: 'Mancera Tonka Cola', nomeBase: 'Mancera Tonka Cola', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Tonka, Cola, Baunilha' },
  'mancera coco vanille': { nome: 'Mancera Coco Vanille', nomeBase: 'Mancera Coco Vanille', genero: 'F', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Coco, Baunilha, Almíscar' },
  'mancera sicily': { nome: 'Mancera Sicily', nomeBase: 'Mancera Sicily', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Limão Siciliano, Bergamota, Néroli' },
  'mancera black gold': { nome: 'Mancera Black Gold', nomeBase: 'Mancera Black Gold', genero: 'M', conc: 'EDP', preco: {'60ml': 294600, '120ml': 412100}, notas: 'Oud, Baunilha, Âmbar, Sândalo' },
  'mancera wild fruits': { nome: 'Mancera Wild Fruits', nomeBase: 'Mancera Wild Fruits', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Frutas Silvestres, Rosa, Âmbar' },
  'montale arabians tonka': { nome: 'Montale Arabians Tonka', nomeBase: 'Montale Arabians Tonka', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Açafrão, Oud, Rosa, Tonka' },
  'montale roses musk': { nome: 'Montale Roses Musk', nomeBase: 'Montale Roses Musk', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Almíscar, Âmbar' },
  'montale intense café': { nome: 'Montale Intense Café', nomeBase: 'Montale Intense Café', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Café, Baunilha, Âmbar' },
  'montale black aoud': { nome: 'Montale Black Aoud', nomeBase: 'Montale Black Aoud', genero: 'M', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Oud, Rosa, Patchouli, Vetiver' },
  'montale dark aoud': { nome: 'Montale Dark Aoud', nomeBase: 'Montale Dark Aoud', genero: 'M', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Oud, Sândalo, Almíscar Negro' },
  'montale amber musk': { nome: 'Montale Amber Musk', nomeBase: 'Montale Amber Musk', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'montale starry nights': { nome: 'Montale Starry Nights', nomeBase: 'Montale Starry Nights', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa Selvagem, Violeta, Açafrão' },
  'montale vanilla cake': { nome: 'Montale Vanilla Cake', nomeBase: 'Montale Vanilla Cake', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Baunilha, Leite, Caramelo' },
  'montale rose elixir': { nome: 'Montale Rose Elixir', nomeBase: 'Montale Rose Elixir', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Almíscar, Vetiver' },
  'montale sensual instinct': { nome: 'Montale Sensual Instinct', nomeBase: 'Montale Sensual Instinct', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Açafrão, Oud, Patchouli' },
  'creed aventus': { nome: 'Creed Aventus', nomeBase: 'Creed Aventus', genero: 'M', conc: 'EDP', preco: {'50ml': 664200, '100ml': 928100}, notas: 'Bergamota, Groselha Preta, Bétula, Almíscar' },
  'creed aventus for her': { nome: 'Creed Aventus for Her', nomeBase: 'Creed Aventus for Her', genero: 'F', conc: 'EDP', preco: {'50ml': 604600, '75ml': 723800}, notas: 'Bergamota, Rosa, Baunilha' },
  'creed green irish tweed': { nome: 'Creed Green Irish Tweed', nomeBase: 'Creed Green Irish Tweed', genero: 'M', conc: 'EDT', preco: {'50ml': 579000, '100ml': 826000}, notas: 'Íris, Sândalo, Âmbar' },
  'creed millesime imperial': { nome: 'Creed Millesime Imperial', nomeBase: 'Creed Millesime Imperial', genero: 'U', conc: 'EDP', preco: {'50ml': 579000, '100ml': 826000}, notas: 'Bergamota, Alga, Almíscar' },
  'parfums de marly layton': { nome: 'Parfums de Marly Layton', nomeBase: 'Parfums de Marly Layton', genero: 'M', conc: 'EDP', preco: {'75ml': 510900, '125ml': 664200}, notas: 'Maçã, Lavanda, Baunilha, Sândalo' },
  'parfums de marly layton exclusif': { nome: 'Parfums de Marly Layton Exclusif', nomeBase: 'Parfums de Marly Layton Exclusif', genero: 'M', conc: 'EDP', preco: {'75ml': 562000}, notas: 'Maçã, Lavanda, Noz-moscada, Sândalo' },
  'parfums de marly delina': { nome: 'Parfums de Marly Delina', nomeBase: 'Parfums de Marly Delina', genero: 'F', conc: 'EDP', preco: {'75ml': 493900, '125ml': 638600}, notas: 'Rhubarbo, Peónia, Rosa de Maio' },
  'parfums de marly delina exclusif': { nome: 'Parfums de Marly Delina Exclusif', nomeBase: 'Parfums de Marly Delina Exclusif', genero: 'F', conc: 'EDP', preco: {'75ml': 562000}, notas: 'Rhubarbo, Peónia, Rosa, Almíscar' },
  'parfums de marly pegasus': { nome: 'Parfums de Marly Pegasus', nomeBase: 'Parfums de Marly Pegasus', genero: 'M', conc: 'EDP', preco: {'75ml': 493900, '125ml': 638600}, notas: 'Lavanda, Almendra, Baunilha, Sândalo' },
  'parfums de marly percival': { nome: 'Parfums de Marly Percival', nomeBase: 'Parfums de Marly Percival', genero: 'M', conc: 'EDP', preco: {'75ml': 493900}, notas: 'Bergamota, Lavanda, Almíscar' },
  'parfums de marly cassili': { nome: 'Parfums de Marly Cassili', nomeBase: 'Parfums de Marly Cassili', genero: 'F', conc: 'EDP', preco: {'75ml': 493900}, notas: 'Rosa, Almíscar, Sândalo' },
  'nishane hacivat': { nome: 'Nishane Hacivat', nomeBase: 'Nishane Hacivat', genero: 'U', conc: 'Extrait', preco: {'50ml': 345700, '100ml': 464900}, notas: 'Bergamota, Abacaxi, Cedro, Patchouli' },
  'nishane ani': { nome: 'Nishane Ani', nomeBase: 'Nishane Ani', genero: 'U', conc: 'Extrait', preco: {'50ml': 345700}, notas: 'Flor de Laranjeira, Almíscar, Âmbar' },
  'nishane zenne': { nome: 'Nishane Zenne', nomeBase: 'Nishane Zenne', genero: 'U', conc: 'Extrait', preco: {'50ml': 345700}, notas: 'Rosa, Oud, Âmbar' },
  'nishane afrika olifant': { nome: 'Nishane Afrika Olifant', nomeBase: 'Nishane Afrika Olifant', genero: 'U', conc: 'Extrait', preco: {'50ml': 362700}, notas: 'Âmbar, Vetiver, Patchouli' },
  'initio oud for greatness': { nome: 'Initio Oud for Greatness', nomeBase: 'Initio Oud for Greatness', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Oud, Almíscar, Especiarias, Âmbar' },
  'initio atomic rose': { nome: 'Initio Atomic Rose', nomeBase: 'Initio Atomic Rose', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Rosa, Almíscar, Âmbar' },
  'initio black gold': { nome: 'Initio Black Gold', nomeBase: 'Initio Black Gold', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Sândalp, Âmbar, Almíscar' },
  'initio rehab': { nome: 'Initio Rehab', nomeBase: 'Initio Rehab', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Baunilha, Almíscar, Patchouli' },
  'xerjoff nio': { nome: 'Xerjoff Nio', nomeBase: 'Xerjoff Nio', genero: 'U', conc: 'EDP', preco: {'50ml': 391700, '100ml': 533000}, notas: 'Yuzu, Menta, Madeira' },
  'xerjoff oud stars alexandria ii': { nome: 'Xerjoff Oud Stars Alexandria II', nomeBase: 'Xerjoff Oud Stars Alexandria II', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Oud, Sândalo, Rosa' },
  'mfk baccarat rouge 540 edp': { nome: 'MFK Baccarat Rouge 540 EDP', nomeBase: 'MFK Baccarat Rouge 540', genero: 'U', conc: 'EDP', preco: {'70ml': 655700}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk baccarat rouge 540 extrait': { nome: 'MFK Baccarat Rouge 540 Extrait', nomeBase: 'MFK Baccarat Rouge 540 Extrait', genero: 'U', conc: 'Extrait', preco: {'70ml': 766400}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk 724 edp': { nome: 'MFK 724 EDP', nomeBase: 'MFK 724', genero: 'U', conc: 'EDP', preco: {'70ml': 562000}, notas: 'Bergamota, Lentisco, Almíscar' },
  'mfk grand soir edp': { nome: 'MFK Grand Soir EDP', nomeBase: 'MFK Grand Soir', genero: 'U', conc: 'EDP', preco: {'70ml': 562000}, notas: 'Âmbar, Baunilha, Almíscar' },
  'mfk gentle fluidity gold edp': { nome: 'MFK Gentle Fluidity Gold EDP', nomeBase: 'MFK Gentle Fluidity Gold', genero: 'U', conc: 'EDP', preco: {'70ml': 562000}, notas: 'Noz-moscada, Âmbar, Baunilha' },
  'by kilian angels share edp': { nome: 'By Kilian Angels Share EDP', nomeBase: 'By Kilian Angels Share', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Conhaque, Baunilha, Canela, Âmbar' },
  'by kilian love don\'t be shy edp': { nome: 'By Kilian Love Don\'t Be Shy EDP', nomeBase: 'By Kilian Love Don\'t Be Shy', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Néroli, Caramelo, Almíscar' },
  'by kilian good girl gone bad edp': { nome: 'By Kilian Good Girl Gone Bad EDP', nomeBase: 'By Kilian Good Girl Gone Bad', genero: 'F', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Ylang, Magnólia, Rosa, Íris' },
  'amouage reflection man edp': { nome: 'Amouage Reflection Man EDP', nomeBase: 'Amouage Reflection Man', genero: 'M', conc: 'EDP', preco: {'50ml': 519400, '100ml': 689700}, notas: 'Alecrim, Íris, Sândalo' },
  'amouage interlude man edp': { nome: 'Amouage Interlude Man EDP', nomeBase: 'Amouage Interlude Man', genero: 'M', conc: 'EDP', preco: {'50ml': 519400}, notas: 'Incenso, Âmbar, Orégão' },
  'amouage memoir man edp': { nome: 'Amouage Memoir Man EDP', nomeBase: 'Amouage Memoir Man', genero: 'M', conc: 'EDP', preco: {'50ml': 519400}, notas: 'Absinto, Incenso, Âmbar' },
  'amouage gold woman edp': { nome: 'Amouage Gold Woman EDP', nomeBase: 'Amouage Gold Woman', genero: 'F', conc: 'EDP', preco: {'50ml': 519400}, notas: 'Rosa, Jasmim, Incenso, Âmbar' },
  'frederic malle portrait of a lady edp': { nome: 'Frederic Malle Portrait of a Lady EDP', nomeBase: 'Frederic Malle Portrait of a Lady', genero: 'F', conc: 'EDP', preco: {'50ml': 567100, '100ml': 754400}, notas: 'Rosa, Patchouli, Sândalo, Âmbar' },
  'frederic malle musc ravageur edp': { nome: 'Frederic Malle Musc Ravageur EDP', nomeBase: 'Frederic Malle Musc Ravageur', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'frederic malle cologne indelebile edp': { nome: 'Frederic Malle Cologne Indelebile EDP', nomeBase: 'Frederic Malle Cologne Indelebile', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Almíscar, Néroli, Jasmim' },
  'roja dove enigma edp': { nome: 'Roja Dove Enigma EDP', nomeBase: 'Roja Dove Enigma', genero: 'M', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Bergamota, Rosa, Incenso, Âmbar' },
  'roja dove elysium edp': { nome: 'Roja Dove Elysium EDP', nomeBase: 'Roja Dove Elysium', genero: 'M', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Bergamota, Lavanda, Sândalo' },
  'roja dove danger edp': { nome: 'Roja Dove Danger EDP', nomeBase: 'Roja Dove Danger', genero: 'M', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Cabeça: Cítrico, Coração: Rosa, Fundo: Âmbar' },
  'roja dove scandal edp': { nome: 'Roja Dove Scandal EDP', nomeBase: 'Roja Dove Scandal', genero: 'F', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Aldeídos, Rosa, Âmbar' },
};

// ===================================================
// SESSOES — estado de conversa por cliente
// ===================================================
const SESSOES = {};

function getSessao(num) {
  const s = SESSOES[num];
  if (s && Date.now() - s.ts < 5 * 60 * 1000) return s;
  return null;
}
function setSessao(num, dados) { SESSOES[num] = { ...dados, ts: Date.now() }; }
function clearSessao(num) { delete SESSOES[num]; }

// ===================================================
// UTILITARIOS
// ===================================================
function normalizar(txt) {
  return txt.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function aplicaDesconto(kz) {
  if (DESCONTO_SEMANA <= 0) return kz;
  return Math.round(kz * (1 - DESCONTO_SEMANA / 100) / 100) * 100;
}

function formatPrecos(preco) {
  if (!preco || typeof preco !== 'object') return '';
  return Object.entries(preco).map(([ml, kz]) => {
    const kzFinal = aplicaDesconto(kz);
    if (DESCONTO_SEMANA > 0)
      return `  - ${ml}: ~~${kz.toLocaleString('pt-PT')}~~ *${kzFinal.toLocaleString('pt-PT')} Kz* 🔥`;
    return `  - ${ml}: ${kzFinal.toLocaleString('pt-PT')} Kz`;
  }).join('\n');
}

function getBannerDesconto() {
  return DESCONTO_SEMANA > 0 ? `\n🔥 *PROMOÇÃO: ${DESCONTO_SEMANA}% DESCONTO EM TUDO!*` : '';
}

function getNomesAgrupados(genero) {
  const map = {};
  Object.values(CATALOGO).filter(p => p.genero === genero).forEach(p => {
    if (!map[p.nomeBase]) map[p.nomeBase] = [];
    if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc);
  });
  return Object.entries(map).map(([base, concs]) => `• ${base} _(${concs.join(' / ')})_`);
}

// ===================================================
// FORMATAR RESPOSTA DE PERFUME — usa "preco" (sem s)
// ===================================================
function respostaPerfume(nomeBase) {
  const versoes = Object.values(CATALOGO).filter(p =>
    p.nomeBase === nomeBase && p.preco && Object.keys(p.preco).length > 0
  );
  if (versoes.length === 0) return null;

  const p0 = versoes[0];
  const emoji = p0.genero === 'M' ? '👔' : p0.genero === 'F' ? '👗' : '✨';
  const banner = getBannerDesconto();

  if (versoes.length === 1) {
    return `${emoji} *${p0.nome}* _(${p0.conc})_${banner}\n\n🌸 Notas: ${p0.notas}\n\n💰 *Preços:*\n${formatPrecos(p0.preco)}\n\n📦 Entrega em Luanda incluída\n_Para encomendar, escreve *encomendar*_ 🖤`;
  }

  let reply = `${emoji} *${nomeBase}*${banner}\n\n🌸 Notas: ${p0.notas}\n\n💰 *Versões disponíveis:*\n`;
  versoes.forEach(p => { reply += `\n*${p.conc}:*\n${formatPrecos(p.preco)}\n`; });
  reply += `\n📦 Entrega em Luanda incluída\n_Para encomendar, escreve *encomendar*_ 🖤`;
  return reply;
}

// ===================================================
// PESQUISA DIRECTA — nome completo ou palavras
// ===================================================
function pesquisaDirecta(txtLow) {
  // Exacta por chave do catalogo
  for (const [key, p] of Object.entries(CATALOGO)) {
    if (txtLow.includes(key)) return p.nomeBase;
  }
  // Por palavras do nomeBase
  const vistos = new Set();
  for (const p of Object.values(CATALOGO)) {
    const nb = normalizar(p.nomeBase);
    if (vistos.has(nb)) continue;
    const palavras = nb.split(' ').filter(w => w.length > 2);
    const todas = palavras.length > 0 && palavras.every(w => txtLow.includes(w));
    const ultima = palavras[palavras.length - 1];
    const ultimaOk = ultima && ultima.length > 3 && txtLow.includes(ultima);
    if (todas || ultimaOk) { vistos.add(nb); return p.nomeBase; }
  }
  return null;
}

// ===================================================
// PESQUISA FUZZY — detecta erros e variações
// ===================================================
const FUZZY_INDEX = [];
const _vistos = new Set();
for (const p of Object.values(CATALOGO)) {
  if (_vistos.has(p.nomeBase)) continue;
  _vistos.add(p.nomeBase);
  const nb = normalizar(p.nomeBase);
  const palavras = nb.split(' ').filter(w => w.length > 1);
  // Adiciona nome completo e cada palavra significativa como keyword
  const keywords = new Set([nb]);
  palavras.filter(w => w.length >= 2).forEach(w => keywords.add(w));
  FUZZY_INDEX.push({ nomeBase: p.nomeBase, keywords: [...keywords] });
}

function pesquisaFuzzy(msgOriginal) {
  const msgNorm = normalizar(msgOriginal);
  const palavrasMsg = msgNorm.split(' ').filter(w => w.length >= 1);
  let melhor = null;
  let melhorScore = Infinity;

  for (const item of FUZZY_INDEX) {
    for (const keyword of item.keywords) {
      const kwPalavras = keyword.split(' ').filter(w => w.length > 1);
      if (kwPalavras.length === 0) continue;
      let totalDist = 0, matched = 0;
      for (const kw of kwPalavras) {
        if (kw.length < 2) { matched++; continue; }
        let minDist = Infinity;
        for (const pm of palavrasMsg) {
          if (pm.length < 1) continue;
          const dist = levenshtein(kw, pm);
          const maxDist = kw.length <= 2 ? 0 : kw.length <= 4 ? 1 : kw.length <= 7 ? 2 : 3;
          if (dist <= maxDist) minDist = Math.min(minDist, dist);
        }
        if (minDist < Infinity) { totalDist += minDist; matched++; }
      }
      if (matched === kwPalavras.length && totalDist < melhorScore) {
        melhorScore = totalDist;
        melhor = item;
      }
    }
  }
  return melhor;
}

// ===================================================
// BOT PRINCIPAL
// ===================================================

// Palavras de comando a ignorar na pesquisa fuzzy
const PALAVRAS_IGNORAR = new Set([
  'ola','oi','sim','nao','ok','bom','boa','dia','tarde','noite','hello','hi','hey','boas',
  'catalogo','masculinos','femininos','nicho','luxo','encomendar','encomenda','entrega','envio',
  'quero','preciso','tem','tens','ter','ver','lista','todos','tudo','outro','outra'
]);

function isComando(txtNorm) {
  return /^(ola|oi|bom|boa|hello|hi|hey|boas|catalogo|todos|lista|masculin|feminin|nicho|luxo|encomendar|encomenda|entrega|envio)/.test(txtNorm);
}

function getBotReply(from, msg) {
  const txt = msg.trim();
  const txtLow = txt.toLowerCase();
  const txtNorm = normalizar(txt);

  // --- 1. Sessão activa (aguarda sim/não) ---
  const sessao = getSessao(from);
  if (sessao && sessao.nomeBase) {
    const r = txtNorm.trim();
    if (/^(sim|s\b|yes|yep|claro|certo|isso|ok|quero|exato|confirm)/.test(r)) {
      const nomeBase = sessao.nomeBase;
      clearSessao(from);
      const resp = respostaPerfume(nomeBase);
      return resp || `🖤 Não encontrei detalhes para *${nomeBase}*. Escreve *catálogo* para ver todos.`;
    }
    if (/^(nao|n\b|no\b|nope|outro|outra|diferente|errado|negativo)/.test(r)) {
      clearSessao(from);
      return `🖤 Sem problema! Escreve o nome do perfume que procuras\nou *catálogo* para ver todos. 😊`;
    }
    // Cliente escreveu outra coisa — limpa sessão e continua
    clearSessao(from);
  }

  // --- 2. Comandos base ---
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|olá|boas)/.test(txtNorm)) {
    const totalM = new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>p.nomeBase)).size;
    const totalF = new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>p.nomeBase)).size;
    const totalU = new Set(Object.values(CATALOGO).filter(p=>p.genero==='U').map(p=>p.nomeBase)).size;
    const banner = DESCONTO_SEMANA > 0 ? `\n🔥 *PROMOÇÃO: ${DESCONTO_SEMANA}% DE DESCONTO EM TUDO!*` : '';
    return `🖤 *Bem-vindo à Omnia Parfums!*${banner}\n\nSomos a tua perfumaria de confiança em Luanda. 🇦🇴\n\nTemos *${totalM+totalF+totalU}+ perfumes*:\n👔 ${totalM} Masculinos · 👗 ${totalF} Femininos · ✨ ${totalU} Nicho\n\nEscreve o nome de um perfume (mesmo com erros eu entendo 😉)\nOu: *masculinos* · *femininos* · *nicho* · *catálogo*\n\n_Entrega em Luanda incluída_ 📦`;
  }

  if (/catalogo|todos|lista|ver tudo/.test(txtNorm)) {
    const masc = getNomesAgrupados('M');
    const fem = getNomesAgrupados('F');
    const uni = getNomesAgrupados('U');
    return `🖤 *Catálogo Omnia Parfums*${getBannerDesconto()}\n\n👔 *MASCULINOS (${masc.length})*\n${masc.join('\n')}\n\n👗 *FEMININOS (${fem.length})*\n${fem.join('\n')}\n\n✨ *NICHO & LUXO (${uni.length})*\n${uni.join('\n')}\n\n_Escreve o nome para ver preços_ 💛`;
  }

  if (/^(masculin|homem|para ele)/.test(txtNorm)) {
    return `👔 *Perfumes Masculinos*${getBannerDesconto()}\n\n${getNomesAgrupados('M').join('\n')}\n\n_Escreve o nome para ver preços_ 💛`;
  }

  if (/^(feminin|mulher|para ela)/.test(txtNorm)) {
    return `👗 *Perfumes Femininos*${getBannerDesconto()}\n\n${getNomesAgrupados('F').join('\n')}\n\n_Escreve o nome para ver preços_ 💛`;
  }

  if (/^(nicho|luxo|exclusiv|premium)/.test(txtNorm)) {
    return `✨ *Nicho & Luxo*${getBannerDesconto()}\n\n${getNomesAgrupados('U').join('\n')}\n\n_Escreve o nome para ver preços_ 💛`;
  }

  if (/encomendar|encomenda|pedido/.test(txtNorm)) {
    return `📦 *Fazer Encomenda*\n\nEnvia-nos:\n1️⃣ Nome do perfume\n2️⃣ Versão (EDT / EDP / Parfum)\n3️⃣ Tamanho (ml)\n4️⃣ O teu nome\n5️⃣ Morada de entrega em Luanda\n\n💛 Respondemos em menos de 30 minutos!\n\n_Pagamento: Transferência, Multicaixa Express ou à entrega_`;
  }

  if (/entrega|envio/.test(txtNorm)) {
    return `📦 *Entregas Omnia Parfums*\n\n✅ Entrega em toda Luanda\n⏰ Prazo: 24-48 horas\n💰 Entrega incluída no preço`;
  }

  // --- 3. Pesquisa directa ---
  const directa = pesquisaDirecta(txtLow);
  if (directa) return respostaPerfume(directa);

  // --- 4. Pesquisa fuzzy — só se não for comando ---
  // Filtra palavras de comando para não fazer fuzzy em "nicho", "catalogo", etc.
  const palavrasMsgFiltradas = txtNorm.split(' ').filter(w => !PALAVRAS_IGNORAR.has(w) && w.length > 1);
  if (!isComando(txtNorm) && palavrasMsgFiltradas.length > 0) {
    const fuzzy = pesquisaFuzzy(palavrasMsgFiltradas.join(' '));
    if (fuzzy) {
      setSessao(from, { nomeBase: fuzzy.nomeBase });
      return `🤔 Será que quiseste dizer *${fuzzy.nomeBase}*?\n\nResponde *sim* ou *não* 😊`;
    }
  }

  // --- 5. Escalada ---
  return null;
}

// ===================================================
// ENVIO E WEBHOOK
// ===================================================
async function sendMessage(to, text) {
  try {
    await axios.post(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      number: to, text: text
    }, { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' } });
    console.log(`✅ Enviado para ${to}`);
  } catch(e) {
    console.error('Erro:', e.response?.data || e.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    if (req.body.event !== 'messages.upsert') return;
    const data = req.body.data;
    if (!data || data.key?.fromMe || data.key?.remoteJid?.includes('@g.us')) return;
    const from = data.key?.remoteJid;
    const text = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
    if (!from || !text) return;

    console.log(`📩 ${from}: ${text}`);
    const reply = getBotReply(from, text);

    if (reply) {
      await sendMessage(from, reply);
    } else {
      await sendMessage(from, `🖤 *Omnia Parfums*\n\nNão encontrei esse perfume. Experimenta:\n- Escrever só parte do nome _(ex: sauvage, chance, libre)_\n- Escrever *catálogo* para ver todos\n\nUm atendente vai ajudar-te em breve! ⏳`);
      if (NUMERO_HUMANO) {
        const numLimpo = from.replace('@s.whatsapp.net', '').replace('@c.us', '');
        await sendMessage(NUMERO_HUMANO, `🔔 *OMNIA PARFUMS — Cliente a aguardar*\n\n📱 Número: +${numLimpo}\n💬 Mensagem: _"${text}"_\n\n👆 Clica para responder:\nhttps://wa.me/${numLimpo}\n\n_Bot não encontrou resposta._`);
      }
    }
  } catch(e) { console.error('Erro webhook:', e.message); }
});

app.get('/webhook', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send(`🖤 Omnia Parfums Bot v6 — ${Object.keys(CATALOGO).length} entradas | Desconto: ${DESCONTO_SEMANA}%`));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot v6 — ${Object.keys(CATALOGO).length} perfumes | Desconto: ${DESCONTO_SEMANA}%`));
