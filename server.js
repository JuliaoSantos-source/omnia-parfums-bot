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
// CATALOGO — 133 perfumes | Preços baseados em sites EUR
// Designer: (max EUR + €20 envio) × 1310 × 1.2
// Nicho:    (max EUR + €35 envio) × 1310 × 1.3
// ===================================================
const CATALOGO = {
  'dior sauvage edt': { nome: 'Dior Sauvage EDT', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDT', preco: {'60ml': 160300, '100ml': 193400, '200ml': 272000}, notas: 'Bergamota, Ambroxan, Pimenta Rosa' },
  'dior sauvage edp': { nome: 'Dior Sauvage EDP', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDP', preco: {'60ml': 177600, '100ml': 212200, '200ml': 294000}, notas: 'Bergamota, Lavanda, Baunilha' },
  'dior sauvage parfum': { nome: 'Dior Sauvage Parfum', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'Parfum', preco: {'60ml': 220100}, notas: 'Bergamota, Sândalo, Baunilha' },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', nomeBase: 'Dior Sauvage Elixir', genero: 'M', conc: 'Extrait', preco: {'60ml': 243700}, notas: 'Cardamomo, Lavanda, Patchouli' },
  'dior j\'adore edp': { nome: 'Dior J\'adore EDP', nomeBase: 'Dior J\'adore', genero: 'F', conc: 'EDP', preco: {'30ml': 130500, '50ml': 163500, '100ml': 212200, '150ml': 272000}, notas: 'Magnólia, Rosa, Jasmim' },
  'dior miss dior edp': { nome: 'Dior Miss Dior EDP', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'EDP', preco: {'30ml': 128900, '50ml': 160300, '100ml': 209100}, notas: 'Peónia, Rosa, Patchouli' },
  'dior miss dior parfum': { nome: 'Dior Miss Dior Parfum', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'Parfum', preco: {'35ml': 144600, '80ml': 212200}, notas: 'Rosa de Grasse, Almíscar Branco' },
  'dior homme intense edp': { nome: 'Dior Homme Intense EDP', nomeBase: 'Dior Homme Intense', genero: 'M', conc: 'EDP', preco: {'50ml': 150900, '100ml': 199600}, notas: 'Íris, Cedro, Âmbar' },
  'bleu de chanel edt': { nome: 'Bleu de Chanel EDT', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDT', preco: {'50ml': 161900, '100ml': 209100, '150ml': 272000}, notas: 'Citrus, Incenso, Sândalo' },
  'bleu de chanel edp': { nome: 'Bleu de Chanel EDP', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDP', preco: {'50ml': 183900, '100ml': 246800, '150ml': 311300}, notas: 'Citrus, Noz-moscada, Sândalo' },
  'bleu de chanel parfum': { nome: 'Bleu de Chanel Parfum', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'Parfum', preco: {'50ml': 224800, '100ml': 294000}, notas: 'Citrus, Bétula, Âmbar' },
  'chanel coco mademoiselle edp': { nome: 'Chanel Coco Mademoiselle EDP', nomeBase: 'Chanel Coco Mademoiselle', genero: 'F', conc: 'EDP', preco: {'50ml': 193400, '100ml': 264100, '150ml': 327000}, notas: 'Bergamota, Rosa, Patchouli' },
  'chanel coco mademoiselle intense': { nome: 'Chanel Coco Mademoiselle Intense', nomeBase: 'Chanel Coco Mademoiselle Intense', genero: 'F', conc: 'EDP', preco: {'50ml': 215400, '100ml': 289200}, notas: 'Bergamota, Rosa, Vetiver' },
  'chanel n°5 edp': { nome: 'Chanel N°5 EDP', nomeBase: 'Chanel N°5', genero: 'F', conc: 'EDP', preco: {'35ml': 150900, '50ml': 196500, '100ml': 272000}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar' },
  'chanel chance edp': { nome: 'Chanel Chance EDP', nomeBase: 'Chanel Chance', genero: 'F', conc: 'EDP', preco: {'50ml': 191800, '100ml': 262500}, notas: 'Cítrico, Rosa, Almíscar Branco' },
  'chanel chance eau tendre edp': { nome: 'Chanel Chance Eau Tendre EDP', nomeBase: 'Chanel Chance Eau Tendre', genero: 'F', conc: 'EDP', preco: {'50ml': 191800, '100ml': 262500}, notas: 'Toranja, Quéssia, Almíscar Branco' },
  'ysl black opium edp': { nome: 'YSL Black Opium EDP', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'EDP', preco: {'30ml': 127300, '50ml': 160300, '90ml': 201200, '150ml': 273500}, notas: 'Café, Baunilha, Patchouli, Flor Branca' },
  'ysl black opium parfum': { nome: 'YSL Black Opium Parfum', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'Parfum', preco: {'50ml': 188600}, notas: 'Café Intenso, Açafrão, Âmbar' },
  'ysl libre edp': { nome: 'YSL Libre EDP', nomeBase: 'YSL Libre', genero: 'F', conc: 'EDP', preco: {'30ml': 132000, '50ml': 166600, '90ml': 215400}, notas: 'Lavanda, Flor de Laranjeira, Cedro' },
  'ysl libre parfum': { nome: 'YSL Libre Parfum', nomeBase: 'YSL Libre', genero: 'F', conc: 'Parfum', preco: {'50ml': 196500}, notas: 'Lavanda Africana, Âmbar, Baunilha' },
  'ysl y edp': { nome: 'YSL Y EDP', nomeBase: 'YSL Y', genero: 'M', conc: 'EDP', preco: {'60ml': 160300, '100ml': 209100, '200ml': 276700}, notas: 'Bergamota, Gengibre, Cedro' },
  'ysl y parfum': { nome: 'YSL Y Parfum', nomeBase: 'YSL Y', genero: 'M', conc: 'Parfum', preco: {'60ml': 188600}, notas: 'Bergamota, Coriandro, Vetiver' },
  'ysl l\'homme edp': { nome: 'YSL L\'Homme EDP', nomeBase: 'YSL L\'Homme', genero: 'M', conc: 'EDP', preco: {'60ml': 155600, '100ml': 199600}, notas: 'Bergamota, Cedro, Âmbar' },
  'rabanne 1 million edt': { nome: 'Rabanne 1 Million EDT', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDT', preco: {'50ml': 143100, '100ml': 185500, '200ml': 248400}, notas: 'Mandarina, Canela, Âmbar, Couro' },
  'rabanne 1 million edp': { nome: 'Rabanne 1 Million EDP', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDP', preco: {'50ml': 155600, '100ml': 201200}, notas: 'Toranja, Canela, Couro, Patchouli' },
  'rabanne 1 million parfum': { nome: 'Rabanne 1 Million Parfum', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'Parfum', preco: {'50ml': 168200, '100ml': 223200}, notas: 'Tonka, Baunilha, Salgado' },
  'rabanne invictus edt': { nome: 'Rabanne Invictus EDT', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDT', preco: {'50ml': 132000, '100ml': 171300, '200ml': 234200}, notas: 'Toranja, Louro, Âmbar' },
  'rabanne invictus edp': { nome: 'Rabanne Invictus EDP', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDP', preco: {'50ml': 147800, '100ml': 193400}, notas: 'Louro, Patchouli, Âmbar, Madeira' },
  'rabanne invictus parfum': { nome: 'Rabanne Invictus Parfum', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'Parfum', preco: {'50ml': 158800, '100ml': 216900}, notas: 'Madeira, Âmbar, Musk' },
  'rabanne phantom edt': { nome: 'Rabanne Phantom EDT', nomeBase: 'Rabanne Phantom', genero: 'M', conc: 'EDT', preco: {'50ml': 135200, '100ml': 176100}, notas: 'Limão, Lavanda, Vetiver' },
  'rabanne fame edp': { nome: 'Rabanne Fame EDP', nomeBase: 'Rabanne Fame', genero: 'F', conc: 'EDP', preco: {'30ml': 124200, '50ml': 152500, '80ml': 196500}, notas: 'Mandarina, Jasmim, Patchouli' },
  'armani acqua di giò edt': { nome: 'Armani Acqua di Giò EDT', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDT', preco: {'50ml': 132000, '100ml': 171300, '200ml': 231100}, notas: 'Citrus, Alga Marinha, Patchouli' },
  'armani acqua di giò edp': { nome: 'Armani Acqua di Giò EDP', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDP', preco: {'75ml': 179200, '125ml': 227900}, notas: 'Bergamota, Incenso, Patchouli' },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', nomeBase: 'Armani Acqua di Giò Profumo', genero: 'M', conc: 'Parfum', preco: {'75ml': 199600, '125ml': 251500}, notas: 'Incenso, Madeira, Cipreste' },
  'armani sì edp': { nome: 'Armani Sì EDP', nomeBase: 'Armani Sì', genero: 'F', conc: 'EDP', preco: {'30ml': 127300, '50ml': 160300, '100ml': 209100}, notas: 'Groselha, Rosa, Almíscar, Âmbar' },
  'armani sì passione edp': { nome: 'Armani Sì Passione EDP', nomeBase: 'Armani Sì Passione', genero: 'F', conc: 'EDP', preco: {'50ml': 166600, '100ml': 220100}, notas: 'Bergamota, Rosa, Baunilha' },
  'lancôme la vie est belle edp': { nome: 'Lancôme La Vie est Belle EDP', nomeBase: 'Lancôme La Vie est Belle', genero: 'F', conc: 'EDP', preco: {'30ml': 110000, '50ml': 136800, '75ml': 152500, '100ml': 168200, '150ml': 193400, '200ml': 303400}, notas: 'Íris, Pralinê, Baunilha' },
  'lancôme idôle edp': { nome: 'Lancôme Idôle EDP', nomeBase: 'Lancôme Idôle', genero: 'F', conc: 'EDP', preco: {'25ml': 106900, '50ml': 144600, '100ml': 191800}, notas: 'Rosa de Grasse, Almíscar, Âmbar' },
  'lancôme trésor edp': { nome: 'Lancôme Trésor EDP', nomeBase: 'Lancôme Trésor', genero: 'F', conc: 'EDP', preco: {'30ml': 103800, '50ml': 132000, '100ml': 176100}, notas: 'Pêssego, Rosa, Almíscar, Âmbar' },
  'versace eros edt': { nome: 'Versace Eros EDT', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDT', preco: {'50ml': 127300, '100ml': 166600, '200ml': 224800}, notas: 'Menta, Tonka, Âmbar' },
  'versace eros edp': { nome: 'Versace Eros EDP', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDP', preco: {'50ml': 143100, '100ml': 188600}, notas: 'Bergamota, Néroli, Fava de Tonka' },
  'versace eros parfum': { nome: 'Versace Eros Parfum', nomeBase: 'Versace Eros', genero: 'M', conc: 'Parfum', preco: {'50ml': 163500}, notas: 'Lichia, Néroli, Âmbar, Vetiver' },
  'versace eros flame edp': { nome: 'Versace Eros Flame EDP', nomeBase: 'Versace Eros Flame', genero: 'M', conc: 'EDP', preco: {'50ml': 135200, '100ml': 179200}, notas: 'Toranja, Romã, Patchouli' },
  'versace bright crystal edt': { nome: 'Versace Bright Crystal EDT', nomeBase: 'Versace Bright Crystal', genero: 'F', conc: 'EDT', preco: {'30ml': 99000, '50ml': 124200, '90ml': 160300}, notas: 'Romã, Peónia, Almíscar' },
  'versace dylan blue pour femme edp': { nome: 'Versace Dylan Blue Pour Femme EDP', nomeBase: 'Versace Dylan Blue Pour Femme', genero: 'F', conc: 'EDP', preco: {'50ml': 128900, '100ml': 171300}, notas: 'Groselha, Peónia, Âmbar Branco' },
  'hugo boss bottled edt': { nome: 'Hugo Boss Bottled EDT', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDT', preco: {'50ml': 113200, '100ml': 143100}, notas: 'Maçã, Madeira de Sândalo, Cedro' },
  'hugo boss bottled edp': { nome: 'Hugo Boss Bottled EDP', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDP', preco: {'50ml': 127300, '100ml': 163500}, notas: 'Maçã, Lavanda, Sândalo' },
  'hugo boss the scent edt': { nome: 'Hugo Boss The Scent EDT', nomeBase: 'Hugo Boss The Scent', genero: 'M', conc: 'EDT', preco: {'50ml': 119500, '100ml': 152500}, notas: 'Gengibre, Osmanthus, Couro' },
  'hugo boss the scent for her edp': { nome: 'Hugo Boss The Scent For Her EDP', nomeBase: 'Hugo Boss The Scent For Her', genero: 'F', conc: 'EDP', preco: {'30ml': 103800, '50ml': 128900}, notas: 'Framboesa, Osmanthus, Âmbar' },
  'narciso rodriguez for her edp': { nome: 'Narciso Rodriguez For Her EDP', nomeBase: 'Narciso Rodriguez For Her', genero: 'F', conc: 'EDP', preco: {'30ml': 110000, '50ml': 143100, '100ml': 188600}, notas: 'Rosa, Almíscar, Âmbar' },
  'narciso rodriguez musc noir rose edp': { nome: 'Narciso Rodriguez Musc Noir Rose EDP', nomeBase: 'Narciso Rodriguez Musc Noir Rose', genero: 'F', conc: 'EDP', preco: {'30ml': 119500, '50ml': 152500}, notas: 'Rosa, Almíscar Negro, Sândalo' },
  'issey miyake l\'eau d\'issey h edt': { nome: 'Issey Miyake L\'Eau d\'Issey H EDT', nomeBase: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', conc: 'EDT', preco: {'50ml': 116300, '100ml': 147800}, notas: 'Yuzu, Coriandro, Almíscar' },
  'issey miyake l\'eau d\'issey h edp': { nome: 'Issey Miyake L\'Eau d\'Issey H EDP', nomeBase: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', conc: 'EDP', preco: {'50ml': 132000}, notas: 'Yuzu, Cedro, Âmbar' },
  'issey miyake l\'eau d\'issey f edp': { nome: 'Issey Miyake L\'Eau d\'Issey F EDP', nomeBase: 'Issey Miyake L\'Eau d\'Issey F', genero: 'F', conc: 'EDP', preco: {'25ml': 97500, '50ml': 124200}, notas: 'Lótus, Peónia, Cedro' },
  'calvin klein ck one edt': { nome: 'Calvin Klein CK One EDT', nomeBase: 'Calvin Klein CK One', genero: 'U', conc: 'EDT', preco: {'50ml': 88000, '100ml': 106900, '200ml': 128900}, notas: 'Bergamota, Chá Verde, Almíscar' },
  'calvin klein eternity edp': { nome: 'Calvin Klein Eternity EDP', nomeBase: 'Calvin Klein Eternity', genero: 'F', conc: 'EDP', preco: {'30ml': 91200, '50ml': 116300, '100ml': 147800}, notas: 'Orquídea, Almíscar, Sândalo' },
  'calvin klein obsession edp': { nome: 'Calvin Klein Obsession EDP', nomeBase: 'Calvin Klein Obsession', genero: 'F', conc: 'EDP', preco: {'50ml': 119500, '100ml': 152500}, notas: 'Especiarias, Almíscar, Baunilha' },
  'tom ford oud wood edp': { nome: 'Tom Ford Oud Wood EDP', nomeBase: 'Tom Ford Oud Wood', genero: 'U', conc: 'EDP', preco: {'50ml': 295500, '100ml': 426000}, notas: 'Oud, Sândalo, Vetiver' },
  'tom ford black orchid edp': { nome: 'Tom Ford Black Orchid EDP', nomeBase: 'Tom Ford Black Orchid', genero: 'U', conc: 'EDP', preco: {'50ml': 257800, '100ml': 360000}, notas: 'Trufa, Orquídea Preta, Patchouli' },
  'tom ford tobacco vanille edp': { nome: 'Tom Ford Tobacco Vanille EDP', nomeBase: 'Tom Ford Tobacco Vanille', genero: 'U', conc: 'EDP', preco: {'50ml': 444900, '100ml': 631900}, notas: 'Tabaco, Baunilha, Madeira de Cedro' },
  'tom ford neroli portofino edp': { nome: 'Tom Ford Neroli Portofino EDP', nomeBase: 'Tom Ford Neroli Portofino', genero: 'U', conc: 'EDP', preco: {'50ml': 397700}, notas: 'Bergamota, Néroli, Âmbar' },
  'tom ford lost cherry edp': { nome: 'Tom Ford Lost Cherry EDP', nomeBase: 'Tom Ford Lost Cherry', genero: 'U', conc: 'EDP', preco: {'50ml': 441700}, notas: 'Cereja, Âmbar, Baunilha' },
  'tom ford rose prick edp': { nome: 'Tom Ford Rose Prick EDP', nomeBase: 'Tom Ford Rose Prick', genero: 'U', conc: 'EDP', preco: {'50ml': 441700}, notas: 'Rosa, Pimenta, Fava de Tonka' },
  'guerlain mon guerlain edp': { nome: 'Guerlain Mon Guerlain EDP', nomeBase: 'Guerlain Mon Guerlain', genero: 'F', conc: 'EDP', preco: {'30ml': 124200, '50ml': 160300, '100ml': 215400}, notas: 'Lavanda, Baunilha, Almíscar' },
  'guerlain l\'homme idéal edt': { nome: 'Guerlain L\'Homme Idéal EDT', nomeBase: 'Guerlain L\'Homme Idéal', genero: 'M', conc: 'EDT', preco: {'50ml': 128900}, notas: 'Amêndoa, Lavanda, Couro' },
  'guerlain l\'homme idéal edp': { nome: 'Guerlain L\'Homme Idéal EDP', nomeBase: 'Guerlain L\'Homme Idéal', genero: 'M', conc: 'EDP', preco: {'50ml': 144600}, notas: 'Amêndoa, Vetiver, Âmbar' },
  'guerlain la petite robe noire edp': { nome: 'Guerlain La Petite Robe Noire EDP', nomeBase: 'Guerlain La Petite Robe Noire', genero: 'F', conc: 'EDP', preco: {'30ml': 116300, '50ml': 147800, '100ml': 196500}, notas: 'Bergamota, Rosa, Alcaçuz, Patchouli' },
  'mugler angel edp': { nome: 'Mugler Angel EDP', nomeBase: 'Mugler Angel', genero: 'F', conc: 'EDP', preco: {'25ml': 116300, '50ml': 155600, '100ml': 209100}, notas: 'Caramelo, Patchouli, Baunilha' },
  'mugler angel nova edp': { nome: 'Mugler Angel Nova EDP', nomeBase: 'Mugler Angel Nova', genero: 'F', conc: 'EDP', preco: {'50ml': 160300}, notas: 'Lavanda, Pralinê, Almíscar' },
  'mugler alien edp': { nome: 'Mugler Alien EDP', nomeBase: 'Mugler Alien', genero: 'F', conc: 'EDP', preco: {'30ml': 124200, '60ml': 168200}, notas: 'Jasmim, Âmbar Branco, Madeira de Caxemira' },
  'mugler a*men edt': { nome: 'Mugler A*Men EDT', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'EDT', preco: {'50ml': 132000}, notas: 'Café, Patchouli, Âmbar' },
  'mugler a*men parfum': { nome: 'Mugler A*Men Parfum', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'Parfum', preco: {'50ml': 163500}, notas: 'Café, Patchouli, Baunilha, Âmbar' },
  'mancera cedrat boise': { nome: 'Mancera Cedrat Boise', nomeBase: 'Mancera Cedrat Boise', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Limão, Cassis, Vetiver, Cedro' },
  'mancera instant crush': { nome: 'Mancera Instant Crush', nomeBase: 'Mancera Instant Crush', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Laranja, Rosa, Baunilha, Âmbar' },
  'mancera roses vanille': { nome: 'Mancera Roses Vanille', nomeBase: 'Mancera Roses Vanille', genero: 'F', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Rosa, Baunilha, Patchouli' },
  'mancera red tobacco': { nome: 'Mancera Red Tobacco', nomeBase: 'Mancera Red Tobacco', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Tabaco, Rosa, Especiarias, Âmbar' },
  'mancera amore caffè': { nome: 'Mancera Amore Caffè', nomeBase: 'Mancera Amore Caffè', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Café, Baunilha, Patchouli' },
  'mancera french riviera': { nome: 'Mancera French Riviera', nomeBase: 'Mancera French Riviera', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Bergamota, Cedro, Âmbar Branco' },
  'mancera tonka cola': { nome: 'Mancera Tonka Cola', nomeBase: 'Mancera Tonka Cola', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Tonka, Cola, Baunilha' },
  'mancera coco vanille': { nome: 'Mancera Coco Vanille', nomeBase: 'Mancera Coco Vanille', genero: 'F', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Coco, Baunilha, Almíscar' },
  'mancera sicily': { nome: 'Mancera Sicily', nomeBase: 'Mancera Sicily', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Limão Siciliano, Bergamota, Néroli' },
  'mancera black gold': { nome: 'Mancera Black Gold', nomeBase: 'Mancera Black Gold', genero: 'M', conc: 'EDP', preco: {'60ml': 255400, '120ml': 357600}, notas: 'Oud, Baunilha, Âmbar, Sândalo' },
  'mancera wild fruits': { nome: 'Mancera Wild Fruits', nomeBase: 'Mancera Wild Fruits', genero: 'U', conc: 'EDP', preco: {'60ml': 245200, '120ml': 340600}, notas: 'Frutas Silvestres, Rosa, Âmbar' },
  'montale arabians tonka': { nome: 'Montale Arabians Tonka', nomeBase: 'Montale Arabians Tonka', genero: 'U', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Açafrão, Oud, Rosa, Tonka' },
  'montale roses musk': { nome: 'Montale Roses Musk', nomeBase: 'Montale Roses Musk', genero: 'F', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Almíscar, Âmbar' },
  'montale intense café': { nome: 'Montale Intense Café', nomeBase: 'Montale Intense Café', genero: 'U', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Café, Baunilha, Âmbar' },
  'montale black aoud': { nome: 'Montale Black Aoud', nomeBase: 'Montale Black Aoud', genero: 'M', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Oud, Rosa, Patchouli, Vetiver' },
  'montale dark aoud': { nome: 'Montale Dark Aoud', nomeBase: 'Montale Dark Aoud', genero: 'M', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Oud, Sândalo, Almíscar Negro' },
  'montale amber musk': { nome: 'Montale Amber Musk', nomeBase: 'Montale Amber Musk', genero: 'U', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Âmbar, Almíscar, Baunilha' },
  'montale starry nights': { nome: 'Montale Starry Nights', nomeBase: 'Montale Starry Nights', genero: 'U', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa Selvagem, Violeta, Açafrão' },
  'montale vanilla cake': { nome: 'Montale Vanilla Cake', nomeBase: 'Montale Vanilla Cake', genero: 'F', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Baunilha, Leite, Caramelo' },
  'montale rose elixir': { nome: 'Montale Rose Elixir', nomeBase: 'Montale Rose Elixir', genero: 'F', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Almíscar, Vetiver' },
  'montale sensual instinct': { nome: 'Montale Sensual Instinct', nomeBase: 'Montale Sensual Instinct', genero: 'U', conc: 'EDP', preco: {'50ml': 298000, '100ml': 323600}, notas: 'Açafrão, Oud, Patchouli' },
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
  'roja dove scandal edp': { nome: 'Roja Dove Scandal EDP', nomeBase: 'Roja Dove Scandal', genero: 'F', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Aldeídos, Rosa, Âmbar' },};

// ===================================================
// SESSOES DE CONVERSA
// ===================================================
const SESSOES = {};
function getSessao(num) {
  const s = SESSOES[num];
  return (s && Date.now() - s.ts < 10 * 60 * 1000) ? s : null;
}
function setSessao(num, dados) { SESSOES[num] = { ...dados, ts: Date.now() }; }
function clearSessao(num) { delete SESSOES[num]; }

// ===================================================
// UTILITÁRIOS
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
      return `  • ${ml}: ~~${kz.toLocaleString('pt-PT')}~~ *${kzFinal.toLocaleString('pt-PT')} Kz* 🔥`;
    return `  • ${ml}: ${kzFinal.toLocaleString('pt-PT')} Kz`;
  }).join('\n');
}

function getBannerDesconto() {
  return DESCONTO_SEMANA > 0 ? `\n🔥 *PROMOÇÃO: ${DESCONTO_SEMANA}% DESCONTO EM TUDO!*\n` : '';
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
// RESPOSTA DE PERFUME — com descrição sensorial
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
    return `${emoji} *${p0.nome}*\n${banner}\n_${p0.notas}_\n\n💰 *Preço:*\n${formatPrecos(p0.preco)}\n\n📦 Entrega em Luanda incluída\n\nDesejas encomendar ou preferes saber mais sobre esta fragrância? 😊`;
  }

  let reply = `${emoji} *${nomeBase}*\n${banner}\n_${p0.notas}_\n\n💰 *Versões disponíveis:*\n`;
  versoes.forEach(p => { reply += `\n*${p.conc}:*\n${formatPrecos(p.preco)}\n`; });
  reply += `\nPrecisas de ajuda a escolher entre as versões? Posso explicar as diferenças! 😊\n📦 Entrega em Luanda incluída`;
  return reply;
}

// ===================================================
// PESQUISA DIRECTA
// ===================================================
function pesquisaDirecta(txtLow) {
  for (const [key, p] of Object.entries(CATALOGO)) {
    if (txtLow.includes(key)) return p.nomeBase;
  }
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
// PESQUISA FUZZY (Levenshtein)
// ===================================================
const FUZZY_INDEX = [];
const _v = new Set();
for (const p of Object.values(CATALOGO)) {
  if (_v.has(p.nomeBase)) continue;
  _v.add(p.nomeBase);
  const nb = normalizar(p.nomeBase);
  const palavras = nb.split(' ').filter(w => w.length > 1);
  const keywords = new Set([nb]);
  palavras.filter(w => w.length >= 2).forEach(w => keywords.add(w));
  FUZZY_INDEX.push({ nomeBase: p.nomeBase, keywords: [...keywords] });
}

function pesquisaFuzzy(msg) {
  const msgNorm = normalizar(msg);
  const palavrasMsg = msgNorm.split(' ').filter(w => w.length >= 1);
  let melhor = null, melhorScore = Infinity;
  for (const item of FUZZY_INDEX) {
    for (const keyword of item.keywords) {
      const kwP = keyword.split(' ').filter(w => w.length > 1);
      if (!kwP.length) continue;
      let total = 0, matched = 0;
      for (const kw of kwP) {
        if (kw.length < 2) { matched++; continue; }
        let minD = Infinity;
        for (const pm of palavrasMsg) {
          const d = levenshtein(kw, pm);
          const max = kw.length <= 2 ? 0 : kw.length <= 4 ? 1 : kw.length <= 7 ? 2 : 3;
          if (d <= max) minD = Math.min(minD, d);
        }
        if (minD < Infinity) { total += minD; matched++; }
      }
      if (matched === kwP.length && total < melhorScore) {
        melhorScore = total; melhor = item;
      }
    }
  }
  return melhor;
}

// ===================================================
// BOT PRINCIPAL — Consultor de Luxo Omnia Parfums
// ===================================================
const COMANDOS = new Set(['ola','oi','sim','nao','ok','bom','boa','dia','tarde','noite',
  'hello','hi','hey','boas','catalogo','masculinos','femininos','nicho','luxo',
  'encomendar','encomenda','entrega','envio','lista','todos','tudo','outro','outra',
  'ajuda','help','preco','precos','obrigado','obrigada','ate','tchau','xau']);

function isComando(n) {
  return /^(ola|oi|bom|boa|hello|hi|hey|boas|catalogo|todos|lista|masculin|feminin|nicho|luxo|encomendar|encomenda|entrega|envio|obrigad|ate|tchau|xau|ajuda|help)/.test(n);
}

function getBotReply(from, msg) {
  const txt = msg.trim();
  const txtLow = txt.toLowerCase();
  const txtNorm = normalizar(txt);

  // --- 1. Sessão activa ---
  const sessao = getSessao(from);
  if (sessao) {
    // Aguarda sim/não para sugestão de perfume
    if (sessao.tipo === 'confirmar_perfume') {
      if (/^(sim|s\b|yes|yep|claro|certo|isso|ok|quero|exato|confirm|é esse|esse mesmo)/.test(txtNorm)) {
        const nb = sessao.nomeBase;
        clearSessao(from);
        return respostaPerfume(nb) || `Hmm, não encontrei os detalhes para *${nb}*. Escreve *catálogo* para ver todos os perfumes disponíveis. 😊`;
      }
      if (/^(nao|n\b|no\b|nope|outro|outra|diferente|errado|negativo|nada disso)/.test(txtNorm)) {
        clearSessao(from);
        return `Sem problema! Podes descrever-me o perfume que procuras — ocasião, estilo, se preferes algo mais fresco ou intenso — e eu ajudo-te a encontrar o ideal. 😊`;
      }
      clearSessao(from);
    }
    // Aguarda sim/não para escalada humana
    if (sessao.tipo === 'confirmar_escalada') {
      if (/^(sim|s\b|yes|yep|claro|certo|ok|quero|confirm)/.test(txtNorm)) {
        clearSessao(from);
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          sendMessage(NUMERO_HUMANO, `🔔 *OMNIA PARFUMS — Pedido de atendimento*\n\n📱 Cliente: +${numLimpo}\n💬 Motivo: ${sessao.motivo || 'Pedido de atendimento humano'}\n📝 Contexto: ${sessao.contexto || 'Sem detalhes'}\n👆 https://wa.me/${numLimpo}\n🕐 ${new Date().toLocaleString('pt-PT')}`);
        }
        return `Perfeito! Já avisei a nossa equipa com os detalhes do teu pedido. Um colega entrará em contacto contigo em breve. 🖤\n\nEnquanto aguardas, se tiveres mais alguma dúvida sobre perfumes estou aqui!`;
      }
      if (/^(nao|n\b|no\b|nope|negativo)/.test(txtNorm)) {
        clearSessao(from);
        return `Claro, sem problema! Diz-me o que precisas e faço o meu melhor para te ajudar. 😊`;
      }
      clearSessao(from);
    }
  }

  // --- 2. Saudações ---
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|olá|boas)/.test(txtNorm)) {
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const banner = DESCONTO_SEMANA > 0 ? `\n\n🔥 *PROMOÇÃO ACTIVA: ${DESCONTO_SEMANA}% de desconto em todo o catálogo!*` : '';
    return `${saudacao}! Bem-vindo à *Omnia Parfums* 🖤${banner}\n\nSou o teu consultor de fragrâncias. Aqui encontras desde os grandes clássicos de designer até ao universo exclusivo das casas de nicho — tudo entregue em Luanda.\n\nComo posso ajudar-te hoje?\n• Procuras algo para ti ou para oferecer?\n• Preferes explorar o nosso *catálogo*?\n• Ou tens um perfume específico em mente?`;
  }

  // --- 3. Agradecimentos / Despedidas ---
  if (/^(obrigad|ate logo|tchau|xau|adeus|bye)/.test(txtNorm)) {
    return `Foi um prazer! Qualquer dúvida sobre fragrâncias estou sempre aqui. Até à próxima! 🖤`;
  }

  // --- 4. Pedido de falar com humano ---
  if (/falar com.*humano|falar com.*pessoa|atendente|humano|colega|responsavel|gerente/.test(txtNorm)) {
    setSessao(from, { tipo: 'confirmar_escalada', motivo: 'Pedido explícito do cliente', contexto: txt });
    return `Claro! Queres que avise um colega para continuar o atendimento? Responde *sim* ou *não*. 😊`;
  }

  // --- 5. Catálogo ---
  if (/catalogo|todos os perfumes|lista.*perfumes|ver tudo/.test(txtNorm)) {
    const masc = getNomesAgrupados('M');
    const fem = getNomesAgrupados('F');
    const uni = getNomesAgrupados('U');
    return `🖤 *Catálogo Omnia Parfums*${getBannerDesconto()}\n\n👔 *MASCULINOS (${masc.length})*\n${masc.join('\n')}\n\n👗 *FEMININOS (${fem.length})*\n${fem.join('\n')}\n\n✨ *NICHO & LUXO (${uni.length})*\n${uni.join('\n')}\n\n_Escreve o nome para ver versões, preços e descrição_ 💛`;
  }

  // --- 6. Por género ---
  if (/^(masculin|perfume.*homem|homem.*perfume|para.*ele\b|ele.*perfume)/.test(txtNorm)) {
    const lista = getNomesAgrupados('M');
    return `👔 *Perfumes Masculinos*${getBannerDesconto()}\n\n${lista.join('\n')}\n\nQual te desperta a curiosidade? Posso descrever qualquer um deles. 😊`;
  }

  if (/^(feminin|perfume.*mulher|mulher.*perfume|para.*ela\b|ela.*perfume)/.test(txtNorm)) {
    const lista = getNomesAgrupados('F');
    return `👗 *Perfumes Femininos*${getBannerDesconto()}\n\n${lista.join('\n')}\n\nQual te chama a atenção? Diz-me e conto-te tudo sobre ele! 😊`;
  }

  if (/^(nicho|luxo|exclusiv|premium|casas.*perfume)/.test(txtNorm)) {
    const lista = getNomesAgrupados('U');
    return `✨ *Nicho & Luxo*${getBannerDesconto()}\n\nO mundo do nicho é para quem quer mais do que um perfume — quer uma experiência.\n\n${lista.join('\n')}\n\nTens algum estilo ou nota olfativa preferida? Guio-te! 😊`;
  }

  // --- 7. Encomenda ---
  if (/encomendar|encomenda|quero comprar|como comprar|fazer.*pedido/.test(txtNorm)) {
    return `📦 *Fazer Encomenda*\n\nEnvia-nos:\n1️⃣ Nome do perfume\n2️⃣ Versão _(EDT / EDP / Parfum)_\n3️⃣ Tamanho _(ml)_\n4️⃣ O teu nome\n5️⃣ Morada de entrega em Luanda\n\nRespondemos em menos de 30 minutos! 💛\n_Pagamento: Transferência, Multicaixa Express ou à entrega_`;
  }

  // --- 8. Entrega ---
  if (/entrega|envio|como.*recebo|prazo/.test(txtNorm)) {
    return `📦 *Entregas Omnia Parfums*\n\n✅ Entrega em toda Luanda\n⏰ Prazo: 24 a 48 horas\n💰 Custo de entrega incluído no preço\n\nTens alguma dúvida sobre o processo? 😊`;
  }

  // --- 9. Descontos / negociação ---
  if (/desconto|preco.*melhor|mais barato|negoci|promo/.test(txtNorm)) {
    if (DESCONTO_SEMANA > 0) {
      return `🔥 Tens sorte — *temos ${DESCONTO_SEMANA}% de desconto activo* em todo o catálogo esta semana!\n\nOs preços já aparecem actualizados. Há algum perfume específico que queiras ver? 😊`;
    }
    return `Os nossos preços são fixos e reflectem a qualidade dos produtos. Se quiseres, posso avisar um colega para verificar se há alguma promoção activa para este produto. Queres que o faça? 😊`;
  }

  // --- 10. Perguntas sobre preços (protecção) ---
  if (/como.*calculou|margem|lucro|custo|fornecedor|quanto.*ganha/.test(txtNorm)) {
    return `O preço reflecte a qualidade e autenticidade do produto, bem como todos os custos envolvidos para te fazer chegar uma fragrância genuína. Não partilho detalhes sobre formação de preços — mas posso ajudar-te a encontrar a melhor opção para o teu orçamento! 😊`;
  }

  // --- 11. Sugestão por ocasião/perfil ---
  if (/suger|recomendar|aconselh|ajuda.*escolher|nao sei.*que|qual.*perfume|perfume.*para|presente/.test(txtNorm)) {
    return `Adoro ajudar a encontrar o perfume certo! 😊\n\nDuas perguntas rápidas:\n1️⃣ É para ti ou para oferecer a alguém?\n2️⃣ Preferes algo *mais fresco e leve* ou *mais intenso e sensual*?\n\nCom isso já consigo fazer sugestões certeiras! 🖤`;
  }

  // --- 12. EDT vs EDP / perguntas técnicas ---
  if (/diferenca|edt.*edp|edp.*edt|concentracao|durar|dura.*mais|quanto.*dura/.test(txtNorm)) {
    return `Boa pergunta! Aqui vai a diferença essencial:\n\n*EDT* — mais fresco, dura 3-5h. Ideal para o dia a dia e clima quente de Luanda.\n\n*EDP* — mais intenso e duradouro, 5-8h. Perfeito para noite ou ocasiões especiais.\n\n*Parfum/Extrait* — a forma mais pura. Dura 8h ou mais. Para quem quer impacto máximo.\n\nQual delas se encaixa melhor no teu estilo? 😊`;
  }

  // --- 13. Sazonalidade / clima ---
  if (/verao|verao|calor|inverno|noite|dia|trabalho|festa|casamento|ocasiao|quotidiano|casual/.test(txtNorm)) {
    return `Para o clima quente de Angola, no dia a dia recomendo fragrâncias *frescas e aquáticas* — como Acqua di Giò, Bleu de Chanel EDT ou Dior Sauvage EDT.\n\nPara noite ou ocasiões especiais, os *orientais e amadeirados* fazem toda a diferença — Baccarat Rouge, Tom Ford Black Orchid, 1 Million.\n\nTens alguma ocasião específica em mente? Ajudo-te a escolher! 😊`;
  }

  // --- 14. Fora do âmbito ---
  if (/advogado|medico|politica|economia|emprego|hotel|restaurante|viagem|investimento/.test(txtNorm)) {
    if (NUMERO_HUMANO) {
      const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
      sendMessage(NUMERO_HUMANO, `⚠️ *OMNIA — Fuga ao âmbito*\n\n📱 +${numLimpo}\n💬 Mensagem: "${txt}"\n📝 Nota: Conversa encerrada por fuga ao âmbito\n🕐 ${new Date().toLocaleString('pt-PT')}`);
    }
    return `Agradeço a confiança, mas o meu foco é exclusivamente o mundo das fragrâncias — não estou preparado para ajudar com esse tipo de questão.\n\nSe precisares de algo sobre perfumes, estarei sempre aqui. Bom dia! 🖤`;
  }

  // --- 15. Pesquisa directa no catálogo ---
  const directa = pesquisaDirecta(txtLow);
  if (directa) return respostaPerfume(directa);

  // --- 16. Pesquisa fuzzy ---
  const palavrasFiltradas = txtNorm.split(' ').filter(w => !COMANDOS.has(w) && w.length > 1);
  if (!isComando(txtNorm) && palavrasFiltradas.length > 0) {
    const fuzzy = pesquisaFuzzy(palavrasFiltradas.join(' '));
    if (fuzzy) {
      setSessao(from, { tipo: 'confirmar_perfume', nomeBase: fuzzy.nomeBase });
      return `Hmm, estarás a pensar no *${fuzzy.nomeBase}*? 🤔\n\nResponde *sim* ou *não* 😊`;
    }
  }

  // --- 17. Escalada ---
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
    console.error('Erro ao enviar:', e.response?.data || e.message);
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
      // Resposta elegante + escalada
      await sendMessage(from, `Hmm, não tenho essa informação de momento. 🤔\n\nPodes tentar:\n• Escrever o nome do perfume _(ex: Sauvage, Chance, Libre)_\n• Escrever *catálogo* para ver todos\n• Descrever o que procuras e eu sugiro!\n\nOu preferes que avise um colega? _(responde *sim* ou *não*)_`);
      setSessao(from, { tipo: 'confirmar_escalada', motivo: 'Bot não encontrou resposta', contexto: text });
    }
  } catch(e) { console.error('Erro webhook:', e.message); }
});

app.get('/webhook', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send(`🖤 Omnia Parfums Bot v7 — ${Object.keys(CATALOGO).length} entradas | Desconto: ${DESCONTO_SEMANA}%`));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot v7 Omnia Parfums — ${Object.keys(CATALOGO).length} perfumes | Desconto: ${DESCONTO_SEMANA}%`));
