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

function precoMax(preco) {
  if (!preco) return 0;
  return Math.max(...Object.values(preco).map(aplicaDesconto));
}

function getBannerDesconto() {
  return DESCONTO_SEMANA > 0 ? `\n🔥 *PROMOÇÃO: ${DESCONTO_SEMANA}% de desconto em todo o catálogo!*\n` : '';
}

// CORRIGIDO: filtro composto genero + nicho
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
// MOTOR DE SUGESTÕES
// ===================================================
function sugerirPorCriterio(txtNorm, orcamento) {
  const c = txtNorm;
  const FILTROS = {
    baunilha: p => /baunilha/i.test(p.notas + p.familia),
    rosa: p => /rosa/i.test(p.notas + p.familia),
    oud: p => /oud/i.test(p.notas + p.familia),
    citrico: p => /citrico|limao|laranja|bergamota|toranja/i.test(p.notas + p.familia),
    floral: p => /floral/i.test(p.familia),
    amadeirado: p => /amadeirado/i.test(p.familia),
    oriental: p => /oriental/i.test(p.familia),
    aquatico: p => /aquatico/i.test(p.familia),
    gourmand: p => /gourmand/i.test(p.familia),
    especiado: p => /especiado|canela|cardamomo/i.test(p.notas + p.familia),
    almiscar: p => /almiscar/i.test(p.notas),
    cafe: p => /cafe/i.test(p.notas),
    lavanda: p => /lavanda/i.test(p.notas),
    sandalo: p => /sandalo/i.test(p.notas + p.familia),
    noite: p => /oriental|gourmand|amadeirado.*oriental|especiado/i.test(p.familia),
    dia: p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    verao: p => /aquatico|citrico|aromatico/i.test(p.familia),
    inverno: p => /oriental|gourmand|amadeirado.*oriental/i.test(p.familia),
    trabalho: p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    reuniao: p => /aquatico|citrico|aromatico|floral.*amadeirado/i.test(p.familia),
    festa: p => /oriental|gourmand|especiado|floral.*oriental/i.test(p.familia),
    casamento: p => /floral|floral.*amadeirado|floral.*oriental/i.test(p.familia),
    romantico: p => /floral.*oriental|oriental.*floral|gourmand|oriental.*amadeirado/i.test(p.familia),
    encontro: p => /floral.*oriental|oriental|gourmand/i.test(p.familia),
    fresco: p => /aquatico|citrico|aromatico|fougere/i.test(p.familia),
    intenso: p => /oriental|amadeirado.*oriental|gourmand|especiado/i.test(p.familia),
    doce: p => /gourmand|baunilha/i.test(p.notas + p.familia),
    calor: p => /aquatico|citrico|aromatico/i.test(p.familia),
    masculino: p => p.genero === 'M',
    feminino: p => p.genero === 'F',
    unissexo: p => p.genero === 'U',
  };

  const filtrosActivos = [];
  for (const [kw, fn] of Object.entries(FILTROS)) {
    if (c.includes(kw)) filtrosActivos.push(fn);
  }
  if (/homem|masculin|ele\b|namorado|marido|pai\b|irmao/.test(c)) filtrosActivos.push(FILTROS.masculino);
  if (/mulher|feminin|ela\b|namorada|esposa|mae\b|irma/.test(c)) filtrosActivos.push(FILTROS.feminino);
  if (filtrosActivos.length === 0) return null;

  let pool = Object.values(CATALOGO).filter(p => p.preco && Object.keys(p.preco).length > 0);
  if (orcamento && orcamento > 0) {
    const poolOrc = pool.filter(p => precoMin(p.preco) <= orcamento * 1.1);
    if (poolOrc.length >= 3) pool = poolOrc;
  }
  for (const fn of filtrosActivos) {
    const filtrado = pool.filter(fn);
    if (filtrado.length >= 2) pool = filtrado;
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
// ALTERNATIVAS
// ===================================================
function encontrarAlternativas(nomeBase, orcamento) {
  const original = Object.values(CATALOGO).find(p => p.nomeBase === nomeBase);
  if (!original) return null;
  const pool = Object.values(CATALOGO).filter(p =>
    p.preco &&
    p.nomeBase !== nomeBase &&
    precoMin(p.preco) < (orcamento || precoMin(original.preco)) &&
    (p.familia === original.familia || p.genero === original.genero)
  );
  const vistos = new Set();
  const alternativas = [];
  for (const p of pool) {
    if (vistos.has(p.nomeBase)) continue;
    vistos.add(p.nomeBase);
    alternativas.push(p);
    if (alternativas.length >= 3) break;
  }
  return alternativas;
}

// ===================================================
// CONTEXTO SAZONAL
// ===================================================
function getContextoSazonal(p) {
  const f = (p.familia || '').toLowerCase();
  if (/aquatico|citrico/.test(f)) return 'ideal para o dia a dia e para o calor de Angola';
  if (/gourmand|oriental.*amadei/.test(f)) return 'perfeito para noites especiais e encontros';
  if (/floral.*oriental|oriental.*floral/.test(f)) return 'excelente para eventos sociais e jantares';
  if (/aromatico|fougere/.test(f) && /aquatico/.test(f)) return 'muito versátil — do trabalho à noite';
  if (/floral\b/.test(f)) return 'elegante para o dia e para ocasiões especiais';
  if (/amadeirado/.test(f) && !/oriental/.test(f)) return 'sofisticado para reuniões e ambientes formais';
  if (/oriental\b/.test(f) || /especiado/.test(f)) return 'marcante para noite, festas e ocasiões importantes';
  return 'versátil para várias ocasiões';
}

// ===================================================
// DURAÇÃO — CORRIGIDA (Parfum/Extrait correctos)
// ===================================================
function getDuracao(conc) {
  const c = (conc || '').toLowerCase();
  if (/extrait/.test(c)) return '10 a 14h — concentração máxima, projecção extraordinária';
  if (/parfum/.test(c)) return '8 a 12h — forma mais pura, persistência superior';
  if (/edp/.test(c)) return '6 a 8h — versátil do dia para a noite';
  if (/edt/.test(c)) return '4 a 6h — leve e ideal para clima quente';
  return '4 a 6h — leve e refrescante';
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
    'Creed': 'a lendária casa britânica Creed — uma das mais antigas do mundo',
    'Mancera': 'a casa parisiense Mancera — uma das mais respeitadas no universo do nicho',
    'Montale': 'a casa parisiense Montale — especialista em fragrâncias orientais',
    'MFK': 'a Maison Francis Kurkdjian — uma das casas de nicho mais cobiçadas do mundo',
    'By Kilian': 'a exclusiva casa By Kilian',
    'Amouage': 'a opulenta casa omanense Amouage',
    'Parfums de Marly': 'a casa francesa Parfums de Marly — inspirada na corte de Luís XV',
    'Nishane': 'a casa turca Nishane',
    'Initio': 'a casa francesa Initio Parfums Privés',
    'Xerjoff': 'a casa italiana Xerjoff — sinónimo de luxo extremo',
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
      return 'Floral com complexidade e alma. Não é um floral óbvio — tem carácter. É o perfume de quem não precisa de gritar para ser notado.';
    if (/oriental|especiado/.test(f))
      return 'Intenso e magnético. Como especiarias no ar e madeiras a arder numa noite fria. Para ocasiões em que quer fazer uma entrada inesquecível.';
    if (/amadeirado/.test(f))
      return 'Sofisticado, seco e inconfundível. As madeiras nobres dão-lhe uma elegância discreta que combina com qualquer ocasião formal.';
    return 'Uma fragrância de carácter que evolui de forma encantadora ao longo do dia.';
  }

  const contexto = getContextoSazonal(p0);
  let reply = `${emoji} *${nomeBase}*${nichoLabel}${banner}\n\nUma criação de ${casa}.\n\n*Género:* ${generoLabel} | *Família:* ${p0.familia || 'não especificada'}\n\n*Notas:* ${p0.notas}\n\n${getDescricao(p0)}\n\n✨ ${contexto.charAt(0).toUpperCase() + contexto.slice(1)}.\n\n`;

  if (versoes.length === 1) {
    reply += `*Duração estimada:* ${getDuracao(p0.conc)}.\n\n💰 *Preço:*\n${formatPrecos(p0.preco)}\n`;
  } else {
    reply += `💰 *Versões disponíveis:*\n`;
    versoes.forEach(p => {
      reply += `\n*${p.conc}* _(${getDuracao(p.conc)})_:\n${formatPrecos(p.preco)}\n`;
    });
  }
  reply += `\n📦 Entrega em Luanda incluída.\n\nDeseja encomendar ou tem alguma questão sobre esta fragrância?`;
  return reply;
}

// ===================================================
// FORMATAR SUGESTÕES
// ===================================================
function formatarSugestoes(sugestoes, tituloContexto, orcamento) {
  const { designers, nicho } = sugestoes;
  if (!designers.length && !nicho.length) return null;
  let reply = `Com prazer em ajudar!\n`;
  if (tituloContexto) reply += `\nPara *${tituloContexto}*, aqui estão as minhas sugestões:\n`;
  if (designers.length) {
    reply += `\n👔👗 *Designer:*\n`;
    designers.forEach(p => {
      const kzMin = precoMin(p.preco);
      const contexto = getContextoSazonal(p);
      reply += `\n• *${p.nomeBase}*\n _${p.notas}_\n ${contexto.charAt(0).toUpperCase() + contexto.slice(1)}.\n A partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
    });
  }
  if (nicho.length) {
    reply += `\n💎 *Nicho (mais exclusivo):*\n`;
    nicho.forEach(p => {
      const kzMin = precoMin(p.preco);
      const contexto = getContextoSazonal(p);
      reply += `\n• *${p.nomeBase}*\n _${p.notas}_\n ${contexto.charAt(0).toUpperCase() + contexto.slice(1)}.\n A partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
    });
  }
  if (orcamento) reply += `\n_Sugestões dentro do seu orçamento de ${orcamento.toLocaleString('pt-PT')} Kz._`;
  reply += `\n\nQuer saber mais sobre algum destes ou prefere outras opções?`;
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
// DETECTORES DE TIPO DE MENSAGEM
// ===================================================

// TIPO A — pergunta conceptual/educativa
function isTipoA(n) {
  return /o que e|o que sao|o que significa|o que quer dizer|diferenca entre|como funciona|explica|sillage|fougere|chypre|oud.*o que|nicho.*o que|edt.*o que|edp.*o que|concentracao|piramide|notas.*topo|notas.*coracao|notas.*fundo|designer.*nicho|nicho.*designer/.test(n);
}

// TIPO B — afirmação do cliente (NÃO é pedido de perfume)
function isTipoB(n) {
  return /^(nao e|nao sao|isso nao|esse.*nao|essa.*nao)/.test(n)
    || /nao e nicho|nao e designer|nao e igual|calvin klein.*nao|nao.*nicho.*calvin/.test(n);
}

// Detecta pedido de sugestão COM critério
function isContextoSugestao(n) {
  if (isTipoA(n) || isTipoB(n)) return false;
  return /suger|recomendar|aconselh|quero algo|quero um|procuro algo|procuro um|para.*ocasiao|para.*noite|para.*festa|para.*casamento|para.*trabalho|para.*reuniao|para.*romantico|para.*encontro|para.*oferecer|para.*presente|para.*ela\b|para.*ele\b|com.*baunilha|com.*rosa|com.*oud|com.*citrico|com.*floral|com.*oriental|com.*amadei|algo.*fresc|algo.*intenso|algo.*doce|algo.*marcante|algo.*forte|algo.*leve/.test(n);
}

// ===================================================
// ENVIO DE MENSAGEM
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
// BOT PRINCIPAL
// ===================================================
function getBotReply(from, msg) {
  const txt = msg.trim();
  const txtLow = txt.toLowerCase();
  const txtNorm = normalizar(txt);
  const sessao = getSessao(from);
  const orcamento = extrairOrcamento(txt) || (sessao && sessao.orcamento);

  if (extrairOrcamento(txt)) updateSessao(from, { orcamento: extrairOrcamento(txt) });

  // ================================================
  // PRIORIDADE 1 — Perfume específico nomeado
  // Responde APENAS sobre esse perfume.
  // NUNCA menciona outro perfume sem pedido.
  // ================================================
  const perfumeDirecto = pesquisaDirecta(txtLow);
  if (perfumeDirecto) {
    clearSessao(from);
    const resp = respostaPerfume(perfumeDirecto);
    if (orcamento && resp) {
      const versoes = Object.values(CATALOGO).filter(p => p.nomeBase === perfumeDirecto && p.preco);
      const minPreco = versoes.length ? Math.min(...versoes.map(p => precoMin(p.preco))) : 0;
      if (minPreco > orcamento * 1.15) {
        const alts = encontrarAlternativas(perfumeDirecto, orcamento);
        if (alts && alts.length) {
          let extra = `\n💡 *Nota:* Este perfume está acima do orçamento indicado. Temos opções com perfil semelhante:\n`;
          alts.forEach(p => {
            extra += `\n• *${p.nomeBase}* — _${p.notas}_ — a partir de ${precoMin(p.preco).toLocaleString('pt-PT')} Kz`;
          });
          extra += `\n\nDeseja explorar alguma destas ou prefere avançar com o ${perfumeDirecto}?`;
          return resp + extra;
        }
      }
    }
    return resp;
  }

  // ================================================
  // PRIORIDADE 2 — Gerir sessão activa
  // ================================================
  if (sessao) {

    // Confirmação de perfume fuzzy
    if (sessao.tipo === 'confirmar_perfume') {
      if (/^(sim|s\b|yes|claro|certo|isso|ok|quero|e esse|esse mesmo|exacto|e)/.test(txtNorm)) {
        const nb = sessao.nomeBase;
        clearSessao(from);
        return respostaPerfume(nb);
      }
      if (/^(nao|n\b|no\b|nope|outro|diferente|errado|negativo|nada)/.test(txtNorm)) {
        clearSessao(from);
        return `Peço desculpa pela confusão. Pode indicar-me o nome do perfume que procura ou descrever o que tem em mente?`;
      }
      clearSessao(from);
    }

    // CONSULTA GUIADA — 3 estados, 1 pergunta por estado
    // ESTADO 1: recebeu resposta "para quem é"
    if (sessao.tipo === 'consulta_guiada_1') {
      updateSessao(from, { tipo: 'consulta_guiada_2', perfil: txt });
      return `Obrigado! E prefere algo *mais fresco e discreto* ou *mais intenso e marcante*?`;
    }

    // ESTADO 2: recebeu resposta fresco/intenso/marcante
    if (sessao.tipo === 'consulta_guiada_2') {
      // Mapear resposta livre para keywords do motor
      const estiloNorm = normalizar(txt);
      let estiloMapped = estiloNorm;
      if (/marcante|intenso|forte|impactante|chamativo|poderoso|pesado|heavy/.test(estiloNorm))
        estiloMapped = 'intenso oriental noite';
      else if (/fresc|leve|discreto|suave|delicado|aquatico|light/.test(estiloNorm))
        estiloMapped = 'fresco aquatico dia';
      else if (/doce|gourmand|baunilha|caramel/.test(estiloNorm))
        estiloMapped = 'doce gourmand baunilha';
      else if (/floral|flores|rosa|jasmim/.test(estiloNorm))
        estiloMapped = 'floral rosa';
      else if (/madeira|amadeirado|seco/.test(estiloNorm))
        estiloMapped = 'amadeirado seco';
      else if (/oud|oriental|exotico|especiado/.test(estiloNorm))
        estiloMapped = 'oud oriental especiado';
      updateSessao(from, { tipo: 'consulta_guiada_3', estilo: txt, estiloMapped });
      return `Tem algum orçamento em mente? (ex: "150 mil Kz" ou "qualquer")`;
    }

    // ESTADO 3: recebeu orçamento → faz sugestão
    if (sessao.tipo === 'consulta_guiada_3') {
      const perfil = sessao.perfil || '';
      const estiloMapped = sessao.estiloMapped || sessao.estilo || '';
      const orc = extrairOrcamento(txt) || orcamento;
      const criterio = normalizar(perfil + ' ' + estiloMapped);
      clearSessao(from);

      const sugestoes = sugerirPorCriterio(criterio, orc);
      if (sugestoes && (sugestoes.designers.length || sugestoes.nicho.length)) {
        let titulo = 'o seu perfil';
        if (/fresc|aquatico/.test(criterio)) titulo = 'uso diário e clima quente';
        else if (/intenso|oriental|noite/.test(criterio)) titulo = 'noite e ocasiões especiais';
        else if (/doce|gourmand/.test(criterio)) titulo = 'quem aprecia fragrâncias envolventes';
        else if (/floral/.test(criterio)) titulo = 'perfil floral';
        else if (/amadeirado|oud/.test(criterio)) titulo = 'perfil amadeirado e intenso';
        return formatarSugestoes(sugestoes, titulo, orc);
      }
      return `Para o perfil que descreveu, as fragrâncias orientais e amadeiradas da nossa colecção são as mais indicadas. Escreva *catálogo* para ver tudo ou diga-me um nome específico e apresento-o com todos os detalhes.`;
    }

    // Confirmação de escalada
    if (sessao.tipo === 'confirmar_escalada') {
      if (/^(sim|s\b|yes|claro|ok|quero)/.test(txtNorm)) {
        clearSessao(from);
        if (NUMERO_HUMANO) {
          const n = from.replace('@s.whatsapp.net', '').replace('@c.us', '');
          sendMessage(NUMERO_HUMANO, `🔔 *OMNIA PARFUMS — Pedido de atendimento*\n\n📱 Cliente: +${n}\n💬 Motivo: ${sessao.motivo || 'Pedido de atendimento'}\n📝 Contexto: ${sessao.contexto || '-'}\n👆 https://wa.me/${n}\n🕐 ${new Date().toLocaleString('pt-PT')}`);
        }
        return `Perfeito. Já notifiquei a nossa equipa com os detalhes do seu pedido. Um colega entrará em contacto consigo em breve. 🖤\n\nEnquanto aguarda, se tiver mais alguma questão sobre fragrâncias, estarei aqui.`;
      }
      if (/^(nao|n\b|no\b|negativo)/.test(txtNorm)) {
        clearSessao(from);
        return `Compreendo. Como posso continuar a ajudar?`;
      }
      clearSessao(from);
    }
  }

  // ================================================
  // PRIORIDADE 3 — Tipo A: pergunta conceptual
  // Responde ao conceito, NUNCA inventa perfume
  // ================================================
  if (isTipoA(txtNorm)) {
    if (/nicho/.test(txtNorm)) {
      return `Perfume de nicho é o nome que damos às fragrâncias criadas por casas independentes e artesanais — como Mancera, Creed, Byredo, Montale ou Amouage.\n\nAo contrário das grandes marcas de designer (Dior, Chanel, Armani), as casas de nicho produzem em menor quantidade, usam matérias-primas mais raras e criam fragrâncias com personalidade mais única e menos comercial.\n\nResultado: maior duração, maior exclusividade e uma experiência mais pessoal.\n\nTem interesse em explorar algum perfume de nicho em particular?`;
    }
    if (/edt.*edp|edp.*edt|diferenca.*eau|concentracao/.test(txtNorm)) {
      return `A diferença está na concentração de óleos aromáticos:\n\n*EDT* (Eau de Toilette): 5–15%. Leve e fresca. Dura 4 a 6 horas. Ideal para o dia a dia e clima quente.\n\n*EDP* (Eau de Parfum): 15–20%. Mais intensa e duradoura. Dura 6 a 8 horas. Versátil para dia e noite.\n\n*Parfum / Extrait*: 20–40%. Forma mais pura. Dura 8 a 12 horas ou mais.\n\nPara o clima de Angola, EDT para o dia a dia e EDP para ocasiões especiais é a combinação ideal. Tem alguma preferência?`;
    }
    if (/designer.*nicho|nicho.*designer|melhor/.test(txtNorm)) {
      return `Nenhum é melhor — são universos diferentes:\n\n*Designer* (Chanel, Dior, Armani...): grande escala, fórmulas reconhecíveis, qualidade consistente, forte reconhecimento social.\n\n*Nicho* (Mancera, Creed, Montale...): produção limitada, matérias-primas raras, maior exclusividade e duração. Para quem quer algo diferente do que toda a gente usa.\n\nDepende do que procura — reconhecimento, exclusividade ou orçamento. Posso ajudá-lo a escolher?`;
    }
    if (/sillage/.test(txtNorm)) {
      return `Sillage é o "rasto" que o perfume deixa no ar quando passa. Um sillage intenso significa que as pessoas à sua volta vão sentir o perfume mesmo depois de passar. Um sillage discreto é mais íntimo — apenas quem está muito perto consegue sentir.\n\nPara Angola, no clima quente, um sillage moderado é geralmente a escolha mais elegante para o dia. Para noite e eventos, pode optar por algo mais projectante.`;
    }
    return `Boa pergunta! Essa é uma área que domino. Pode reformular o que quer saber sobre ${txt.replace(/\?/g, '')} e respondo com todo o detalhe?`;
  }

  // ================================================
  // PRIORIDADE 4 — Tipo B: afirmação do cliente
  // ================================================
  if (isTipoB(txtNorm)) {
    if (/calvin klein.*nao.*nicho|nao.*nicho.*calvin/.test(txtNorm)) {
      return `Tem razão! Calvin Klein é uma marca de designer — grande escala, fórmulas acessíveis e muito reconhecida. O universo do nicho é diferente: casas mais pequenas, produção limitada e fragrâncias com maior profundidade e exclusividade.\n\nQuer explorar opções de nicho ou prefere continuar nas marcas de designer?`;
    }
    if (/nao e nicho/.test(txtNorm)) {
      return `Tem razão, peço desculpa pela confusão. Quer explorar os nossos perfumes de nicho em separado? Escreva *nicho* para ver a selecção completa.`;
    }
    return `Obrigado pela observação! Como posso ajudá-lo com as nossas fragrâncias?`;
  }

  // ================================================
  // PRIORIDADE 5 — Comandos principais
  // ================================================

  // Saudações
  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|ola|boas)/.test(txtNorm)) {
    const h = new Date().getHours();
    const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const banner = DESCONTO_SEMANA > 0 ? `\n\n🔥 *PROMOÇÃO ACTIVA: ${DESCONTO_SEMANA}% de desconto em todo o catálogo.*` : '';
    return `${s}! Bem-vindo à *Omnia Parfums*. 🖤${banner}\n\nSou o seu consultor de fragrâncias. Temos uma selecção cuidada de perfumes designer e de nicho, todos entregues em Luanda.\n\nComo posso ajudá-lo hoje?\n• Procura um perfume específico?\n• Deseja sugestões para uma ocasião?\n• Ou prefere explorar o nosso *catálogo*?`;
  }

  // Despedidas
  if (/^(obrigad|ate logo|tchau|xau|adeus|bye|boa noite$)/.test(txtNorm)) {
    return `Foi um prazer poder ajudar. A *Omnia Parfums* fica sempre à sua disposição. Até breve! 🖤`;
  }

  // Pedido de atendimento humano
  if (/falar com.*humano|falar com.*pessoa|atendente|responsavel|gerente/.test(txtNorm)) {
    setSessao(from, { tipo: 'confirmar_escalada', motivo: 'Pedido explícito do cliente', contexto: txt });
    return `Naturalmente. Deseja que notifique um colega para continuar o seu atendimento?`;
  }

  // CATÁLOGO — 4 grupos separados
  if (/catalogo|todos os perfumes|ver tudo|ver colecao/.test(txtNorm)) {
    const masc  = getNomesAgrupados('M');
    const fem   = getNomesAgrupados('F');
    const uni   = getNomesAgrupados('U');
    const nicho = getNomesAgrupados(null, true);
    return `🖤 *Catálogo Omnia Parfums*${getBannerDesconto()}\n\n👔 *MASCULINOS — Designer (${masc.length})*\n${masc.join('\n')}\n\n👗 *FEMININOS — Designer (${fem.length})*\n${fem.join('\n')}\n\n✨ *UNISSEXO — Designer (${uni.length})*\n${uni.join('\n')}\n\n💎 *NICHO & LUXO (${nicho.length})*\n${nicho.join('\n')}\n\n_Escreva o nome para ver versões, preços e descrição._`;
  }

  // Masculinos — designer + nicho separados
  if (/^(masculin|perfume.*homem|homem.*perfume|para.*ele\b)/.test(txtNorm)) {
    const designer = getNomesAgrupados('M');
    const nichoMasc = (() => {
      const map = {};
      Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'M').forEach(p => {
        if (!map[p.nomeBase]) map[p.nomeBase] = [];
        if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc);
      });
      return Object.entries(map).map(([base, concs]) => `• ${base} _(${concs.join(' / ')})`);
    })();
    return `👔 *Perfumes Masculinos — Omnia Parfums*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoMasc.length ? nichoMasc.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
  }

  // Femininos — designer + nicho separados
  if (/^(feminin|perfume.*mulher|mulher.*perfume|para.*ela\b)/.test(txtNorm)) {
    const designer = getNomesAgrupados('F');
    const nichoFem = (() => {
      const map = {};
      Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'F').forEach(p => {
        if (!map[p.nomeBase]) map[p.nomeBase] = [];
        if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc);
      });
      return Object.entries(map).map(([base, concs]) => `• ${base} _(${concs.join(' / ')})`);
    })();
    return `👗 *Perfumes Femininos — Omnia Parfums*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoFem.length ? nichoFem.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
  }

  // Nicho — dividido por género
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

  // Entrega/envio
  if (/entrega|envio|entregam|como.*chega|onde.*entreg/.test(txtNorm)) {
    return `📦 *Entrega em Luanda incluída* no preço de todos os nossos produtos.\n\nApós confirmação da encomenda, o prazo habitual é de 24 a 48 horas úteis. Para mais detalhes sobre a sua zona específica, posso notificar um colega. Pretende?`;
  }

  // Preço / desconto
  if (/desconto|promocao|oferta|preco.*melhor|melhor.*preco/.test(txtNorm)) {
    if (DESCONTO_SEMANA > 0) {
      return `🔥 Sim! Temos actualmente *${DESCONTO_SEMANA}% de desconto* em todo o catálogo. Os preços apresentados já reflectem este desconto.\n\nHá algum perfume específico que queira ver?`;
    }
    return `Os nossos preços são fixos e reflectem a qualidade e autenticidade dos produtos. Se tiver interesse num produto específico, posso verificar se há alguma promoção activa. Qual o perfume que tem em mente?`;
  }

  // ================================================
  // PRIORIDADE 6 — Sugestão com critério (isContextoSugestao)
  // Se já tem info suficiente, sugere directamente.
  // Só inicia consulta guiada se precisar de mais info.
  // ================================================
  if (isContextoSugestao(txtNorm)) {
    const sugestaoDirecta = sugerirPorCriterio(txtNorm, orcamento);
    if (sugestaoDirecta && (sugestaoDirecta.designers.length || sugestaoDirecta.nicho.length)) {
      // Tem critério suficiente — sugere directamente
      let titulo = null;
      if (/noite|festa|especial|romantico|encontro/.test(txtNorm)) titulo = 'noite e ocasiões especiais';
      else if (/dia|trabalho|reuniao|escritorio/.test(txtNorm)) titulo = 'uso diário';
      else if (/verao|calor/.test(txtNorm)) titulo = 'clima quente';
      else if (/inverno|frio/.test(txtNorm)) titulo = 'clima frio';
      return formatarSugestoes(sugestaoDirecta, titulo, orcamento);
    }
    // Precisa de mais info — inicia consulta guiada com UMA pergunta
    setSessao(from, { tipo: 'consulta_guiada_1' });
    return `Com prazer em ajudar! É para uso próprio ou para oferecer?`;
  }

  // Pedido vago sem critério (mais barato, opções, etc.)
  if (/mais barato|mais acessivel|opcoes.*baratas|algo.*barato|cabem no orcamento|cabe no orcamento|dentro do orcamento|meu orcamento|tens algo bom|o que recomendas|o que tens|o que sugeres/.test(txtNorm)) {
    if (/barato|acessivel|orcamento|cabe/.test(txtNorm)) {
      return `Claro, vamos encontrar algo que se encaixe bem! Qual é o orçamento que tem em mente? E é para uso próprio ou para oferecer?`;
    }
    setSessao(from, { tipo: 'consulta_guiada_1' });
    return `Com prazer em ajudar! É para uso próprio ou para oferecer?`;
  }

  // ================================================
  // PRIORIDADE 7 — Fuzzy search (nome com erro)
  // ================================================
  if (txt.length > 3 && txt.length < 60) {
    const fuzzy = pesquisaFuzzy(txt);
    if (fuzzy) {
      setSessao(from, { tipo: 'confirmar_perfume', nomeBase: fuzzy.nomeBase });
      return `Estará a referir-se ao *${fuzzy.nomeBase}*?`;
    }
  }

  // ================================================
  // FALLBACK — resposta genérica inteligente
  // ================================================
  return `Obrigado pela sua mensagem! Para o ajudar melhor:\n\n• Escreva o nome de um perfume para ver detalhes e preços\n• Escreva *catálogo* para ver toda a nossa selecção\n• Descreva o que procura (ex: "algo marcante para noite") e faço sugestões personalizadas\n• Ou diga *masculinos*, *femininos* ou *nicho* para filtrar`;
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
