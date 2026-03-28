const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://evolution-api-production-e0f4.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'omnia-parfums';
const NUMERO_HUMANO = process.env.NUMERO_HUMANO || '244930300694@s.whatsapp.net';

// ===== CATALOGO OMNIA PARFUMS =====
// 114 perfumes — Designer + Nicho
// Para actualizar precos ou adicionar perfumes edita este objecto
const CATALOGO = {
  'dior sauvage': { nome: 'Dior Sauvage', genero: 'M', preco: {'60ml': 318100, '100ml': 294600, '200ml': 373000}, notas: 'Bergamota, Ambroxan, Pimenta Rosa' },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', genero: 'M', preco: {'60ml': 344800}, notas: 'Cardamomo, Lavanda, Patchouli' },
  'dior j\'adore': { nome: 'Dior J\'adore', genero: 'F', preco: {'30ml': 192800, '50ml': 231900, '100ml': 302500, '150ml': 380800}, notas: 'Magnólia, Rosa, Jasmim' },
  'dior miss dior': { nome: 'Dior Miss Dior', genero: 'F', preco: {'30ml': 188100, '50ml': 228800, '100ml': 294600, '35ml': 208400, '80ml': 297800}, notas: 'Peónia, Rosa, Patchouli' },
  'dior homme intense': { nome: 'Dior Homme Intense', genero: 'M', preco: {'50ml': 216300, '100ml': 282100}, notas: 'Íris, Cedro, Âmbar' },
  'bleu de chanel': { nome: 'Bleu de Chanel', genero: 'M', preco: {'50ml': 315000, '100ml': 410600, '150ml': 432500}, notas: 'Citrus, Incenso, Sândalo' },
  'chanel coco mademoiselle': { nome: 'Chanel Coco Mademoiselle', genero: 'F', preco: {'50ml': 272700, '100ml': 369800, '150ml': 454400}, notas: 'Bergamota, Rosa, Patchouli' },
  'chanel coco mademoiselle intense': { nome: 'Chanel Coco Mademoiselle Intense', genero: 'F', preco: {'50ml': 302500, '100ml': 402700}, notas: 'Bergamota, Rosa, Vetiver' },
  'chanel n°5': { nome: 'Chanel N°5', genero: 'F', preco: {'35ml': 216300, '50ml': 277400, '100ml': 380800}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar' },
  'chanel chance': { nome: 'Chanel Chance', genero: 'F', preco: {'50ml': 272700, '100ml': 368300}, notas: 'Cítrico, Rosa, Almíscar Branco' },
  'chanel chance eau tendre': { nome: 'Chanel Chance Eau Tendre', genero: 'F', preco: {'50ml': 272700, '100ml': 368300}, notas: 'Toranja, Quéssia, Almíscar Branco' },
  'ysl black opium': { nome: 'YSL Black Opium', genero: 'F', preco: {'30ml': 183400, '50ml': 266400, '90ml': 283700, '150ml': 380800}, notas: 'Café, Baunilha, Patchouli, Flor Branca' },
  'ysl libre': { nome: 'YSL Libre', genero: 'F', preco: {'30ml': 191200, '50ml': 277400, '90ml': 302500}, notas: 'Lavanda, Flor de Laranjeira, Cedro' },
  'ysl y': { nome: 'YSL Y', genero: 'M', preco: {'60ml': 266400, '100ml': 294600, '200ml': 383900}, notas: 'Bergamota, Gengibre, Cedro' },
  'ysl l\'homme': { nome: 'YSL L\'Homme', genero: 'M', preco: {'60ml': 222500, '100ml': 282100}, notas: 'Bergamota, Cedro, Âmbar' },
  'rabanne 1 million': { nome: 'Rabanne 1 Million', genero: 'M', preco: {'50ml': 239800, '100ml': 313400, '200ml': 347900}, notas: 'Mandarina, Canela, Âmbar, Couro' },
  'rabanne invictus': { nome: 'Rabanne Invictus', genero: 'M', preco: {'50ml': 227200, '100ml': 305600, '200ml': 329100}, notas: 'Toranja, Louro, Âmbar' },
  'rabanne phantom': { nome: 'Rabanne Phantom', genero: 'M', preco: {'50ml': 194300, '100ml': 250700}, notas: 'Limão, Lavanda, Vetiver' },
  'rabanne fame': { nome: 'Rabanne Fame', genero: 'F', preco: {'30ml': 180200, '50ml': 217800, '80ml': 277400}, notas: 'Mandarina, Jasmim, Patchouli' },
  'armani acqua di giò': { nome: 'Armani Acqua di Giò', genero: 'M', preco: {'50ml': 189600, '100ml': 244500, '200ml': 324400, '75ml': 255400, '125ml': 319700}, notas: 'Citrus, Alga Marinha, Patchouli' },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', genero: 'M', preco: {'75ml': 280500, '125ml': 352600}, notas: 'Incenso, Madeira, Cipreste' },
  'armani sì': { nome: 'Armani Sì', genero: 'F', preco: {'30ml': 183400, '50ml': 228800, '100ml': 294600}, notas: 'Groselha, Rosa, Almíscar, Âmbar' },
  'armani sì passione': { nome: 'Armani Sì Passione', genero: 'F', preco: {'50ml': 238200, '100ml': 308700}, notas: 'Bergamota, Rosa, Baunilha' },
  'lancôme la vie est belle': { nome: 'Lancôme La Vie est Belle', genero: 'F', preco: {'30ml': 161400, '50ml': 195900, '75ml': 217800, '100ml': 239800, '150ml': 272700, '200ml': 421500}, notas: 'Íris, Pralinê, Baunilha' },
  'lancôme idôle': { nome: 'Lancôme Idôle', genero: 'F', preco: {'25ml': 158300, '50ml': 206900, '100ml': 271100}, notas: 'Rosa de Grasse, Almíscar, Âmbar' },
  'lancôme trésor': { nome: 'Lancôme Trésor', genero: 'F', preco: {'30ml': 153600, '50ml': 189600, '100ml': 250700}, notas: 'Pêssego, Rosa, Almíscar, Âmbar' },
  'versace eros': { nome: 'Versace Eros', genero: 'M', preco: {'50ml': 233500, '100ml': 266400, '200ml': 315000}, notas: 'Menta, Tonka, Âmbar' },
  'versace eros flame': { nome: 'Versace Eros Flame', genero: 'M', preco: {'50ml': 194300, '100ml': 255400}, notas: 'Toranja, Romã, Patchouli' },
  'versace bright crystal': { nome: 'Versace Bright Crystal', genero: 'F', preco: {'30ml': 147300, '50ml': 180200, '90ml': 228800}, notas: 'Romã, Peónia, Almíscar' },
  'versace dylan blue pour femme': { nome: 'Versace Dylan Blue Pour Femme', genero: 'F', preco: {'50ml': 186500, '100ml': 244500}, notas: 'Groselha, Peónia, Âmbar Branco' },
  'hugo boss bottled': { nome: 'Hugo Boss Bottled', genero: 'M', preco: {'50ml': 183400, '100ml': 233500}, notas: 'Maçã, Madeira de Sândalo, Cedro' },
  'hugo boss the scent': { nome: 'Hugo Boss The Scent', genero: 'M', preco: {'50ml': 172400, '100ml': 217800}, notas: 'Gengibre, Osmanthus, Couro' },
  'hugo boss the scent for her': { nome: 'Hugo Boss The Scent For Her', genero: 'F', preco: {'30ml': 150500, '50ml': 186500}, notas: 'Framboesa, Osmanthus, Âmbar' },
  'narciso rodriguez for her': { nome: 'Narciso Rodriguez For Her', genero: 'F', preco: {'30ml': 161400, '50ml': 205300, '100ml': 266400}, notas: 'Rosa, Almíscar, Âmbar' },
  'narciso rodriguez musc noir rose': { nome: 'Narciso Rodriguez Musc Noir Rose', genero: 'F', preco: {'30ml': 172400, '50ml': 217800}, notas: 'Rosa, Almíscar Negro, Sândalo' },
  'issey miyake l\'eau d\'issey h': { nome: 'Issey Miyake L\'Eau d\'Issey H', genero: 'M', preco: {'50ml': 189600, '100ml': 211600}, notas: 'Yuzu, Coriandro, Almíscar' },
  'issey miyake l\'eau d\'issey f': { nome: 'Issey Miyake L\'Eau d\'Issey F', genero: 'F', preco: {'25ml': 142600, '50ml': 180200}, notas: 'Lótus, Peónia, Cedro' },
  'calvin klein ck one': { nome: 'Calvin Klein CK One', genero: 'U', preco: {'50ml': 131700, '100ml': 158300, '200ml': 186500}, notas: 'Bergamota, Chá Verde, Almíscar' },
  'calvin klein eternity': { nome: 'Calvin Klein Eternity', genero: 'F', preco: {'30ml': 136400, '50ml': 167700, '100ml': 211600}, notas: 'Orquídea, Almíscar, Sândalo' },
  'calvin klein obsession': { nome: 'Calvin Klein Obsession', genero: 'F', preco: {'50ml': 172400, '100ml': 217800}, notas: 'Especiarias, Almíscar, Baunilha' },
  'tom ford oud wood': { nome: 'Tom Ford Oud Wood', genero: 'U', preco: {'50ml': 410600, '100ml': 589200}, notas: 'Oud, Sândalo, Vetiver' },
  'tom ford black orchid': { nome: 'Tom Ford Black Orchid', genero: 'U', preco: {'50ml': 358900, '100ml': 498300}, notas: 'Trufa, Orquídea Preta, Patchouli' },
  'tom ford tobacco vanille': { nome: 'Tom Ford Tobacco Vanille', genero: 'U', preco: {'50ml': 612700, '100ml': 866500}, notas: 'Tabaco, Baunilha, Madeira de Cedro' },
  'tom ford neroli portofino': { nome: 'Tom Ford Neroli Portofino', genero: 'U', preco: {'50ml': 548400}, notas: 'Bergamota, Néroli, Âmbar' },
  'tom ford lost cherry': { nome: 'Tom Ford Lost Cherry', genero: 'U', preco: {'50ml': 608000}, notas: 'Cereja, Âmbar, Baunilha' },
  'tom ford rose prick': { nome: 'Tom Ford Rose Prick', genero: 'U', preco: {'50ml': 608000}, notas: 'Rosa, Pimenta, Fava de Tonka' },
  'guerlain mon guerlain': { nome: 'Guerlain Mon Guerlain', genero: 'F', preco: {'30ml': 180200, '50ml': 228800, '100ml': 302500}, notas: 'Lavanda, Baunilha, Almíscar' },
  'guerlain l\'homme idéal': { nome: 'Guerlain L\'Homme Idéal', genero: 'M', preco: {'50ml': 206900}, notas: 'Amêndoa, Lavanda, Couro' },
  'guerlain la petite robe noire': { nome: 'Guerlain La Petite Robe Noire', genero: 'F', preco: {'30ml': 167700, '50ml': 211600, '100ml': 277400}, notas: 'Bergamota, Rosa, Alcaçuz, Patchouli' },
  'mugler angel': { nome: 'Mugler Angel', genero: 'F', preco: {'25ml': 167700, '50ml': 222500, '100ml': 294600}, notas: 'Caramelo, Patchouli, Baunilha' },
  'mugler angel nova': { nome: 'Mugler Angel Nova', genero: 'F', preco: {'50ml': 228800}, notas: 'Lavanda, Pralinê, Almíscar' },
  'mugler alien': { nome: 'Mugler Alien', genero: 'F', preco: {'30ml': 180200, '60ml': 239800}, notas: 'Jasmim, Âmbar Branco, Madeira de Caxemira' },
  'mugler a*men': { nome: 'Mugler A*Men', genero: 'M', preco: {'50ml': 233500}, notas: 'Café, Patchouli, Âmbar' },
  'mancera cedrat boise': { nome: 'Mancera Cedrat Boise', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Limão, Cassis, Vetiver, Cedro' },
  'mancera instant crush': { nome: 'Mancera Instant Crush', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Laranja, Rosa, Baunilha, Âmbar' },
  'mancera roses vanille': { nome: 'Mancera Roses Vanille', genero: 'F', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Rosa, Baunilha, Patchouli' },
  'mancera red tobacco': { nome: 'Mancera Red Tobacco', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Tabaco, Rosa, Especiarias, Âmbar' },
  'mancera amore caffè': { nome: 'Mancera Amore Caffè', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Café, Baunilha, Patchouli' },
  'mancera french riviera': { nome: 'Mancera French Riviera', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Bergamota, Cedro, Âmbar Branco' },
  'mancera tonka cola': { nome: 'Mancera Tonka Cola', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Tonka, Cola, Baunilha' },
  'mancera coco vanille': { nome: 'Mancera Coco Vanille', genero: 'F', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Coco, Baunilha, Almíscar' },
  'mancera sicily': { nome: 'Mancera Sicily', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Limão Siciliano, Bergamota, Néroli' },
  'mancera black gold': { nome: 'Mancera Black Gold', genero: 'M', preco: {'60ml': 294600, '120ml': 412100}, notas: 'Oud, Baunilha, Âmbar, Sândalo' },
  'mancera wild fruits': { nome: 'Mancera Wild Fruits', genero: 'U', preco: {'60ml': 279000, '120ml': 388600}, notas: 'Frutas Silvestres, Rosa, Âmbar' },
  'montale arabians tonka': { nome: 'Montale Arabians Tonka', genero: 'U', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Açafrão, Oud, Rosa, Tonka' },
  'montale roses musk': { nome: 'Montale Roses Musk', genero: 'F', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Almíscar, Âmbar' },
  'montale intense café': { nome: 'Montale Intense Café', genero: 'U', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Café, Baunilha, Âmbar' },
  'montale black aoud': { nome: 'Montale Black Aoud', genero: 'M', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Oud, Rosa, Patchouli, Vetiver' },
  'montale dark aoud': { nome: 'Montale Dark Aoud', genero: 'M', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Oud, Sândalo, Almíscar Negro' },
  'montale amber musk': { nome: 'Montale Amber Musk', genero: 'U', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'montale starry nights': { nome: 'Montale Starry Nights', genero: 'U', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa Selvagem, Violeta, Açafrão' },
  'montale vanilla cake': { nome: 'Montale Vanilla Cake', genero: 'F', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Baunilha, Leite, Caramelo' },
  'montale rose elixir': { nome: 'Montale Rose Elixir', genero: 'F', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Rosa, Almíscar, Vetiver' },
  'montale sensual instinct': { nome: 'Montale Sensual Instinct', genero: 'U', preco: {'50ml': 302500, '100ml': 326000}, notas: 'Açafrão, Oud, Patchouli' },
  'creed aventus': { nome: 'Creed Aventus', genero: 'M', preco: {'50ml': 664200, '100ml': 928100}, notas: 'Bergamota, Groselha Preta, Bétula, Almíscar' },
  'creed aventus for her': { nome: 'Creed Aventus for Her', genero: 'F', preco: {'50ml': 604600, '75ml': 723800}, notas: 'Bergamota, Rosa, Baunilha' },
  'creed green irish tweed': { nome: 'Creed Green Irish Tweed', genero: 'M', preco: {'50ml': 579000, '100ml': 826000}, notas: 'Íris, Sândalo, Âmbar' },
  'creed millesime imperial': { nome: 'Creed Millesime Imperial', genero: 'U', preco: {'50ml': 579000, '100ml': 826000}, notas: 'Bergamota, Alga, Almíscar' },
  'parfums de marly layton': { nome: 'Parfums de Marly Layton', genero: 'M', preco: {'75ml': 510900, '125ml': 664200}, notas: 'Maçã, Lavanda, Baunilha, Sândalo' },
  'parfums de marly layton exclusif': { nome: 'Parfums de Marly Layton Exclusif', genero: 'M', preco: {'75ml': 562000}, notas: 'Maçã, Lavanda, Noz-moscada, Sândalo' },
  'parfums de marly delina': { nome: 'Parfums de Marly Delina', genero: 'F', preco: {'75ml': 493900, '125ml': 638600}, notas: 'Rhubarbo, Peónia, Rosa de Maio' },
  'parfums de marly delina exclusif': { nome: 'Parfums de Marly Delina Exclusif', genero: 'F', preco: {'75ml': 562000}, notas: 'Rhubarbo, Peónia, Rosa, Almíscar' },
  'parfums de marly pegasus': { nome: 'Parfums de Marly Pegasus', genero: 'M', preco: {'75ml': 493900, '125ml': 638600}, notas: 'Lavanda, Almendra, Baunilha, Sândalo' },
  'parfums de marly percival': { nome: 'Parfums de Marly Percival', genero: 'M', preco: {'75ml': 493900}, notas: 'Bergamota, Lavanda, Almíscar' },
  'parfums de marly cassili': { nome: 'Parfums de Marly Cassili', genero: 'F', preco: {'75ml': 493900}, notas: 'Rosa, Almíscar, Sândalo' },
  'nishane hacivat': { nome: 'Nishane Hacivat', genero: 'U', preco: {'50ml': 345700, '100ml': 464900}, notas: 'Bergamota, Abacaxi, Cedro, Patchouli' },
  'nishane ani': { nome: 'Nishane Ani', genero: 'U', preco: {'50ml': 345700}, notas: 'Flor de Laranjeira, Almíscar, Âmbar' },
  'nishane zenne': { nome: 'Nishane Zenne', genero: 'U', preco: {'50ml': 345700}, notas: 'Rosa, Oud, Âmbar' },
  'nishane afrika olifant': { nome: 'Nishane Afrika Olifant', genero: 'U', preco: {'50ml': 362700}, notas: 'Âmbar, Vetiver, Patchouli' },
  'initio oud for greatness': { nome: 'Initio Oud for Greatness', genero: 'U', preco: {'90ml': 536400}, notas: 'Oud, Almíscar, Especiarias, Âmbar' },
  'initio atomic rose': { nome: 'Initio Atomic Rose', genero: 'U', preco: {'90ml': 536400}, notas: 'Rosa, Almíscar, Âmbar' },
  'initio black gold': { nome: 'Initio Black Gold', genero: 'U', preco: {'90ml': 536400}, notas: 'Sândalp, Âmbar, Almíscar' },
  'initio rehab': { nome: 'Initio Rehab', genero: 'U', preco: {'90ml': 536400}, notas: 'Baunilha, Almíscar, Patchouli' },
  'xerjoff nio': { nome: 'Xerjoff Nio', genero: 'U', preco: {'50ml': 391700, '100ml': 533000}, notas: 'Yuzu, Menta, Madeira' },
  'xerjoff oud stars alexandria ii': { nome: 'Xerjoff Oud Stars Alexandria II', genero: 'U', preco: {'50ml': 545000}, notas: 'Oud, Sândalo, Rosa' },
  'mfk baccarat rouge 540': { nome: 'MFK Baccarat Rouge 540', genero: 'U', preco: {'70ml': 655700}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk baccarat rouge 540 extrait': { nome: 'MFK Baccarat Rouge 540 Extrait', genero: 'U', preco: {'70ml': 766400}, notas: 'Jasmim, Açafrão, Cedro Âmbar' },
  'mfk 724': { nome: 'MFK 724', genero: 'U', preco: {'70ml': 562000}, notas: 'Bergamota, Lentisco, Almíscar' },
  'mfk grand soir': { nome: 'MFK Grand Soir', genero: 'U', preco: {'70ml': 562000}, notas: 'Âmbar, Baunilha, Almíscar' },
  'mfk gentle fluidity gold': { nome: 'MFK Gentle Fluidity Gold', genero: 'U', preco: {'70ml': 562000}, notas: 'Noz-moscada, Âmbar, Baunilha' },
  'by kilian angels share': { nome: 'By Kilian Angels Share', genero: 'U', preco: {'50ml': 545000}, notas: 'Conhaque, Baunilha, Canela, Âmbar' },
  'by kilian love don\'t be shy': { nome: 'By Kilian Love Don\'t Be Shy', genero: 'U', preco: {'50ml': 545000}, notas: 'Néroli, Caramelo, Almíscar' },
  'by kilian good girl gone bad': { nome: 'By Kilian Good Girl Gone Bad', genero: 'F', preco: {'50ml': 545000}, notas: 'Ylang, Magnólia, Rosa, Íris' },
  'amouage reflection man': { nome: 'Amouage Reflection Man', genero: 'M', preco: {'50ml': 519400, '100ml': 689700}, notas: 'Alecrim, Íris, Sândalo' },
  'amouage interlude man': { nome: 'Amouage Interlude Man', genero: 'M', preco: {'50ml': 519400}, notas: 'Incenso, Âmbar, Orégão' },
  'amouage memoir man': { nome: 'Amouage Memoir Man', genero: 'M', preco: {'50ml': 519400}, notas: 'Absinto, Incenso, Âmbar' },
  'amouage gold woman': { nome: 'Amouage Gold Woman', genero: 'F', preco: {'50ml': 519400}, notas: 'Rosa, Jasmim, Incenso, Âmbar' },
  'frederic malle portrait of a lady': { nome: 'Frederic Malle Portrait of a Lady', genero: 'F', preco: {'50ml': 567100, '100ml': 754400}, notas: 'Rosa, Patchouli, Sândalo, Âmbar' },
  'frederic malle musc ravageur': { nome: 'Frederic Malle Musc Ravageur', genero: 'U', preco: {'50ml': 545000}, notas: 'Âmbar, Almíscar, Baunilha' },
  'frederic malle cologne indelebile': { nome: 'Frederic Malle Cologne Indelebile', genero: 'U', preco: {'50ml': 545000}, notas: 'Almíscar, Néroli, Jasmim' },
  'roja dove enigma': { nome: 'Roja Dove Enigma', genero: 'M', preco: {'50ml': 885600}, notas: 'Bergamota, Rosa, Incenso, Âmbar' },
  'roja dove elysium': { nome: 'Roja Dove Elysium', genero: 'M', preco: {'50ml': 885600}, notas: 'Bergamota, Lavanda, Sândalo' },
  'roja dove danger': { nome: 'Roja Dove Danger', genero: 'M', preco: {'50ml': 885600}, notas: 'Cabeça: Cítrico, Coração: Rosa, Fundo: Âmbar' },
  'roja dove scandal': { nome: 'Roja Dove Scandal', genero: 'F', preco: {'50ml': 885600}, notas: 'Aldeídos, Rosa, Âmbar' },};

function formatPrecos(preco) {
  return Object.entries(preco).map(([ml, kz]) => `  - ${ml}: ${kz.toLocaleString('pt-PT')} Kz`).join('\n');
}

function getBotReply(msg) {
  const txt = msg.toLowerCase().trim();

  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|olá|boas)/.test(txt)) {
    const totalM = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>p.nome))].length;
    const totalF = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>p.nome))].length;
    const totalU = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='U').map(p=>p.nome))].length;
    return `🖤 *Bem-vindo à Omnia Parfums!*\n\nSomos a tua perfumaria de confiança em Luanda. 🇦🇴\n\nTemos *${Object.keys(CATALOGO).length}+ perfumes* em stock:\n👔 ${totalM} Masculinos · 👗 ${totalF} Femininos · ✨ ${totalU} Unissexo\n\nPodes:\n- Escrever o nome de um perfume para ver o preço\n- Escrever *masculinos* para perfumes de homem\n- Escrever *femininos* para perfumes de mulher\n- Escrever *nicho* para perfumes de luxo\n- Escrever *catálogo* para ver todos\n- Escrever *encomendar* para fazer encomenda\n\n_Entrega em Luanda incluída_ 📦`;
  }

  if (/cat.logo|todos|lista|ver tudo/.test(txt)) {
    const masc = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>`• ${p.nome}`))];
    const fem = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>`• ${p.nome}`))];
    const uni = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='U').map(p=>`• ${p.nome}`))];
    return `🖤 *Catálogo Omnia Parfums*\n\n👔 *MASCULINOS (${masc.length})*\n${masc.join('\n')}\n\n👗 *FEMININOS (${fem.length})*\n${fem.join('\n')}\n\n✨ *UNISSEXO/NICHO (${uni.length})*\n${uni.join('\n')}\n\n_Escreve o nome para ver o preço_ 💛`;
  }

  if (/^masculin|^homem|para ele|perfume.*homem|homem.*perfume/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>`• ${p.nome}`))];
    return `👔 *Perfumes Masculinos — Omnia Parfums*\n\n${lista.join('\n')}\n\n_Escreve o nome completo para ver preço_ 💛`;
  }

  if (/^feminin|^mulher|para ela|perfume.*mulher|mulher.*perfume/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>`• ${p.nome}`))];
    return `👗 *Perfumes Femininos — Omnia Parfums*\n\n${lista.join('\n')}\n\n_Escreve o nome completo para ver preço_ 💛`;
  }

  if (/nicho|luxo|exclusivo|premium/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='U').map(p=>`• ${p.nome}`))];
    return `✨ *Perfumes Nicho & Luxo — Omnia Parfums*\n\n${lista.join('\n')}\n\n_Escreve o nome para ver preço_ 💛`;
  }

  if (/encomendar|encomenda|comprar|quero|pedido/.test(txt)) {
    return `📦 *Fazer Encomenda*\n\nEnvia-nos:\n1️⃣ Nome do perfume\n2️⃣ Tamanho (ml)\n3️⃣ O teu nome\n4️⃣ Morada de entrega em Luanda\n\n💛 Respondemos em menos de 30 minutos!\n\n_Pagamento: Transferência, Multicaixa Express ou à entrega_`;
  }

  if (/entrega|envio/.test(txt)) {
    return `📦 *Entregas Omnia Parfums*\n\n✅ Entrega em toda Luanda\n⏰ Prazo: 24-48 horas\n💰 Entrega incluída no preço\n\n_Encomenda mínima: 1 frasco_`;
  }

  // Procura no catalogo
  for (const [key, produto] of Object.entries(CATALOGO)) {
    if (txt.includes(key) || txt.includes(produto.nome.toLowerCase())) {
      const emoji = produto.genero==='M' ? '👔' : produto.genero==='F' ? '👗' : '✨';
      return `${emoji} *${produto.nome}*\n\n🌸 Notas: ${produto.notas}\n\n💰 *Preços:*\n${formatPrecos(produto.preco)}\n\n📦 Entrega em Luanda incluída\n\n_Para encomendar, escreve *encomendar*_ 🖤`;
    }
  }

  // Nao encontrou - escalada para humano
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
app.get('/', (req, res) => res.send(`🖤 Omnia Parfums Bot — ${Object.keys(CATALOGO).length} perfumes activos`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot activo — ${Object.keys(CATALOGO).length} perfumes carregados`));
