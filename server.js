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
// CATÁLOGO — 133 perfumes
// ===================================================
const CATALOGO = {
  'dior sauvage edt': { nome: 'Dior Sauvage EDT', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'60ml': 160300, '100ml': 193400, '200ml': 272000}, notas: 'Bergamota, Ambroxan, Pimenta Rosa' },
  'dior sauvage edp': { nome: 'Dior Sauvage EDP', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDP', familia: 'Oriental Fougère', nicho: false, preco: {'60ml': 177600, '100ml': 212200, '200ml': 294000}, notas: 'Bergamota, Lavanda, Baunilha' },
  'dior sauvage parfum': { nome: 'Dior Sauvage Parfum', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'Parfum', familia: 'Oriental Aromático', nicho: false, preco: {'60ml': 220100}, notas: 'Bergamota, Sândalo, Baunilha' },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', nomeBase: 'Dior Sauvage Elixir', genero: 'M', conc: 'Extrait', familia: 'Especiado Aromático', nicho: false, preco: {'60ml': 243700}, notas: 'Cardamomo, Lavanda, Patchouli' },
  'dior j\'adore edp': { nome: 'Dior J\'adore EDP', nomeBase: 'Dior J\'adore', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'30ml': 130500, '50ml': 163500, '100ml': 212200, '150ml': 272000}, notas: 'Magnólia, Rosa, Jasmim' },
  'dior miss dior edp': { nome: 'Dior Miss Dior EDP', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'EDP', familia: 'Floral Aromático', nicho: false, preco: {'30ml': 128900, '50ml': 160300, '100ml': 209100}, notas: 'Peónia, Rosa, Patchouli' },
  'dior miss dior parfum': { nome: 'Dior Miss Dior Parfum', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'Parfum', familia: 'Floral', nicho: false, preco: {'35ml': 144600, '80ml': 212200}, notas: 'Rosa de Grasse, Almíscar Branco' },
  'dior homme intense edp': { nome: 'Dior Homme Intense EDP', nomeBase: 'Dior Homme Intense', genero: 'M', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'50ml': 150900, '100ml': 199600}, notas: 'Íris, Cedro, Âmbar' },
  'bleu de chanel edt': { nome: 'Bleu de Chanel EDT', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 161900, '100ml': 209100, '150ml': 272000}, notas: 'Citrus, Incenso, Sândalo' },
  'bleu de chanel edp': { nome: 'Bleu de Chanel EDP', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 183900, '100ml': 246800, '150ml': 311300}, notas: 'Citrus, Noz-moscada, Sândalo' },
  'bleu de chanel parfum': { nome: 'Bleu de Chanel Parfum', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 224800, '100ml': 294000}, notas: 'Citrus, Bétula, Âmbar' },
  'chanel coco mademoiselle edp': { nome: 'Chanel Coco Mademoiselle EDP', nomeBase: 'Chanel Coco Mademoiselle', genero: 'F', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'50ml': 193400, '100ml': 264100, '150ml': 327000}, notas: 'Bergamota, Rosa, Patchouli' },
  'chanel coco mademoiselle intense': { nome: 'Chanel Coco Mademoiselle Intense', nomeBase: 'Chanel Coco Mademoiselle Intense', genero: 'F', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'50ml': 215400, '100ml': 289200}, notas: 'Bergamota, Rosa, Vetiver' },
  'chanel n°5 edp': { nome: 'Chanel N°5 EDP', nomeBase: 'Chanel N°5', genero: 'F', conc: 'EDP', familia: 'Floral Aldéidico', nicho: false, preco: {'35ml': 150900, '50ml': 196500, '100ml': 272000}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar' },
  'chanel chance edp': { nome: 'Chanel Chance EDP', nomeBase: 'Chanel Chance', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'50ml': 191800, '100ml': 262500}, notas: 'Cítrico, Rosa, Almíscar Branco' },
  'chanel chance eau tendre edp': { nome: 'Chanel Chance Eau Tendre EDP', nomeBase: 'Chanel Chance Eau Tendre', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'50ml': 191800, '100ml': 262500}, notas: 'Toranja, Quéssia, Almíscar Branco' },
  'ysl black opium edp': { nome: 'YSL Black Opium EDP', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 127300, '50ml': 160300, '90ml': 201200, '150ml': 273500}, notas: 'Café, Baunilha, Patchouli, Flor Branca' },
  'ysl black opium parfum': { nome: 'YSL Black Opium Parfum', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'Parfum', familia: 'Floral Gourmand', nicho: false, preco: {'50ml': 188600}, notas: 'Café Intenso, Açafrão, Âmbar' },
  'ysl libre edp': { nome: 'YSL Libre EDP', nomeBase: 'YSL Libre', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 132000, '50ml': 166600, '90ml': 215400}, notas: 'Lavanda, Flor de Laranjeira, Cedro' },
  'ysl libre parfum': { nome: 'YSL Libre Parfum', nomeBase: 'YSL Libre', genero: 'F', conc: 'Parfum', familia: 'Floral Amadeirado', nicho: false, preco: {'50ml': 196500}, notas: 'Lavanda Africana, Âmbar, Baunilha' },
  'ysl y edp': { nome: 'YSL Y EDP', nomeBase: 'YSL Y', genero: 'M', conc: 'EDP', familia: 'Fougère Amadeirado', nicho: false, preco: {'60ml': 160300, '100ml': 209100, '200ml': 276700}, notas: 'Bergamota, Gengibre, Cedro' },
  'ysl y parfum': { nome: 'YSL Y Parfum', nomeBase: 'YSL Y', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Especiado', nicho: false, preco: {'60ml': 188600}, notas: 'Bergamota, Coriandro, Vetiver' },
  'ysl l\'homme edp': { nome: 'YSL L\'Homme EDP', nomeBase: 'YSL L\'Homme', genero: 'M', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: false, preco: {'60ml': 155600, '100ml': 199600}, notas: 'Bergamota, Cedro, Âmbar' },
  'rabanne 1 million edt': { nome: 'Rabanne 1 Million EDT', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDT', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 143100, '100ml': 185500, '200ml': 248400}, notas: 'Mandarina, Canela, Âmbar, Couro' },
  'rabanne 1 million edp': { nome: 'Rabanne 1 Million EDP', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 155600, '100ml': 201200}, notas: 'Toranja, Canela, Couro, Patchouli' },
  'rabanne 1 million parfum': { nome: 'Rabanne 1 Million Parfum', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'Parfum', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 168200, '100ml': 223200}, notas: 'Tonka, Baunilha, Salgado' },
  'rabanne invictus edt': { nome: 'Rabanne Invictus EDT', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDT', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 132000, '100ml': 171300, '200ml': 234200}, notas: 'Toranja, Louro, Âmbar' },
  'rabanne invictus edp': { nome: 'Rabanne Invictus EDP', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDP', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 147800, '100ml': 193400}, notas: 'Louro, Patchouli, Âmbar, Madeira' },
  'rabanne invictus parfum': { nome: 'Rabanne Invictus Parfum', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 158800, '100ml': 216900}, notas: 'Madeira, Âmbar, Musk' },
  'rabanne phantom edt': { nome: 'Rabanne Phantom EDT', nomeBase: 'Rabanne Phantom', genero: 'M', conc: 'EDT', familia: 'Lavanda Amadeirado', nicho: false, preco: {'50ml': 135200, '100ml': 176100}, notas: 'Limão, Lavanda, Vetiver' },
  'rabanne fame edp': { nome: 'Rabanne Fame EDP', nomeBase: 'Rabanne Fame', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 124200, '50ml': 152500, '80ml': 196500}, notas: 'Mandarina, Jasmim, Patchouli' },
  'armani acqua di giò edt': { nome: 'Armani Acqua di Giò EDT', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDT', familia: 'Aquático', nicho: false, preco: {'50ml': 132000, '100ml': 171300, '200ml': 231100}, notas: 'Citrus, Alga Marinha, Patchouli' },
  'armani acqua di giò edp': { nome: 'Armani Acqua di Giò EDP', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDP', familia: 'Aquático Aromático', nicho: false, preco: {'75ml': 179200, '125ml': 227900}, notas: 'Bergamota, Incenso, Patchouli' },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', nomeBase: 'Armani Acqua di Giò Profumo', genero: 'M', conc: 'Parfum', familia: 'Aquático Aromático', nicho: false, preco: {'75ml': 199600, '125ml': 251500}, notas: 'Incenso, Madeira, Cipreste' },
  'armani sì edp': { nome: 'Armani Sì EDP', nomeBase: 'Armani Sì', genero: 'F', conc: 'EDP', familia: 'Floral Chypre', nicho: false, preco: {'30ml': 127300, '50ml': 160300, '100ml': 209100}, notas: 'Groselha, Rosa, Almíscar, Âmbar' },
  'armani sì passione edp': { nome: 'Armani Sì Passione EDP', nomeBase: 'Armani Sì Passione', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'50ml': 166600, '100ml': 220100}, notas: 'Bergamota, Rosa, Baunilha' },
  'lancôme la vie est belle edp': { nome: 'Lancôme La Vie est Belle EDP', nomeBase: 'Lancôme La Vie est Belle', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 110000, '50ml': 136800, '75ml': 152500, '100ml': 168200, '150ml': 193400, '200ml': 303400}, notas: 'Íris, Pralinê, Baunilha' },
  'lancôme idôle edp': { nome: 'Lancôme Idôle EDP', nomeBase: 'Lancôme Idôle', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'25ml': 106900, '50ml': 144600, '100ml': 191800}, notas: 'Rosa de Grasse, Almíscar, Âmbar' },
  'lancôme trésor edp': { nome: 'Lancôme Trésor EDP', nomeBase: 'Lancôme Trésor', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 103800, '50ml': 132000, '100ml': 176100}, notas: 'Pêssego, Rosa, Almíscar, Âmbar' },
  'versace eros edt': { nome: 'Versace Eros EDT', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDT', familia: 'Aromático Fougère', nicho: false, preco: {'50ml': 127300, '100ml': 166600, '200ml': 224800}, notas: 'Menta, Tonka, Âmbar' },
  'versace eros edp': { nome: 'Versace Eros EDP', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDP', familia: 'Aromático Oriental', nicho: false, preco: {'50ml': 143100, '100ml': 188600}, notas: 'Bergamota, Néroli, Fava de Tonka' },
  'versace eros parfum': { nome: 'Versace Eros Parfum', nomeBase: 'Versace Eros', genero: 'M', conc: 'Parfum', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 163500}, notas: 'Lichia, Néroli, Âmbar, Vetiver' },
  'versace eros flame edp': { nome: 'Versace Eros Flame EDP', nomeBase: 'Versace Eros Flame', genero: 'M', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 135200, '100ml': 179200}, notas: 'Toranja, Romã, Patchouli' },
  'versace bright crystal edt': { nome: 'Versace Bright Crystal EDT', nomeBase: 'Versace Bright Crystal', genero: 'F', conc: 'EDT', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 99000, '50ml': 124200, '90ml': 160300}, notas: 'Romã, Peónia, Almíscar' },
  'versace dylan blue pour femme edp': { nome: 'Versace Dylan Blue Pour Femme EDP', nomeBase: 'Versace Dylan Blue Pour Femme', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'50ml': 128900, '100ml': 171300}, notas: 'Groselha, Peónia, Âmbar Branco' },
  'hugo boss bottled edt': { nome: 'Hugo Boss Bottled EDT', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDT', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 113200, '100ml': 143100}, notas: 'Maçã, Madeira de Sândalo, Cedro' },
  'hugo boss bottled edp': { nome: 'Hugo Boss Bottled EDP', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 127300, '100ml': 163500}, notas: 'Maçã, Lavanda, Sândalo' },
  'hugo boss the scent edt': { nome: 'Hugo Boss The Scent EDT', nomeBase: 'Hugo Boss The Scent', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 119500, '100ml': 152500}, notas: 'Gengibre, Osmanthus, Couro' },
  'hugo boss the scent for her edp': { nome: 'Hugo Boss The Scent For Her EDP', nomeBase: 'Hugo Boss The Scent For Her', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 103800, '50ml': 128900}, notas: 'Framboesa, Osmanthus, Âmbar' },
  'narciso rodriguez for her edp': { nome: 'Narciso Rodriguez For Her EDP', nomeBase: 'Narciso Rodriguez For Her', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 110000, '50ml': 143100, '100ml': 188600}, notas: 'Rosa, Almíscar, Âmbar' },
  'narciso rodriguez musc noir rose edp': { nome: 'Narciso Rodriguez Musc Noir Rose EDP', nomeBase: 'Narciso Rodriguez Musc Noir Rose', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 119500, '50ml': 152500}, notas: 'Rosa, Almíscar Negro, Sândalo' },
  'issey miyake l\'eau d\'issey h edt': { nome: 'Issey Miyake L\'Eau d\'Issey H EDT', nomeBase: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', conc: 'EDT', familia: 'Aquático', nicho: false, preco: {'50ml': 116300, '100ml': 147800}, notas: 'Yuzu, Coriandro, Almíscar' },
  'issey miyake l\'eau d\'issey h edp': { nome: 'Issey Miyake L\'Eau d\'Issey H EDP', nomeBase: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', conc: 'EDP', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 132000}, notas: 'Yuzu, Cedro, Âmbar' },
  'issey miyake l\'eau d\'issey f edp': { nome: 'Issey Miyake L\'Eau d\'Issey F EDP', nomeBase: 'Issey Miyake L\'Eau d\'Issey F', genero: 'F', conc: 'EDP', familia: 'Floral Aquático', nicho: false, preco: {'25ml': 97500, '50ml': 124200}, notas: 'Lótus, Peónia, Cedro' },
  'calvin klein ck one edt': { nome: 'Calvin Klein CK One EDT', nomeBase: 'Calvin Klein CK One', genero: 'U', conc: 'EDT', familia: 'Cítrico Aquático', nicho: false, preco: {'50ml': 88000, '100ml': 106900, '200ml': 128900}, notas: 'Bergamota, Chá Verde, Almíscar' },
  'calvin klein eternity edp': { nome: 'Calvin Klein Eternity EDP', nomeBase: 'Calvin Klein Eternity', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'30ml': 91200, '50ml': 116300, '100ml': 147800}, notas: 'Orquídea, Almíscar, Sândalo' },
  'calvin klein obsession edp': { nome: 'Calvin Klein Obsession EDP', nomeBase: 'Calvin Klein Obsession', genero: 'F', conc: 'EDP', familia: 'Oriental', nicho: false, preco: {'50ml': 119500, '100ml': 152500}, notas: 'Especiarias, Almíscar, Baunilha' },
  'tom ford oud wood edp': { nome: 'Tom Ford Oud Wood EDP', nomeBase: 'Tom Ford Oud Wood', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: false, preco: {'50ml': 295500, '100ml': 426000}, notas: 'Oud, Sândalo, Vetiver' },
  'tom ford black orchid edp': { nome: 'Tom Ford Black Orchid EDP', nomeBase: 'Tom Ford Black Orchid', genero: 'U', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'50ml': 257800, '100ml': 360000}, notas: 'Trufa, Orquídea Preta, Patchouli' },
  'tom ford tobacco vanille edp': { nome: 'Tom Ford Tobacco Vanille EDP', nomeBase: 'Tom Ford Tobacco Vanille', genero: 'U', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 444900, '100ml': 631900}, notas: 'Tabaco, Baunilha, Madeira de Cedro' },
  'tom ford neroli portofino edp': { nome: 'Tom Ford Neroli Portofino EDP', nomeBase: 'Tom Ford Neroli Portofino', genero: 'U', conc: 'EDP', familia: 'Cítrico Floral', nicho: false, preco: {'50ml': 397700}, notas: 'Bergamota, Néroli, Âmbar' },
  'tom ford lost cherry edp': { nome: 'Tom Ford Lost Cherry EDP', nomeBase: 'Tom Ford Lost Cherry', genero: 'U', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'50ml': 441700}, notas: 'Cereja, Âmbar, Baunilha' },
  'tom ford rose prick edp': { nome: 'Tom Ford Rose Prick EDP', nomeBase: 'Tom Ford Rose Prick', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'50ml': 441700}, notas: 'Rosa, Pimenta, Fava de Tonka' },
  'guerlain mon guerlain edp': { nome: 'Guerlain Mon Guerlain EDP', nomeBase: 'Guerlain Mon Guerlain', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 124200, '50ml': 160300, '100ml': 215400}, notas: 'Lavanda, Baunilha, Almíscar' },
  'guerlain l\'homme idéal edt': { nome: 'Guerlain L\'Homme Idéal EDT', nomeBase: 'Guerlain L\'Homme Idéal', genero: 'M', conc: 'EDT', familia: 'Fougère Aromático', nicho: false, preco: {'50ml': 128900}, notas: 'Amêndoa, Lavanda, Couro' },
  'guerlain l\'homme idéal edp': { nome: 'Guerlain L\'Homme Idéal EDP', nomeBase: 'Guerlain L\'Homme Idéal', genero: 'M', conc: 'EDP', familia: 'Fougère Oriental', nicho: false, preco: {'50ml': 144600}, notas: 'Amêndoa, Vetiver, Âmbar' },
  'guerlain la petite robe noire edp': { nome: 'Guerlain La Petite Robe Noire EDP', nomeBase: 'Guerlain La Petite Robe Noire', genero: 'F', conc: 'EDP', familia: 'Floral Frutal Gourmand', nicho: false, preco: {'30ml': 116300, '50ml': 147800, '100ml': 196500}, notas: 'Bergamota, Rosa, Alcaçuz, Patchouli' },
  'mugler angel edp': { nome: 'Mugler Angel EDP', nomeBase: 'Mugler Angel', genero: 'F', conc: 'EDP', familia: 'Oriental Gourmand', nicho: false, preco: {'25ml': 116300, '50ml': 155600, '100ml': 209100}, notas: 'Caramelo, Patchouli, Baunilha' },
  'mugler angel nova edp': { nome: 'Mugler Angel Nova EDP', nomeBase: 'Mugler Angel Nova', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'50ml': 160300}, notas: 'Lavanda, Pralinê, Almíscar' },
  'mugler alien edp': { nome: 'Mugler Alien EDP', nomeBase: 'Mugler Alien', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 124200, '60ml': 168200}, notas: 'Jasmim, Âmbar Branco, Madeira de Caxemira' },
  'mugler a*men edt': { nome: 'Mugler A*Men EDT', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'EDT', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 132000}, notas: 'Café, Patchouli, Âmbar' },
  'mugler a*men parfum': { nome: 'Mugler A*Men Parfum', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'Parfum', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 163500}, notas: 'Café, Patchouli, Baunilha, Âmbar' },
  'mancera cedrat boise': { nome: 'Mancera Cedrat Boise', nomeBase: 'Mancera Cedrat Boise', genero: 'U', conc: 'EDP', familia: 'Cítrico Amadeirado', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Limão, Cassis, Vetiver, Cedro' },
  'mancera instant crush': { nome: 'Mancera Instant Crush', nomeBase: 'Mancera Instant Crush', genero: 'U', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Laranja, Rosa, Baunilha, Âmbar' },
  'mancera roses vanille': { nome: 'Mancera Roses Vanille', nomeBase: 'Mancera Roses Vanille', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Rosa, Baunilha, Patchouli' },
  'mancera red tobacco': { nome: 'Mancera Red Tobacco', nomeBase: 'Mancera Red Tobacco', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Tabaco, Rosa, Especiarias, Âmbar' },
  'mancera amore caffè': { nome: 'Mancera Amore Caffè', nomeBase: 'Mancera Amore Caffè', genero: 'U', conc: 'EDP', familia: 'Gourmand Oriental', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Café, Baunilha, Patchouli' },
  'mancera french riviera': { nome: 'Mancera French Riviera', nomeBase: 'Mancera French Riviera', genero: 'U', conc: 'EDP', familia: 'Cítrico Marinho', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Bergamota, Cedro, Âmbar Branco' },
  'mancera tonka cola': { nome: 'Mancera Tonka Cola', nomeBase: 'Mancera Tonka Cola', genero: 'U', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Tonka, Cola, Baunilha' },
  'mancera coco vanille': { nome: 'Mancera Coco Vanille', nomeBase: 'Mancera Coco Vanille', genero: 'F', conc: 'EDP', familia: 'Gourmand Floral', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Coco, Baunilha, Almíscar' },
  'mancera sicily': { nome: 'Mancera Sicily', nomeBase: 'Mancera Sicily', genero: 'U', conc: 'EDP', familia: 'Cítrico Floral', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Limão Siciliano, Bergamota, Néroli' },
  'mancera black gold': { nome: 'Mancera Black Gold', nomeBase: 'Mancera Black Gold', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'60ml': 255400, '120ml': 357600}, notas: 'Oud, Baunilha, Âmbar, Sândalo' },
  'mancera wild fruits': { nome: 'Mancera Wild Fruits', nomeBase: 'Mancera Wild Fruits', genero: 'U', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Frutas Silvestres, Rosa, Âmbar' },
  'montale arabians tonka': { nome: 'Montale Arabians Tonka', nomeBase: 'Montale Arabians Tonka', genero: 'U', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Açafrão, Oud, Rosa, Tonka' },
  'montale roses musk': { nome: 'Montale Roses Musk', nomeBase: 'Montale Roses Musk', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Almíscar, Âmbar' },
  'montale intense café': { nome: 'Montale Intense Café', nomeBase: 'Montale Intense Café', genero: 'U', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Café, Baunilha, Âmbar' },
  'montale black aoud': { nome: 'Montale Black Aoud', nomeBase: 'Montale Black Aoud', genero: 'M', conc: 'EDP', familia: 'Amadeirado Floral', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Oud, Rosa, Patchouli, Vetiver' },
  'montale dark aoud': { nome: 'Montale Dark Aoud', nomeBase: 'Montale Dark Aoud', genero: 'M', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Oud, Sândalo, Almíscar Negro' },
  'montale amber musk': { nome: 'Montale Amber Musk', nomeBase: 'Montale Amber Musk', genero: 'U', conc: 'EDP', familia: 'Almíscar Âmbar', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Âmbar, Almíscar, Baunilha' },
  'montale starry nights': { nome: 'Montale Starry Nights', nomeBase: 'Montale Starry Nights', genero: 'U', conc: 'EDP', familia: 'Oriental Floral', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa Selvagem, Violeta, Açafrão' },
  'montale vanilla cake': { nome: 'Montale Vanilla Cake', nomeBase: 'Montale Vanilla Cake', genero: 'F', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Baunilha, Leite, Caramelo' },
  'montale rose elixir': { nome: 'Montale Rose Elixir', nomeBase: 'Montale Rose Elixir', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Almíscar, Vetiver' },
  'montale sensual instinct': { nome: 'Montale Sensual Instinct', nomeBase: 'Montale Sensual Instinct', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Açafrão, Oud, Patchouli' },
  'creed aventus': { nome: 'Creed Aventus', nomeBase: 'Creed Aventus', genero: 'M', conc: 'EDP', familia: 'Frutal Chypre', nicho: true, preco: {'50ml': 664200, '100ml': 928100}, notas: 'Bergamota, Groselha Preta, Bétula, Almíscar' },
  'creed aventus for her': { nome: 'Creed Aventus for Her', nomeBase: 'Creed Aventus for Her', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'50ml': 604600, '75ml': 723800}, notas: 'Bergamota, Rosa, Baunilha' },
  'creed green irish tweed': { nome: 'Creed Green Irish Tweed', nomeBase: 'Creed Green Irish Tweed', genero: 'M', conc: 'EDT', familia: 'Fougère', nicho: true, preco: {'50ml': 579000, '100ml': 826000}, notas: 'Íris, Sândalo, Âmbar' },
  'creed millesime imperial': { nome: 'Creed Millesime Imperial', nomeBase: 'Creed Millesime Imperial', genero: 'U', conc: 'EDP', familia: 'Aquático', nicho: true, preco: {'50ml': 579000, '100ml': 826000}, notas: 'Bergamota, Alga, Almíscar' },
  'parfums de marly layton': { nome: 'Parfums de Marly Layton', nomeBase: 'Parfums de Marly Layton', genero: 'M', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'75ml': 510900, '125ml': 664200}, notas: 'Maçã, Lavanda, Baunilha, Sândalo' },
  'parfums de marly layton exclusif': { nome: 'Parfums de Marly Layton Exclusif', nomeBase: 'Parfums de Marly Layton Exclusif', genero: 'M', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'75ml': 562000}, notas: 'Maçã, Lavanda, Noz-moscada, Sândalo' },
  'parfums de marly delina': { nome: 'Parfums de Marly Delina', nomeBase: 'Parfums de Marly Delina', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'75ml': 493900, '125ml': 638600}, notas: 'Rhubarbo, Peónia, Rosa de Maio' },
  'parfums de marly delina exclusif': { nome: 'Parfums de Marly Delina Exclusif', nomeBase: 'Parfums de Marly Delina Exclusif', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'75ml': 562000}, notas: 'Rhubarbo, Peónia, Rosa, Almíscar' },
  'parfums de marly pegasus': { nome: 'Parfums de Marly Pegasus', nomeBase: 'Parfums de Marly Pegasus', genero: 'M', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'75ml': 493900, '125ml': 638600}, notas: 'Lavanda, Almendra, Baunilha, Sândalo' },
  'parfums de marly percival': { nome: 'Parfums de Marly Percival', nomeBase: 'Parfums de Marly Percival', genero: 'M', conc: 'EDP', familia: 'Fougère', nicho: true, preco: {'75ml': 493900}, notas: 'Bergamota, Lavanda, Almíscar' },
  'parfums de marly cassili': { nome: 'Parfums de Marly Cassili', nomeBase: 'Parfums de Marly Cassili', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'75ml': 493900}, notas: 'Rosa, Almíscar, Sândalo' },
  'nishane hacivat': { nome: 'Nishane Hacivat', nomeBase: 'Nishane Hacivat', genero: 'U', conc: 'Extrait', familia: 'Cítrico Amadeirado', nicho: true, preco: {'50ml': 345700, '100ml': 464900}, notas: 'Bergamota, Abacaxi, Cedro, Patchouli' },
  'nishane ani': { nome: 'Nishane Ani', nomeBase: 'Nishane Ani', genero: 'U', conc: 'Extrait', familia: 'Floral Almíscar', nicho: true, preco: {'50ml': 345700}, notas: 'Flor de Laranjeira, Almíscar, Âmbar' },
  'nishane zenne': { nome: 'Nishane Zenne', nomeBase: 'Nishane Zenne', genero: 'U', conc: 'Extrait', familia: 'Oriental Floral', nicho: true, preco: {'50ml': 345700}, notas: 'Rosa, Oud, Âmbar' },
  'nishane afrika olifant': { nome: 'Nishane Afrika Olifant', nomeBase: 'Nishane Afrika Olifant', genero: 'U', conc: 'Extrait', familia: 'Amadeirado Especiado', nicho: true, preco: {'50ml': 362700}, notas: 'Âmbar, Vetiver, Patchouli' },
  'initio oud for greatness': { nome: 'Initio Oud for Greatness', nomeBase: 'Initio Oud for Greatness', genero: 'U', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: true, preco: {'90ml': 536400}, notas: 'Oud, Almíscar, Especiarias, Âmbar' },
  'initio atomic rose': { nome: 'Initio Atomic Rose', nomeBase: 'Initio Atomic Rose', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'90ml': 536400}, notas: 'Rosa, Almíscar, Âmbar' },
  'initio black gold': { nome: 'Initio Black Gold', nomeBase: 'Initio Black Gold', genero: 'U', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'90ml': 536400}, notas: 'Sândalo, Âmbar, Almíscar' },
  'initio rehab': { nome: 'Initio Rehab', nomeBase: 'Initio Rehab', genero: 'U', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'90ml': 536400}, notas: 'Baunilha, Almíscar, Patchouli' },
  'xerjoff nio': { nome: 'Xerjoff Nio', nomeBase: 'Xerjoff Nio', genero: 'U', conc: 'EDP', familia: 'Cítrico Verde', nicho: true, preco: {'50ml': 391700, '100ml': 533000}, notas: 'Yuzu, Menta, Madeira' },
  'xerjoff oud stars alexandria ii': { nome: 'Xerjoff Oud Stars Alexandria II', nomeBase: 'Xerjoff Oud Stars Alexandria II', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'50ml': 545000}, notas: 'Oud, Sândalo, Rosa' },
  'mfk baccarat rouge 540 edp': { nome: 'MFK Baccarat Rouge 540 EDP', nomeBase: 'MFK Baccarat Rouge 540', genero: 'U', conc: 'EDP', familia: 'Floral Âmbar', nicho: true, preco: {'70ml': 655700}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk baccarat rouge 540 extrait': { nome: 'MFK Baccarat Rouge 540 Extrait', nomeBase: 'MFK Baccarat Rouge 540 Extrait', genero: 'U', conc: 'Extrait', familia: 'Floral Âmbar', nicho: true, preco: {'70ml': 766400}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk 724 edp': { nome: 'MFK 724 EDP', nomeBase: 'MFK 724', genero: 'U', conc: 'EDP', familia: 'Floral Amadeirado', nicho: true, preco: {'70ml': 562000}, notas: 'Bergamota, Lentisco, Almíscar' },
  'mfk grand soir edp': { nome: 'MFK Grand Soir EDP', nomeBase: 'MFK Grand Soir', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'70ml': 562000}, notas: 'Âmbar, Baunilha, Almíscar' },
  'mfk gentle fluidity gold edp': { nome: 'MFK Gentle Fluidity Gold EDP', nomeBase: 'MFK Gentle Fluidity Gold', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'70ml': 562000}, notas: 'Noz-moscada, Âmbar, Baunilha' },
  'by kilian angels share edp': { nome: 'By Kilian Angels Share EDP', nomeBase: 'By Kilian Angels Share', genero: 'U', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'50ml': 545000}, notas: 'Conhaque, Baunilha, Canela, Âmbar' },
  'by kilian love don\'t be shy edp': { nome: 'By Kilian Love Don\'t Be Shy EDP', nomeBase: 'By Kilian Love Don\'t Be Shy', genero: 'U', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'50ml': 545000}, notas: 'Néroli, Caramelo, Almíscar' },
  'by kilian good girl gone bad edp': { nome: 'By Kilian Good Girl Gone Bad EDP', nomeBase: 'By Kilian Good Girl Gone Bad', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 545000}, notas: 'Ylang, Magnólia, Rosa, Íris' },
  'amouage reflection man edp': { nome: 'Amouage Reflection Man EDP', nomeBase: 'Amouage Reflection Man', genero: 'M', conc: 'EDP', familia: 'Floral Aromático', nicho: true, preco: {'50ml': 519400, '100ml': 689700}, notas: 'Alecrim, Íris, Sândalo' },
  'amouage interlude man edp': { nome: 'Amouage Interlude Man EDP', nomeBase: 'Amouage Interlude Man', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: true, preco: {'50ml': 519400}, notas: 'Incenso, Âmbar, Orégão' },
  'amouage memoir man edp': { nome: 'Amouage Memoir Man EDP', nomeBase: 'Amouage Memoir Man', genero: 'M', conc: 'EDP', familia: 'Floral Amadeirado', nicho: true, preco: {'50ml': 519400}, notas: 'Absinto, Incenso, Âmbar' },
  'amouage gold woman edp': { nome: 'Amouage Gold Woman EDP', nomeBase: 'Amouage Gold Woman', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: true, preco: {'50ml': 519400}, notas: 'Rosa, Jasmim, Incenso, Âmbar' },
  'frederic malle portrait of a lady edp': { nome: 'Frederic Malle Portrait of a Lady EDP', nomeBase: 'Frederic Malle Portrait of a Lady', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: true, preco: {'50ml': 567100, '100ml': 754400}, notas: 'Rosa, Patchouli, Sândalo, Âmbar' },
  'frederic malle musc ravageur edp': { nome: 'Frederic Malle Musc Ravageur EDP', nomeBase: 'Frederic Malle Musc Ravageur', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'50ml': 545000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'frederic malle cologne indelebile edp': { nome: 'Frederic Malle Cologne Indelebile EDP', nomeBase: 'Frederic Malle Cologne Indelebile', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 545000}, notas: 'Almíscar, Néroli, Jasmim' },
  'roja dove enigma edp': { nome: 'Roja Dove Enigma EDP', nomeBase: 'Roja Dove Enigma', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'50ml': 885600}, notas: 'Bergamota, Rosa, Incenso, Âmbar' },
  'roja dove elysium edp': { nome: 'Roja Dove Elysium EDP', nomeBase: 'Roja Dove Elysium', genero: 'M', conc: 'EDP', familia: 'Fougère', nicho: true, preco: {'50ml': 885600}, notas: 'Bergamota, Lavanda, Sândalo' },
  'roja dove danger edp': { nome: 'Roja Dove Danger EDP', nomeBase: 'Roja Dove Danger', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: true, preco: {'50ml': 885600}, notas: 'Cítrico, Rosa, Âmbar' },
  'roja dove scandal edp': { nome: 'Roja Dove Scandal EDP', nomeBase: 'Roja Dove Scandal', genero: 'F', conc: 'EDP', familia: 'Floral Chypre', nicho: true, preco: {'50ml': 885600}, notas: 'Aldeídos, Rosa, Âmbar' },
};

// ===================================================
// DADOS BANCÁRIOS — OMNIA PARFUMS
// ===================================================
const DADOS_BANCARIOS = `🏦 *Dados para Pagamento — Omnia Parfums*

📱 *Multicaixa Express:* 925 553 281
🏛️ *Banco BCI*
👤 *Titular:* Julião dos Santos
💳 *Conta:* 10857171310001
🔢 *IBAN:* AO06 0005 0000 0857 1713 1011 5

_Após efectuar o pagamento, envie o comprovativo (foto ou PDF) aqui neste chat._`;

// ===================================================
// SESSÕES
// ===================================================
const SESSOES = {};
function getSessao(num) {
  const s = SESSOES[num];
  return (s && Date.now() - s.ts < 15 * 60 * 1000) ? s : null;
}
function setSessao(num, dados) { SESSOES[num] = { ...dados, ts: Date.now() }; }
function clearSessao(num) { delete SESSOES[num]; }
function updateSessao(num, dados) {
  const s = getSessao(num) || {};
  SESSOES[num] = { ...s, ...dados, ts: Date.now() };
}

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
    Array.from({length: n+1}, (_, j) => i===0 ? j : j===0 ? i : 0));
  for (let i=1; i<=m; i++) for (let j=1; j<=n; j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function aplicaDesconto(kz) {
  if (DESCONTO_SEMANA <= 0) return kz;
  return Math.round(kz * (1 - DESCONTO_SEMANA / 100) / 100) * 100;
}

function formatPrecos(preco) {
  if (!preco) return '';
  return Object.entries(preco).map(([ml, kz]) => {
    const f = aplicaDesconto(kz);
    return DESCONTO_SEMANA > 0
      ? ` • ${ml}: ~~${kz.toLocaleString('pt-PT')}~~ *${f.toLocaleString('pt-PT')} Kz* 🔥`
      : ` • ${ml}: ${f.toLocaleString('pt-PT')} Kz`;
  }).join('\n');
}

function precoMin(preco) {
  if (!preco) return 0;
  return Math.min(...Object.values(preco).map(aplicaDesconto));
}

function getBannerDesconto() {
  return DESCONTO_SEMANA > 0 ? `\n🔥 *PROMOÇÃO: ${DESCONTO_SEMANA}% de desconto em todo o catálogo!*\n` : '';
}

function getNomesAgrupados(genero, apenasNicho = false) {
  const map = {};
  Object.values(CATALOGO).filter(p => {
    if (apenasNicho) return p.nicho === true;
    return p.genero === genero && p.nicho === false;
  }).forEach(p => {
    if (!map[p.nomeBase]) map[p.nomeBase] = [];
    if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc);
  });
  return Object.entries(map).map(([base, concs]) => `• ${base} _(${concs.join(' / ')})`);
}

// ===================================================
// RESPOSTAS CONCEPTUAIS — FIX BUG 2
// Resposta directa e completa para cada família/termo
// ===================================================
const CONCEITOS = {
  floral: `As fragrâncias *florais* têm como alma flores — rosa, jasmim, peónia, íris, magnólia. São as mais usadas em perfumaria, especialmente feminina, mas há florais muito elegantes para qualquer género.

Existem florais frescos e aéreos (como o *Dior J'adore* ou *Chanel Chance*), florais com fundo quente e sensual (como o *YSL Black Opium*) e florais delicados para o dia (como o *Chanel Chance Eau Tendre*).

É uma família incrivelmente versátil — do uso diário a ocasiões especiais.

Tem interesse em explorar perfumes florais da nossa selecção?`,

  gourmand: `As fragrâncias *gourmand* evocam alimentos doces e quentes — baunilha, caramelo, chocolate, café, pralinê, mel. São envolventes, íntimas e difíceis de ignorar.

Não confunda com "doce de comer" — são sofisticadas. A pessoa que as usa tende sempre a ouvir: _"que cheiro tão bom, o que é isso?"_

Exemplos na nossa colecção: *Mugler Angel*, *YSL Black Opium*, *Lancôme La Vie est Belle*, *Mancera Instant Crush*, *By Kilian Angels Share*.

São perfeitas para noite, clima ameno e ocasiões especiais. Quer explorar alguma?`,

  oriental: `As fragrâncias *orientais* são quentes, sensuais e de grande profundidade. Combinam resinas, âmbar, especiarias, oud e madeiras exóticas. São marcantes, projectam-se bem e duram muitas horas na pele.

Ideais para noite, eventos especiais e clima mais fresco. Em Angola, brilham especialmente em ambientes fechados e à noite.

Exemplos: *Tom Ford Black Orchid*, *Dior Sauvage Parfum*, *Mancera Red Tobacco*, *MFK Grand Soir*.

Prefere algo mais suave ou algo verdadeiramente marcante?`,

  amadeirado: `Os perfumes *amadeirados* têm como alma madeiras nobres — sândalo, cedro, vetiver, patchouli, oud. São secos, elegantes e sofisticados.

Transmitem confiança e autoridade sem exagerar. São a escolha certa para ambientes profissionais, reuniões e qualquer contexto em que a elegância discreta seja valorizada.

Exemplos: *Bleu de Chanel*, *Tom Ford Oud Wood*, *Dior Sauvage EDT*, *Creed Green Irish Tweed*.

Tem alguma ocasião específica em mente?`,

  aquatico: `As fragrâncias *aquáticas* evocam o oceano, a maresia e a frescura natural. São leves, limpas e revigorantes.

Perfeitas para o clima quente de Angola, uso diário, trabalho e qualquer contexto em que a discrição elegante seja ideal.

Exemplos: *Armani Acqua di Giò EDT*, *Issey Miyake L'Eau d'Issey*, *Creed Millesime Imperial*.

Quer sugestões aquáticas para o dia a dia?`,

  citrico: `As fragrâncias *cítricas* têm base em bergamota, limão, toranja ou laranja. São frescas, energéticas e com impacto imediato.

Duram tipicamente menos tempo, mas têm uma abertura inconfundível. Ótimas para clima quente, manhãs e uso casual.

Exemplos: *Calvin Klein CK One*, *Mancera French Riviera*, *Mancera Sicily*, *Armani Acqua di Giò EDT*.

Quer explorar opções cítricas?`,

  fougere: `*Fougère* (pronuncia-se "fuzjér") significa "feto" em francês. É uma família clássica — fresca, herbal e aromática, combinando lavanda, musgo de carvalho e cumarina.

É o ADN de grandes clássicos masculinos. Exemplos: *Hugo Boss Bottled*, *Versace Eros EDT*, *Creed Green Irish Tweed*, *Roja Dove Elysium*.

É versátil — do trabalho à noite. Quer explorar?`,

  chypre: `As fragrâncias *chypre* têm como base musgo de carvalho, bergamota e patchouli. São sofisticadas, com personalidade forte e uma elegância atemporal.

Menos comuns hoje, mas muito apreciadas por quem quer algo distintivo. Exemplos: *Armani Sì*, *Creed Aventus for Her*, *Roja Dove Scandal*.

Tem interesse neste estilo mais elegante e distinto?`,

  sillage: `*Sillage* (pronuncia-se "siaj") é o rasto que o perfume deixa no ar quando passa — a "pegada" olfactiva.

Um sillage intenso significa que as pessoas à volta sentem o perfume mesmo após passar. Um sillage discreto é mais íntimo — só quem está muito perto consegue sentir.

Para Angola: no trabalho e clima quente, sillage moderado é mais elegante. Para noite e eventos, pode optar por algo mais projectante e marcante.`,

  edt: `*EDT* (Eau de Toilette) tem 5 a 15% de óleos aromáticos. É a forma mais leve e fresca.

Dura 4 a 6 horas na pele. Perfeita para o dia a dia, clima quente de Angola e escritório.

Exemplos EDT na nossa selecção: *Dior Sauvage EDT*, *Armani Acqua di Giò EDT*, *Versace Eros EDT*.`,

  edp: `*EDP* (Eau de Parfum) tem 15 a 20% de óleos aromáticos. Mais intensa e duradoura que a EDT.

Dura 6 a 8 horas. Versátil do dia para a noite — o equilíbrio perfeito entre presença e refinamento.

A maioria dos nossos perfumes existe em versão EDP, o que a torna a concentração mais popular da nossa selecção.`,

  parfum: `*Parfum* (ou Extrait de Parfum) tem 20 a 40% de concentração — a forma mais pura.

Dura 8 a 12 horas ou mais. Projecção intensa nas primeiras horas, depois torna-se mais íntima e sedutora.

Geralmente mais caro, mas uma aplicação mínima chega para todo o dia. Para ocasiões em que quer ser verdadeiramente inesquecível.

Temos disponíveis: *Dior Sauvage Parfum*, *Bleu de Chanel Parfum*, *YSL Libre Parfum*, entre outros.`,

  elixir: `*Elixir* é uma concentração ultra-elevada com fórmula reformulada — uma evolução do Extrait, pensada para máximo impacto e duração extraordinária.

Vai além do Parfum convencional — geralmente com uma fórmula completamente reimaginada, não apenas mais concentrada.

Na nossa selecção temos o *Dior Sauvage Elixir* — uma versão profunda, especiada e animal que vai muito além de qualquer outro Sauvage.

Tem interesse em saber mais?`,

  nicho: `*Perfumaria de nicho* é o universo das casas independentes e artesanais — Mancera, Creed, Montale, Amouage, Maison Francis Kurkdjian, By Kilian, Nishane, Roja Dove.

Ao contrário das grandes marcas de designer (Dior, Chanel, Armani), as casas de nicho produzem em menor quantidade, usam matérias-primas mais raras e criam fragrâncias com personalidade mais única e menos comercial.

Resultado: maior duração, maior exclusividade, e uma experiência mais pessoal e distinta. Para quem quer usar algo que muito poucas pessoas usam.

Quer explorar o nosso catálogo de nicho? Escreva *nicho* para ver a selecção completa.`,

  designer: `*Perfumaria de designer* engloba as grandes marcas de moda e luxo — Dior, Chanel, YSL, Armani, Versace, Hugo Boss, Rabanne.

Produzidos em grande escala, com fórmulas reconhecíveis, qualidade consistente e forte reconhecimento social. Quando entra numa sala com Dior Sauvage ou Chanel N°5, as pessoas reconhecem.

Geralmente mais acessíveis que o nicho e ideais para quem quer qualidade com reconhecimento social imediato.`,

  edt_edp: `A diferença está na concentração de óleos aromáticos:\n\n*EDT* (Eau de Toilette): 5–15%. Leve e fresca. Dura 4 a 6 horas. Ideal para o dia a dia e clima quente.\n\n*EDP* (Eau de Parfum): 15–20%. Mais intensa e duradoura. Dura 6 a 8 horas. Versátil para dia e noite.\n\n*Parfum / Extrait*: 20–40%. Forma mais pura. Dura 8 a 12 horas ou mais.\n\n*Elixir*: Concentração ultra-elevada com fórmula reformulada. Duração máxima.\n\nPara Angola: EDT para o dia a dia e calor, EDP para ocasiões e noite. Tem algum perfume específico em mente?`,

  nicho_designer: `Nenhum é melhor — são universos diferentes:\n\n*Designer* (Chanel, Dior, Armani...): grande escala, fórmulas reconhecíveis, qualidade consistente, forte reconhecimento social.\n\n*Nicho* (Mancera, Creed, Montale...): produção limitada, matérias-primas raras, maior exclusividade e duração. Para quem quer algo diferente do que toda a gente usa.\n\nDepende do que procura — reconhecimento, exclusividade ou orçamento. Posso ajudá-lo a escolher?`,
};

// ===================================================
// DETECTAR PERGUNTA CONCEPTUAL — FIX BUG 2
// Responde directamente, sem loop
// ===================================================
function detectarConceito(txtNorm) {
  // Padrões de pergunta
  const ehPergunta = /o que e|o que sao|o que significa|o que quer dizer|explica|define|como funciona|diferenca entre|o que.*familia|como.*chama|que.*tipo|o que.*nota|o que.*perfume.*floral|o que.*perfume.*gourmand|o que.*perfume.*oriental|o que.*perfume.*amadeirado|o que.*perfume.*aquatico|o que.*perfume.*citrico|o que.*perfume.*nicho/.test(txtNorm);

  // Detectar conceito mesmo sem pergunta explícita (ex: "floral?")
  const soPalavra = txtNorm.split(' ').filter(w=>w.length>1).length <= 3;

  if (!ehPergunta && !soPalavra) return null;

  if (/edt.*edp|edp.*edt|diferenca.*eau|concentracao|diferenca.*concentracao/.test(txtNorm)) return CONCEITOS.edt_edp;
  if (/designer.*nicho|nicho.*designer|qual.*melhor.*nicho|nicho.*melhor/.test(txtNorm)) return CONCEITOS.nicho_designer;
  if (/\bfloral/.test(txtNorm)) return CONCEITOS.floral;
  if (/gourmand/.test(txtNorm)) return CONCEITOS.gourmand;
  if (/oriental/.test(txtNorm) && ehPergunta) return CONCEITOS.oriental;
  if (/amadeirado/.test(txtNorm) && ehPergunta) return CONCEITOS.amadeirado;
  if (/aquatico|aquatica/.test(txtNorm) && ehPergunta) return CONCEITOS.aquatico;
  if (/citrico|citrica/.test(txtNorm) && ehPergunta) return CONCEITOS.citrico;
  if (/fougere|fougère/.test(txtNorm)) return CONCEITOS.fougere;
  if (/\bchypre\b/.test(txtNorm)) return CONCEITOS.chypre;
  if (/\bsillage\b/.test(txtNorm)) return CONCEITOS.sillage;
  if (/\belixir\b/.test(txtNorm) && ehPergunta) return CONCEITOS.elixir;
  if (/\bparfum\b/.test(txtNorm) && ehPergunta && !/perfume/.test(txtNorm)) return CONCEITOS.parfum;
  if (/\bedt\b/.test(txtNorm) && ehPergunta) return CONCEITOS.edt;
  if (/\bedp\b/.test(txtNorm) && ehPergunta) return CONCEITOS.edp;
  if (/\bnicho\b/.test(txtNorm) && ehPergunta) return CONCEITOS.nicho;
  if (/\bdesigner\b/.test(txtNorm) && ehPergunta) return CONCEITOS.designer;

  return null;
}

// ===================================================
// MOTOR DE SUGESTÕES
// ===================================================
function sugerirPorCriterio(txtNorm, genero, orcamento) {
  // genero: 'M', 'F', 'U' ou null (não definido ainda)
  const c = txtNorm;

  const FILTROS_CONTEXTO = {
    // Notas específicas
    baunilha:    p => /baunilha/i.test(p.notas + p.familia),
    rosa:        p => /rosa/i.test(p.notas + p.familia),
    oud:         p => /oud/i.test(p.notas + p.familia),
    citrico:     p => /citrico|limao|laranja|bergamota|toranja/i.test(p.notas + p.familia),
    floral:      p => /floral/i.test(p.familia),
    amadeirado:  p => /amadeirado/i.test(p.familia),
    oriental:    p => /oriental/i.test(p.familia),
    aquatico:    p => /aquatico/i.test(p.familia),
    gourmand:    p => /gourmand/i.test(p.familia),
    especiado:   p => /especiado|canela|cardamomo/i.test(p.notas + p.familia),
    almiscar:    p => /almiscar/i.test(p.notas),
    cafe:        p => /cafe/i.test(p.notas),
    lavanda:     p => /lavanda/i.test(p.notas),
    sandalo:     p => /sandalo/i.test(p.notas + p.familia),
    // Clima/época
    calor:       p => /aquatico|citrico|aromatico/i.test(p.familia),
    quente:      p => /aquatico|citrico|aromatico/i.test(p.familia),
    verao:       p => /aquatico|citrico|aromatico/i.test(p.familia),
    sol:         p => /aquatico|citrico|aromatico/i.test(p.familia),
    praia:       p => /aquatico|citrico/i.test(p.familia),
    frio:        p => /oriental|gourmand|amadeirado/i.test(p.familia),
    inverno:     p => /oriental|gourmand|amadeirado/i.test(p.familia),
    outono:      p => /oriental|amadeirado|especiado/i.test(p.familia),
    fresco:      p => /aquatico|citrico|aromatico|fougere/i.test(p.familia),
    // Ocasião
    noite:       p => /oriental|gourmand|amadeirado.*oriental|especiado/i.test(p.familia),
    festa:       p => /oriental|gourmand|especiado|floral.*oriental/i.test(p.familia),
    balada:      p => /oriental|gourmand|especiado|floral.*oriental/i.test(p.familia),
    casamento:   p => /floral|floral.*amadeirado|floral.*oriental/i.test(p.familia),
    jantar:      p => /oriental|gourmand|floral.*oriental/i.test(p.familia),
    evento:      p => /oriental|floral.*oriental|floral.*amadeirado/i.test(p.familia),
    aniversario: p => /floral.*oriental|oriental|gourmand/i.test(p.familia),
    formatura:   p => /floral.*oriental|floral.*amadeirado/i.test(p.familia),
    romantico:   p => /floral.*oriental|oriental.*floral|gourmand|oriental.*amadeirado/i.test(p.familia),
    encontro:    p => /floral.*oriental|oriental|gourmand/i.test(p.familia),
    conquista:   p => /oriental|gourmand|floral.*oriental/i.test(p.familia),
    seduzir:     p => /oriental|gourmand|floral.*oriental/i.test(p.familia),
    // Dia a dia
    trabalho:    p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    escritorio:  p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    reuniao:     p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    diario:      p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    casual:      p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    // Estilo
    intenso:     p => /oriental|amadeirado.*oriental|gourmand|especiado/i.test(p.familia),
    marcante:    p => /oriental|amadeirado.*oriental|gourmand|especiado/i.test(p.familia),
    forte:       p => /oriental|amadeirado.*oriental|gourmand|especiado/i.test(p.familia),
    leve:        p => /aquatico|citrico|aromatico|fougere/i.test(p.familia),
    discreto:    p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    suave:       p => /aquatico|citrico|floral|aromatico/i.test(p.familia),
    doce:        p => /gourmand|baunilha/i.test(p.notas + p.familia),
    sensual:     p => /oriental|gourmand|floral.*oriental/i.test(p.familia),
    elegante:    p => /floral.*amadeirado|amadeirado|floral.*oriental/i.test(p.familia),
    sofisticado: p => /amadeirado|floral.*amadeirado|oriental.*amadeirado/i.test(p.familia),
    unico:       p => p.nicho === true,
    exclusivo:   p => p.nicho === true,
    raro:        p => p.nicho === true,
  };

  // Filtros activos pelo critério
  const filtros = [];
  for (const [kw, fn] of Object.entries(FILTROS_CONTEXTO)) {
    if (c.includes(kw)) filtros.push(fn);
  }

  let pool = Object.values(CATALOGO).filter(p => p.preco && Object.keys(p.preco).length > 0);

  // Filtro de orçamento
  if (orcamento && orcamento > 0) {
    const c1 = pool.filter(p => precoMin(p.preco) <= orcamento * 1.1);
    if (c1.length >= 3) pool = c1;
  }

  // Filtro de género — OBRIGATÓRIO se definido
  if (genero) {
    const c2 = pool.filter(p => {
      if (genero === 'M') return p.genero === 'M' || p.genero === 'U';
      if (genero === 'F') return p.genero === 'F' || p.genero === 'U';
      return p.genero === 'U';
    });
    if (c2.length >= 2) pool = c2;
  }

  // Filtros de contexto
  for (const fn of filtros) {
    const c3 = pool.filter(fn);
    if (c3.length >= 2) pool = c3;
  }

  const vistos = new Set();
  const designers = [], nicho = [];
  for (const p of pool) {
    if (vistos.has(p.nomeBase)) continue;
    vistos.add(p.nomeBase);
    if (p.nicho) nicho.push(p);
    else designers.push(p);
  }
  return { designers: designers.slice(0, 3), nicho: nicho.slice(0, 2) };
}

// ===================================================
// DETECTOR DE ORÇAMENTO
// ===================================================
function extrairOrcamento(txt) {
  const n = normalizar(txt);
  const m1 = n.match(/(\d[\d\s]*)k\b/);
  if (m1) return parseInt(m1[1].replace(/\s/g, '')) * 1000;
  const m2 = n.match(/(\d[\d\s]*)mil/);
  if (m2) return parseInt(m2[1].replace(/\s/g, '')) * 1000;
  const m3 = n.match(/(\d{4,})/);
  if (m3) return parseInt(m3[1]);
  return null;
}

// ===================================================
// DETECTOR DE GÉNERO NA MENSAGEM
// ===================================================
function extrairGenero(txtNorm) {
  if (/\b(homem|masculin|masculino|ele\b|namorado|marido|pai\b|irmao|rapaz|meu filho|filho\b)\b/.test(txtNorm)) return 'M';
  if (/\b(mulher|feminin|feminino|ela\b|namorada|esposa|mae\b|irma|menina|minha filha|filha\b)\b/.test(txtNorm)) return 'F';
  return null;
}

// ===================================================
// CONTEXTO SAZONAL
// ===================================================
function getContextoSazonal(p) {
  const f = (p.familia || '').toLowerCase();
  if (/aquatico|citrico/.test(f)) return 'ideal para o dia a dia e para o calor de Angola';
  if (/gourmand|oriental.*amadei/.test(f)) return 'perfeito para noites especiais e encontros';
  if (/floral.*oriental|oriental.*floral/.test(f)) return 'excelente para eventos sociais e jantares';
  if (/aromatico|fougere/.test(f)) return 'versátil — do trabalho à noite';
  if (/floral\b/.test(f)) return 'elegante para o dia e ocasiões especiais';
  if (/amadeirado/.test(f) && !/oriental/.test(f)) return 'sofisticado para reuniões e ambientes formais';
  if (/oriental\b/.test(f) || /especiado/.test(f)) return 'marcante para noite, festas e ocasiões importantes';
  return 'versátil para várias ocasiões';
}

// ===================================================
// DURAÇÃO
// ===================================================
function getDuracao(conc) {
  const c = (conc || '').toLowerCase();
  if (/extrait/.test(c)) return '10 a 14h — concentração máxima';
  if (/parfum/.test(c)) return '8 a 12h — forma mais pura';
  if (/edp/.test(c)) return '6 a 8h — versátil do dia para a noite';
  if (/edt/.test(c)) return '4 a 6h — leve e ideal para calor';
  return '4 a 6h';
}

// ===================================================
// RESPOSTA COMPLETA DE UM PERFUME
// ===================================================
function respostaPerfume(nomeBase) {
  const versoes = Object.values(CATALOGO).filter(p =>
    p.nomeBase === nomeBase && p.preco && Object.keys(p.preco).length > 0
  );
  if (!versoes.length) return null;
  const p0 = versoes[0];
  const emoji = p0.genero === 'M' ? '👔' : p0.genero === 'F' ? '👗' : '✨';
  const banner = getBannerDesconto();
  const generoLabel = p0.genero === 'M' ? 'Masculino' : p0.genero === 'F' ? 'Feminino' : 'Unissexo';
  const nichoLabel = p0.nicho ? ' _(Nicho)_' : '';

  const CASAS = {
    'Dior': 'a prestigiada casa francesa Dior',
    'Chanel': 'a icónica casa Chanel',
    'YSL': 'a casa francesa Yves Saint Laurent',
    'Armani': 'a casa italiana Giorgio Armani',
    'Rabanne': 'a casa Paco Rabanne',
    'Versace': 'a casa italiana Versace',
    'Hugo Boss': 'a casa Hugo Boss',
    'Lancôme': 'a casa francesa Lancôme',
    'Guerlain': 'a histórica casa francesa Guerlain',
    'Mugler': 'a casa francesa Thierry Mugler',
    'Tom Ford': 'a casa americana Tom Ford',
    'Calvin Klein': 'a casa americana Calvin Klein',
    'Narciso Rodriguez': 'a casa Narciso Rodriguez',
    'Issey Miyake': 'a casa japonesa Issey Miyake',
    'Creed': 'a lendária casa britânica Creed',
    'Mancera': 'a casa parisiense Mancera — referência no nicho',
    'Montale': 'a casa parisiense Montale',
    'MFK': 'a Maison Francis Kurkdjian',
    'By Kilian': 'a exclusiva casa By Kilian',
    'Amouage': 'a opulenta casa omanense Amouage',
    'Parfums de Marly': 'a casa francesa Parfums de Marly',
    'Nishane': 'a casa turca Nishane',
    'Initio': 'a casa francesa Initio Parfums Privés',
    'Xerjoff': 'a casa italiana Xerjoff',
    'Frederic Malle': 'as Éditions de Parfums Frédéric Malle',
    'Roja Dove': 'a casa britânica Roja Parfums',
  };
  let casa = 'uma reconhecida casa de perfumaria';
  for (const [marca, desc] of Object.entries(CASAS)) {
    if (nomeBase.includes(marca)) { casa = desc; break; }
  }

  function getDescricao(p) {
    const f = (p.familia || '').toLowerCase();
    if (/baccarat|rouge.*540/.test(nomeBase.toLowerCase()))
      return 'Quem o usa raramente passa despercebido. Deixa um rasto dourado e inconfundível — é o tipo de fragrância que as pessoas se voltam para tentar perceber de onde vem.';
    if (/aquatico|citrico/.test(f))
      return 'Fresco, limpo e revigorante. Discreto sem ser apagado — a escolha certa para quem quer estar sempre bem apresentado sem exageros.';
    if (/gourmand/.test(f))
      return 'Envolvente, quente e irresistível. Sofisticado sem ser pesado. Quem está perto vai sentir um calor agradável — nunca enjoativo, sempre memorável.';
    if (/floral.*oriental|oriental.*floral/.test(f))
      return 'Elegante e marcante. Floral na superfície, com uma base quente e profunda que transforma ao longo do dia. Para quem quer ser lembrado depois de sair da sala.';
    if (/floral/.test(f))
      return 'Floral com complexidade e alma. Não é um floral óbvio — tem carácter. O perfume de quem não precisa de gritar para ser notado.';
    if (/oriental|especiado/.test(f))
      return 'Intenso e magnético. Como especiarias no ar e madeiras a arder numa noite fria. Para ocasiões em que quer fazer uma entrada inesquecível.';
    if (/amadeirado/.test(f))
      return 'Sofisticado, seco e inconfundível. As madeiras nobres dão-lhe uma elegância discreta que combina com qualquer ocasião formal.';
    return 'Uma fragrância de carácter que evolui de forma encantadora ao longo do dia.';
  }

  const contexto = getContextoSazonal(p0);
  let reply = `${emoji} *${nomeBase}*${nichoLabel}${banner}\n\nUma criação de ${casa}.\n\n*Género:* ${generoLabel} | *Família:* ${p0.familia}\n\n*Notas:* ${p0.notas}\n\n${getDescricao(p0)}\n\n✨ ${contexto.charAt(0).toUpperCase() + contexto.slice(1)}.\n\n`;

  if (versoes.length === 1) {
    reply += `*Duração estimada:* ${getDuracao(p0.conc)}.\n\n💰 *Preço:*\n${formatPrecos(p0.preco)}\n`;
  } else {
    reply += `💰 *Versões disponíveis:*\n`;
    versoes.forEach(p => {
      reply += `\n*${p.conc}* _(${getDuracao(p.conc)})_:\n${formatPrecos(p.preco)}\n`;
    });
  }
  reply += `\n📦 Entrega em Luanda incluída.`;

  // UPSELL de promoção para perfumes de nicho
  if (p0.nicho) {
    reply += `\n\nDeseja encomendar? Escreva *encomendar* e trato de tudo!\n\n💡 Posso também verificar se existe alguma promoção disponível para este perfume. Quer que o faça?`;
  } else {
    reply += `\n\nDeseja encomendar? Escreva *encomendar* e trato de tudo!`;
  }
  return reply;
}

// ===================================================
// FLUXO DE ENCOMENDA
// ===================================================

// Iniciar encomenda a partir de um perfume específico
function iniciarEncomenda(nomeBase, from) {
  const versoes = Object.values(CATALOGO).filter(p =>
    p.nomeBase === nomeBase && p.preco && Object.keys(p.preco).length > 0
  );
  if (!versoes.length) return null;

  // Construir lista de opções (versão + tamanho + preço)
  const opcoes = [];
  versoes.forEach(p => {
    Object.entries(p.preco).forEach(([ml, kz]) => {
      const kzFinal = aplicaDesconto(kz);
      opcoes.push({ nome: p.nome, conc: p.conc, ml, kz: kzFinal });
    });
  });

  // Guardar sessão com as opções disponíveis
  setSessao(from, {
    tipo: 'confirmar_encomenda',
    nomeBase,
    opcoes,
    orcamento: null,
  });

  let msg = `Óptima escolha! Para confirmar a sua encomenda do *${nomeBase}*:

`;
  msg += `Qual versão e tamanho deseja?

`;
  opcoes.forEach((o, i) => {
    msg += `*${i+1}.* ${o.conc} — ${o.ml}: ${o.kz.toLocaleString('pt-PT')} Kz
`;
  });
  msg += `
Indique o número da opção ou descreva o que pretende.`;
  return msg;
}

// ===================================================
// ALTERNATIVAS
// ===================================================
function encontrarAlternativas(nomeBase, orcamento) {
  const original = Object.values(CATALOGO).find(p => p.nomeBase === nomeBase);
  if (!original) return null;
  const pool = Object.values(CATALOGO).filter(p =>
    p.preco && p.nomeBase !== nomeBase &&
    precoMin(p.preco) < (orcamento || precoMin(original.preco)) &&
    (p.familia === original.familia || p.genero === original.genero)
  );
  const vistos = new Set();
  const alts = [];
  for (const p of pool) {
    if (vistos.has(p.nomeBase)) continue;
    vistos.add(p.nomeBase);
    alts.push(p);
    if (alts.length >= 3) break;
  }
  return alts;
}

// ===================================================
// FORMATAR SUGESTÕES
// ===================================================
function formatarSugestoes(sugestoes, tituloContexto, orcamento) {
  const { designers, nicho } = sugestoes;
  if (!designers.length && !nicho.length) return null;
  let reply = `Com prazer!\n`;
  if (tituloContexto) reply += `\nPara *${tituloContexto}*, as minhas sugestões:\n`;
  if (designers.length) {
    reply += `\n🏷️ *Designer:*\n`;
    designers.forEach(p => {
      const kzMin = precoMin(p.preco);
      const ctx = getContextoSazonal(p);
      reply += `\n• *${p.nomeBase}*\n  _${p.notas}_\n  ${ctx.charAt(0).toUpperCase() + ctx.slice(1)}.\n  A partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
    });
  }
  if (nicho.length) {
    reply += `\n💎 *Nicho (mais exclusivo):*\n`;
    nicho.forEach(p => {
      const kzMin = precoMin(p.preco);
      const ctx = getContextoSazonal(p);
      reply += `\n• *${p.nomeBase}*\n  _${p.notas}_\n  ${ctx.charAt(0).toUpperCase() + ctx.slice(1)}.\n  A partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
    });
  }
  if (orcamento) reply += `\n_Dentro do orçamento de ${orcamento.toLocaleString('pt-PT')} Kz._`;
  reply += `\n\nQuer saber mais sobre algum destes? Escreva o nome para ver todos os detalhes, ou *encomendar [nome]* para avançar.`;
  return reply;
}

// ===================================================
// PESQUISA DIRECTA
// ===================================================
// ===================================================
// ÍNDICE DE PALAVRAS ÚNICAS — construído no arranque
// Cada palavra que identifica EXCLUSIVAMENTE um perfume
// ===================================================
const _PALAVRA_PARA_NB = {}; // palavra → [nomeBase, ...]
const _NB_NORM = {};         // nomeBase → string normalizada
const _NB_PALAVRAS = {};     // nomeBase → palavras >3 letras

(function construirIndice() {
  const nomesBase = new Set(Object.values(CATALOGO).map(p => p.nomeBase));
  for (const nb of nomesBase) {
    const nbNorm = normalizar(nb);
    _NB_NORM[nb] = nbNorm;
    const palavras = nbNorm.split(' ').filter(w => w.length > 3);
    _NB_PALAVRAS[nb] = palavras;
    for (const p of palavras) {
      if (!_PALAVRA_PARA_NB[p]) _PALAVRA_PARA_NB[p] = [];
      if (!_PALAVRA_PARA_NB[p].includes(nb)) _PALAVRA_PARA_NB[p].push(nb);
    }
  }
})();

function pesquisaDirecta(txtLow) {
  const txtNorm = normalizar(txtLow);

  // 1. Exacta por chave do catálogo
  for (const [key, p] of Object.entries(CATALOGO)) {
    if (txtLow.includes(key)) return p.nomeBase;
  }

  // 2. Exacta por nomeBase normalizado
  const nomesBase = new Set(Object.values(CATALOGO).map(p => p.nomeBase));
  for (const nb of nomesBase) {
    if (txtNorm.includes(_NB_NORM[nb])) return nb;
  }

  // 3. Por palavras únicas — uma palavra que identifica só 1 perfume
  //    Se ela aparece na mensagem, encontrámos o perfume sem ambiguidade
  const candidatos = new Map(); // nomeBase → nr de palavras encontradas
  for (const palavra of Object.keys(_PALAVRA_PARA_NB)) {
    if (!txtNorm.includes(palavra)) continue;
    const perfumes = _PALAVRA_PARA_NB[palavra];
    // Palavra única → encontrou directamente
    if (perfumes.length === 1) {
      const nb = perfumes[0];
      const count = (candidatos.get(nb) || 0) + 2; // peso maior para palavras únicas
      candidatos.set(nb, count);
    } else {
      // Palavra partilhada → adiciona ao score de todos os perfumes que a têm
      for (const nb of perfumes) {
        candidatos.set(nb, (candidatos.get(nb) || 0) + 1);
      }
    }
  }

  if (candidatos.size === 0) return null;

  // Ordenar por score e validar o melhor candidato
  const sorted = [...candidatos.entries()].sort((a, b) => b[1] - a[1]);
  const [melhorNB, melhorScore] = sorted[0];
  const palavrasDoMelhor = _NB_PALAVRAS[melhorNB] || [];

  // Critério de aceitação:
  // - Score >= 2 (pelo menos 1 palavra única, ou 2+ palavras partilhadas)
  // - E o candidato tem score claramente melhor que o 2º (evita ambiguidade)
  const segundoScore = sorted.length > 1 ? sorted[1][1] : 0;
  const semAmbiguidade = melhorScore > segundoScore || melhorScore >= 3;

  if (melhorScore >= 2 && semAmbiguidade) {
    return melhorNB;
  }

  // 4. Fallback: todas as palavras do nome presentes (só para nomes distintos)
  for (const nb of nomesBase) {
    const palavras = _NB_PALAVRAS[nb];
    if (palavras.length < 2) continue; // evita nomes com 1 palavra (ambíguo)
    if (palavras.every(w => txtNorm.includes(w))) return nb;
  }

  return null;
}

// ===================================================
// PESQUISA FUZZY
// ===================================================
const FUZZY_INDEX = [];
const _fv = new Set();
for (const p of Object.values(CATALOGO)) {
  if (_fv.has(p.nomeBase)) continue;
  _fv.add(p.nomeBase);
  const nb = normalizar(p.nomeBase);
  const palavras = nb.split(' ').filter(w => w.length > 1);
  const kws = new Set([nb]);
  palavras.filter(w => w.length >= 2).forEach(w => kws.add(w));
  FUZZY_INDEX.push({ nomeBase: p.nomeBase, keywords: [...kws] });
}

function pesquisaFuzzy(msg) {
  const msgNorm = normalizar(msg);
  const palavrasMsg = msgNorm.split(' ').filter(w => w.length >= 1);
  let melhor = null, score = Infinity;
  for (const item of FUZZY_INDEX) {
    for (const kw of item.keywords) {
      const kwP = kw.split(' ').filter(w => w.length > 1);
      if (!kwP.length) continue;
      let total = 0, matched = 0;
      for (const k of kwP) {
        let minD = Infinity;
        for (const pm of palavrasMsg) {
          const d = levenshtein(k, pm);
          const max = k.length <= 2 ? 0 : k.length <= 4 ? 1 : k.length <= 7 ? 2 : 3;
          if (d <= max) minD = Math.min(minD, d);
        }
        if (minD < Infinity) { total += minD; matched++; }
      }
      if (matched === kwP.length && total < score) { score = total; melhor = item; }
    }
  }
  return melhor;
}

// ===================================================
// ENVIO
// ===================================================
async function sendMessage(to, text) {
  try {
    await axios.post(
      `${EVOLUTION_URL}/message/sendText/${INSTANCE}`,
      { number: to, text },
      { headers: { apikey: EVOLUTION_KEY } }
    );
  } catch (e) {
    console.error('Erro ao enviar:', e.message);
  }
}

// ===================================================
// BOT PRINCIPAL — LÓGICA CORRIGIDA
// ===================================================
function getBotReply(from, msg) {
  const txt = msg.trim();
  const txtLow = txt.toLowerCase();
  const txtNorm = normalizar(txt);
  const sessao = getSessao(from);
  const orcamento = extrairOrcamento(txt) || (sessao && sessao.orcamento);
  if (extrairOrcamento(txt)) updateSessao(from, { orcamento: extrairOrcamento(txt) });

  // ================================================
  // P1 — Perfume específico nomeado (PRIORIDADE MÁXIMA)
  // Responde APENAS sobre esse perfume. Sempre.
  // ================================================
  const perfumeDirecto = pesquisaDirecta(txtLow);
  if (perfumeDirecto) {
    // Guardar perfume activo — inclui flag se é nicho (para upsell de promoção)
    const ehNicho = Object.values(CATALOGO).some(p => p.nomeBase === perfumeDirecto && p.nicho);
    setSessao(from, { nomeBase: perfumeDirecto, tipo: 'perfume_activo', ehNicho });
    const resp = respostaPerfume(perfumeDirecto);
    if (orcamento && resp) {
      const versoes = Object.values(CATALOGO).filter(p => p.nomeBase === perfumeDirecto && p.preco);
      const minPreco = versoes.length ? Math.min(...versoes.map(p => precoMin(p.preco))) : 0;
      if (minPreco > orcamento * 1.15) {
        const alts = encontrarAlternativas(perfumeDirecto, orcamento);
        if (alts && alts.length) {
          let extra = `\n\n💡 Este perfume está acima do orçamento indicado. Alternativas com perfil semelhante:\n`;
          alts.forEach(p => {
            extra += `\n• *${p.nomeBase}* — _${p.notas}_ — a partir de ${precoMin(p.preco).toLocaleString('pt-PT')} Kz`;
          });
          extra += `\n\nDeseja explorar alguma destas ou avançar com o ${perfumeDirecto}?`;
          return resp + extra;
        }
      }
    }
    return resp;
  }

  // ================================================
  // P2 — Sessão activa
  // ================================================
  if (sessao) {

    // =============================================
    // UPSELL: cliente respondeu "sim" ao upsell de promoção
    // =============================================
    if (sessao.tipo === 'perfume_activo' && sessao.ehNicho) {
      if (/^(sim|s|yes|claro|quero|gostava|boa|ótimo|por favor|faz.*favor|verifica|verif)/.test(txtNorm)) {
        const nomeBase = sessao.nomeBase;
        clearSessao(from);
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          sendMessage(NUMERO_HUMANO,
            `🎁 *OMNIA — Pedido de verificação de promoção*

` +
            `📱 Cliente: +${numLimpo}
` +
            `🛍️ Perfume: ${nomeBase}
` +
            `💬 O cliente quer saber se há promoção disponível.
` +
            `👆 https://wa.me/${numLimpo}
` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }
        return `Perfeito! Já enviei o pedido à nossa equipa para verificar se existe alguma promoção disponível para o *${nomeBase}*.

Um consultor entrará em contacto consigo brevemente. 🖤`;
      }
      if (/^(nao|n|no|negativo|obrigad|dispenso|tudo bem|nao precis)/.test(txtNorm)) {
        // Não quer promoção — mantém sessão para encomendar
        return `Claro! Quando quiser encomendar, escreva *encomendar* e trato de tudo. 😊`;
      }
      // Não é resposta ao upsell — limpa flag de nicho e continua processamento normal
      updateSessao(from, { ehNicho: false });
    }

    // Confirmação fuzzy
    if (sessao.tipo === 'confirmar_perfume') {
      if (/^(sim|s\b|yes|claro|certo|isso|ok|quero|e esse|exacto)/.test(txtNorm)) {
        const nb = sessao.nomeBase;
        clearSessao(from);
        return respostaPerfume(nb);
      }
      if (/^(nao|n\b|no\b|nope|outro|diferente|errado|negativo|nada)/.test(txtNorm)) {
        clearSessao(from);
        return `Peço desculpa pela confusão. Pode indicar-me o nome do perfume ou descrever o que procura?`;
      }
      clearSessao(from);
    }

    // =============================================
    // FLUXO DE QUALIFICAÇÃO — FIX BUG 1 e BUG 3
    // Estado 1: recebeu contexto, pergunta género
    // Estado 2: recebeu género, pergunta época/estilo
    // Estado 3: recebeu época, sugere com contexto
    // =============================================
    if (sessao.tipo === 'qualificar_genero') {
      // Cliente respondeu — extractar género
      const generoRespondido = extrairGenero(txtNorm)
        || (/masculin|homem|ele\b|rapaz|\bm\b|para mim/.test(txtNorm) ? 'M'
          : /feminin|mulher|ela\b|menina|\bf\b/.test(txtNorm) ? 'F'
          : /unissex|ambos|qualquer/.test(txtNorm) ? 'U' : null);

      if (!generoRespondido) {
        // Não percebeu o género — pergunta de novo de forma diferente
        return `Para ajudar melhor — o perfume é para homem ou para mulher?`;
      }

      const criterioBase = sessao.criterio || '';
      updateSessao(from, { tipo: 'qualificar_epoca', genero: generoRespondido, criterio: criterioBase });

      // Se já tem época no contexto inicial, avança directamente
      const temEpoca = /calor|quente|verao|frio|inverno|noite|dia\b|trabalho/.test(criterioBase);
      if (temEpoca) {
        // Sugere directamente com género + época
        const sugestoes = sugerirPorCriterio(criterioBase, generoRespondido, orcamento);
        if (sugestoes && (sugestoes.designers.length || sugestoes.nicho.length)) {
          clearSessao(from);
          const titulo = getTituloContexto(criterioBase);
          const genLabel = generoRespondido === 'M' ? 'masculinos' : 'femininos';
          return formatarSugestoes(sugestoes, `${titulo} — perfumes ${genLabel}`, orcamento);
        }
      }

      return `E para que tipo de ocasião — prefere algo *mais fresco para o dia* ou *mais intenso para a noite*?`;
    }

    if (sessao.tipo === 'qualificar_epoca') {
      const genero = sessao.genero;
      const criterioBase = sessao.criterio || '';

      // Mapear resposta do cliente para critério
      const n = txtNorm;
      let criterioEpoca = '';
      if (/calor|quente|dia\b|fresc|leve|casual|trabalho|escritorio/.test(n)) criterioEpoca = 'fresco aquatico dia calor';
      else if (/noite|intenso|marcante|forte|especial|festa|evento|romantico|encontro|casamento/.test(n)) criterioEpoca = 'intenso oriental noite especial';
      else if (/ambos|qualquer|versatil/.test(n)) criterioEpoca = 'versatil floral amadeirado';
      else criterioEpoca = n; // usa a resposta literal

      const criterioFinal = criterioBase + ' ' + criterioEpoca;
      const sugestoes = sugerirPorCriterio(criterioFinal, genero, orcamento);
      clearSessao(from);

      if (sugestoes && (sugestoes.designers.length || sugestoes.nicho.length)) {
        const titulo = getTituloContexto(criterioFinal);
        const genLabel = genero === 'M' ? 'masculinos' : genero === 'F' ? 'femininos' : '';
        return formatarSugestoes(sugestoes, titulo + (genLabel ? ` — ${genLabel}` : ''), orcamento);
      }
      return `Para o perfil indicado, as fragrâncias orientais e amadeiradas são as mais indicadas. Escreva *catálogo* para ver tudo ou diga-me um nome específico.`;
    }

    // Refinamento de sugestão activa
    if (sessao.tipo === 'sugestao_activa') {
      const criterioAnterior = sessao.criterio || '';
      const novoOrc = extrairOrcamento(txt) || sessao.orcamento;
      const generoRefinado = extrairGenero(txtNorm);

      if (generoRefinado || novoOrc !== sessao.orcamento) {
        const genFinal = generoRefinado || sessao.genero;
        const novasSugestoes = sugerirPorCriterio(criterioAnterior, genFinal, novoOrc);
        if (novasSugestoes && (novasSugestoes.designers.length || novasSugestoes.nicho.length)) {
          updateSessao(from, { tipo: 'sugestao_activa', criterio: criterioAnterior, genero: genFinal, orcamento: novoOrc });
          const genLabel = genFinal === 'M' ? 'perfil masculino' : genFinal === 'F' ? 'perfil feminino' : 'o seu perfil';
          return formatarSugestoes(novasSugestoes, genLabel, novoOrc);
        }
      }
      if (/nicho|exclusiv|luxo|mais.*opcoes|outras/.test(txtNorm)) {
        const nichS = sugerirPorCriterio(criterioAnterior + ' exclusivo', sessao.genero, novoOrc);
        if (nichS && nichS.nicho.length) {
          return formatarSugestoes({ designers: [], nicho: nichS.nicho }, 'nicho e exclusivo', novoOrc);
        }
      }
      clearSessao(from);
    }

    // =============================================
    // ESTADO: confirmar_encomenda
    // Cliente escolheu perfume, bot confirma opção
    // =============================================
    if (sessao.tipo === 'confirmar_encomenda') {
      const opcoes = sessao.opcoes || [];
      const nomeBase = sessao.nomeBase || '';

      // Cancelar encomenda
      if (/^(nao|n\b|cancelar|desistir|esquecer|nada|voltar)/.test(txtNorm)) {
        clearSessao(from);
        return `Sem problema. Se precisar de ajuda com outro perfume ou quiser retomar a encomenda, estou aqui.`;
      }

      // Detectar escolha por número ou por texto
      let escolha = null;
      const numMatch = txtNorm.match(/^[1-9]$/);
      if (numMatch) {
        const idx = parseInt(numMatch[0]) - 1;
        if (idx >= 0 && idx < opcoes.length) escolha = opcoes[idx];
      }
      // Detectar por texto (ex: "100ml edp" ou "edp 100ml")
      if (!escolha) {
        escolha = opcoes.find(o =>
          txtNorm.includes(normalizar(o.ml)) &&
          (txtNorm.includes(normalizar(o.conc)) || opcoes.length === 1)
        ) || (opcoes.length === 1 ? opcoes[0] : null);
      }

      if (escolha) {
        // Confirmar escolha e enviar dados bancários
        updateSessao(from, {
          tipo: 'aguardar_comprovativo',
          nomeBase,
          opcaoEscolhida: escolha,
        });

        const kzFmt = escolha.kz.toLocaleString('pt-PT');
        let msg = `✅ *Encomenda registada!*

`;
        msg += `• *Perfume:* ${escolha.nome}
`;
        msg += `• *Tamanho:* ${escolha.ml}
`;
        msg += `• *Valor:* ${kzFmt} Kz
`;
        msg += `📦 Entrega em Luanda incluída.

`;
        msg += `Para concluir, efectue o pagamento e envie o comprovativo:

`;
        msg += DADOS_BANCARIOS;
        return msg;
      }

      // Não percebeu a escolha
      let msg = `Não percebi bem a opção. Disponível para *${nomeBase}*:

`;
      opcoes.forEach((o, i) => {
        msg += `*${i+1}.* ${o.conc} — ${o.ml}: ${o.kz.toLocaleString('pt-PT')} Kz
`;
      });
      msg += `
Indique o número da opção pretendida.`;
      return msg;
    }

    // Escalada
    if (sessao.tipo === 'confirmar_escalada') {
      if (/^(sim|s\b|yes|claro|ok|quero)/.test(txtNorm)) {
        clearSessao(from);
        if (NUMERO_HUMANO) {
          const n = from.replace('@s.whatsapp.net', '').replace('@c.us', '');
          sendMessage(NUMERO_HUMANO, `🔔 *OMNIA PARFUMS — Pedido de atendimento*\n\n📱 Cliente: +${n}\n💬 Motivo: ${sessao.motivo || 'Pedido de atendimento'}\n📝 Contexto: ${sessao.contexto || '-'}\n👆 https://wa.me/${n}\n🕐 ${new Date().toLocaleString('pt-PT')}`);
        }
        return `Perfeito. Já notifiquei a nossa equipa. Um colega entrará em contacto em breve. 🖤\n\nEnquanto aguarda, se tiver alguma questão sobre fragrâncias estarei aqui.`;
      }
      if (/^(nao|n\b|no\b|negativo)/.test(txtNorm)) {
        clearSessao(from);
        return `Compreendo. Como posso continuar a ajudar?`;
      }
      clearSessao(from);
    }
  }

  // ================================================
  // P3 — Perguntas conceptuais (FIX BUG 2)
  // Resposta directa, sem loop, sem "pode reformular"
  // ================================================
  const respostaConceito = detectarConceito(txtNorm);
  if (respostaConceito) return respostaConceito;

  // ================================================
  // P4 — Saudações e comandos base
  // ================================================
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|boas)/.test(txtNorm)) {
    const h = new Date().getHours();
    const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const banner = DESCONTO_SEMANA > 0 ? `\n\n🔥 *PROMOÇÃO ACTIVA: ${DESCONTO_SEMANA}% de desconto em todo o catálogo.*` : '';
    return `${s}! Bem-vindo à *Omnia Parfums*. 🖤${banner}\n\nSou o seu consultor de fragrâncias. Temos uma selecção cuidada de perfumes designer e de nicho, todos entregues em Luanda.\n\nComo posso ajudá-lo?\n• Procura um perfume específico?\n• Deseja sugestões para uma ocasião?\n• Ou prefere explorar o nosso *catálogo*?`;
  }

  if (/^(obrigad|ate logo|tchau|xau|adeus|bye)/.test(txtNorm)) {
    return `Foi um prazer! A *Omnia Parfums* fica sempre à disposição. Até breve! 🖤`;
  }

  if (/falar com.*humano|falar com.*pessoa|atendente|responsavel|gerente/.test(txtNorm)) {
    setSessao(from, { tipo: 'confirmar_escalada', motivo: 'Pedido explícito', contexto: txt });
    return `Naturalmente. Deseja que notifique um colega para continuar o seu atendimento?`;
  }

  if (/catalogo|todos os perfumes|ver tudo|ver colecao/.test(txtNorm)) {
    const masc  = getNomesAgrupados('M');
    const fem   = getNomesAgrupados('F');
    const uni   = getNomesAgrupados('U');
    const nicho = getNomesAgrupados(null, true);
    return `🖤 *Catálogo Omnia Parfums*${getBannerDesconto()}\n\n👔 *MASCULINOS — Designer (${masc.length})*\n${masc.join('\n')}\n\n👗 *FEMININOS — Designer (${fem.length})*\n${fem.join('\n')}\n\n✨ *UNISSEXO — Designer (${uni.length})*\n${uni.join('\n')}\n\n💎 *NICHO & LUXO (${nicho.length})*\n${nicho.join('\n')}\n\n_Escreva o nome para ver versões, preços e descrição._`;
  }

  if (/^(masculin|perfume.*homem|homem.*perfume)/.test(txtNorm)) {
    const designer = getNomesAgrupados('M');
    const nichoM = (() => { const map = {}; Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'M').forEach(p => { if (!map[p.nomeBase]) map[p.nomeBase] = []; if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc); }); return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`); })();
    return `👔 *Perfumes Masculinos*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoM.length ? nichoM.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
  }

  if (/^(feminin|perfume.*mulher|mulher.*perfume)/.test(txtNorm)) {
    const designer = getNomesAgrupados('F');
    const nichoF = (() => { const map = {}; Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'F').forEach(p => { if (!map[p.nomeBase]) map[p.nomeBase] = []; if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc); }); return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`); })();
    return `👗 *Perfumes Femininos*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoF.length ? nichoF.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
  }

  if (/^(nicho|luxo|exclusiv|premium)/.test(txtNorm)) {
    const mascN = [], femN = [], uniN = [];
    const vM = new Set(), vF = new Set(), vU = new Set();
    Object.values(CATALOGO).filter(p => p.nicho).forEach(p => {
      const label = `• ${p.nomeBase} _(${p.conc})_`;
      if (p.genero === 'M' && !vM.has(p.nomeBase)) { vM.add(p.nomeBase); mascN.push(label); }
      if (p.genero === 'F' && !vF.has(p.nomeBase)) { vF.add(p.nomeBase); femN.push(label); }
      if (p.genero === 'U' && !vU.has(p.nomeBase)) { vU.add(p.nomeBase); uniN.push(label); }
    });
    return `💎 *Nicho & Luxo — Omnia Parfums*${getBannerDesconto()}\n\nO universo do nicho é para quem valoriza exclusividade e matérias-primas raras.\n\n👔 *Masculinos:*\n${mascN.join('\n')}\n\n👗 *Femininos:*\n${femN.join('\n')}\n\n✨ *Unissexo:*\n${uniN.join('\n')}\n\n_Escreva o nome para ver versões, preços e descrição._`;
  }

  // Pedido de encomenda
  if (/encomendar|encomenda|quero comprar|vou comprar|quero pedir|fazer.*pedido|fazer.*encomenda/.test(txtNorm)) {
    // PRIORIDADE 1: perfume nomeado na mensagem actual
    const perfumeMensagem = pesquisaDirecta(txtLow);
    if (perfumeMensagem) {
      return iniciarEncomenda(perfumeMensagem, from);
    }

    // PRIORIDADE 2: perfume em sessão activa
    // (depois de ver detalhes de um perfume OU depois de sugestão)
    const perfumeSessao = sessao && (sessao.nomeBase || sessao.ultimoPerumeSugerido);
    if (perfumeSessao) {
      return iniciarEncomenda(perfumeSessao, from);
    }

    // PRIORIDADE 3: verificar se as sugestões tinham só 1 perfume
    if (sessao && sessao.tipo === 'sugestao_activa' && sessao.criterio) {
      // Não tem perfume definido — pede que escolha
      return `Qual dos perfumes sugeridos deseja encomendar? Indique o nome e trato de tudo.`;
    }

    // Sem contexto — pede que especifique
    return `Claro! Qual o perfume que deseja encomendar? Pode escrever o nome e ajudo-o com os detalhes.`;
  }

  if (/entrega|envio|como.*chega|onde.*entreg/.test(txtNorm)) {
    return `📦 *Entrega em Luanda incluída* em todos os produtos.\n\nPrazo habitual: 24 a 48 horas úteis após confirmação.`;
  }

  if (/desconto|promocao|preco.*melhor/.test(txtNorm)) {
    if (DESCONTO_SEMANA > 0) return `🔥 Temos actualmente *${DESCONTO_SEMANA}% de desconto* em todo o catálogo. Há algum perfume que queira ver?`;
    return `Os preços são fixos e reflectem a qualidade dos produtos. Há algum perfume específico que queira consultar?`;
  }

  // ================================================
  // P5 — Sugestão com critério de contexto
  // FIX BUG 1 e BUG 3: SE NÃO TEM GÉNERO → pergunta género primeiro
  // ================================================
  const TEM_CONTEXTO = /calor|quente|verao|frio|inverno|noite|festa|casamento|jantar|romantico|encontro|trabalho|escritorio|reuniao|diario|casual|intenso|marcante|leve|fresco|discreto|doce|sensual|elegante|baunilha|floral|oriental|amadeirado|aquatico|gourmand|oud|rosa\b|suger|recomendar|quero algo|procuro algo|para.*dia\b|para.*noite|para.*ocasiao|para.*evento/.test(txtNorm);

  if (TEM_CONTEXTO) {
    const generoMsg = extrairGenero(txtNorm);

    if (!generoMsg) {
      // NÃO TEM GÉNERO — pergunta primeiro (FIX BUG 1 + BUG 3)
      setSessao(from, { tipo: 'qualificar_genero', criterio: txtNorm, orcamento });
      return `Para ajudar melhor — o perfume é para si (homem ou mulher) ou para oferecer a alguém?`;
    }

    // TEM GÉNERO — verifica se precisa de época
    const temEpoca = /calor|quente|frio|inverno|noite|dia\b|trabalho|casual|fresco|intenso/.test(txtNorm);

    if (!temEpoca) {
      // Tem género mas não tem época — pergunta época
      setSessao(from, { tipo: 'qualificar_epoca', genero: generoMsg, criterio: txtNorm, orcamento });
      return `Perfeito! E para que tipo de ocasião — algo *mais fresco para o dia* ou *mais intenso para a noite*?`;
    }

    // TEM GÉNERO + ÉPOCA — sugere directamente
    const sugestoes = sugerirPorCriterio(txtNorm, generoMsg, orcamento);
    if (sugestoes && (sugestoes.designers.length || sugestoes.nicho.length)) {
      setSessao(from, { tipo: 'sugestao_activa', criterio: txtNorm, genero: generoMsg, orcamento });
      const titulo = getTituloContexto(txtNorm);
      const genLabel = generoMsg === 'M' ? 'masculinos' : 'femininos';
      return formatarSugestoes(sugestoes, `${titulo} — ${genLabel}`, orcamento);
    }
  }

  // Pedido vago de orçamento
  if (/mais barato|mais acessivel|orcamento|cabe no|dentro do.*orcamento/.test(txtNorm)) {
    return `Claro! Qual é o orçamento que tem em mente? E é para uso próprio ou para oferecer?`;
  }

  // ================================================
  // P6 — Fuzzy (só msgs curtas sem preposições)
  // ================================================
  const palavrasMsg = txtNorm.split(' ').filter(w => w.length > 0);
  const temPreposicao = /\b(para|com|sobre|de|do|da|um|uma|o\b|a\b|que|como|qual|quero|queria|procuro|tens|tem)\b/.test(txtNorm);
  const msgCurta = palavrasMsg.length >= 1 && palavrasMsg.length <= 5;

  if (msgCurta && !temPreposicao && txt.length > 2 && txt.length < 50) {
    const fuzzy = pesquisaFuzzy(txt);
    if (fuzzy) {
      setSessao(from, { tipo: 'confirmar_perfume', nomeBase: fuzzy.nomeBase });
      return `Estará a referir-se ao *${fuzzy.nomeBase}*?`;
    }
  }

  // ================================================
  // FALLBACK INTELIGENTE
  // Antes de desistir, detecta se o cliente mencionou
  // um nome de perfume fora do catálogo → escalada elegante
  // ================================================

  // Detectar se a mensagem parece conter um nome de perfume
  // (capitalizado, marca conhecida, ou padrão de nome)
  const MARCAS_CONHECIDAS = /(dior|chanel|ysl|armani|versace|rabanne|paco|guerlain|lancôme|lancome|mugler|boss|narciso|issey|calvin|tom ford|creed|mancera|montale|mfk|kilian|amouage|parfums de marly|nishane|initio|xerjoff|frederic malle|roja|givenchy|burberry|prada|valentino|bvlgari|hermes|hermès|jo malone|byredo|diptyque|serge|maison|viktor|spicebomb|flowerbomb|invictus|sauvage|aventus|oud|baccarat|layton|delina|pegasus|hacivat|replica)/i;

  const pareceNomePerfume = MARCAS_CONHECIDAS.test(txt) ||
    // Padrão: maiúscula + pelo menos outra palavra (ex: "Polo Blue", "Guilty Pour Homme")
    /^[A-Z][a-zA-Zà-ÿ]+ [A-Za-zà-ÿ]/.test(txt) ||
    // Explicitamente a pedir um perfume
    /tens.*o\s+\w+|tem.*o\s+\w+|quanto.*custa.*\w{4}|preço.*\w{4}|informaç.*\w{4}/i.test(txt);

  if (pareceNomePerfume) {
    // Cliente mencionou algo que parece um perfume — não está no catálogo
    const numLimpo = from ? from.replace('@s.whatsapp.net','').replace('@c.us','') : '';
    if (NUMERO_HUMANO && numLimpo) {
      sendMessage(NUMERO_HUMANO,
        `🔍 *OMNIA — Perfume não encontrado no catálogo*

` +
        `📱 Cliente: +${numLimpo}
` +
        `💬 Mensagem: _"${txt}"_
` +
        `📝 O cliente pode estar a perguntar sobre um perfume fora do catálogo.
` +
        `👆 https://wa.me/${numLimpo}
` +
        `🕐 ${new Date().toLocaleString('pt-PT')}`
      );
    }
    return `De momento não temos esse perfume disponível no nosso catálogo.

Já encaminhei o seu pedido a um dos nossos consultores — vamos verificar a disponibilidade e o preço e entramos em contacto consigo brevemente. 🖤`;
  }

  // Mensagem genuinamente ambígua — pedir clarificação de forma elegante
  return `Peço desculpa, não percebi bem o que procura.

Pode indicar-me o nome do perfume ou descrever a ocasião? Terei todo o gosto em ajudar.`;
}

// ===================================================
// HELPER — título do contexto para sugestões
// ===================================================
function getTituloContexto(n) {
  if (/casamento/.test(n)) return 'casamento';
  if (/noite|festa|balada|evento|jantar/.test(n)) return 'noite e ocasiões especiais';
  if (/romantico|encontro|conquista|seduzir/.test(n)) return 'encontro romântico';
  if (/trabalho|escritorio|reuniao/.test(n)) return 'ambiente profissional';
  if (/calor|quente|verao|sol\b|praia/.test(n)) return 'clima quente';
  if (/frio|inverno/.test(n)) return 'clima frio';
  if (/fresco|leve|discreto|dia\b|diario|casual/.test(n)) return 'uso diário e fresco';
  if (/intenso|marcante|forte/.test(n)) return 'algo intenso e marcante';
  if (/doce|baunilha|gourmand/.test(n)) return 'notas doces e envolventes';
  if (/floral/.test(n)) return 'notas florais';
  if (/oud|oriental/.test(n)) return 'perfil oriental';
  if (/presente|oferecer|oferta/.test(n)) return 'oferta especial';
  return 'o seu perfil';
}

// ===================================================
// WEBHOOK
// ===================================================
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    const msg = body?.data?.message;
    const from = body?.data?.key?.remoteJid;
    const fromMe = body?.data?.key?.fromMe;
    if (!msg || !from || fromMe) return;

    // ============================================
    // TRATAR IMAGEM / PDF (comprovativo de pagamento)
    // ============================================
    const isImagem = !!(msg.imageMessage || msg.stickerMessage);
    const isPDF = !!(msg.documentMessage && (
      msg.documentMessage.mimetype === 'application/pdf' ||
      msg.documentMessage.fileName?.endsWith('.pdf')
    ));
    const isDocumento = !!(msg.documentMessage);

    if (isImagem || isPDF || isDocumento) {
      const sessao = getSessao(from);
      const tipoFicheiro = isImagem ? 'imagem' : 'documento';

      if (sessao && sessao.tipo === 'aguardar_comprovativo') {
        // Cliente enviou comprovativo após encomenda
        const opcao = sessao.opcaoEscolhida || {};
        const nomeBase = sessao.nomeBase || 'perfume';
        clearSessao(from);

        // Notificar atendente
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          const link = `https://wa.me/${numLimpo}`;
          await sendMessage(NUMERO_HUMANO,
            `💳 *OMNIA PARFUMS — Comprovativo recebido*\n\n` +
            `📱 Cliente: +${numLimpo}\n` +
            `🛍️ Encomenda: ${opcao.nome || nomeBase} ${opcao.ml || ''}\n` +
            `💰 Valor: ${(opcao.kz || 0).toLocaleString('pt-PT')} Kz\n` +
            `📎 O cliente enviou um comprovativo de pagamento (${tipoFicheiro}).\n` +
            `👆 Clica para verificar: ${link}\n` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }

        // Resposta ao cliente
        await sendMessage(from,
          `✅ Comprovativo recebido! Obrigado.\n\n` +
          `A nossa equipa irá validar o pagamento em breve e entrará em contacto consigo para confirmar os detalhes da entrega.\n\n` +
          `🖤 *Omnia Parfums* — Entrega em Luanda em 24 a 48 horas.`
        );
        return;

      } else {
        // Imagem/ficheiro fora do contexto de encomenda
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          await sendMessage(NUMERO_HUMANO,
            `📎 *OMNIA PARFUMS — Ficheiro recebido*\n\n` +
            `📱 Cliente: +${numLimpo}\n` +
            `📎 Tipo: ${tipoFicheiro}\n` +
            `👆 https://wa.me/${numLimpo}\n` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }
        await sendMessage(from,
          `Recebemos o seu ficheiro. A nossa equipa irá analisá-lo e entrará em contacto em breve. 🖤`
        );
        return;
      }
    }

    // ============================================
    // TRATAR TEXTO NORMAL
    // ============================================
    let text = '';
    if (msg.conversation) text = msg.conversation;
    else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
    else if (msg.buttonsResponseMessage?.selectedDisplayText) text = msg.buttonsResponseMessage.selectedDisplayText;
    if (!text || text.trim().length < 1) return;

    const reply = getBotReply(from, text);
    if (reply) await sendMessage(from, reply);

  } catch (e) {
    console.error('Webhook error:', e);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', perfumes: Object.keys(CATALOGO).length }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Omnia Parfums Bot — porta ${PORT}`));
