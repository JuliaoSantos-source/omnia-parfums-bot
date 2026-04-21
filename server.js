const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://evolution-api-production-e0f4.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'omnia-parfums';
const NUMERO_HUMANO = process.env.NUMERO_HUMANO || '244930300694@s.whatsapp.net';
const DESCONTO_SEMANA = parseFloat(process.env.DESCONTO_SEMANA || '0');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// ===================================================
// VISÃO IA — Identificar perfume numa imagem
// ===================================================
async function identificarPerfumeNaImagem(mediaUrl, mediaBase64) {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    // Construir o conteúdo da imagem
    let imagemContent;
    if (mediaBase64) {
      imagemContent = {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: mediaBase64 }
      };
    } else if (mediaUrl) {
      imagemContent = {
        type: 'image',
        source: { type: 'url', url: mediaUrl }
      };
    } else {
      return null;
    }

    const prompt = `Analisa esta imagem de um perfume.
Identifica:
1. Nome exacto do perfume (ex: "Dior Sauvage EDP", "Chanel N°5")
2. Marca (ex: Dior, Chanel, YSL)
3. Concentração se visível (EDT, EDP, Parfum, Extrait)

Responde APENAS com um JSON no formato:
{"nome": "Nome Completo", "marca": "Marca", "conc": "EDP", "encontrado": true}

Se não consegues identificar o perfume, responde:
{"nome": null, "marca": null, "conc": null, "encontrado": false}

Não incluas mais nada na resposta — apenas o JSON.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [imagemContent, { type: 'text', text: prompt }]
      }]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const texto = response.data?.content?.[0]?.text || '';
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Erro vision API:', e.message);
    return null;
  }
}

// Descarregar media da Evolution API e converter para base64
async function downloadMediaBase64(from, msgId) {
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/chat/getBase64FromMediaMessage/${INSTANCE}`,
      { message: { key: { remoteJid: from, id: msgId } } },
      { headers: { apikey: EVOLUTION_KEY } }
    );
    return response.data?.base64 || null;
  } catch (e) {
    console.error('Erro download media:', e.message);
    return null;
  }
}

// ===================================================
// CATÁLOGO — 133 perfumes
// ===================================================
const CATALOGO = {
  'dior homme intense edp': { nome: 'Dior Homme Intense EDP', nomeBase: 'Dior Homme Intense', genero: 'M', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'50ml': 150900, '100ml': 199600}, notas: 'Íris, Cedro, Âmbar' },
  'chanel n°5 edp': { nome: 'Chanel N°5 EDP', nomeBase: 'Chanel N°5', genero: 'F', conc: 'EDP', familia: 'Floral Aldéidico', nicho: false, preco: {'35ml': 150900, '50ml': 196500, '100ml': 272000}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar' },
  'ysl y parfum': { nome: 'YSL Y Parfum', nomeBase: 'YSL Y', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Especiado', nicho: false, preco: {'60ml': 188600}, notas: 'Bergamota, Coriandro, Vetiver' },
  'ysl l\'homme edp': { nome: 'YSL L\'Homme EDP', nomeBase: 'YSL L\'Homme', genero: 'M', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: false, preco: {'60ml': 155600, '100ml': 199600}, notas: 'Bergamota, Cedro, Âmbar' },
  'rabanne 1 million parfum': { nome: 'Rabanne 1 Million Parfum', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'Parfum', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 168200, '100ml': 223200}, notas: 'Tonka, Baunilha, Salgado' },
  'rabanne phantom edt': { nome: 'Rabanne Phantom EDT', nomeBase: 'Rabanne Phantom', genero: 'M', conc: 'EDT', familia: 'Lavanda Amadeirado', nicho: false, preco: {'50ml': 135200, '100ml': 176100}, notas: 'Limão, Lavanda, Vetiver' },
  'rabanne fame edp': { nome: 'Rabanne Fame EDP', nomeBase: 'Rabanne Fame', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 124200, '50ml': 152500, '80ml': 196500}, notas: 'Mandarina, Jasmim, Patchouli' },
  'lancôme idôle edp': { nome: 'Lancôme Idôle EDP', nomeBase: 'Lancôme Idôle', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'25ml': 106900, '50ml': 144600, '100ml': 191800}, notas: 'Rosa de Grasse, Almíscar, Âmbar' },
  'lancôme trésor edp': { nome: 'Lancôme Trésor EDP', nomeBase: 'Lancôme Trésor', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 103800, '50ml': 132000, '100ml': 176100}, notas: 'Pêssego, Rosa, Almíscar, Âmbar' },
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
  'nishane hundred silent ways': { nome: 'Nishane Hundred Silent Ways', nomeBase: 'Nishane Hundred Silent Ways', genero: 'U', conc: 'Extrait', familia: 'Floral Amadeirado', nicho: true, preco: {'50ml': 362700, '100ml': 490000}, notas: 'Rosa Turca, Almíscar, Cedro, Âmbar' },
  'nishane wulong cha': { nome: 'Nishane Wulong Cha', nomeBase: 'Nishane Wulong Cha', genero: 'U', conc: 'Extrait', familia: 'Aquático Verde', nicho: true, preco: {'50ml': 345700}, notas: 'Chá Oolong, Madeira, Almíscar' },
  'nishane florane': { nome: 'Nishane Florane', nomeBase: 'Nishane Florane', genero: 'U', conc: 'Extrait', familia: 'Floral Verde', nicho: true, preco: {'50ml': 345700}, notas: 'Tubarosa, Jasmim, Almíscar Branco' },
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
  'givenchy l\'interdit edp': { nome: 'Givenchy L\'Interdit EDP', nomeBase: 'Givenchy L\'Interdit', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'35ml': 138300, '50ml': 169800, '80ml': 209100}, notas: 'Jasmim, Tuberosa, Âmbar, Patchouli' },
  'givenchy l\'interdit parfum': { nome: 'Givenchy L\'Interdit Parfum', nomeBase: 'Givenchy L\'Interdit', genero: 'F', conc: 'Parfum', familia: 'Floral Oriental', nicho: false, preco: {'50ml': 205000}, notas: 'Jasmim, Tuberosa, Baunilha, Âmbar Branco' },
  'dolce gabbana devotion edp': { nome: 'D&G Devotion EDP', nomeBase: 'D&G Devotion', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'50ml': 152500, '100ml': 205000}, notas: 'Neroli, Almíscar Branco, Âmbar, Baunilha' },
  'prada luna rossa ocean parfum': { nome: 'Prada Luna Rossa Ocean Parfum', nomeBase: 'Prada Luna Rossa Ocean', genero: 'M', conc: 'Parfum', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 185500, '100ml': 236700}, notas: 'Bergamota, Íris, Vetiver, Sândalo' },
  'prada paradoxe edp': { nome: 'Prada Paradoxe EDP', nomeBase: 'Prada Paradoxe', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 116200, '50ml': 130400, '90ml': 157100}, notas: 'Neroli, Âmbar, Almíscar, Baunilha' },
  'prada paradoxe intense edp': { nome: 'Prada Paradoxe Intense EDP', nomeBase: 'Prada Paradoxe Intense', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 122500, '50ml': 138300, '90ml': 166600}, notas: 'Neroli, Jasmim, Âmbar, Almíscar' },
  'prada paradoxe virtual flower edp': { nome: 'Prada Paradoxe Virtual Flower EDP', nomeBase: 'Prada Paradoxe Virtual Flower', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 80100, '50ml': 88000, '90ml': 103000}, notas: 'Jasmim, Neroli, Almíscar, Âmbar' },
  'prada paradoxe radical essence parfum': { nome: 'Prada Paradoxe Radical Essence Parfum', nomeBase: 'Prada Paradoxe Radical Essence', genero: 'F', conc: 'Parfum', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 95800, '50ml': 106800, '90ml': 125700}, notas: 'Neroli, Âmbar, Almíscar, Patchouli' },
  'prada l\'homme edt': { nome: 'Prada L\'Homme EDT', nomeBase: 'Prada L\'Homme', genero: 'M', conc: 'EDT', familia: 'Floral Amadeirado', nicho: false, preco: {'50ml': 144600, '100ml': 180800}, notas: 'Íris, Âmbar, Cedro, Sálvia' },
  'prada l\'homme intense edp': { nome: 'Prada L\'Homme Intense EDP', nomeBase: 'Prada L\'Homme Intense', genero: 'M', conc: 'EDP', familia: 'Amadeirado Floral', nicho: false, preco: {'50ml': 160300, '100ml': 203700}, notas: 'Íris, Âmbar Branco, Cedro, Almíscar' },
  'gucci flora gorgeous gardenia edp': { nome: 'Gucci Flora Gorgeous Gardenia EDP', nomeBase: 'Gucci Flora Gorgeous Gardenia', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'30ml': 130500, '50ml': 163500, '100ml': 207800}, notas: 'Pêra, Gardénia, Jasmim, Âmbar' },
  'carolina herrera 212 vip edt': { nome: 'Carolina Herrera 212 VIP EDT', nomeBase: 'Carolina Herrera 212 VIP', genero: 'M', conc: 'EDT', familia: 'Fougère Aromático', nicho: false, preco: {'50ml': 138300, '100ml': 169800}, notas: 'Bergamota, Âmbar, Almíscar Branco' },
  'lacoste l.12.12 blanc edt': { nome: 'Lacoste L.12.12 Blanc EDT', nomeBase: 'Lacoste L.12.12 Blanc', genero: 'M', conc: 'EDT', familia: 'Aquático Aromático', nicho: false, preco: {'50ml': 103700, '100ml': 127300}, notas: 'Bergamota, Patchouli, Almíscar, Cedro' },
  'lacoste l.12.12 vert edt': { nome: 'Lacoste L.12.12 Vert EDT', nomeBase: 'Lacoste L.12.12 Vert', genero: 'M', conc: 'EDT', familia: 'Aromático Fougère', nicho: false, preco: {'50ml': 103700, '100ml': 127300}, notas: 'Vetiver, Feno, Ervas Aromáticas' },

  'dior sauvage edt': { nome: 'Dior Sauvage EDT', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'30ml': 110000, '60ml': 125700, '100ml': 149300, '200ml': 188600}, notas: 'Bergamota, Ambroxan, Pimenta Rosa' },
  'dior sauvage edp': { nome: 'Dior Sauvage EDP', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDP', familia: 'Oriental Fougère', nicho: false, preco: {'30ml': 125700, '60ml': 141400, '100ml': 165000, '200ml': 212100}, notas: 'Bergamota, Lavanda, Baunilha' },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', nomeBase: 'Dior Sauvage Elixir', genero: 'M', conc: 'Extrait', familia: 'Especiado Aromático', nicho: false, preco: {'60ml': 248300, '100ml': 314300}, notas: 'Cardamomo, Lavanda, Patchouli' },
  'dior j\'adore edp': { nome: 'Dior J\'adore EDP', nomeBase: 'Dior J\'adore', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'30ml': 139800, '50ml': 172800, '100ml': 220000, '150ml': 275000}, notas: 'Magnólia, Rosa, Jasmim' },
  'dior miss dior edp': { nome: 'Dior Miss Dior EDP', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'EDP', familia: 'Floral Aromático', nicho: false, preco: {'30ml': 133500, '50ml': 161800, '100ml': 204300, '150ml': 259300}, notas: 'Peónia, Rosa, Patchouli' },
  'bleu de chanel edt': { nome: 'Bleu de Chanel EDT', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 157100, '100ml': 196400, '150ml': 243600}, notas: 'Citrus, Incenso, Sândalo' },
  'bleu de chanel edp': { nome: 'Bleu de Chanel EDP', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 172800, '100ml': 220000, '150ml': 267200}, notas: 'Citrus, Noz-moscada, Sândalo' },
  'bleu de chanel parfum': { nome: 'Bleu de Chanel Parfum', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 204300, '100ml': 259300}, notas: 'Citrus, Bétula, Âmbar' },
  'chanel coco mademoiselle edp': { nome: 'Chanel Coco Mademoiselle EDP', nomeBase: 'Chanel Coco Mademoiselle', genero: 'F', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'50ml': 179100, '100ml': 232600, '150ml': 282900}, notas: 'Bergamota, Rosa, Patchouli' },
  'chanel chance eau tendre edp': { nome: 'Chanel Chance Eau Tendre EDP', nomeBase: 'Chanel Chance Eau Tendre', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'50ml': 172800, '100ml': 223100}, notas: 'Toranja, Quéssia, Almíscar Branco' },
  'ysl black opium edp': { nome: 'YSL Black Opium EDP', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 97400, '50ml': 116200, '90ml': 144500, '150ml': 185400}, notas: 'Café, Baunilha, Patchouli, Flor Branca' },
  'ysl libre edp': { nome: 'YSL Libre EDP', nomeBase: 'YSL Libre', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 110000, '50ml': 133500, '90ml': 161800}, notas: 'Lavanda, Flor de Laranjeira, Cedro' },
  'ysl y edp': { nome: 'YSL Y EDP', nomeBase: 'YSL Y', genero: 'M', conc: 'EDP', familia: 'Fougère Amadeirado', nicho: false, preco: {'40ml': 105200, '60ml': 122500, '100ml': 150800, '200ml': 188600}, notas: 'Bergamota, Gengibre, Cedro' },
  'rabanne invictus edt': { nome: 'Rabanne Invictus EDT', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDT', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 117800, '100ml': 144500, '200ml': 180700}, notas: 'Toranja, Louro, Âmbar' },
  'rabanne invictus edp': { nome: 'Rabanne Invictus EDP', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDP', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 128800, '100ml': 160300}, notas: 'Louro, Patchouli, Âmbar, Madeira' },
  'rabanne invictus parfum': { nome: 'Rabanne Invictus Parfum', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 133500, '100ml': 165000, '200ml': 212100}, notas: 'Lavanda, Sândalo Negro, Âmbar' },
  'rabanne 1 million edt': { nome: 'Rabanne 1 Million EDT', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDT', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 117800, '100ml': 144500, '200ml': 180700}, notas: 'Mandarina, Canela, Âmbar, Couro' },
  'rabanne 1 million edp': { nome: 'Rabanne 1 Million EDP', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 128800, '100ml': 157100}, notas: 'Toranja, Canela, Couro, Patchouli' },
  'armani acqua di giò edt': { nome: 'Armani Acqua di Giò EDT', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDT', familia: 'Aquático', nicho: false, preco: {'50ml': 114700, '100ml': 138300, '200ml': 169700}, notas: 'Citrus, Alga Marinha, Patchouli' },
  'armani acqua di giò edp': { nome: 'Armani Acqua di Giò EDP', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDP', familia: 'Aquático Aromático', nicho: false, preco: {'75ml': 146100, '125ml': 177600}, notas: 'Bergamota, Incenso, Patchouli' },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', nomeBase: 'Armani Acqua di Giò Profumo', genero: 'M', conc: 'Parfum', familia: 'Aquático Aromático', nicho: false, preco: {'75ml': 157100, '125ml': 188600}, notas: 'Incenso, Madeira, Cipreste' },
  'armani sì edp': { nome: 'Armani Sì EDP', nomeBase: 'Armani Sì', genero: 'F', conc: 'EDP', familia: 'Floral Chypre', nicho: false, preco: {'30ml': 117800, '50ml': 146100, '100ml': 185400, '150ml': 227900}, notas: 'Groselha, Rosa, Almíscar, Âmbar' },
  'versace eros edt': { nome: 'Versace Eros EDT', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDT', familia: 'Aromático Fougère', nicho: false, preco: {'50ml': 106800, '100ml': 130400, '200ml': 165000}, notas: 'Menta, Tonka, Âmbar' },
  'versace eros edp': { nome: 'Versace Eros EDP', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDP', familia: 'Aromático Oriental', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Bergamota, Néroli, Fava de Tonka' },
  'lancôme la vie est belle edp': { nome: 'Lancôme La Vie est Belle EDP', nomeBase: 'Lancôme La Vie est Belle', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 106800, '50ml': 130400, '75ml': 157100, '100ml': 180700, '150ml': 220000}, notas: 'Íris, Pralinê, Baunilha' },
  'mugler angel edp': { nome: 'Mugler Angel EDP', nomeBase: 'Mugler Angel', genero: 'F', conc: 'EDP', familia: 'Oriental Gourmand', nicho: false, preco: {'30ml': 106800, '50ml': 130400, '60ml': 146100, '90ml': 172800}, notas: 'Caramelo, Patchouli, Baunilha' },
  'calvin klein ck one edt': { nome: 'Calvin Klein CK One EDT', nomeBase: 'Calvin Klein CK One', genero: 'U', conc: 'EDT', familia: 'Cítrico Aquático', nicho: false, preco: {'100ml': 86400, '200ml': 105200}, notas: 'Bergamota, Chá Verde, Almíscar' },
  'givenchy gentleman edp': { nome: 'Givenchy Gentleman EDP', nomeBase: 'Givenchy Gentleman', genero: 'M', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'40ml': 122500, '60ml': 146100, '100ml': 180700, '150ml': 220000}, notas: 'Lavanda, Íris, Patchouli, Baunilha Negra' },
  'givenchy gentleman society edp': { nome: 'Givenchy Gentleman Society EDP', nomeBase: 'Givenchy Gentleman Society', genero: 'M', conc: 'EDP', familia: 'Amadeirado Floral', nicho: false, preco: {'40ml': 130400, '60ml': 157100, '100ml': 204300}, notas: 'Sálvia, Narciso, Vetiver, Sândalo, Baunilha' },
  'givenchy l\'interdit edp': { nome: 'Givenchy L\'Interdit EDP', nomeBase: 'Givenchy L\'Interdit', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'35ml': 117800, '50ml': 146100, '80ml': 177600, '125ml': 220000}, notas: 'Jasmim, Tuberosa, Âmbar, Patchouli' },
  'givenchy irresistible edp': { nome: 'Givenchy Irresistible EDP', nomeBase: 'Givenchy Irresistible', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'35ml': 114700, '50ml': 141400, '80ml': 172800}, notas: 'Rosa, Magnólia, Almíscar, Âmbar' },
  'burberry hero edp': { nome: 'Burberry Hero EDP', nomeBase: 'Burberry Hero', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 122500, '100ml': 150800}, notas: 'Cedro, Vetiver, Almíscar, Junípero' },
  'burberry hero edt': { nome: 'Burberry Hero EDT', nomeBase: 'Burberry Hero', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 114700, '100ml': 138300, '150ml': 172800}, notas: 'Bergamota, Cedro, Almíscar, Vetiver' },
  'burberry her edp': { nome: 'Burberry Her EDP', nomeBase: 'Burberry Her', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'30ml': 110000, '50ml': 133500, '100ml': 165000}, notas: 'Frutas Vermelhas, Jasmim, Âmbar, Almíscar' },
  'carolina herrera good girl edp': { nome: 'Carolina Herrera Good Girl EDP', nomeBase: 'Carolina Herrera Good Girl', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 114700, '50ml': 138300, '80ml': 169700}, notas: 'Cacao, Jasmim, Bergamota, Tonka' },
  'carolina herrera bad boy edt': { nome: 'Carolina Herrera Bad Boy EDT', nomeBase: 'Carolina Herrera Bad Boy', genero: 'M', conc: 'EDT', familia: 'Aromático Amadeirado', nicho: false, preco: {'50ml': 122500, '100ml': 150800, '150ml': 188600}, notas: 'Pimenta Vermelha, Salgueiro, Âmbar Cinza' },
  'viktor rolf flowerbomb edp': { nome: 'Viktor & Rolf Flowerbomb EDP', nomeBase: 'Viktor & Rolf Flowerbomb', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 114700, '50ml': 138300, '100ml': 172800}, notas: 'Rosa, Jasmim, Orquídea, Patchouli' },
  'viktor rolf spicebomb edt': { nome: 'Viktor & Rolf Spicebomb EDT', nomeBase: 'Viktor & Rolf Spicebomb', genero: 'M', conc: 'EDT', familia: 'Especiado Aromático', nicho: false, preco: {'50ml': 114700, '90ml': 138300}, notas: 'Pimenta, Safran, Vetiver, Tabaco' },
  'viktor rolf spicebomb extreme edp': { nome: 'Viktor & Rolf Spicebomb Extreme EDP', nomeBase: 'Viktor & Rolf Spicebomb Extreme', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 125700, '90ml': 157100}, notas: 'Baunilha, Tabaco, Canela, Pimenta' },
  'valentino born in roma uomo edp': { nome: 'Valentino Born in Roma Uomo EDP', nomeBase: 'Valentino Born in Roma', genero: 'M', conc: 'EDP', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 125700, '100ml': 157100}, notas: 'Lavanda, Baunilha, Vetiver, Âmbar' },
  'valentino born in roma intense edp': { nome: 'Valentino Born in Roma Intense EDP', nomeBase: 'Valentino Born in Roma Intense', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 138300, '100ml': 169700}, notas: 'Lavanda, Baunilha, Vetiver, Âmbar Fumado' },
  'valentino donna born in roma edp': { nome: 'Valentino Donna Born in Roma EDP', nomeBase: 'Valentino Donna Born in Roma', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'50ml': 125700, '100ml': 157100}, notas: 'Jasmim, Baunilha, Groseilha, Bergamota' },
  'gucci bloom edp': { nome: 'Gucci Bloom EDP', nomeBase: 'Gucci Bloom', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'30ml': 122500, '50ml': 146100, '100ml': 188600}, notas: 'Tuberosa, Rangoon Creeper, Jasmim' },
  'gucci guilty edp h': { nome: 'Gucci Guilty EDP Pour Homme', nomeBase: 'Gucci Guilty Pour Homme', genero: 'M', conc: 'EDP', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 122500, '90ml': 154000}, notas: 'Coentro, Cedro, Patchouli, Âmbar' },
  'gucci guilty edt h': { nome: 'Gucci Guilty EDT Pour Homme', nomeBase: 'Gucci Guilty Pour Homme', genero: 'M', conc: 'EDT', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 110000, '90ml': 135100}, notas: 'Limão, Lavanda, Patchouli, Âmbar' },
  'dolce gabbana the one edt h': { nome: 'D&G The One EDT Homme', nomeBase: 'D&G The One Homme', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Toranja, Basílico, Âmbar, Cedro' },
  'dolce gabbana the one edp h': { nome: 'D&G The One EDP Homme', nomeBase: 'D&G The One Homme', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 128800, '100ml': 160300}, notas: 'Tabaco, Gengibre, Cardamomo, Âmbar' },
  'dolce gabbana light blue h edt': { nome: 'D&G Light Blue Pour Homme EDT', nomeBase: 'D&G Light Blue Pour Homme', genero: 'M', conc: 'EDT', familia: 'Aquático', nicho: false, preco: {'40ml': 94200, '75ml': 117800, '125ml': 146100}, notas: 'Junípero, Bergamota, Rosalina, Madeira' },
  'dolce gabbana light blue f edt': { nome: 'D&G Light Blue EDT', nomeBase: 'D&G Light Blue', genero: 'F', conc: 'EDT', familia: 'Floral Aquático', nicho: false, preco: {'25ml': 86400, '50ml': 106800, '100ml': 132000}, notas: 'Maçã, Cedro, Bambu, Jasmim Branco' },
  'jean paul gaultier le male edt': { nome: 'Jean Paul Gaultier Le Male EDT', nomeBase: 'Jean Paul Gaultier Le Male', genero: 'M', conc: 'EDT', familia: 'Fougère Oriental', nicho: false, preco: {'75ml': 117800, '125ml': 146100, '200ml': 180700}, notas: 'Lavanda, Baunilha, Almíscar, Menta' },
  'jean paul gaultier le male edp': { nome: 'Jean Paul Gaultier Le Male EDP', nomeBase: 'Jean Paul Gaultier Le Male', genero: 'M', conc: 'EDP', familia: 'Oriental Fougère', nicho: false, preco: {'75ml': 128800, '125ml': 157100}, notas: 'Lavanda, Baunilha, Âmbar, Almíscar' },
  'jean paul gaultier scandal edp': { nome: 'Jean Paul Gaultier Scandal EDP', nomeBase: 'Jean Paul Gaultier Scandal', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 110000, '50ml': 133500, '80ml': 161800}, notas: 'Mel, Peónia, Patchouli, Fava de Tonka' },
  'prada luna rossa ocean edt': { nome: 'Prada Luna Rossa Ocean EDT', nomeBase: 'Prada Luna Rossa Ocean', genero: 'M', conc: 'EDT', familia: 'Aquático Aromático', nicho: false, preco: {'50ml': 130400, '100ml': 161800}, notas: 'Bergamota, Açafrão, Íris, Vetiver' },
  'prada l\'homme edt': { nome: 'Prada L\'Homme EDT', nomeBase: 'Prada L\'Homme', genero: 'M', conc: 'EDT', familia: 'Floral Amadeirado', nicho: false, preco: {'50ml': 122500, '100ml': 150800}, notas: 'Íris, Âmbar, Cedro, Sálvia' },
  'prada l\'homme intense edp': { nome: 'Prada L\'Homme Intense EDP', nomeBase: 'Prada L\'Homme Intense', genero: 'M', conc: 'EDP', familia: 'Amadeirado Floral', nicho: false, preco: {'50ml': 133500, '100ml': 165000}, notas: 'Íris, Âmbar Branco, Cedro, Almíscar' },
  'creed aventus': { nome: 'Creed Aventus', nomeBase: 'Creed Aventus', genero: 'M', conc: 'EDP', familia: 'Frutal Chypre', nicho: true, preco: {'50ml': 323600, '100ml': 587500}, notas: 'Bergamota, Groselha Preta, Bétula, Almíscar' },
  'creed green irish tweed': { nome: 'Creed Green Irish Tweed', nomeBase: 'Creed Green Irish Tweed', genero: 'M', conc: 'EDT', familia: 'Fougère', nicho: true, preco: {'50ml': 340600, '100ml': 510900}, notas: 'Íris, Sândalo, Âmbar' },
  'creed millesime imperial': { nome: 'Creed Millesime Imperial', nomeBase: 'Creed Millesime Imperial', genero: 'U', conc: 'EDP', familia: 'Aquático', nicho: true, preco: {'50ml': 332100, '100ml': 502400}, notas: 'Bergamota, Alga, Almíscar' },
  'creed aventus for her': { nome: 'Creed Aventus for Her', nomeBase: 'Creed Aventus for Her', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'50ml': 315100, '75ml': 400200}, notas: 'Bergamota, Rosa, Baunilha' },
  'tom ford oud wood edp': { nome: 'Tom Ford Oud Wood EDP', nomeBase: 'Tom Ford Oud Wood', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'50ml': 383200, '100ml': 587500}, notas: 'Oud, Sândalo, Vetiver' },
  'tom ford black orchid edp': { nome: 'Tom Ford Black Orchid EDP', nomeBase: 'Tom Ford Black Orchid', genero: 'U', conc: 'EDP', familia: 'Oriental Floral', nicho: true, preco: {'50ml': 306500, '100ml': 451300}, notas: 'Trufa, Orquídea Preta, Patchouli' },
  'tom ford tobacco vanille edp': { nome: 'Tom Ford Tobacco Vanille EDP', nomeBase: 'Tom Ford Tobacco Vanille', genero: 'U', conc: 'EDP', familia: 'Oriental Especiado', nicho: true, preco: {'50ml': 391700, '100ml': 613100}, notas: 'Tabaco, Baunilha, Madeira de Cedro' },
  'tom ford lost cherry edp': { nome: 'Tom Ford Lost Cherry EDP', nomeBase: 'Tom Ford Lost Cherry', genero: 'U', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'50ml': 391700, '100ml': 613100}, notas: 'Cereja, Âmbar, Baunilha' },
  'tom ford neroli portofino edp': { nome: 'Tom Ford Neroli Portofino EDP', nomeBase: 'Tom Ford Neroli Portofino', genero: 'U', conc: 'EDP', familia: 'Cítrico Floral', nicho: true, preco: {'50ml': 366100, '100ml': 562000}, notas: 'Bergamota, Néroli, Âmbar' },
  'tom ford rose prick edp': { nome: 'Tom Ford Rose Prick EDP', nomeBase: 'Tom Ford Rose Prick', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 391700}, notas: 'Rosa, Pimenta, Fava de Tonka' },
  'ralph lauren polo blue edt': { nome: 'Ralph Lauren Polo Blue EDT', nomeBase: 'Ralph Lauren Polo Blue', genero: 'M', conc: 'EDT', familia: 'Aquático Amadeirado', nicho: false, preco: {'75ml': 90500, '125ml': 114700, '200ml': 141400}, notas: 'Melão, Pepino, Sândalo, Almíscar' },
  'ralph lauren polo blue edp': { nome: 'Ralph Lauren Polo Blue EDP', nomeBase: 'Ralph Lauren Polo Blue', genero: 'M', conc: 'EDP', familia: 'Aquático Amadeirado', nicho: false, preco: {'75ml': 100300, '125ml': 125700, '200ml': 157100}, notas: 'Bergamota, Cedro, Âmbar, Sândalo' },
  'azzaro wanted edt': { nome: 'Azzaro Wanted EDT', nomeBase: 'Azzaro Wanted', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 94200, '100ml': 114700}, notas: 'Bergamota, Cedro, Âmbar, Gengibre' },
  'azzaro the most wanted edp': { nome: 'Azzaro The Most Wanted EDP', nomeBase: 'Azzaro The Most Wanted', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Sálvia, Âmbar, Cedro, Baunilha' },
  'azzaro the most wanted edt': { nome: 'Azzaro The Most Wanted EDT', nomeBase: 'Azzaro The Most Wanted', genero: 'M', conc: 'EDT', familia: 'Aromático Amadeirado', nicho: false, preco: {'50ml': 102100, '100ml': 125700}, notas: 'Bergamota, Cedro, Âmbar' },
  'ysl myslf edp': { nome: 'YSL MYSLF EDP', nomeBase: 'YSL MYSLF', genero: 'M', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'60ml': 117800, '100ml': 146100, '150ml': 180700}, notas: 'Lavanda, Salicilato, Cedro, Âmbar' },
  'ysl mon paris edp': { nome: 'YSL Mon Paris EDP', nomeBase: 'YSL Mon Paris', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'30ml': 102100, '50ml': 124100, '90ml': 152400}, notas: 'Amora, Peónia, Almíscar, Âmbar' },
  'armani stronger with you edt': { nome: 'Armani Stronger With You EDT', nomeBase: 'Armani Stronger With You', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 99000, '100ml': 121000, '150ml': 149300}, notas: 'Castanha, Cardamomo, Baunilha, Âmbar' },
  'armani stronger with you intensely edp': { nome: 'Armani Stronger With You Intensely EDP', nomeBase: 'Armani Stronger With You Intensely', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 102100, '100ml': 125700, '150ml': 154000}, notas: 'Castanha, Sálvia, Cedro, Baunilha' },
  'armani my way edp': { nome: 'Armani My Way EDP', nomeBase: 'Armani My Way', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 92700, '50ml': 114700, '90ml': 141400}, notas: 'Bergamota, Flor de Laranjeira, Cedro, Almíscar' },
  'mugler alien goddess edp': { nome: 'Mugler Alien Goddess EDP', nomeBase: 'Mugler Alien Goddess', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 102100, '60ml': 125700, '90ml': 149300}, notas: 'Neroli, Baunilha, Âmbar, Almíscar' },
  'hugo boss bottled edt': { nome: 'Hugo Boss Bottled EDT', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDT', familia: 'Amadeirado Especiado', nicho: false, preco: {'30ml': 67500, '50ml': 75400, '100ml': 91100, '200ml': 114700}, notas: 'Maçã, Madeira de Sândalo, Cedro' },
  'hugo boss the scent edt': { nome: 'Hugo Boss The Scent EDT', nomeBase: 'Hugo Boss The Scent', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 94200, '100ml': 114700, '200ml': 141400}, notas: 'Gengibre, Osmanthus, Couro' },
  'hugo boss alive edp': { nome: 'Hugo Boss Alive EDP', nomeBase: 'Hugo Boss Alive', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 86400, '50ml': 102100, '80ml': 121000}, notas: 'Maçã, Rosa, Sândalo, Baunilha' },
  'carolina herrera 212 vip edt': { nome: 'Carolina Herrera 212 VIP EDT', nomeBase: 'Carolina Herrera 212 VIP', genero: 'M', conc: 'EDT', familia: 'Fougère Aromático', nicho: false, preco: {'50ml': 102100, '100ml': 124100}, notas: 'Bergamota, Âmbar, Almíscar Branco' },
  'carolina herrera 212 vip black edp': { nome: 'Carolina Herrera 212 VIP Black EDP', nomeBase: 'Carolina Herrera 212 VIP Black', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 102100, '100ml': 125700, '200ml': 157100}, notas: 'Sálvia, Couro, Baunilha, Âmbar' },
  'carolina herrera good girl blush edp': { nome: 'Carolina Herrera Good Girl Blush EDP', nomeBase: 'Carolina Herrera Good Girl Blush', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 119400, '50ml': 141400, '80ml': 169700, '150ml': 220000}, notas: 'Rosa, Peónia, Amora, Almíscar' },
  'dolce gabbana devotion edp': { nome: 'D&G Devotion EDP', nomeBase: 'D&G Devotion', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Neroli, Almíscar Branco, Âmbar, Baunilha' },
  'dolce gabbana the one edp f': { nome: 'D&G The One EDP', nomeBase: 'D&G The One', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Bergamota, Rosa, Baunilha, Âmbar' },
  'jean paul gaultier la belle edp': { nome: 'Jean Paul Gaultier La Belle EDP', nomeBase: 'Jean Paul Gaultier La Belle', genero: 'F', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'30ml': 102100, '50ml': 122500, '100ml': 152400}, notas: 'Pera, Jasmim, Baunilha, Âmbar' },
  'jean paul gaultier le male ultra edt': { nome: 'Jean Paul Gaultier Le Male Ultra EDT', nomeBase: 'Jean Paul Gaultier Le Male Ultra', genero: 'M', conc: 'EDT', familia: 'Oriental Almíscar', nicho: false, preco: {'40ml': 102100, '75ml': 122500, '125ml': 149300}, notas: 'Lavanda, Baunilha, Almíscar, Menta' },
  'narciso rodriguez for her edp': { nome: 'Narciso Rodriguez For Her EDP', nomeBase: 'Narciso Rodriguez For Her', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 89500, '50ml': 110000, '100ml': 138300, '150ml': 169700}, notas: 'Rosa, Almíscar, Âmbar' },
  'narciso rodriguez musc noir rose edp': { nome: 'Narciso Rodriguez Musc Noir Rose EDP', nomeBase: 'Narciso Rodriguez Musc Noir Rose', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 102100, '50ml': 122500}, notas: 'Rosa, Almíscar Negro, Sândalo' },
  'montblanc explorer edp': { nome: 'Montblanc Explorer EDP', nomeBase: 'Montblanc Explorer', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'60ml': 94200, '100ml': 114700, '200ml': 141400}, notas: 'Bergamota, Patchouli, Âmbar, Couro' },
  'gucci flora gorgeous jasmine edp': { nome: 'Gucci Flora Gorgeous Jasmine EDP', nomeBase: 'Gucci Flora Gorgeous Jasmine', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 117800, '50ml': 141400, '100ml': 180700}, notas: 'Jasmim, Bergamota, Almíscar, Âmbar' },

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

  // Mostrar SEMPRE todas as versões — mesmo que só haja 1
  // Assim o cliente fica sempre informado de todas as opções disponíveis
  if (versoes.length === 1) {
    reply += `*Concentração:* ${p0.conc} — ${getDuracao(p0.conc)}.\n\n`;
    reply += `💰 *Preço:*\n${formatPrecos(p0.preco)}\n`;
    reply += `\n📦 Entrega em Luanda incluída.`;

    // Procurar versões relacionadas: mesma marca, nome semelhante mas diferente nomeBase
    // Ex: "Prada Paradoxe" → verificar se há "Prada Paradoxe Intense", etc.
    const marcaBase = nomeBase.split(' ').slice(0, 2).join(' ').toLowerCase();
    const versoesRelacionadas = Object.values(CATALOGO).filter(p =>
      p.nomeBase !== nomeBase &&
      normalizar(p.nomeBase).startsWith(normalizar(nomeBase).split(' ').slice(0,2).join(' ')) &&
      p.preco && Object.keys(p.preco).length > 0
    );
    const nomesRelUnicos = new Set(versoesRelacionadas.map(p => p.nomeBase));

    if (nomesRelUnicos.size > 0) {
      reply += `\n\n💡 *Também temos versões relacionadas:*\n`;
      nomesRelUnicos.forEach(nb => {
        const vs = versoesRelacionadas.filter(p => p.nomeBase === nb);
        const kzMin = Math.min(...vs.map(p => precoMin(p.preco)));
        reply += `• *${nb}* — a partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
      });
      reply += `\nQuer saber mais sobre alguma destas versões?`;
    } else if (p0.nicho) {
      reply += `\n\nDeseja encomendar? Escreva *encomendar* e trato de tudo!\n\n💡 Posso também verificar se existe alguma promoção disponível. Quer que o faça?`;
    } else {
      reply += `\n\nDeseja encomendar? Escreva *encomendar* e trato de tudo!`;
    }
  } else {
    // Múltiplas versões — mostrar TODAS com preços e perguntar qual prefere
    reply += `💰 *Todas as versões disponíveis:*\n`;
    versoes.forEach((p, i) => {
      const precMin = precoMin(p.preco);
      const precMax = precoMax(p.preco);
      const faixaPreco = precMin === precMax
        ? `${precMin.toLocaleString('pt-PT')} Kz`
        : `${precMin.toLocaleString('pt-PT')} a ${precMax.toLocaleString('pt-PT')} Kz`;
      reply += `\n*${i+1}. ${p.conc}* _(${getDuracao(p.conc).split(' — ')[0]})_\n`;
      reply += formatPrecos(p.preco) + `\n`;
    });
    reply += `\n📦 Entrega em Luanda incluída.`;
    if (p0.nicho) {
      reply += `\n\nQual das versões prefere? Pode indicar o número ou o nome _(EDT, EDP, Parfum...)_.\n\n💡 Posso também verificar se existe alguma promoção disponível. Quer que o faça?`;
    } else {
      reply += `\n\nQual das versões prefere? Indique o número ou o nome _(EDT, EDP, Parfum...)_ e trato da encomenda.`;
    }
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
    const ehNicho = Object.values(CATALOGO).some(p => p.nomeBase === perfumeDirecto && p.nicho);
    // Verificar quantas versões existem — se múltiplas, guardar lista para selecção
    const versoesPerfume = Object.values(CATALOGO).filter(p =>
      p.nomeBase === perfumeDirecto && p.preco && Object.keys(p.preco).length > 0
    );
    if (versoesPerfume.length > 1) {
      // Múltiplas versões — guardar lista para o cliente escolher
      setSessao(from, {
        nomeBase: perfumeDirecto,
        tipo: 'escolher_versao',
        ehNicho,
        versoes: versoesPerfume.map((p, i) => ({ idx: i+1, nome: p.nome, conc: p.conc, preco: p.preco, nomeBase: p.nomeBase }))
      });
    } else {
      setSessao(from, { nomeBase: perfumeDirecto, tipo: 'perfume_activo', ehNicho });
    }
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
    // ESTADO: cliente escolhe versão de perfume
    // =============================================
    if (sessao.tipo === 'escolher_versao') {
      const versoes = sessao.versoes || [];
      const nomeBase = sessao.nomeBase;

      // Detectar escolha por número (1, 2, 3...)
      const numMatch = txtNorm.match(/^[1-9]$/);
      let escolha = null;

      if (numMatch) {
        const idx = parseInt(numMatch[0]);
        escolha = versoes.find(v => v.idx === idx);
      }

      // Detectar por concentração (edt, edp, parfum, extrait, elixir)
      if (!escolha) {
        escolha = versoes.find(v =>
          txtNorm.includes(normalizar(v.conc)) ||
          (v.nome && txtNorm.includes(normalizar(v.nome).split(' ').pop()))
        );
      }

      if (escolha) {
        // Encontrou a versão — iniciar encomenda directamente
        clearSessao(from);
        // Criar as opcoes de tamanho para essa versão
        const opcoes = Object.entries(escolha.preco).map(([ml, kz]) => ({
          nome: escolha.nome, conc: escolha.conc, ml, kz: aplicaDesconto(kz)
        }));
        setSessao(from, {
          tipo: 'confirmar_encomenda',
          nomeBase,
          opcoes,
        });
        let msg = `Óptima escolha! *${escolha.nome}*\n\nQual o tamanho que prefere?\n\n`;
        opcoes.forEach((o, i) => {
          msg += `*${i+1}.* ${o.ml}: ${o.kz.toLocaleString('pt-PT')} Kz\n`;
        });
        return msg;
      }

      // Pedido de encomendar sem especificar versão
      if (/encomendar|encomenda|quero comprar|vou comprar/.test(txtNorm)) {
        clearSessao(from);
        return iniciarEncomenda(nomeBase, from);
      }

      // Não reconheceu — mostrar opções novamente
      let msg = `Qual das versões prefere?\n\n`;
      versoes.forEach(v => {
        const kzMin = precoMin(v.preco);
        msg += `*${v.idx}.* ${v.conc} — a partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
      });
      msg += `\nIndique o número ou o nome da concentração.`;
      return msg;
    }

    // =============================================
    // CONFIRMAÇÃO: cliente confirmou que imagem é de perfume
    // =============================================
    if (sessao.tipo === 'aguardar_confirmacao_foto') {
      if (/^(sim|s|yes|claro|ok|quero|e isso|exacto|perfume|foto)/.test(txtNorm)) {
        updateSessao(from, { tipo: 'aguardar_foto_perfume', nomePerguntado: 'foto enviada' });
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          sendMessage(NUMERO_HUMANO,
            `📸 *OMNIA — Cliente quer identificação de perfume*\n\n` +
            `📱 Cliente: +${numLimpo}\n` +
            `📎 O cliente enviou uma imagem de um perfume para cotação.\n` +
            `👆 https://wa.me/${numLimpo}\n` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }
        return `Perfeito! Já notifiquei a nossa equipa. Um consultor vai identificar o perfume e entrará em contacto com o preço e disponibilidade. 🖤`;
      }
      if (/^(nao|n|no|negativo|nada|outro)/.test(txtNorm)) {
        clearSessao(from);
        return `Sem problema. Posso ajudá-lo com algum outro perfume? Escreva o nome ou descreva o que procura. 🖤`;
      }
      clearSessao(from);
    }

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

  // ================================================
  // FIX — "Nicho femininos", "nicho e designer", etc.
  // Responde SEM escalar
  // ================================================
  if (/nicho.*(feminin|mulher|ela\b|menina)|feminin.*nicho|mulher.*nicho/.test(txtNorm)) {
    const nichoF = (() => {
      const map = {};
      Object.values(CATALOGO).filter(p => p.nicho && (p.genero === 'F' || p.genero === 'U')).forEach(p => {
        if (!map[p.nomeBase]) map[p.nomeBase] = [];
        if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc);
      });
      return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`);
    })();
    return `👗💎 *Nicho Feminino & Unissexo — Omnia Parfums*${getBannerDesconto()}\n\nPerfumes de nicho para ela — exclusivos, raros, inesquecíveis:\n\n${nichoF.join('\n')}\n\n_Escreva o nome para ver detalhes completos, notas e preços._`;
  }

  if (/nicho.*(masculin|homem|ele\b|rapaz)|masculin.*nicho|homem.*nicho/.test(txtNorm)) {
    const nichoM = (() => {
      const map = {};
      Object.values(CATALOGO).filter(p => p.nicho && (p.genero === 'M' || p.genero === 'U')).forEach(p => {
        if (!map[p.nomeBase]) map[p.nomeBase] = [];
        if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc);
      });
      return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`);
    })();
    return `👔💎 *Nicho Masculino & Unissexo — Omnia Parfums*${getBannerDesconto()}\n\nPerfumes de nicho para ele — presença inconfundível, exclusividade real:\n\n${nichoM.join('\n')}\n\n_Escreva o nome para ver detalhes completos, notas e preços._`;
  }

  if (/nicho.*designer|designer.*nicho|diferenca.*(nicho|designer)|nicho.*ou.*designer|designer.*ou.*nicho/.test(txtNorm)) {
    return `Boa questão! São dois universos com filosofias diferentes:\n\n🏷️ *Designer* (Dior, Chanel, Armani, YSL...) — produção em larga escala, fórmulas reconhecíveis, forte presença social. Excelente relação qualidade-preço.\n\n💎 *Nicho* (Mancera, Creed, Montale, Nishane, Parfums de Marly...) — produção limitada, matérias-primas raras, maior duração e exclusividade. Para quem quer ser inconfundível, não apenas reconhecível.\n\nA escolha depende do que procura: *ser reconhecido* ou *ser único*?\n\nEscreva *nicho* ou *catálogo* para explorar, ou diga-me o perfil e faço uma sugestão.`;
  }

  // ================================================
  // Perfume fora do catálogo — escalada CIRÚRGICA
  // NUNCA durante conversa fluida ou conceptual
  // ================================================
  const eContextoFluido = /nicho|designer|suger|recomendar|calor|quente|frio|noite|festa|fresc|intenso|floral|oriental|leve|para.*ele|para.*ela|para.*dia|para.*noite|quero algo|procuro|tens.*algo|o que.*recomendas|lista|ver|mostrar|explorar|diferenca|o que e|como|feminino|masculino/i.test(txt);

  if (!eContextoFluido) {
    const pareceNomeEspecifico = (
      /^[A-Z][a-zA-Zà-ÿ]/.test(txt) && txt.split(' ').length <= 6
    ) && (
      /tens|tem|custa|preço|preco|quanto|disponivel|quero|comprar|encomendar/i.test(txt) ||
      txt.split(' ').length <= 4
    );

    if (pareceNomeEspecifico) {
      const numLimpo = from ? from.replace('@s.whatsapp.net','').replace('@c.us','') : '';
      setSessao(from, { tipo: 'aguardar_foto_perfume', nomePerguntado: txt });
      if (NUMERO_HUMANO && numLimpo) {
        sendMessage(NUMERO_HUMANO,
          `🔍 *OMNIA — Perfume não encontrado*\n\n📱 Cliente: +${numLimpo}\n💬 Perguntou: _"${txt}"_\n👆 https://wa.me/${numLimpo}\n🕐 ${new Date().toLocaleString('pt-PT')}`
        );
      }
      return `De momento não temos esse perfume no catálogo. Pode enviar uma *foto do frasco*? A nossa equipa verifica disponibilidade e preço e entra em contacto. 📸`;
    }
  }

  // ================================================
  // FALLBACK — variado, nunca monótono
  // ================================================
  const FALLBACKS = [
    `Não percebi completamente, mas estou aqui! Pode dizer o nome de um perfume, descrever o que procura (ex: "algo fresco para o calor") ou escrever *catálogo* para ver tudo.`,
    `Pode reformular? Se me disser o perfume ou a ocasião, ajudo de imediato. Ou escreva *catálogo* para explorar a nossa selecção.`,
    `Tenho fragrâncias para todas as ocasiões — diga-me um nome, uma sensação ou um momento e trato do resto.`,
    `Pode dar-me mais detalhes? Um nome, uma ocasião, ou "algo marcante para noite" — e faço uma sugestão certeira.`,
    `Estou aqui! Descreva o que procura — clima, ocasião, sensação — ou escreva directamente o nome do perfume.`,
  ];
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
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
        // ─── 1. Comprovativo de pagamento ────────────────────
        const opcao = sessao.opcaoEscolhida || {};
        const nomeBase = sessao.nomeBase || 'perfume';
        clearSessao(from);
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          await sendMessage(NUMERO_HUMANO,
            `💳 *OMNIA — Comprovativo recebido*\n\n` +
            `📱 Cliente: +${numLimpo}\n` +
            `🛍️ Encomenda: ${opcao.nome || nomeBase} ${opcao.ml || ''}\n` +
            `💰 Valor: ${(opcao.kz || 0).toLocaleString('pt-PT')} Kz\n` +
            `📎 Comprovativo enviado (${tipoFicheiro}).\n` +
            `👆 https://wa.me/${numLimpo}\n` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }
        await sendMessage(from,
          `✅ Comprovativo recebido! Obrigado.\n\n` +
          `A nossa equipa vai validar o pagamento em breve e entrará em contacto para confirmar a entrega.\n\n` +
          `🖤 *Omnia Parfums* — Entrega em Luanda em 24 a 48 horas.`
        );
        return;

      } else if (sessao && sessao.tipo === 'aguardar_foto_perfume') {
        // ─── 2. Foto de perfume para identificação ───────────
        const nomePerguntado = sessao.nomePerguntado || 'perfume desconhecido';
        clearSessao(from);
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          await sendMessage(NUMERO_HUMANO,
            `📸 *OMNIA — Foto de perfume para identificação*\n\n` +
            `📱 Cliente: +${numLimpo}\n` +
            `💬 Perfume perguntado: _"${nomePerguntado}"_\n` +
            `📎 O cliente enviou uma foto do perfume para cotação.\n` +
            `👆 https://wa.me/${numLimpo}\n` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }
        await sendMessage(from,
          `📸 Foto recebida! Obrigado.\n\n` +
          `A nossa equipa vai identificar o perfume e entrar em contacto consigo com o preço e disponibilidade em breve. 🖤`
        );
        return;

      } else if (isImagem) {
        // ─── 3. Imagem genérica — Analisar com IA Vision ─────
        // Informar o cliente que estamos a analisar
        await sendMessage(from, `🔍 A analisar a imagem... um momento!`);

        // Descarregar imagem da Evolution API
        const msgId = body?.data?.key?.id;
        const base64 = await downloadMediaBase64(from, msgId);

        // Analisar com Anthropic Vision
        const resultado = await identificarPerfumeNaImagem(null, base64);

        if (resultado && resultado.encontrado && resultado.nome) {
          // IA identificou o perfume — procurar no catálogo
          const nomeIA = resultado.nome.toLowerCase();
          const marcaIA = (resultado.marca || '').toLowerCase();
          const concIA = (resultado.conc || '').toLowerCase();

          // Pesquisa directa no catálogo
          let nomeBaseEncontrado = null;

          // 1. Tentar pesquisa directa com o nome completo
          const txtBusca = nomeIA + ' ' + concIA;
          nomeBaseEncontrado = pesquisaDirecta(txtBusca);

          // 2. Se não encontrou, tentar só com palavras principais
          if (!nomeBaseEncontrado) {
            const palavrasChave = nomeIA.replace(/eau de|parfum|toilette|elixir/gi, '').trim();
            nomeBaseEncontrado = pesquisaDirecta(palavrasChave);
          }

          if (nomeBaseEncontrado) {
            // ✅ Perfume encontrado no catálogo!
            clearSessao(from);
            setSessao(from, { nomeBase: nomeBaseEncontrado, tipo: 'perfume_activo',
              ehNicho: Object.values(CATALOGO).some(p => p.nomeBase === nomeBaseEncontrado && p.nicho) });
            const resposta = respostaPerfume(nomeBaseEncontrado);
            if (resposta) {
              await sendMessage(from, `✨ Reconheci o perfume na imagem: *${resultado.nome}*\n\n` + resposta);
            }
          } else {
            // ❌ IA identificou mas não está no catálogo
            setSessao(from, { tipo: 'aguardar_foto_perfume', nomePerguntado: resultado.nome });
            if (NUMERO_HUMANO) {
              const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
              await sendMessage(NUMERO_HUMANO,
                `📸 *OMNIA — Perfume identificado por IA (fora do catálogo)*\n\n` +
                `📱 Cliente: +${numLimpo}\n` +
                `🤖 IA identificou: *${resultado.nome}* (${resultado.marca})\n` +
                `📎 O cliente enviou uma foto — perfume não está no catálogo.\n` +
                `👆 https://wa.me/${numLimpo}\n` +
                `🕐 ${new Date().toLocaleString('pt-PT')}`
              );
            }
            await sendMessage(from,
              `✨ Reconheci o perfume: *${resultado.nome}*\n\n` +
              `De momento não temos este perfume disponível no nosso catálogo.\n\n` +
              `Já notifiquei a nossa equipa — vamos verificar disponibilidade e preço e entramos em contacto brevemente. 🖤`
            );
          }
        } else {
          // ❌ IA não conseguiu identificar
          setSessao(from, { tipo: 'aguardar_confirmacao_foto' });
          await sendMessage(from,
            `📸 Recebi a imagem mas não consegui identificar o perfume com clareza.\n\n` +
            `Pode escrever o nome do perfume? Assim ajudo-o de imediato. 🖤`
          );
        }
        return;

      } else {
        // ─── 4. PDF / documento genérico ─────────────────────
        if (NUMERO_HUMANO) {
          const numLimpo = from.replace('@s.whatsapp.net','').replace('@c.us','');
          await sendMessage(NUMERO_HUMANO,
            `📎 *OMNIA — Documento recebido*\n\n` +
            `📱 Cliente: +${numLimpo}\n` +
            `📎 Tipo: ${tipoFicheiro}\n` +
            `👆 https://wa.me/${numLimpo}\n` +
            `🕐 ${new Date().toLocaleString('pt-PT')}`
          );
        }
        await sendMessage(from,
          `Recebemos o documento. A nossa equipa irá analisá-lo e entrará em contacto. 🖤`
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
