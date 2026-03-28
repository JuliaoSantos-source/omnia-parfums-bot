const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://evolution-api-production-e0f4.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'omnia-parfums';
const NUMERO_HUMANO = process.env.NUMERO_HUMANO || '244930300694@s.whatsapp.net';

// ===================================================
// DESCONTO GLOBAL — muda esta variavel no Railway
// Ex: DESCONTO_SEMANA=10  → 10% desconto em tudo
//     DESCONTO_SEMANA=0   → sem desconto
// ===================================================
const DESCONTO_SEMANA = parseFloat(process.env.DESCONTO_SEMANA || '0');

// ===================================================
// CATALOGO OMNIA PARFUMS — 133 perfumes
// EDT, EDP, Parfum e Elixir separados com precos proprios
// Para adicionar: copia uma linha e ajusta os valores
// Para alterar precos: edita os valores em Kz
// ===================================================
const CATALOGO = {
  'dior sauvage edt': { nome: 'Dior Sauvage EDT', genero: 'M', conc: 'EDT', preco: {'60ml': 203700, '100ml': 263300, '200ml': 333800}, notas: 'Bergamota, Ambroxan, Pimenta Rosa' },
  'dior sauvage edp': { nome: 'Dior Sauvage EDP', genero: 'M', conc: 'EDP', preco: {'60ml': 247600, '100ml': 294600, '200ml': 373000}, notas: 'Bergamota, Lavanda, Baunilha' },
  'dior sauvage parfum': { nome: 'Dior Sauvage Parfum', genero: 'M', conc: 'Parfum', preco: {'60ml': 318100}, notas: 'Bergamota, Sândalo, Baunilha' },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', genero: 'M', conc: 'Extrait', preco: {'60ml': 344800}, notas: 'Cardamomo, Lavanda, Patchouli' },
  'dior j\'adore edp': { nome: 'Dior J\'adore EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 192800, '50ml': 231900, '100ml': 302500, '150ml': 380800}, notas: 'Magnólia, Rosa, Jasmim' },
  'dior miss dior edp': { nome: 'Dior Miss Dior EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 188100, '50ml': 228800, '100ml': 294600}, notas: 'Peónia, Rosa, Patchouli' },
  'dior miss dior parfum': { nome: 'Dior Miss Dior Parfum', genero: 'F', conc: 'Parfum', preco: {'35ml': 208400, '80ml': 297800}, notas: 'Rosa de Grasse, Almíscar Branco' },
  'dior homme intense edp': { nome: 'Dior Homme Intense EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 216300, '100ml': 282100}, notas: 'Íris, Cedro, Âmbar' },
  'bleu de chanel edt': { nome: 'Bleu de Chanel EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 231900, '100ml': 294600, '150ml': 380800}, notas: 'Citrus, Incenso, Sândalo' },
  'bleu de chanel edp': { nome: 'Bleu de Chanel EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 260200, '100ml': 344800, '150ml': 432500}, notas: 'Citrus, Noz-moscada, Sândalo' },
  'bleu de chanel parfum': { nome: 'Bleu de Chanel Parfum', genero: 'M', conc: 'Parfum', preco: {'50ml': 315000, '100ml': 410600}, notas: 'Citrus, Bétula, Âmbar' },
  'chanel coco mademoiselle edp': { nome: 'Chanel Coco Mademoiselle EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 272700, '100ml': 369800, '150ml': 454400}, notas: 'Bergamota, Rosa, Patchouli' },
  'chanel coco mademoiselle intense': { nome: 'Chanel Coco Mademoiselle Intense', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 402700}, notas: 'Bergamota, Rosa, Vetiver' },
  'chanel n°5 edp': { nome: 'Chanel N°5 EDP', genero: 'F', conc: 'EDP', preco: {'35ml': 216300, '50ml': 277400, '100ml': 380800}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar' },
  'chanel chance edp': { nome: 'Chanel Chance EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 272700, '100ml': 368300}, notas: 'Cítrico, Rosa, Almíscar Branco' },
  'chanel chance eau tendre edp': { nome: 'Chanel Chance Eau Tendre EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 272700, '100ml': 368300}, notas: 'Toranja, Quéssia, Almíscar Branco' },
  'ysl black opium edp': { nome: 'YSL Black Opium EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 183400, '50ml': 228800, '90ml': 283700, '150ml': 380800}, notas: 'Café, Baunilha, Patchouli, Flor Branca' },
  'ysl black opium parfum': { nome: 'YSL Black Opium Parfum', genero: 'F', conc: 'Parfum', preco: {'50ml': 266400}, notas: 'Café Intenso, Açafrão, Âmbar' },
  'ysl libre edp': { nome: 'YSL Libre EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 191200, '50ml': 238200, '90ml': 302500}, notas: 'Lavanda, Flor de Laranjeira, Cedro' },
  'ysl libre parfum': { nome: 'YSL Libre Parfum', genero: 'F', conc: 'Parfum', preco: {'50ml': 277400}, notas: 'Lavanda Africana, Âmbar, Baunilha' },
  'ysl y edp': { nome: 'YSL Y EDP', genero: 'M', conc: 'EDP', preco: {'60ml': 228800, '100ml': 294600, '200ml': 383900}, notas: 'Bergamota, Gengibre, Cedro' },
  'ysl y parfum': { nome: 'YSL Y Parfum', genero: 'M', conc: 'Parfum', preco: {'60ml': 266400}, notas: 'Bergamota, Coriandro, Vetiver' },
  'ysl l\'homme edp': { nome: 'YSL L\'Homme EDP', genero: 'M', conc: 'EDP', preco: {'60ml': 222500, '100ml': 282100}, notas: 'Bergamota, Cedro, Âmbar' },
  'rabanne 1 million edt': { nome: 'Rabanne 1 Million EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 205300, '100ml': 261700, '200ml': 347900}, notas: 'Mandarina, Canela, Âmbar, Couro' },
  'rabanne 1 million edp': { nome: 'Rabanne 1 Million EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 222500, '100ml': 283700}, notas: 'Toranja, Canela, Couro, Patchouli' },
  'rabanne 1 million parfum': { nome: 'Rabanne 1 Million Parfum', genero: 'M', conc: 'Parfum', preco: {'50ml': 239800, '100ml': 313400}, notas: 'Tonka, Baunilha, Salgado' },
  'rabanne invictus edt': { nome: 'Rabanne Invictus EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 189600, '100ml': 244500, '200ml': 329100}, notas: 'Toranja, Louro, Âmbar' },
  'rabanne invictus edp': { nome: 'Rabanne Invictus EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 211600, '100ml': 272700}, notas: 'Louro, Patchouli, Âmbar, Madeira' },
  'rabanne invictus parfum': { nome: 'Rabanne Invictus Parfum', genero: 'M', conc: 'Parfum', preco: {'50ml': 227200, '100ml': 305600}, notas: 'Madeira, Âmbar, Musk' },
  'rabanne phantom edt': { nome: 'Rabanne Phantom EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 194300, '100ml': 250700}, notas: 'Limão, Lavanda, Vetiver' },
  'rabanne fame edp': { nome: 'Rabanne Fame EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 180200, '50ml': 217800, '80ml': 277400}, notas: 'Mandarina, Jasmim, Patchouli' },
  'armani acqua di giò edt': { nome: 'Armani Acqua di Giò EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 189600, '100ml': 244500, '200ml': 324400}, notas: 'Citrus, Alga Marinha, Patchouli' },
  'armani acqua di giò edp': { nome: 'Armani Acqua di Giò EDP', genero: 'M', conc: 'EDP', preco: {'75ml': 255400, '125ml': 319700}, notas: 'Bergamota, Incenso, Patchouli' },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', genero: 'M', conc: 'Parfum', preco: {'75ml': 280500, '125ml': 352600}, notas: 'Incenso, Madeira, Cipreste' },
  'armani sì edp': { nome: 'Armani Sì EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 183400, '50ml': 228800, '100ml': 294600}, notas: 'Groselha, Rosa, Almíscar, Âmbar' },
  'armani sì passione edp': { nome: 'Armani Sì Passione EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 238200, '100ml': 308700}, notas: 'Bergamota, Rosa, Baunilha' },
  'lancôme la vie est belle edp': { nome: 'Lancôme La Vie est Belle EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 161400, '50ml': 195900, '75ml': 217800, '100ml': 239800, '150ml': 272700, '200ml': 421500}, notas: 'Íris, Pralinê, Baunilha' },
  'lancôme idôle edp': { nome: 'Lancôme Idôle EDP', genero: 'F', conc: 'EDP', preco: {'25ml': 158300, '50ml': 206900, '100ml': 271100}, notas: 'Rosa de Grasse, Almíscar, Âmbar' },
  'lancôme trésor edp': { nome: 'Lancôme Trésor EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 153600, '50ml': 189600, '100ml': 250700}, notas: 'Pêssego, Rosa, Almíscar, Âmbar' },
  'versace eros edt': { nome: 'Versace Eros EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 183400, '100ml': 238200, '200ml': 315000}, notas: 'Menta, Tonka, Âmbar' },
  'versace eros edp': { nome: 'Versace Eros EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 205300, '100ml': 266400}, notas: 'Bergamota, Néroli, Fava de Tonka' },
  'versace eros parfum': { nome: 'Versace Eros Parfum', genero: 'M', conc: 'Parfum', preco: {'50ml': 233500}, notas: 'Lichia, Néroli, Âmbar, Vetiver' },
  'versace eros flame edp': { nome: 'Versace Eros Flame EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 194300, '100ml': 255400}, notas: 'Toranja, Romã, Patchouli' },
  'versace bright crystal edt': { nome: 'Versace Bright Crystal EDT', genero: 'F', conc: 'EDT', preco: {'30ml': 147300, '50ml': 180200, '90ml': 228800}, notas: 'Romã, Peónia, Almíscar' },
  'versace dylan blue pour femme edp': { nome: 'Versace Dylan Blue Pour Femme EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 186500, '100ml': 244500}, notas: 'Groselha, Peónia, Âmbar Branco' },
  'hugo boss bottled edt': { nome: 'Hugo Boss Bottled EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 164600, '100ml': 205300}, notas: 'Maçã, Madeira de Sândalo, Cedro' },
  'hugo boss bottled edp': { nome: 'Hugo Boss Bottled EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 183400, '100ml': 233500}, notas: 'Maçã, Lavanda, Sândalo' },
  'hugo boss the scent edt': { nome: 'Hugo Boss The Scent EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 172400, '100ml': 217800}, notas: 'Gengibre, Osmanthus, Couro' },
  'hugo boss the scent for her edp': { nome: 'Hugo Boss The Scent For Her EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 150500, '50ml': 186500}, notas: 'Framboesa, Osmanthus, Âmbar' },
  'narciso rodriguez for her edp': { nome: 'Narciso Rodriguez For Her EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 161400, '50ml': 205300, '100ml': 266400}, notas: 'Rosa, Almíscar, Âmbar' },
  'narciso rodriguez musc noir rose edp': { nome: 'Narciso Rodriguez Musc Noir Rose EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 172400, '50ml': 217800}, notas: 'Rosa, Almíscar Negro, Sândalo' },
  'issey miyake l\'eau d\'issey h edt': { nome: 'Issey Miyake L\'Eau d\'Issey H EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 167700, '100ml': 211600}, notas: 'Yuzu, Coriandro, Almíscar' },
  'issey miyake l\'eau d\'issey h edp': { nome: 'Issey Miyake L\'Eau d\'Issey H EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 189600}, notas: 'Yuzu, Cedro, Âmbar' },
  'issey miyake l\'eau d\'issey f edp': { nome: 'Issey Miyake L\'Eau d\'Issey F EDP', genero: 'F', conc: 'EDP', preco: {'25ml': 142600, '50ml': 180200}, notas: 'Lótus, Peónia, Cedro' },
  'calvin klein ck one edt': { nome: 'Calvin Klein CK One EDT', genero: 'U', conc: 'EDT', preco: {'50ml': 131700, '100ml': 158300, '200ml': 186500}, notas: 'Bergamota, Chá Verde, Almíscar' },
  'calvin klein eternity edp': { nome: 'Calvin Klein Eternity EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 136400, '50ml': 167700, '100ml': 211600}, notas: 'Orquídea, Almíscar, Sândalo' },
  'calvin klein obsession edp': { nome: 'Calvin Klein Obsession EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 172400, '100ml': 217800}, notas: 'Especiarias, Almíscar, Baunilha' },
  'tom ford oud wood edp': { nome: 'Tom Ford Oud Wood EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 410600, '100ml': 589200}, notas: 'Oud, Sândalo, Vetiver' },
  'tom ford black orchid edp': { nome: 'Tom Ford Black Orchid EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 358900, '100ml': 498300}, notas: 'Trufa, Orquídea Preta, Patchouli' },
  'tom ford tobacco vanille edp': { nome: 'Tom Ford Tobacco Vanille EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 612700, '100ml': 866500}, notas: 'Tabaco, Baunilha, Madeira de Cedro' },
  'tom ford neroli portofino edp': { nome: 'Tom Ford Neroli Portofino EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 548400}, notas: 'Bergamota, Néroli, Âmbar' },
  'tom ford lost cherry edp': { nome: 'Tom Ford Lost Cherry EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 608000}, notas: 'Cereja, Âmbar, Baunilha' },
  'tom ford rose prick edp': { nome: 'Tom Ford Rose Prick EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 608000}, notas: 'Rosa, Pimenta, Fava de Tonka' },
  'guerlain mon guerlain edp': { nome: 'Guerlain Mon Guerlain EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 180200, '50ml': 228800, '100ml': 302500}, notas: 'Lavanda, Baunilha, Almíscar' },
  'guerlain l\'homme idéal edt': { nome: 'Guerlain L\'Homme Idéal EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 186500}, notas: 'Amêndoa, Lavanda, Couro' },
  'guerlain l\'homme idéal edp': { nome: 'Guerlain L\'Homme Idéal EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 206900}, notas: 'Amêndoa, Vetiver, Âmbar' },
  'guerlain la petite robe noire edp': { nome: 'Guerlain La Petite Robe Noire EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 167700, '50ml': 211600, '100ml': 277400}, notas: 'Bergamota, Rosa, Alcaçuz, Patchouli' },
  'mugler angel edp': { nome: 'Mugler Angel EDP', genero: 'F', conc: 'EDP', preco: {'25ml': 167700, '50ml': 222500, '100ml': 294600}, notas: 'Caramelo, Patchouli, Baunilha' },
  'mugler angel nova edp': { nome: 'Mugler Angel Nova EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 228800}, notas: 'Lavanda, Pralinê, Almíscar' },
  'mugler alien edp': { nome: 'Mugler Alien EDP', genero: 'F', conc: 'EDP', preco: {'30ml': 180200, '60ml': 239800}, notas: 'Jasmim, Âmbar Branco, Madeira de Caxemira' },
  'mugler a*men edt': { nome: 'Mugler A*Men EDT', genero: 'M', conc: 'EDT', preco: {'50ml': 189600}, notas: 'Café, Patchouli, Âmbar' },
  'mugler a*men parfum': { nome: 'Mugler A*Men Parfum', genero: 'M', conc: 'Parfum', preco: {'50ml': 233500}, notas: 'Café, Patchouli, Baunilha, Âmbar' },
  'mancera cedrat boise': { nome: 'Mancera Cedrat Boise', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Limão, Cassis, Vetiver, Cedro' },
  'mancera instant crush': { nome: 'Mancera Instant Crush', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Laranja, Rosa, Baunilha, Âmbar' },
  'mancera roses vanille': { nome: 'Mancera Roses Vanille', genero: 'F', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Rosa, Baunilha, Patchouli' },
  'mancera red tobacco': { nome: 'Mancera Red Tobacco', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Tabaco, Rosa, Especiarias, Âmbar' },
  'mancera amore caffè': { nome: 'Mancera Amore Caffè', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Café, Baunilha, Patchouli' },
  'mancera french riviera': { nome: 'Mancera French Riviera', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Bergamota, Cedro, Âmbar Branco' },
  'mancera tonka cola': { nome: 'Mancera Tonka Cola', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Tonka, Cola, Baunilha' },
  'mancera coco vanille': { nome: 'Mancera Coco Vanille', genero: 'F', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Coco, Baunilha, Almíscar' },
  'mancera sicily': { nome: 'Mancera Sicily', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Limão Siciliano, Bergamota, Néroli' },
  'mancera black gold': { nome: 'Mancera Black Gold', genero: 'M', conc: 'EDP', preco: {'60ml': 294600, '120ml': 412100}, notas: 'Oud, Baunilha, Âmbar, Sândalo' },
  'mancera wild fruits': { nome: 'Mancera Wild Fruits', genero: 'U', conc: 'EDP', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Frutas Silvestres, Rosa, Âmbar' },
  'montale arabians tonka': { nome: 'Montale Arabians Tonka', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Açafrão, Oud, Rosa, Tonka' },
  'montale roses musk': { nome: 'Montale Roses Musk', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Almíscar, Âmbar' },
  'montale intense café': { nome: 'Montale Intense Café', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Café, Baunilha, Âmbar' },
  'montale black aoud': { nome: 'Montale Black Aoud', genero: 'M', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Oud, Rosa, Patchouli, Vetiver' },
  'montale dark aoud': { nome: 'Montale Dark Aoud', genero: 'M', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Oud, Sândalo, Almíscar Negro' },
  'montale amber musk': { nome: 'Montale Amber Musk', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'montale starry nights': { nome: 'Montale Starry Nights', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa Selvagem, Violeta, Açafrão' },
  'montale vanilla cake': { nome: 'Montale Vanilla Cake', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Baunilha, Leite, Caramelo' },
  'montale rose elixir': { nome: 'Montale Rose Elixir', genero: 'F', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Almíscar, Vetiver' },
  'montale sensual instinct': { nome: 'Montale Sensual Instinct', genero: 'U', conc: 'EDP', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Açafrão, Oud, Patchouli' },
  'creed aventus': { nome: 'Creed Aventus', genero: 'M', conc: 'EDP', preco: {'50ml': 664200, '100ml': 928100}, notas: 'Bergamota, Groselha Preta, Bétula, Almíscar' },
  'creed aventus for her': { nome: 'Creed Aventus for Her', genero: 'F', conc: 'EDP', preco: {'50ml': 604600, '75ml': 723800}, notas: 'Bergamota, Rosa, Baunilha' },
  'creed green irish tweed': { nome: 'Creed Green Irish Tweed', genero: 'M', conc: 'EDT', preco: {'50ml': 579000, '100ml': 826000}, notas: 'Íris, Sândalo, Âmbar' },
  'creed millesime imperial': { nome: 'Creed Millesime Imperial', genero: 'U', conc: 'EDP', preco: {'50ml': 579000, '100ml': 826000}, notas: 'Bergamota, Alga, Almíscar' },
  'parfums de marly layton': { nome: 'Parfums de Marly Layton', genero: 'M', conc: 'EDP', preco: {'75ml': 510900, '125ml': 664200}, notas: 'Maçã, Lavanda, Baunilha, Sândalo' },
  'parfums de marly layton exclusif': { nome: 'Parfums de Marly Layton Exclusif', genero: 'M', conc: 'EDP', preco: {'75ml': 562000}, notas: 'Maçã, Lavanda, Noz-moscada, Sândalo' },
  'parfums de marly delina': { nome: 'Parfums de Marly Delina', genero: 'F', conc: 'EDP', preco: {'75ml': 493900, '125ml': 638600}, notas: 'Rhubarbo, Peónia, Rosa de Maio' },
  'parfums de marly delina exclusif': { nome: 'Parfums de Marly Delina Exclusif', genero: 'F', conc: 'EDP', preco: {'75ml': 562000}, notas: 'Rhubarbo, Peónia, Rosa, Almíscar' },
  'parfums de marly pegasus': { nome: 'Parfums de Marly Pegasus', genero: 'M', conc: 'EDP', preco: {'75ml': 493900, '125ml': 638600}, notas: 'Lavanda, Almendra, Baunilha, Sândalo' },
  'parfums de marly percival': { nome: 'Parfums de Marly Percival', genero: 'M', conc: 'EDP', preco: {'75ml': 493900}, notas: 'Bergamota, Lavanda, Almíscar' },
  'parfums de marly cassili': { nome: 'Parfums de Marly Cassili', genero: 'F', conc: 'EDP', preco: {'75ml': 493900}, notas: 'Rosa, Almíscar, Sândalo' },
  'nishane hacivat': { nome: 'Nishane Hacivat', genero: 'U', conc: 'Extrait', preco: {'50ml': 345700, '100ml': 464900}, notas: 'Bergamota, Abacaxi, Cedro, Patchouli' },
  'nishane ani': { nome: 'Nishane Ani', genero: 'U', conc: 'Extrait', preco: {'50ml': 345700}, notas: 'Flor de Laranjeira, Almíscar, Âmbar' },
  'nishane zenne': { nome: 'Nishane Zenne', genero: 'U', conc: 'Extrait', preco: {'50ml': 345700}, notas: 'Rosa, Oud, Âmbar' },
  'nishane afrika olifant': { nome: 'Nishane Afrika Olifant', genero: 'U', conc: 'Extrait', preco: {'50ml': 362700}, notas: 'Âmbar, Vetiver, Patchouli' },
  'initio oud for greatness': { nome: 'Initio Oud for Greatness', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Oud, Almíscar, Especiarias, Âmbar' },
  'initio atomic rose': { nome: 'Initio Atomic Rose', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Rosa, Almíscar, Âmbar' },
  'initio black gold': { nome: 'Initio Black Gold', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Sândalp, Âmbar, Almíscar' },
  'initio rehab': { nome: 'Initio Rehab', genero: 'U', conc: 'EDP', preco: {'90ml': 536400}, notas: 'Baunilha, Almíscar, Patchouli' },
  'xerjoff nio': { nome: 'Xerjoff Nio', genero: 'U', conc: 'EDP', preco: {'50ml': 391700, '100ml': 533000}, notas: 'Yuzu, Menta, Madeira' },
  'xerjoff oud stars alexandria ii': { nome: 'Xerjoff Oud Stars Alexandria II', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Oud, Sândalo, Rosa' },
  'mfk baccarat rouge 540 edp': { nome: 'MFK Baccarat Rouge 540 EDP', genero: 'U', conc: 'EDP', preco: {'70ml': 655700}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk baccarat rouge 540 extrait': { nome: 'MFK Baccarat Rouge 540 Extrait', genero: 'U', conc: 'Extrait', preco: {'70ml': 766400}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk 724 edp': { nome: 'MFK 724 EDP', genero: 'U', conc: 'EDP', preco: {'70ml': 562000}, notas: 'Bergamota, Lentisco, Almíscar' },
  'mfk grand soir edp': { nome: 'MFK Grand Soir EDP', genero: 'U', conc: 'EDP', preco: {'70ml': 562000}, notas: 'Âmbar, Baunilha, Almíscar' },
  'mfk gentle fluidity gold edp': { nome: 'MFK Gentle Fluidity Gold EDP', genero: 'U', conc: 'EDP', preco: {'70ml': 562000}, notas: 'Noz-moscada, Âmbar, Baunilha' },
  'by kilian angels share edp': { nome: 'By Kilian Angels Share EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Conhaque, Baunilha, Canela, Âmbar' },
  'by kilian love don\'t be shy edp': { nome: 'By Kilian Love Don\'t Be Shy EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Néroli, Caramelo, Almíscar' },
  'by kilian good girl gone bad edp': { nome: 'By Kilian Good Girl Gone Bad EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Ylang, Magnólia, Rosa, Íris' },
  'amouage reflection man edp': { nome: 'Amouage Reflection Man EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 519400, '100ml': 689700}, notas: 'Alecrim, Íris, Sândalo' },
  'amouage interlude man edp': { nome: 'Amouage Interlude Man EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 519400}, notas: 'Incenso, Âmbar, Orégão' },
  'amouage memoir man edp': { nome: 'Amouage Memoir Man EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 519400}, notas: 'Absinto, Incenso, Âmbar' },
  'amouage gold woman edp': { nome: 'Amouage Gold Woman EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 519400}, notas: 'Rosa, Jasmim, Incenso, Âmbar' },
  'frederic malle portrait of a lady edp': { nome: 'Frederic Malle Portrait of a Lady EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 567100, '100ml': 754400}, notas: 'Rosa, Patchouli, Sândalo, Âmbar' },
  'frederic malle musc ravageur edp': { nome: 'Frederic Malle Musc Ravageur EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'frederic malle cologne indelebile edp': { nome: 'Frederic Malle Cologne Indelebile EDP', genero: 'U', conc: 'EDP', preco: {'50ml': 545000}, notas: 'Almíscar, Néroli, Jasmim' },
  'roja dove enigma edp': { nome: 'Roja Dove Enigma EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Bergamota, Rosa, Incenso, Âmbar' },
  'roja dove elysium edp': { nome: 'Roja Dove Elysium EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Bergamota, Lavanda, Sândalo' },
  'roja dove danger edp': { nome: 'Roja Dove Danger EDP', genero: 'M', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Cabeça: Cítrico, Coração: Rosa, Fundo: Âmbar' },
  'roja dove scandal edp': { nome: 'Roja Dove Scandal EDP', genero: 'F', conc: 'EDP', preco: {'50ml': 885600}, notas: 'Aldeídos, Rosa, Âmbar' },};

// Aplica desconto ao preco
function aplicaDesconto(kz) {
  if (DESCONTO_SEMANA <= 0) return kz;
  return Math.round(kz * (1 - DESCONTO_SEMANA / 100) / 100) * 100;
}

function formatPrecos(preco) {
  return Object.entries(preco)
    .map(([ml, kz]) => {
      const kzFinal = aplicaDesconto(kz);
      if (DESCONTO_SEMANA > 0) {
        return `  - ${ml}: ~~${kz.toLocaleString('pt-PT')}~~ *${kzFinal.toLocaleString('pt-PT')} Kz* 🔥`;
      }
      return `  - ${ml}: ${kzFinal.toLocaleString('pt-PT')} Kz`;
    })
    .join('\n');
}

function getBannerDesconto() {
  if (DESCONTO_SEMANA <= 0) return '';
  return `\n\n🔥 *PROMOÇÃO ACTIVA: ${DESCONTO_SEMANA}% de desconto em todo o catálogo!*`;
}

// Agrupa versoes do mesmo perfume base (ex: Dior Sauvage EDT + EDP + Parfum)
function getNomesAgrupados(genero) {
  const nomesBase = {};
  Object.values(CATALOGO)
    .filter(p => p.genero === genero)
    .forEach(p => {
      // Nome base sem concentração
      const nomeBase = p.nome
        .replace(/ EDT$/, '').replace(/ EDP$/, '')
        .replace(/ Parfum$/, '').replace(/ Elixir$/, '')
        .replace(/ Extrait$/, '').trim();
      if (!nomesBase[nomeBase]) nomesBase[nomeBase] = [];
      nomesBase[nomeBase].push(p.conc);
    });
  return Object.entries(nomesBase)
    .map(([base, concs]) => `• ${base} _(${concs.join(' / ')})_`);
}

function getBotReply(msg) {
  const txt = msg.toLowerCase().trim();

  // Saudacoes
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|olá|boas)/.test(txt)) {
    const totalM = new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>p.nome.replace(/ (EDT|EDP|Parfum|Elixir|Extrait)$/,''))).size;
    const totalF = new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>p.nome.replace(/ (EDT|EDP|Parfum|Elixir|Extrait)$/,''))).size;
    const totalU = new Set(Object.values(CATALOGO).filter(p=>p.genero==='U').map(p=>p.nome.replace(/ (EDT|EDP|Parfum|Elixir|Extrait)$/,''))).size;
    const banner = DESCONTO_SEMANA > 0 ? `\n\n🔥 *PROMOÇÃO: ${DESCONTO_SEMANA}% DE DESCONTO EM TUDO ESTA SEMANA!*` : '';
    return `🖤 *Bem-vindo à Omnia Parfums!*\n\nSomos a tua perfumaria de confiança em Luanda. 🇦🇴${banner}\n\nTemos *${totalM + totalF + totalU}+ perfumes*:\n👔 ${totalM} Masculinos · 👗 ${totalF} Femininos · ✨ ${totalU} Nicho/Unissexo\n\nPodes:\n- Escrever o nome de um perfume (ex: *Sauvage* ou *Sauvage EDP*)\n- Escrever *masculinos* · *femininos* · *nicho*\n- Escrever *catálogo* para ver todos\n- Escrever *encomendar* para fazer pedido\n\n_Entrega em Luanda incluída_ 📦`;
  }

  // Catalogo completo
  if (/cat.logo|todos|lista|ver tudo/.test(txt)) {
    const masc = getNomesAgrupados('M');
    const fem = getNomesAgrupados('F');
    const uni = getNomesAgrupados('U');
    const banner = getBannerDesconto();
    return `🖤 *Catálogo Omnia Parfums*${banner}\n\n👔 *MASCULINOS (${masc.length})*\n${masc.join('\n')}\n\n👗 *FEMININOS (${fem.length})*\n${fem.join('\n')}\n\n✨ *NICHO & LUXO (${uni.length})*\n${uni.join('\n')}\n\n_Escreve o nome para ver EDT/EDP/Parfum e preços_ 💛`;
  }

  // Masculinos
  if (/^masculin|^homem|para ele/.test(txt)) {
    const lista = getNomesAgrupados('M');
    const banner = getBannerDesconto();
    return `👔 *Perfumes Masculinos — Omnia Parfums*${banner}\n\n${lista.join('\n')}\n\n_Escreve o nome para ver versões e preços_ 💛`;
  }

  // Femininos
  if (/^feminin|^mulher|para ela/.test(txt)) {
    const lista = getNomesAgrupados('F');
    const banner = getBannerDesconto();
    return `👗 *Perfumes Femininos — Omnia Parfums*${banner}\n\n${lista.join('\n')}\n\n_Escreve o nome para ver versões e preços_ 💛`;
  }

  // Nicho
  if (/nicho|luxo|exclusivo|premium/.test(txt)) {
    const lista = getNomesAgrupados('U');
    const banner = getBannerDesconto();
    return `✨ *Perfumes Nicho & Luxo — Omnia Parfums*${banner}\n\n${lista.join('\n')}\n\n_Escreve o nome para ver versões e preços_ 💛`;
  }

  // Encomendar
  if (/encomendar|encomenda|comprar|quero|pedido/.test(txt)) {
    return `📦 *Fazer Encomenda*\n\nEnvia-nos:\n1️⃣ Nome do perfume\n2️⃣ Versão (EDT / EDP / Parfum)\n3️⃣ Tamanho (ml)\n4️⃣ O teu nome\n5️⃣ Morada de entrega em Luanda\n\n💛 Respondemos em menos de 30 minutos!\n\n_Pagamento: Transferência, Multicaixa Express ou à entrega_`;
  }

  // Entrega
  if (/entrega|envio/.test(txt)) {
    return `📦 *Entregas Omnia Parfums*\n\n✅ Entrega em toda Luanda\n⏰ Prazo: 24-48 horas\n💰 Entrega incluída no preço\n\n_Encomenda mínima: 1 frasco_`;
  }

  // Procura exacta primeiro (ex: "sauvage edp")
  for (const [key, produto] of Object.entries(CATALOGO)) {
    if (txt.includes(key)) {
      const emoji = produto.genero==='M' ? '👔' : produto.genero==='F' ? '👗' : '✨';
      const banner = getBannerDesconto();
      return `${emoji} *${produto.nome}* _(${produto.conc})_${banner}\n\n🌸 Notas: ${produto.notas}\n\n💰 *Preços:*\n${formatPrecos(produto.preco)}\n\n📦 Entrega em Luanda incluída\n\n_Para encomendar, escreve *encomendar*_ 🖤`;
    }
  }

  // Procura por nome base (ex: "sauvage" mostra todas as versoes)
  const matches = [];
  const nomesBaseVistos = new Set();
  for (const [key, produto] of Object.entries(CATALOGO)) {
    const nomeBase = produto.nome.replace(/ (EDT|EDP|Parfum|Elixir|Extrait)$/, '').toLowerCase();
    if (txt.includes(nomeBase) && !nomesBaseVistos.has(nomeBase)) {
      // Encontrou pelo nome base — mostra todas as versoes
      const versoes = Object.entries(CATALOGO).filter(([k, p]) =>
        p.nome.replace(/ (EDT|EDP|Parfum|Elixir|Extrait)$/, '').toLowerCase() === nomeBase && p.precos && Object.keys(p.precos).length > 0
      );
      if (versoes.length > 0) {
        nomesBaseVistos.add(nomeBase);
        const emoji = produto.genero==='M' ? '👔' : produto.genero==='F' ? '👗' : '✨';
        const banner = getBannerDesconto();
        let reply = `${emoji} *${produto.nome.replace(/ (EDT|EDP|Parfum|Elixir|Extrait)$/, '')}*${banner}\n\n🌸 Notas: ${produto.notas}\n\n💰 *Versões disponíveis:*\n`;
        versoes.forEach(([k, p]) => {
          reply += `\n*${p.conc}:*\n${formatPrecos(p.preco)}\n`;
        });
        reply += `\n📦 Entrega em Luanda incluída\n_Para encomendar, escreve *encomendar*_ 🖤`;
        matches.push(reply);
      }
    }
  }
  if (matches.length > 0) return matches[0];

  // Nao encontrou — escalada para humano
  return null;
}

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
    const reply = getBotReply(text);
    if (reply) {
      await sendMessage(from, reply);
    } else {
      await sendMessage(from, `🖤 *Omnia Parfums*\n\nObrigado pela mensagem! Não encontrei esse perfume mas um atendente responde em breve. ⏳\n\nEscreve *catálogo* para ver todos os perfumes disponíveis.`);
      if (NUMERO_HUMANO) {
        await sendMessage(NUMERO_HUMANO, `⚠️ *Cliente sem resposta automática*\n\nNúmero: ${from}\nMensagem: "${text}"\n\n_Responde directamente ao cliente._`);
      }
    }
  } catch(e) { console.error('Erro:', e.message); }
});

app.get('/webhook', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send(`🖤 Omnia Parfums Bot v3 — ${Object.keys(CATALOGO).length} entradas | Desconto: ${DESCONTO_SEMANA}%`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot v3 activo — ${Object.keys(CATALOGO).length} perfumes | Desconto: ${DESCONTO_SEMANA}%`));
