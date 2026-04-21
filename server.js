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
  'dior homme intense edp': { nome: 'Dior Homme Intense EDP', nomeBase: 'Dior Homme Intense', genero: 'M', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'50ml': 150900, '100ml': 199600}, notas: 'Íris, Cedro, Âmbar'  },
  'chanel n°5 edp': { nome: 'Chanel N°5 EDP', nomeBase: 'Chanel N°5', genero: 'F', conc: 'EDP', familia: 'Floral Aldéidico', nicho: false, preco: {'35ml': 150900, '50ml': 196500, '100ml': 272000}, notas: 'Ylang-ylang, Íris, Almíscar, Âmbar'  },
  'ysl y parfum': { nome: 'YSL Y Parfum', nomeBase: 'YSL Y', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Especiado', nicho: false, preco: {'60ml': 188600}, notas: 'Bergamota, Coriandro, Vetiver'  },
  'rabanne 1 million parfum': { nome: 'Rabanne 1 Million Parfum', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'Parfum', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 168200, '100ml': 223200}, notas: 'Tonka, Baunilha, Salgado'  },
  'rabanne phantom edt': { nome: 'Rabanne Phantom EDT', nomeBase: 'Rabanne Phantom', genero: 'M', conc: 'EDT', familia: 'Lavanda Amadeirado', nicho: false, preco: {'50ml': 135200, '100ml': 176100}, notas: 'Limão, Lavanda, Vetiver'  },
  'rabanne fame edp': { nome: 'Rabanne Fame EDP', nomeBase: 'Rabanne Fame', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 124200, '50ml': 152500, '80ml': 196500}, notas: 'Mandarina, Jasmim, Patchouli'  },
  'lancôme idôle edp': { nome: 'Lancôme Idôle EDP', nomeBase: 'Lancôme Idôle', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'25ml': 106900, '50ml': 144600, '100ml': 191800}, notas: 'Rosa de Grasse, Almíscar, Âmbar'  },
  'lancôme trésor edp': { nome: 'Lancôme Trésor EDP', nomeBase: 'Lancôme Trésor', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 103800, '50ml': 132000, '100ml': 176100}, notas: 'Pêssego, Rosa, Almíscar, Âmbar'  },
  'versace eros parfum': { nome: 'Versace Eros Parfum', nomeBase: 'Versace Eros', genero: 'M', conc: 'Parfum', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 163500}, notas: 'Lichia, Néroli, Âmbar, Vetiver'  },
  'versace eros flame edp': { nome: 'Versace Eros Flame EDP', nomeBase: 'Versace Eros Flame', genero: 'M', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 135200, '100ml': 179200}, notas: 'Toranja, Romã, Patchouli'  },
  'versace bright crystal edt': { nome: 'Versace Bright Crystal EDT', nomeBase: 'Versace Bright Crystal', genero: 'F', conc: 'EDT', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 99000, '50ml': 124200, '90ml': 160300}, notas: 'Romã, Peónia, Almíscar'  },
  'versace dylan blue pour femme edp': { nome: 'Versace Dylan Blue Pour Femme EDP', nomeBase: 'Versace Dylan Blue Pour Femme', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'50ml': 128900, '100ml': 171300}, notas: 'Groselha, Peónia, Âmbar Branco'  },
  'hugo boss bottled edt': { nome: 'Hugo Boss Bottled EDT', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDT', familia: 'Amadeirado Especiado', nicho: false, preco: {'30ml': 67500, '50ml': 75400, '100ml': 91100, '200ml': 114700}, notas: 'Maçã, Madeira de Sândalo, Cedro'  },
  'hugo boss bottled edp': { nome: 'Hugo Boss Bottled EDP', nomeBase: 'Hugo Boss Bottled', genero: 'M', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 127300, '100ml': 163500}, notas: 'Maçã, Lavanda, Sândalo'  },
  'hugo boss the scent edt': { nome: 'Hugo Boss The Scent EDT', nomeBase: 'Hugo Boss The Scent', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 94200, '100ml': 114700, '200ml': 141400}, notas: 'Gengibre, Osmanthus, Couro'  },
  'hugo boss the scent for her edp': { nome: 'Hugo Boss The Scent For Her EDP', nomeBase: 'Hugo Boss The Scent For Her', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 103800, '50ml': 128900}, notas: 'Framboesa, Osmanthus, Âmbar'  },
  'narciso rodriguez for her edp': { nome: 'Narciso Rodriguez For Her EDP', nomeBase: 'Narciso Rodriguez For Her', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 89500, '50ml': 110000, '100ml': 138300, '150ml': 169700}, notas: 'Rosa, Almíscar, Âmbar'  },
  'narciso rodriguez musc noir rose edp': { nome: 'Narciso Rodriguez Musc Noir Rose EDP', nomeBase: 'Narciso Rodriguez Musc Noir Rose', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 102100, '50ml': 122500}, notas: 'Rosa, Almíscar Negro, Sândalo'  },
  'calvin klein eternity edp': { nome: 'Calvin Klein Eternity EDP', nomeBase: 'Calvin Klein Eternity', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'30ml': 91200, '50ml': 116300, '100ml': 147800}, notas: 'Orquídea, Almíscar, Sândalo'  },
  'calvin klein obsession edp': { nome: 'Calvin Klein Obsession EDP', nomeBase: 'Calvin Klein Obsession', genero: 'F', conc: 'EDP', familia: 'Oriental', nicho: false, preco: {'50ml': 119500, '100ml': 152500}, notas: 'Especiarias, Almíscar, Baunilha'  },
  'tom ford oud wood edp': { nome: 'Tom Ford Oud Wood EDP', nomeBase: 'Tom Ford Oud Wood', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'50ml': 383200, '100ml': 587500}, notas: 'Oud, Sândalo, Vetiver'  },
  'tom ford black orchid edp': { nome: 'Tom Ford Black Orchid EDP', nomeBase: 'Tom Ford Black Orchid', genero: 'U', conc: 'EDP', familia: 'Oriental Floral', nicho: true, preco: {'50ml': 306500, '100ml': 451300}, notas: 'Trufa, Orquídea Preta, Patchouli'  },
  'tom ford tobacco vanille edp': { nome: 'Tom Ford Tobacco Vanille EDP', nomeBase: 'Tom Ford Tobacco Vanille', genero: 'U', conc: 'EDP', familia: 'Oriental Especiado', nicho: true, preco: {'50ml': 391700, '100ml': 613100}, notas: 'Tabaco, Baunilha, Madeira de Cedro'  },
  'tom ford neroli portofino edp': { nome: 'Tom Ford Neroli Portofino EDP', nomeBase: 'Tom Ford Neroli Portofino', genero: 'U', conc: 'EDP', familia: 'Cítrico Floral', nicho: true, preco: {'50ml': 366100, '100ml': 562000}, notas: 'Bergamota, Néroli, Âmbar'  },
  'tom ford lost cherry edp': { nome: 'Tom Ford Lost Cherry EDP', nomeBase: 'Tom Ford Lost Cherry', genero: 'U', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'50ml': 391700, '100ml': 613100}, notas: 'Cereja, Âmbar, Baunilha'  },
  'tom ford rose prick edp': { nome: 'Tom Ford Rose Prick EDP', nomeBase: 'Tom Ford Rose Prick', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 391700}, notas: 'Rosa, Pimenta, Fava de Tonka'  },
  'guerlain mon guerlain edp': { nome: 'Guerlain Mon Guerlain EDP', nomeBase: 'Guerlain Mon Guerlain', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 124200, '50ml': 160300, '100ml': 215400}, notas: 'Lavanda, Baunilha, Almíscar'  },
  'guerlain la petite robe noire edp': { nome: 'Guerlain La Petite Robe Noire EDP', nomeBase: 'Guerlain La Petite Robe Noire', genero: 'F', conc: 'EDP', familia: 'Floral Frutal Gourmand', nicho: false, preco: {'30ml': 116300, '50ml': 147800, '100ml': 196500}, notas: 'Bergamota, Rosa, Alcaçuz, Patchouli'  },
  'mugler angel nova edp': { nome: 'Mugler Angel Nova EDP', nomeBase: 'Mugler Angel Nova', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'50ml': 160300}, notas: 'Lavanda, Pralinê, Almíscar'  },
  'mugler alien edp': { nome: 'Mugler Alien EDP', nomeBase: 'Mugler Alien', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 124200, '60ml': 168200}, notas: 'Jasmim, Âmbar Branco, Madeira de Caxemira'  },
  'mugler a*men edt': { nome: 'Mugler A*Men EDT', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'EDT', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 132000}, notas: 'Café, Patchouli, Âmbar'  },
  'mugler a*men parfum': { nome: 'Mugler A*Men Parfum', nomeBase: 'Mugler A*Men', genero: 'M', conc: 'Parfum', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 163500}, notas: 'Café, Patchouli, Baunilha, Âmbar'  },
  'mancera cedrat boise': { nome: 'Mancera Cedrat Boise', nomeBase: 'Mancera Cedrat Boise', genero: 'U', conc: 'EDP', familia: 'Cítrico Amadeirado', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Limão, Cassis, Vetiver, Cedro'  },
  'mancera instant crush': { nome: 'Mancera Instant Crush', nomeBase: 'Mancera Instant Crush', genero: 'U', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Laranja, Rosa, Baunilha, Âmbar'  },
  'mancera roses vanille': { nome: 'Mancera Roses Vanille', nomeBase: 'Mancera Roses Vanille', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Rosa, Baunilha, Patchouli'  },
  'mancera red tobacco': { nome: 'Mancera Red Tobacco', nomeBase: 'Mancera Red Tobacco', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Tabaco, Rosa, Especiarias, Âmbar'  },
  'mancera amore caffè': { nome: 'Mancera Amore Caffè', nomeBase: 'Mancera Amore Caffè', genero: 'U', conc: 'EDP', familia: 'Gourmand Oriental', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Café, Baunilha, Patchouli'  },
  'mancera french riviera': { nome: 'Mancera French Riviera', nomeBase: 'Mancera French Riviera', genero: 'U', conc: 'EDP', familia: 'Cítrico Marinho', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Bergamota, Cedro, Âmbar Branco'  },
  'mancera tonka cola': { nome: 'Mancera Tonka Cola', nomeBase: 'Mancera Tonka Cola', genero: 'U', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Tonka, Cola, Baunilha'  },
  'mancera coco vanille': { nome: 'Mancera Coco Vanille', nomeBase: 'Mancera Coco Vanille', genero: 'F', conc: 'EDP', familia: 'Gourmand Floral', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Coco, Baunilha, Almíscar'  },
  'mancera sicily': { nome: 'Mancera Sicily', nomeBase: 'Mancera Sicily', genero: 'U', conc: 'EDP', familia: 'Cítrico Floral', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Limão Siciliano, Bergamota, Néroli'  },
  'mancera black gold': { nome: 'Mancera Black Gold', nomeBase: 'Mancera Black Gold', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'60ml': 255400, '120ml': 357600}, notas: 'Oud, Baunilha, Âmbar, Sândalo'  },
  'mancera wild fruits': { nome: 'Mancera Wild Fruits', nomeBase: 'Mancera Wild Fruits', genero: 'U', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'60ml': 245200, '120ml': 340600}, notas: 'Frutas Silvestres, Rosa, Âmbar'  },
  'montale arabians tonka': { nome: 'Montale Arabians Tonka', nomeBase: 'Montale Arabians Tonka', genero: 'U', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Açafrão, Oud, Rosa, Tonka'  },
  'montale roses musk': { nome: 'Montale Roses Musk', nomeBase: 'Montale Roses Musk', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Almíscar, Âmbar'  },
  'montale intense café': { nome: 'Montale Intense Café', nomeBase: 'Montale Intense Café', genero: 'U', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Café, Baunilha, Âmbar'  },
  'montale black aoud': { nome: 'Montale Black Aoud', nomeBase: 'Montale Black Aoud', genero: 'M', conc: 'EDP', familia: 'Amadeirado Floral', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Oud, Rosa, Patchouli, Vetiver'  },
  'montale dark aoud': { nome: 'Montale Dark Aoud', nomeBase: 'Montale Dark Aoud', genero: 'M', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Oud, Sândalo, Almíscar Negro'  },
  'montale amber musk': { nome: 'Montale Amber Musk', nomeBase: 'Montale Amber Musk', genero: 'U', conc: 'EDP', familia: 'Almíscar Âmbar', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Âmbar, Almíscar, Baunilha'  },
  'montale starry nights': { nome: 'Montale Starry Nights', nomeBase: 'Montale Starry Nights', genero: 'U', conc: 'EDP', familia: 'Oriental Floral', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa Selvagem, Violeta, Açafrão'  },
  'montale vanilla cake': { nome: 'Montale Vanilla Cake', nomeBase: 'Montale Vanilla Cake', genero: 'F', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Baunilha, Leite, Caramelo'  },
  'montale rose elixir': { nome: 'Montale Rose Elixir', nomeBase: 'Montale Rose Elixir', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Rosa, Almíscar, Vetiver'  },
  'montale sensual instinct': { nome: 'Montale Sensual Instinct', nomeBase: 'Montale Sensual Instinct', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'50ml': 298000, '100ml': 323600}, notas: 'Açafrão, Oud, Patchouli'  },
  'creed aventus': { nome: 'Creed Aventus', nomeBase: 'Creed Aventus', genero: 'M', conc: 'EDP', familia: 'Frutal Chypre', nicho: true, preco: {'50ml': 323600, '100ml': 587500}, notas: 'Bergamota, Groselha Preta, Bétula, Almíscar'  },
  'creed aventus for her': { nome: 'Creed Aventus for Her', nomeBase: 'Creed Aventus for Her', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: true, preco: {'50ml': 315100, '75ml': 400200}, notas: 'Bergamota, Rosa, Baunilha'  },
  'creed green irish tweed': { nome: 'Creed Green Irish Tweed', nomeBase: 'Creed Green Irish Tweed', genero: 'M', conc: 'EDT', familia: 'Fougère', nicho: true, preco: {'50ml': 340600, '100ml': 510900}, notas: 'Íris, Sândalo, Âmbar'  },
  'creed millesime imperial': { nome: 'Creed Millesime Imperial', nomeBase: 'Creed Millesime Imperial', genero: 'U', conc: 'EDP', familia: 'Aquático', nicho: true, preco: {'50ml': 332100, '100ml': 502400}, notas: 'Bergamota, Alga, Almíscar'  },
  'parfums de marly layton': { nome: 'Parfums de Marly Layton', nomeBase: 'Parfums de Marly Layton', genero: 'M', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'75ml': 510900, '125ml': 664200}, notas: 'Maçã, Lavanda, Baunilha, Sândalo'  },
  'parfums de marly layton exclusif': { nome: 'Parfums de Marly Layton Exclusif', nomeBase: 'Parfums de Marly Layton Exclusif', genero: 'M', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'75ml': 562000}, notas: 'Maçã, Lavanda, Noz-moscada, Sândalo'  },
  'parfums de marly delina': { nome: 'Parfums de Marly Delina', nomeBase: 'Parfums de Marly Delina', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'75ml': 493900, '125ml': 638600}, notas: 'Rhubarbo, Peónia, Rosa de Maio'  },
  'parfums de marly delina exclusif': { nome: 'Parfums de Marly Delina Exclusif', nomeBase: 'Parfums de Marly Delina Exclusif', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'75ml': 562000}, notas: 'Rhubarbo, Peónia, Rosa, Almíscar'  },
  'parfums de marly pegasus': { nome: 'Parfums de Marly Pegasus', nomeBase: 'Parfums de Marly Pegasus', genero: 'M', conc: 'EDP', familia: 'Floral Gourmand', nicho: true, preco: {'75ml': 493900, '125ml': 638600}, notas: 'Lavanda, Almendra, Baunilha, Sândalo'  },
  'parfums de marly percival': { nome: 'Parfums de Marly Percival', nomeBase: 'Parfums de Marly Percival', genero: 'M', conc: 'EDP', familia: 'Fougère', nicho: true, preco: {'75ml': 493900}, notas: 'Bergamota, Lavanda, Almíscar'  },
  'parfums de marly cassili': { nome: 'Parfums de Marly Cassili', nomeBase: 'Parfums de Marly Cassili', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'75ml': 493900}, notas: 'Rosa, Almíscar, Sândalo'  },
  'nishane hacivat': { nome: 'Nishane Hacivat', nomeBase: 'Nishane Hacivat', genero: 'U', conc: 'Extrait', familia: 'Cítrico Amadeirado', nicho: true, preco: {'50ml': 345700, '100ml': 464900}, notas: 'Bergamota, Abacaxi, Cedro, Patchouli'  },
  'nishane ani': { nome: 'Nishane Ani', nomeBase: 'Nishane Ani', genero: 'U', conc: 'Extrait', familia: 'Floral Almíscar', nicho: true, preco: {'50ml': 345700}, notas: 'Flor de Laranjeira, Almíscar, Âmbar'  },
  'nishane zenne': { nome: 'Nishane Zenne', nomeBase: 'Nishane Zenne', genero: 'U', conc: 'Extrait', familia: 'Oriental Floral', nicho: true, preco: {'50ml': 345700}, notas: 'Rosa, Oud, Âmbar'  },
  'nishane afrika olifant': { nome: 'Nishane Afrika Olifant', nomeBase: 'Nishane Afrika Olifant', genero: 'U', conc: 'Extrait', familia: 'Amadeirado Especiado', nicho: true, preco: {'50ml': 362700}, notas: 'Âmbar, Vetiver, Patchouli'  },
  'initio oud for greatness': { nome: 'Initio Oud for Greatness', nomeBase: 'Initio Oud for Greatness', genero: 'U', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: true, preco: {'90ml': 536400}, notas: 'Oud, Almíscar, Especiarias, Âmbar'  },
  'initio atomic rose': { nome: 'Initio Atomic Rose', nomeBase: 'Initio Atomic Rose', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'90ml': 536400}, notas: 'Rosa, Almíscar, Âmbar'  },
  'initio black gold': { nome: 'Initio Black Gold', nomeBase: 'Initio Black Gold', genero: 'U', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'90ml': 536400}, notas: 'Sândalo, Âmbar, Almíscar'  },
  'initio rehab': { nome: 'Initio Rehab', nomeBase: 'Initio Rehab', genero: 'U', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'90ml': 536400}, notas: 'Baunilha, Almíscar, Patchouli'  },
  'xerjoff nio': { nome: 'Xerjoff Nio', nomeBase: 'Xerjoff Nio', genero: 'U', conc: 'EDP', familia: 'Cítrico Verde', nicho: true, preco: {'50ml': 391700, '100ml': 533000}, notas: 'Yuzu, Menta, Madeira'  },
  'xerjoff oud stars alexandria ii': { nome: 'Xerjoff Oud Stars Alexandria II', nomeBase: 'Xerjoff Oud Stars Alexandria II', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'50ml': 545000}, notas: 'Oud, Sândalo, Rosa'  },
  'mfk baccarat rouge 540 edp': { nome: 'MFK Baccarat Rouge 540 EDP', nomeBase: 'MFK Baccarat Rouge 540', genero: 'U', conc: 'EDP', familia: 'Floral Âmbar', nicho: true, preco: {'70ml': 655700}, notas: 'Jasmim, Açafrão, Cedro Âmbar'  },
  'mfk baccarat rouge 540 extrait': { nome: 'MFK Baccarat Rouge 540 Extrait', nomeBase: 'MFK Baccarat Rouge 540 Extrait', genero: 'U', conc: 'Extrait', familia: 'Floral Âmbar', nicho: true, preco: {'70ml': 766400}, notas: 'Jasmim, Açafrão, Cedro Âmbar'  },
  'mfk 724 edp': { nome: 'MFK 724 EDP', nomeBase: 'MFK 724', genero: 'U', conc: 'EDP', familia: 'Floral Amadeirado', nicho: true, preco: {'70ml': 562000}, notas: 'Bergamota, Lentisco, Almíscar'  },
  'mfk grand soir edp': { nome: 'MFK Grand Soir EDP', nomeBase: 'MFK Grand Soir', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'70ml': 562000}, notas: 'Âmbar, Baunilha, Almíscar'  },
  'mfk gentle fluidity gold edp': { nome: 'MFK Gentle Fluidity Gold EDP', nomeBase: 'MFK Gentle Fluidity Gold', genero: 'U', conc: 'EDP', familia: 'Amadeirado Oriental', nicho: true, preco: {'70ml': 562000}, notas: 'Noz-moscada, Âmbar, Baunilha'  },
  'by kilian angels share edp': { nome: 'By Kilian Angels Share EDP', nomeBase: 'By Kilian Angels Share', genero: 'U', conc: 'EDP', familia: 'Gourmand', nicho: true, preco: {'50ml': 545000}, notas: 'Conhaque, Baunilha, Canela, Âmbar'  },
  'by kilian good girl gone bad edp': { nome: 'By Kilian Good Girl Gone Bad EDP', nomeBase: 'By Kilian Good Girl Gone Bad', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 545000}, notas: 'Ylang, Magnólia, Rosa, Íris'  },
  'amouage reflection man edp': { nome: 'Amouage Reflection Man EDP', nomeBase: 'Amouage Reflection Man', genero: 'M', conc: 'EDP', familia: 'Floral Aromático', nicho: true, preco: {'50ml': 519400, '100ml': 689700}, notas: 'Alecrim, Íris, Sândalo'  },
  'amouage interlude man edp': { nome: 'Amouage Interlude Man EDP', nomeBase: 'Amouage Interlude Man', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: true, preco: {'50ml': 519400}, notas: 'Incenso, Âmbar, Orégão'  },
  'amouage memoir man edp': { nome: 'Amouage Memoir Man EDP', nomeBase: 'Amouage Memoir Man', genero: 'M', conc: 'EDP', familia: 'Floral Amadeirado', nicho: true, preco: {'50ml': 519400}, notas: 'Absinto, Incenso, Âmbar'  },
  'amouage gold woman edp': { nome: 'Amouage Gold Woman EDP', nomeBase: 'Amouage Gold Woman', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: true, preco: {'50ml': 519400}, notas: 'Rosa, Jasmim, Incenso, Âmbar'  },
  'frederic malle portrait of a lady edp': { nome: 'Frederic Malle Portrait of a Lady EDP', nomeBase: 'Frederic Malle Portrait of a Lady', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: true, preco: {'50ml': 567100, '100ml': 754400}, notas: 'Rosa, Patchouli, Sândalo, Âmbar'  },
  'frederic malle musc ravageur edp': { nome: 'Frederic Malle Musc Ravageur EDP', nomeBase: 'Frederic Malle Musc Ravageur', genero: 'U', conc: 'EDP', familia: 'Oriental', nicho: true, preco: {'50ml': 545000}, notas: 'Âmbar, Almíscar, Baunilha'  },
  'frederic malle cologne indelebile edp': { nome: 'Frederic Malle Cologne Indelebile EDP', nomeBase: 'Frederic Malle Cologne Indelebile', genero: 'U', conc: 'EDP', familia: 'Floral', nicho: true, preco: {'50ml': 545000}, notas: 'Almíscar, Néroli, Jasmim'  },
  'roja dove enigma edp': { nome: 'Roja Dove Enigma EDP', nomeBase: 'Roja Dove Enigma', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: true, preco: {'50ml': 885600}, notas: 'Bergamota, Rosa, Incenso, Âmbar'  },
  'roja dove elysium edp': { nome: 'Roja Dove Elysium EDP', nomeBase: 'Roja Dove Elysium', genero: 'M', conc: 'EDP', familia: 'Fougère', nicho: true, preco: {'50ml': 885600}, notas: 'Bergamota, Lavanda, Sândalo'  },
  'roja dove danger edp': { nome: 'Roja Dove Danger EDP', nomeBase: 'Roja Dove Danger', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: true, preco: {'50ml': 885600}, notas: 'Cítrico, Rosa, Âmbar'  },
  'roja dove scandal edp': { nome: 'Roja Dove Scandal EDP', nomeBase: 'Roja Dove Scandal', genero: 'F', conc: 'EDP', familia: 'Floral Chypre', nicho: true, preco: {'50ml': 885600}, notas: 'Aldeídos, Rosa, Âmbar'  },
  'dolce gabbana devotion edp': { nome: 'D&G Devotion EDP', nomeBase: 'D&G Devotion', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Neroli, Almíscar Branco, Âmbar, Baunilha'  },
  'prada luna rossa ocean parfum': { nome: 'Prada Luna Rossa Ocean Parfum', nomeBase: 'Prada Luna Rossa Ocean', genero: 'M', conc: 'Parfum', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 185500, '100ml': 236700}, notas: 'Bergamota, Íris, Vetiver, Sândalo'  },
  'prada paradoxe edp': { nome: 'Prada Paradoxe EDP', nomeBase: 'Prada Paradoxe', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 116200, '50ml': 130400, '90ml': 157100}, notas: 'Neroli, Âmbar, Almíscar, Baunilha'  },
  'prada paradoxe intense edp': { nome: 'Prada Paradoxe Intense EDP', nomeBase: 'Prada Paradoxe Intense', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 122500, '50ml': 138300, '90ml': 166600}, notas: 'Neroli, Jasmim, Âmbar, Almíscar'  },
  'prada paradoxe virtual flower edp': { nome: 'Prada Paradoxe Virtual Flower EDP', nomeBase: 'Prada Paradoxe Virtual Flower', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 80100, '50ml': 88000, '90ml': 103000}, notas: 'Jasmim, Neroli, Almíscar, Âmbar'  },
  'prada paradoxe radical essence parfum': { nome: 'Prada Paradoxe Radical Essence Parfum', nomeBase: 'Prada Paradoxe Radical Essence', genero: 'F', conc: 'Parfum', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 95800, '50ml': 106800, '90ml': 125700}, notas: 'Neroli, Âmbar, Almíscar, Patchouli'  },
  'gucci flora gorgeous gardenia edp': { nome: 'Gucci Flora Gorgeous Gardenia EDP', nomeBase: 'Gucci Flora Gorgeous Gardenia', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'30ml': 130500, '50ml': 163500, '100ml': 207800}, notas: 'Pêra, Gardénia, Jasmim, Âmbar'  },
  'carolina herrera 212 vip edt': { nome: 'Carolina Herrera 212 VIP EDT', nomeBase: 'Carolina Herrera 212 VIP', genero: 'M', conc: 'EDT', familia: 'Fougère Aromático', nicho: false, preco: {'50ml': 102100, '100ml': 124100}, notas: 'Bergamota, Âmbar, Almíscar Branco'  },
  'lacoste l.12.12 blanc edt': { nome: 'Lacoste L.12.12 Blanc EDT', nomeBase: 'Lacoste L.12.12 Blanc', genero: 'M', conc: 'EDT', familia: 'Aquático Aromático', nicho: false, preco: {'50ml': 103700, '100ml': 127300}, notas: 'Bergamota, Patchouli, Almíscar, Cedro'  },
  'lacoste l.12.12 vert edt': { nome: 'Lacoste L.12.12 Vert EDT', nomeBase: 'Lacoste L.12.12 Vert', genero: 'M', conc: 'EDT', familia: 'Aromático Fougère', nicho: false, preco: {'50ml': 103700, '100ml': 127300}, notas: 'Vetiver, Feno, Ervas Aromáticas'  },
  'dior sauvage edt': { nome: 'Dior Sauvage EDT', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'30ml': 110000, '60ml': 125700, '100ml': 149300, '200ml': 188600}, notas: 'Bergamota, Ambroxan, Pimenta Rosa'  },
  'dior sauvage edp': { nome: 'Dior Sauvage EDP', nomeBase: 'Dior Sauvage', genero: 'M', conc: 'EDP', familia: 'Oriental Fougère', nicho: false, preco: {'30ml': 125700, '60ml': 141400, '100ml': 165000, '200ml': 212100}, notas: 'Bergamota, Lavanda, Baunilha'  },
  'dior sauvage elixir': { nome: 'Dior Sauvage Elixir', nomeBase: 'Dior Sauvage Elixir', genero: 'M', conc: 'Extrait', familia: 'Especiado Aromático', nicho: false, preco: {'60ml': 248300, '100ml': 314300}, notas: 'Cardamomo, Lavanda, Patchouli'  },
  'dior miss dior edp': { nome: 'Dior Miss Dior EDP', nomeBase: 'Dior Miss Dior', genero: 'F', conc: 'EDP', familia: 'Floral Aromático', nicho: false, preco: {'30ml': 133500, '50ml': 161800, '100ml': 204300, '150ml': 259300}, notas: 'Peónia, Rosa, Patchouli'  },
  'bleu de chanel edt': { nome: 'Bleu de Chanel EDT', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 157100, '100ml': 196400, '150ml': 243600}, notas: 'Citrus, Incenso, Sândalo'  },
  'bleu de chanel edp': { nome: 'Bleu de Chanel EDP', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 172800, '100ml': 220000, '150ml': 267200}, notas: 'Citrus, Noz-moscada, Sândalo'  },
  'bleu de chanel parfum': { nome: 'Bleu de Chanel Parfum', nomeBase: 'Bleu de Chanel', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 204300, '100ml': 259300}, notas: 'Citrus, Bétula, Âmbar'  },
  'chanel coco mademoiselle edp': { nome: 'Chanel Coco Mademoiselle EDP', nomeBase: 'Chanel Coco Mademoiselle', genero: 'F', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'50ml': 179100, '100ml': 232600, '150ml': 282900}, notas: 'Bergamota, Rosa, Patchouli'  },
  'chanel chance eau tendre edp': { nome: 'Chanel Chance Eau Tendre EDP', nomeBase: 'Chanel Chance Eau Tendre', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'50ml': 172800, '100ml': 223100}, notas: 'Toranja, Quéssia, Almíscar Branco'  },
  'ysl black opium edp': { nome: 'YSL Black Opium EDP', nomeBase: 'YSL Black Opium', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 97400, '50ml': 116200, '90ml': 144500, '150ml': 185400}, notas: 'Café, Baunilha, Patchouli, Flor Branca'  },
  'ysl libre edp': { nome: 'YSL Libre EDP', nomeBase: 'YSL Libre', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 110000, '50ml': 133500, '90ml': 161800}, notas: 'Lavanda, Flor de Laranjeira, Cedro'  },
  'ysl y edp': { nome: 'YSL Y EDP', nomeBase: 'YSL Y', genero: 'M', conc: 'EDP', familia: 'Fougère Amadeirado', nicho: false, preco: {'40ml': 105200, '60ml': 122500, '100ml': 150800, '200ml': 188600}, notas: 'Bergamota, Gengibre, Cedro'  },
  'rabanne invictus edt': { nome: 'Rabanne Invictus EDT', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDT', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 117800, '100ml': 144500, '200ml': 180700}, notas: 'Toranja, Louro, Âmbar'  },
  'rabanne invictus edp': { nome: 'Rabanne Invictus EDP', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'EDP', familia: 'Aquático Amadeirado', nicho: false, preco: {'50ml': 128800, '100ml': 160300}, notas: 'Louro, Patchouli, Âmbar, Madeira'  },
  'rabanne invictus parfum': { nome: 'Rabanne Invictus Parfum', nomeBase: 'Rabanne Invictus', genero: 'M', conc: 'Parfum', familia: 'Amadeirado Especiado', nicho: false, preco: {'50ml': 133500, '100ml': 165000, '200ml': 212100}, notas: 'Lavanda, Sândalo Negro, Âmbar'  },
  'rabanne 1 million edt': { nome: 'Rabanne 1 Million EDT', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDT', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 117800, '100ml': 144500, '200ml': 180700}, notas: 'Mandarina, Canela, Âmbar, Couro'  },
  'rabanne 1 million edp': { nome: 'Rabanne 1 Million EDP', nomeBase: 'Rabanne 1 Million', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 128800, '100ml': 157100}, notas: 'Toranja, Canela, Couro, Patchouli'  },
  'armani acqua di giò edt': { nome: 'Armani Acqua di Giò EDT', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDT', familia: 'Aquático', nicho: false, preco: {'50ml': 114700, '100ml': 138300, '200ml': 169700}, notas: 'Citrus, Alga Marinha, Patchouli'  },
  'armani acqua di giò edp': { nome: 'Armani Acqua di Giò EDP', nomeBase: 'Armani Acqua di Giò', genero: 'M', conc: 'EDP', familia: 'Aquático Aromático', nicho: false, preco: {'75ml': 146100, '125ml': 177600}, notas: 'Bergamota, Incenso, Patchouli'  },
  'armani acqua di giò profumo': { nome: 'Armani Acqua di Giò Profumo', nomeBase: 'Armani Acqua di Giò Profumo', genero: 'M', conc: 'Parfum', familia: 'Aquático Aromático', nicho: false, preco: {'75ml': 157100, '125ml': 188600}, notas: 'Incenso, Madeira, Cipreste'  },
  'armani sì edp': { nome: 'Armani Sì EDP', nomeBase: 'Armani Sì', genero: 'F', conc: 'EDP', familia: 'Floral Chypre', nicho: false, preco: {'30ml': 117800, '50ml': 146100, '100ml': 185400, '150ml': 227900}, notas: 'Groselha, Rosa, Almíscar, Âmbar'  },
  'versace eros edt': { nome: 'Versace Eros EDT', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDT', familia: 'Aromático Fougère', nicho: false, preco: {'50ml': 106800, '100ml': 130400, '200ml': 165000}, notas: 'Menta, Tonka, Âmbar'  },
  'versace eros edp': { nome: 'Versace Eros EDP', nomeBase: 'Versace Eros', genero: 'M', conc: 'EDP', familia: 'Aromático Oriental', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Bergamota, Néroli, Fava de Tonka'  },
  'lancôme la vie est belle edp': { nome: 'Lancôme La Vie est Belle EDP', nomeBase: 'Lancôme La Vie est Belle', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 106800, '50ml': 130400, '75ml': 157100, '100ml': 180700, '150ml': 220000}, notas: 'Íris, Pralinê, Baunilha'  },
  'mugler angel edp': { nome: 'Mugler Angel EDP', nomeBase: 'Mugler Angel', genero: 'F', conc: 'EDP', familia: 'Oriental Gourmand', nicho: false, preco: {'30ml': 106800, '50ml': 130400, '60ml': 146100, '90ml': 172800}, notas: 'Caramelo, Patchouli, Baunilha'  },
  'calvin klein ck one edt': { nome: 'Calvin Klein CK One EDT', nomeBase: 'Calvin Klein CK One', genero: 'U', conc: 'EDT', familia: 'Cítrico Aquático', nicho: false, preco: {'100ml': 86400, '200ml': 105200}, notas: 'Bergamota, Chá Verde, Almíscar'  },
  'givenchy gentleman edp': { nome: 'Givenchy Gentleman EDP', nomeBase: 'Givenchy Gentleman', genero: 'M', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'40ml': 122500, '60ml': 146100, '100ml': 180700, '150ml': 220000}, notas: 'Lavanda, Íris, Patchouli, Baunilha Negra'  },
  'givenchy gentleman society edp': { nome: 'Givenchy Gentleman Society EDP', nomeBase: 'Givenchy Gentleman Society', genero: 'M', conc: 'EDP', familia: 'Amadeirado Floral', nicho: false, preco: {'40ml': 130400, '60ml': 157100, '100ml': 204300}, notas: 'Sálvia, Narciso, Vetiver, Sândalo, Baunilha'  },
  'givenchy irresistible edp': { nome: 'Givenchy Irresistible EDP', nomeBase: 'Givenchy Irresistible', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'35ml': 114700, '50ml': 141400, '80ml': 172800}, notas: 'Rosa, Magnólia, Almíscar, Âmbar'  },
  'burberry hero edp': { nome: 'Burberry Hero EDP', nomeBase: 'Burberry Hero', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 122500, '100ml': 150800}, notas: 'Cedro, Vetiver, Almíscar, Junípero'  },
  'burberry hero edt': { nome: 'Burberry Hero EDT', nomeBase: 'Burberry Hero', genero: 'M', conc: 'EDT', familia: 'Amadeirado Aromático', nicho: false, preco: {'50ml': 114700, '100ml': 138300, '150ml': 172800}, notas: 'Bergamota, Cedro, Almíscar, Vetiver'  },
  'burberry her edp': { nome: 'Burberry Her EDP', nomeBase: 'Burberry Her', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'30ml': 110000, '50ml': 133500, '100ml': 165000}, notas: 'Frutas Vermelhas, Jasmim, Âmbar, Almíscar'  },
  'carolina herrera good girl edp': { nome: 'Carolina Herrera Good Girl EDP', nomeBase: 'Carolina Herrera Good Girl', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 114700, '50ml': 138300, '80ml': 169700}, notas: 'Cacao, Jasmim, Bergamota, Tonka'  },
  'carolina herrera bad boy edt': { nome: 'Carolina Herrera Bad Boy EDT', nomeBase: 'Carolina Herrera Bad Boy', genero: 'M', conc: 'EDT', familia: 'Aromático Amadeirado', nicho: false, preco: {'50ml': 122500, '100ml': 150800, '150ml': 188600}, notas: 'Pimenta Vermelha, Salgueiro, Âmbar Cinza'  },
  'viktor rolf flowerbomb edp': { nome: 'Viktor & Rolf Flowerbomb EDP', nomeBase: 'Viktor & Rolf Flowerbomb', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'30ml': 114700, '50ml': 138300, '100ml': 172800}, notas: 'Rosa, Jasmim, Orquídea, Patchouli'  },
  'viktor rolf spicebomb edt': { nome: 'Viktor & Rolf Spicebomb EDT', nomeBase: 'Viktor & Rolf Spicebomb', genero: 'M', conc: 'EDT', familia: 'Especiado Aromático', nicho: false, preco: {'50ml': 114700, '90ml': 138300}, notas: 'Pimenta, Safran, Vetiver, Tabaco'  },
  'viktor rolf spicebomb extreme edp': { nome: 'Viktor & Rolf Spicebomb Extreme EDP', nomeBase: 'Viktor & Rolf Spicebomb Extreme', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 125700, '90ml': 157100}, notas: 'Baunilha, Tabaco, Canela, Pimenta'  },
  'valentino born in roma uomo edp': { nome: 'Valentino Born in Roma Uomo EDP', nomeBase: 'Valentino Born in Roma', genero: 'M', conc: 'EDP', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 125700, '100ml': 157100}, notas: 'Lavanda, Baunilha, Vetiver, Âmbar'  },
  'valentino born in roma intense edp': { nome: 'Valentino Born in Roma Intense EDP', nomeBase: 'Valentino Born in Roma Intense', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 138300, '100ml': 169700}, notas: 'Lavanda, Baunilha, Vetiver, Âmbar Fumado'  },
  'valentino donna born in roma edp': { nome: 'Valentino Donna Born in Roma EDP', nomeBase: 'Valentino Donna Born in Roma', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'50ml': 125700, '100ml': 157100}, notas: 'Jasmim, Baunilha, Groseilha, Bergamota'  },
  'gucci bloom edp': { nome: 'Gucci Bloom EDP', nomeBase: 'Gucci Bloom', genero: 'F', conc: 'EDP', familia: 'Floral', nicho: false, preco: {'30ml': 122500, '50ml': 146100, '100ml': 188600}, notas: 'Tuberosa, Rangoon Creeper, Jasmim'  },
  'gucci guilty edp h': { nome: 'Gucci Guilty EDP Pour Homme', nomeBase: 'Gucci Guilty Pour Homme', genero: 'M', conc: 'EDP', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 122500, '90ml': 154000}, notas: 'Coentro, Cedro, Patchouli, Âmbar'  },
  'gucci guilty edt h': { nome: 'Gucci Guilty EDT Pour Homme', nomeBase: 'Gucci Guilty Pour Homme', genero: 'M', conc: 'EDT', familia: 'Oriental Aromático', nicho: false, preco: {'50ml': 110000, '90ml': 135100}, notas: 'Limão, Lavanda, Patchouli, Âmbar'  },
  'dolce gabbana the one edt h': { nome: 'D&G The One EDT Homme', nomeBase: 'D&G The One Homme', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Toranja, Basílico, Âmbar, Cedro'  },
  'dolce gabbana the one edp h': { nome: 'D&G The One EDP Homme', nomeBase: 'D&G The One Homme', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 128800, '100ml': 160300}, notas: 'Tabaco, Gengibre, Cardamomo, Âmbar'  },
  'dolce gabbana light blue h edt': { nome: 'D&G Light Blue Pour Homme EDT', nomeBase: 'D&G Light Blue Pour Homme', genero: 'M', conc: 'EDT', familia: 'Aquático', nicho: false, preco: {'40ml': 94200, '75ml': 117800, '125ml': 146100}, notas: 'Junípero, Bergamota, Rosalina, Madeira'  },
  'dolce gabbana light blue f edt': { nome: 'D&G Light Blue EDT', nomeBase: 'D&G Light Blue', genero: 'F', conc: 'EDT', familia: 'Floral Aquático', nicho: false, preco: {'25ml': 86400, '50ml': 106800, '100ml': 132000}, notas: 'Maçã, Cedro, Bambu, Jasmim Branco'  },
  'jean paul gaultier le male edt': { nome: 'Jean Paul Gaultier Le Male EDT', nomeBase: 'Jean Paul Gaultier Le Male', genero: 'M', conc: 'EDT', familia: 'Fougère Oriental', nicho: false, preco: {'75ml': 117800, '125ml': 146100, '200ml': 180700}, notas: 'Lavanda, Baunilha, Almíscar, Menta'  },
  'jean paul gaultier le male edp': { nome: 'Jean Paul Gaultier Le Male EDP', nomeBase: 'Jean Paul Gaultier Le Male', genero: 'M', conc: 'EDP', familia: 'Oriental Fougère', nicho: false, preco: {'75ml': 128800, '125ml': 157100}, notas: 'Lavanda, Baunilha, Âmbar, Almíscar'  },
  'jean paul gaultier scandal edp': { nome: 'Jean Paul Gaultier Scandal EDP', nomeBase: 'Jean Paul Gaultier Scandal', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 110000, '50ml': 133500, '80ml': 161800}, notas: 'Mel, Peónia, Patchouli, Fava de Tonka'  },
  'prada luna rossa ocean edt': { nome: 'Prada Luna Rossa Ocean EDT', nomeBase: 'Prada Luna Rossa Ocean', genero: 'M', conc: 'EDT', familia: 'Aquático Aromático', nicho: false, preco: {'50ml': 130400, '100ml': 161800}, notas: 'Bergamota, Açafrão, Íris, Vetiver'  },
  'ralph lauren polo blue edt': { nome: 'Ralph Lauren Polo Blue EDT', nomeBase: 'Ralph Lauren Polo Blue', genero: 'M', conc: 'EDT', familia: 'Aquático Amadeirado', nicho: false, preco: {'75ml': 90500, '125ml': 114700, '200ml': 141400}, notas: 'Melão, Pepino, Sândalo, Almíscar'  },
  'ralph lauren polo blue edp': { nome: 'Ralph Lauren Polo Blue EDP', nomeBase: 'Ralph Lauren Polo Blue', genero: 'M', conc: 'EDP', familia: 'Aquático Amadeirado', nicho: false, preco: {'75ml': 100300, '125ml': 125700, '200ml': 157100}, notas: 'Bergamota, Cedro, Âmbar, Sândalo'  },
  'azzaro wanted edt': { nome: 'Azzaro Wanted EDT', nomeBase: 'Azzaro Wanted', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 94200, '100ml': 114700}, notas: 'Bergamota, Cedro, Âmbar, Gengibre'  },
  'azzaro the most wanted edp': { nome: 'Azzaro The Most Wanted EDP', nomeBase: 'Azzaro The Most Wanted', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Sálvia, Âmbar, Cedro, Baunilha'  },
  'azzaro the most wanted edt': { nome: 'Azzaro The Most Wanted EDT', nomeBase: 'Azzaro The Most Wanted', genero: 'M', conc: 'EDT', familia: 'Aromático Amadeirado', nicho: false, preco: {'50ml': 102100, '100ml': 125700}, notas: 'Bergamota, Cedro, Âmbar'  },
  'ysl myslf edp': { nome: 'YSL MYSLF EDP', nomeBase: 'YSL MYSLF', genero: 'M', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'60ml': 117800, '100ml': 146100, '150ml': 180700}, notas: 'Lavanda, Salicilato, Cedro, Âmbar'  },
  'ysl mon paris edp': { nome: 'YSL Mon Paris EDP', nomeBase: 'YSL Mon Paris', genero: 'F', conc: 'EDP', familia: 'Floral Frutal', nicho: false, preco: {'30ml': 102100, '50ml': 124100, '90ml': 152400}, notas: 'Amora, Peónia, Almíscar, Âmbar'  },
  'armani stronger with you edt': { nome: 'Armani Stronger With You EDT', nomeBase: 'Armani Stronger With You', genero: 'M', conc: 'EDT', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 99000, '100ml': 121000, '150ml': 149300}, notas: 'Castanha, Cardamomo, Baunilha, Âmbar'  },
  'armani stronger with you intensely edp': { nome: 'Armani Stronger With You Intensely EDP', nomeBase: 'Armani Stronger With You Intensely', genero: 'M', conc: 'EDP', familia: 'Oriental Amadeirado', nicho: false, preco: {'50ml': 102100, '100ml': 125700, '150ml': 154000}, notas: 'Castanha, Sálvia, Cedro, Baunilha'  },
  'armani my way edp': { nome: 'Armani My Way EDP', nomeBase: 'Armani My Way', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 92700, '50ml': 114700, '90ml': 141400}, notas: 'Bergamota, Flor de Laranjeira, Cedro, Almíscar'  },
  'mugler alien goddess edp': { nome: 'Mugler Alien Goddess EDP', nomeBase: 'Mugler Alien Goddess', genero: 'F', conc: 'EDP', familia: 'Floral Almíscar', nicho: false, preco: {'30ml': 102100, '60ml': 125700, '90ml': 149300}, notas: 'Neroli, Baunilha, Âmbar, Almíscar'  },
  'hugo boss alive edp': { nome: 'Hugo Boss Alive EDP', nomeBase: 'Hugo Boss Alive', genero: 'F', conc: 'EDP', familia: 'Floral Amadeirado', nicho: false, preco: {'30ml': 86400, '50ml': 102100, '80ml': 121000}, notas: 'Maçã, Rosa, Sândalo, Baunilha'  },
  'carolina herrera 212 vip black edp': { nome: 'Carolina Herrera 212 VIP Black EDP', nomeBase: 'Carolina Herrera 212 VIP Black', genero: 'M', conc: 'EDP', familia: 'Oriental Especiado', nicho: false, preco: {'50ml': 102100, '100ml': 125700, '200ml': 157100}, notas: 'Sálvia, Couro, Baunilha, Âmbar'  },
  'carolina herrera good girl blush edp': { nome: 'Carolina Herrera Good Girl Blush EDP', nomeBase: 'Carolina Herrera Good Girl Blush', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 119400, '50ml': 141400, '80ml': 169700, '150ml': 220000}, notas: 'Rosa, Peónia, Amora, Almíscar'  },
  'dolce gabbana the one edp f': { nome: 'D&G The One EDP', nomeBase: 'D&G The One', genero: 'F', conc: 'EDP', familia: 'Floral Oriental', nicho: false, preco: {'50ml': 117800, '100ml': 146100}, notas: 'Bergamota, Rosa, Baunilha, Âmbar'  },
  'jean paul gaultier la belle edp': { nome: 'Jean Paul Gaultier La Belle EDP', nomeBase: 'Jean Paul Gaultier La Belle', genero: 'F', conc: 'EDP', familia: 'Oriental Floral', nicho: false, preco: {'30ml': 102100, '50ml': 122500, '100ml': 152400}, notas: 'Pera, Jasmim, Baunilha, Âmbar'  },
  'jean paul gaultier le male ultra edt': { nome: 'Jean Paul Gaultier Le Male Ultra EDT', nomeBase: 'Jean Paul Gaultier Le Male Ultra', genero: 'M', conc: 'EDT', familia: 'Oriental Almíscar', nicho: false, preco: {'40ml': 102100, '75ml': 122500, '125ml': 149300}, notas: 'Lavanda, Baunilha, Almíscar, Menta'  },
  'montblanc explorer edp': { nome: 'Montblanc Explorer EDP', nomeBase: 'Montblanc Explorer', genero: 'M', conc: 'EDP', familia: 'Amadeirado Aromático', nicho: false, preco: {'60ml': 94200, '100ml': 114700, '200ml': 141400}, notas: 'Bergamota, Patchouli, Âmbar, Couro'  },
  'gucci flora gorgeous jasmine edp': { nome: 'Gucci Flora Gorgeous Jasmine EDP', nomeBase: 'Gucci Flora Gorgeous Jasmine', genero: 'F', conc: 'EDP', familia: 'Floral Gourmand', nicho: false, preco: {'30ml': 117800, '50ml': 141400, '100ml': 180700}, notas: 'Jasmim, Bergamota, Almíscar, Âmbar'  },
  'maison crivelli musc nurāsana': { nome: 'Maison Crivelli Musc Nurāsana Extrait', nomeBase: 'Maison Crivelli Musc Nurāsana', genero: 'U', conc: 'Extrait', familia: 'Almiscarado Floral', nicho: true, preco: {'5ml': 85000, '50ml': 680000, '100ml': 1190000}, notas: 'Almíscar aéreo, rosa, incenso' },
  'maison crivelli cuir infrarouge': { nome: 'Maison Crivelli Cuir Infrarouge Extrait', nomeBase: 'Maison Crivelli Cuir Infrarouge', genero: 'U', conc: 'Extrait', familia: 'Couro Frutado', nicho: true, preco: {'5ml': 85000, '50ml': 680000, '100ml': 1190000}, notas: 'Couro grainado, framboesa, neon' },
  'maison crivelli safran secret': { nome: 'Maison Crivelli Safran Secret Extrait', nomeBase: 'Maison Crivelli Safran Secret', genero: 'U', conc: 'Extrait', familia: 'Oriental Especiado', nicho: true, preco: {'5ml': 102000, '50ml': 731000, '100ml': 1258000}, notas: 'Açafrão, madeiras quentes, névoa' },
  'maison crivelli oud maracujá': { nome: 'Maison Crivelli Oud Maracujá Extrait', nomeBase: 'Maison Crivelli Oud Maracujá', genero: 'U', conc: 'Extrait', familia: 'Oriental Frutado', nicho: true, preco: {'5ml': 102000, '50ml': 731000, '100ml': 1258000}, notas: 'Oud, maracujá, exótico' },
  'maison crivelli oud cadenza': { nome: 'Maison Crivelli Oud Cadenza Extrait', nomeBase: 'Maison Crivelli Oud Cadenza', genero: 'U', conc: 'Extrait', familia: 'Oriental Gourmand', nicho: true, preco: {'5ml': 102000, '50ml': 731000, '100ml': 1258000}, notas: 'Oud, tâmara, açúcar de cana' },
  'maison crivelli oud stallion': { nome: 'Maison Crivelli Oud Stallion Extrait', nomeBase: 'Maison Crivelli Oud Stallion', genero: 'U', conc: 'Extrait', familia: 'Couro Oriental', nicho: true, preco: {'5ml': 102000, '50ml': 731000, '100ml': 1258000}, notas: 'Oud, couro fumado, especiarias' },
  'maison crivelli hibiscus mahajád': { nome: 'Maison Crivelli Hibiscus Mahajád Extrait', nomeBase: 'Maison Crivelli Hibiscus Mahajád', genero: 'U', conc: 'Extrait', familia: 'Floral Oriental', nicho: true, preco: {'5ml': 85000, '50ml': 680000, '100ml': 1190000}, notas: 'Hibiscus, rosa, baunilha, couro' },
  'maison crivelli tubéreuse astrale': { nome: 'Maison Crivelli Tubéreuse Astrale Extrait', nomeBase: 'Maison Crivelli Tubéreuse Astrale', genero: 'U', conc: 'Extrait', familia: 'Floral Aveludado', nicho: true, preco: {'5ml': 85000, '50ml': 680000, '100ml': 1190000}, notas: 'Tubérosa, camurça, almíscar' },
  'maison crivelli ambre chromatique': { nome: 'Maison Crivelli Ambre Chromatique Extrait', nomeBase: 'Maison Crivelli Ambre Chromatique', genero: 'U', conc: 'Extrait', familia: 'Oriental Ambarino', nicho: true, preco: {'5ml': 85000, '50ml': 680000}, notas: 'Benjoin, âmbar, especiarias' },
  'maison crivelli patchouli magnetik': { nome: 'Maison Crivelli Patchouli Magnetik Extrait', nomeBase: 'Maison Crivelli Patchouli Magnetik', genero: 'U', conc: 'Extrait', familia: 'Amadeirado', nicho: true, preco: {'5ml': 85000, '50ml': 680000}, notas: 'Patchouli, sândalo, gardénia' },
  'maison crivelli iris malikhân': { nome: 'Maison Crivelli Iris Malikhân EDP', nomeBase: 'Maison Crivelli Iris Malikhân', genero: 'U', conc: 'EDP', familia: 'Floral Amadeirado', nicho: true, preco: {'100ml': 646000}, notas: 'Íris, baunilha, couro' },
  'maison crivelli rose saltifolia': { nome: 'Maison Crivelli Rose Saltifolia EDP', nomeBase: 'Maison Crivelli Rose Saltifolia', genero: 'U', conc: 'EDP', familia: 'Floral Marinho', nicho: true, preco: {'100ml': 646000}, notas: 'Rosa Centifolia, algas, brisa' },
  'maison crivelli bois datchai': { nome: 'Maison Crivelli Bois Datchai EDP', nomeBase: 'Maison Crivelli Bois Datchai', genero: 'U', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: true, preco: {'100ml': 646000}, notas: 'Chá preto, bagas, madeira fumada' },
  'maison crivelli santal volcanique': { nome: 'Maison Crivelli Santal Volcanique EDP', nomeBase: 'Maison Crivelli Santal Volcanique', genero: 'U', conc: 'EDP', familia: 'Amadeirado Especiado', nicho: true, preco: {'100ml': 646000}, notas: 'Sândalo, café, especiarias' },
  'maison crivelli papyrus moléculaire': { nome: 'Maison Crivelli Papyrus Moléculaire EDP', nomeBase: 'Maison Crivelli Papyrus Moléculaire', genero: 'U', conc: 'EDP', familia: 'Amadeirado Tabaco', nicho: true, preco: {'100ml': 646000}, notas: 'Papiro, tabaco, coriandro' },
  'maison crivelli neroli nasimba': { nome: 'Maison Crivelli Neroli Nasimba EDP', nomeBase: 'Maison Crivelli Neroli Nasimba', genero: 'U', conc: 'EDP', familia: 'Floral Cítrico', nicho: true, preco: {'100ml': 646000}, notas: 'Néroli, couro, cardamomo' },
  'maison crivelli absinthe boréale': { nome: 'Maison Crivelli Absinthe Boréale EDP', nomeBase: 'Maison Crivelli Absinthe Boréale', genero: 'U', conc: 'EDP', familia: 'Aromático Fresco', nicho: true, preco: {'100ml': 646000}, notas: 'Absinto, lavanda, bruma ártica' },
  'maison crivelli lys sølaberg': { nome: 'Maison Crivelli Lys Sølaberg EDP', nomeBase: 'Maison Crivelli Lys Sølaberg', genero: 'U', conc: 'EDP', familia: 'Floral Amadeirado', nicho: true, preco: {'100ml': 646000}, notas: 'Lírio, âmbar, noite no fiorde' },
  'maison crivelli citrus batikanga': { nome: 'Maison Crivelli Citrus Batikanga EDP', nomeBase: 'Maison Crivelli Citrus Batikanga', genero: 'U', conc: 'EDP', familia: 'Cítrico Especiado', nicho: true, preco: {'100ml': 306000}, notas: 'Bergamota, pimenta, vetiver' },
  'maison crivelli coffret explor. extraits (6×5ml)': { nome: 'Maison Crivelli Coffret Explor. Extraits (6×5ml)', nomeBase: 'Maison Crivelli Coffret Explor. Extraits (6×5ml)', genero: 'U', conc: 'Set', familia: 'Nicho', nicho: true, preco: {'5ml': 459000}, notas: '6 extraits: CI, SS, TA, HM, OM, OS' },
  'maison crivelli coffret descoberta edp (8×1.5ml)': { nome: 'Maison Crivelli Coffret Descoberta EDP (8×1.5ml)', nomeBase: 'Maison Crivelli Coffret Descoberta EDP (8×1.5ml)', genero: 'U', conc: 'Set', familia: 'Nicho', nicho: true, preco: {'5ml': 119000}, notas: '8 amostras EDP' },
  'maison crivelli coffret descoberta extraits': { nome: 'Maison Crivelli Coffret Descoberta Extraits', nomeBase: 'Maison Crivelli Coffret Descoberta Extraits', genero: 'U', conc: 'Set', familia: 'Nicho', nicho: true, preco: {'5ml': 139400}, notas: 'Amostras 1.5ml extraits' },
  'maison crivelli oud trilogy (3×50ml)': { nome: 'Maison Crivelli Oud Trilogy (3×50ml)', nomeBase: 'Maison Crivelli Oud Trilogy (3×50ml)', genero: 'U', conc: 'Set', familia: 'Nicho', nicho: true, preco: {'50ml': 1989000}, notas: 'OM + OS + OC' },
  'maison crivelli magic blotters': { nome: 'Maison Crivelli Magic Blotters', nomeBase: 'Maison Crivelli Magic Blotters', genero: 'U', conc: 'Set', familia: 'Nicho', nicho: true, preco: {'5ml': 40800}, notas: 'Testadores ilustrados' },
  'serge lutens fils de joie': { nome: 'Serge Lutens Fils De Joie EDP', nomeBase: 'Serge Lutens Fils De Joie', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens dent de lait': { nome: 'Serge Lutens Dent De Lait EDP', nomeBase: 'Serge Lutens Dent De Lait', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 428400}, notas: 'Serge Lutens' },
  'serge lutens la religieuse': { nome: 'Serge Lutens La Religieuse EDP', nomeBase: 'Serge Lutens La Religieuse', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens santal majuscule': { nome: 'Serge Lutens Santal Majuscule EDP', nomeBase: 'Serge Lutens Santal Majuscule', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens nuit de cellophane': { nome: 'Serge Lutens Nuit De Cellophane EDP', nomeBase: 'Serge Lutens Nuit De Cellophane', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens le fille de berlin': { nome: 'Serge Lutens Le Fille De Berlin EDP', nomeBase: 'Serge Lutens Le Fille De Berlin', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens ambre sultan': { nome: 'Serge Lutens Ambre Sultan EDP', nomeBase: 'Serge Lutens Ambre Sultan', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens fèminité du bois': { nome: 'Serge Lutens Fèminité Du Bois EDP', nomeBase: 'Serge Lutens Fèminité Du Bois', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens la fille tour de fer': { nome: 'Serge Lutens La Fille Tour De Fer EDP', nomeBase: 'Serge Lutens La Fille Tour De Fer', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens écrin de fumée': { nome: 'Serge Lutens Écrin De Fumée EDP', nomeBase: 'Serge Lutens Écrin De Fumée', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens poivre noir': { nome: 'Serge Lutens Poivre Noir EDP', nomeBase: 'Serge Lutens Poivre Noir', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens la dompteuse encagée': { nome: 'Serge Lutens La Dompteuse Encagée EDP', nomeBase: 'Serge Lutens La Dompteuse Encagée', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens baptême du feu': { nome: 'Serge Lutens Baptême Du Feu EDP', nomeBase: 'Serge Lutens Baptême Du Feu', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 428400}, notas: 'Serge Lutens' },
  'serge lutens un bois vanille': { nome: 'Serge Lutens Un Bois Vanille EDP', nomeBase: 'Serge Lutens Un Bois Vanille', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'serge lutens le perce-vent': { nome: 'Serge Lutens Le Perce-Vent EDP', nomeBase: 'Serge Lutens Le Perce-Vent', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 523600}, notas: 'Serge Lutens' },
  'carthusia terra mia': { nome: 'Carthusia Terra Mia EDP', nomeBase: 'Carthusia Terra Mia', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia io capri': { nome: 'Carthusia Io Capri EDP', nomeBase: 'Carthusia Io Capri', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia fiori di capri': { nome: 'Carthusia Fiori Di Capri EDP', nomeBase: 'Carthusia Fiori Di Capri', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia essence of the park': { nome: 'Carthusia Essence Of The Park EDP', nomeBase: 'Carthusia Essence Of The Park', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia corallium': { nome: 'Carthusia Corallium EDP', nomeBase: 'Carthusia Corallium', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia aria di capri': { nome: 'Carthusia Aria Di Capri EDP', nomeBase: 'Carthusia Aria Di Capri', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia carthusia uomo': { nome: 'Carthusia Carthusia Uomo EDP', nomeBase: 'Carthusia Carthusia Uomo', genero: 'M', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia via camerelle': { nome: 'Carthusia Via Camerelle EDP', nomeBase: 'Carthusia Via Camerelle', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia mediterraneo': { nome: 'Carthusia Mediterraneo EDP', nomeBase: 'Carthusia Mediterraneo', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia 1681': { nome: 'Carthusia 1681 EDP', nomeBase: 'Carthusia 1681', genero: 'M', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'carthusia numero uno': { nome: 'Carthusia Numero Uno EDP', nomeBase: 'Carthusia Numero Uno', genero: 'M', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 522600}, notas: 'Carthusia' },
  'alexandre.j collector silver ombre': { nome: 'Alexandre.J Collector Silver Ombre EDP', nomeBase: 'Alexandre.J Collector Silver Ombre', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 452200}, notas: 'Alexandre.J' },
  'alexandre.j collector mandarine sultane': { nome: 'Alexandre.J Collector Mandarine Sultane EDP', nomeBase: 'Alexandre.J Collector Mandarine Sultane', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 452200}, notas: 'Alexandre.J' },
  'alexandre.j oscent white': { nome: 'Alexandre.J Oscent White EDP', nomeBase: 'Alexandre.J Oscent White', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 482800}, notas: 'Alexandre.J' },
  'alexandre.j the majestic musk': { nome: 'Alexandre.J The Majestic Musk EDP', nomeBase: 'Alexandre.J The Majestic Musk', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 503200}, notas: 'Alexandre.J' },
  'alexandre.j the majestic jardin': { nome: 'Alexandre.J The Majestic Jardin EDP', nomeBase: 'Alexandre.J The Majestic Jardin', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 503200}, notas: 'Alexandre.J' },
  'alexandre.j the majestic vanilla': { nome: 'Alexandre.J The Majestic Vanilla EDP', nomeBase: 'Alexandre.J The Majestic Vanilla', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 503200}, notas: 'Alexandre.J' },
  'moncler recharge pour homme': { nome: 'Moncler Recharge Pour Homme EDP', nomeBase: 'Moncler Recharge Pour Homme', genero: 'M', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 390000}, notas: 'Moncler' },
  'moncler pour home led': { nome: 'Moncler Pour Home Led EDP', nomeBase: 'Moncler Pour Home Led', genero: 'M', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 609000}, notas: 'Moncler' },
  'moncler pour femme': { nome: 'Moncler Pour Femme EDP', nomeBase: 'Moncler Pour Femme', genero: 'F', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 240000}, notas: 'Moncler' },
  'moncler pour femme led': { nome: 'Moncler Pour Femme Led EDP', nomeBase: 'Moncler Pour Femme Led', genero: 'F', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 609000}, notas: 'Moncler' },
  'moncler sunrise pour femme': { nome: 'Moncler Sunrise Pour Femme EDP', nomeBase: 'Moncler Sunrise Pour Femme', genero: 'F', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 240000}, notas: 'Moncler' },
  'the merchant of venice byzantium saffron': { nome: 'The Merchant of Venice Byzantium Saffron EDP', nomeBase: 'The Merchant of Venice Byzantium Saffron', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 527000}, notas: 'The Merchant of Venice' },
  'the merchant of venice rosa moceniga elixir': { nome: 'The Merchant of Venice Rosa Moceniga Elixir EDP', nomeBase: 'The Merchant of Venice Rosa Moceniga Elixir', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice maria callas': { nome: 'The Merchant of Venice Maria Callas EDP', nomeBase: 'The Merchant of Venice Maria Callas', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice flamant rose': { nome: 'The Merchant of Venice Flamant Rose EDP', nomeBase: 'The Merchant of Venice Flamant Rose', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 986000}, notas: 'The Merchant of Venice' },
  'the merchant of venice imperial emerald concentree': { nome: 'The Merchant of Venice Imperial Emerald Concentree EDP', nomeBase: 'The Merchant of Venice Imperial Emerald Concentree', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 986000}, notas: 'The Merchant of Venice' },
  'the merchant of venice la fenice my pearls': { nome: 'The Merchant of Venice La Fenice My Pearls EDP', nomeBase: 'The Merchant of Venice La Fenice My Pearls', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice tmov venezia & oriente moscado': { nome: 'The Merchant of Venice Tmov Venezia & Oriente Moscado EDP', nomeBase: 'The Merchant of Venice Tmov Venezia & Oriente Moscado', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice red potion': { nome: 'The Merchant of Venice Red Potion EDP', nomeBase: 'The Merchant of Venice Red Potion', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice oriente blue tea': { nome: 'The Merchant of Venice Oriente Blue Tea EDP', nomeBase: 'The Merchant of Venice Oriente Blue Tea', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice oriente gyokuro': { nome: 'The Merchant of Venice Oriente Gyokuro EDP', nomeBase: 'The Merchant of Venice Oriente Gyokuro', genero: 'F', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'The Merchant of Venice' },
  'the merchant of venice cyprus shell': { nome: 'The Merchant of Venice Cyprus Shell EDP', nomeBase: 'The Merchant of Venice Cyprus Shell', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 357000}, notas: 'The Merchant of Venice' },
  'trussardi galleria vittorio emanuele': { nome: 'Trussardi Galleria Vittorio Emanuele EDP', nomeBase: 'Trussardi Galleria Vittorio Emanuele', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi walking in porta venezia': { nome: 'Trussardi Walking In Porta Venezia EDP', nomeBase: 'Trussardi Walking In Porta Venezia', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi alba sui navigli': { nome: 'Trussardi Alba Sui Navigli EDP', nomeBase: 'Trussardi Alba Sui Navigli', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi porta nuova': { nome: 'Trussardi Porta Nuova EDP', nomeBase: 'Trussardi Porta Nuova', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi piazza alla scala': { nome: 'Trussardi Piazza Alla Scala EDP', nomeBase: 'Trussardi Piazza Alla Scala', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi district of nolo': { nome: 'Trussardi District Of Nolo EDP', nomeBase: 'Trussardi District Of Nolo', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi via della spiga': { nome: 'Trussardi Via Della Spiga EDP', nomeBase: 'Trussardi Via Della Spiga', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi musc noir perfume enhancer': { nome: 'Trussardi Musc Noir Perfume Enhancer EDP', nomeBase: 'Trussardi Musc Noir Perfume Enhancer', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'trussardi via fiori chiari': { nome: 'Trussardi Via Fiori Chiari EDP', nomeBase: 'Trussardi Via Fiori Chiari', genero: 'U', conc: 'EDP', familia: 'Designer', nicho: false, preco: {'100ml': 570000}, notas: 'Trussardi' },
  'reminiscence le patchouli elixir': { nome: 'Reminiscence Le Patchouli Elixir EDP', nomeBase: 'Reminiscence Le Patchouli Elixir', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 299200}, notas: 'Reminiscence' },
  'reminiscence dolce riviera patchouli blanc': { nome: 'Reminiscence Dolce Riviera Patchouli Blanc EDP', nomeBase: 'Reminiscence Dolce Riviera Patchouli Blanc', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 299200}, notas: 'Reminiscence' },
  'reminiscence sous un mimosa de provence': { nome: 'Reminiscence Sous Un Mimosa De Provence EDT', nomeBase: 'Reminiscence Sous Un Mimosa De Provence', genero: 'U', conc: 'EDT', familia: 'Nicho', nicho: true, preco: {'100ml': 261800}, notas: 'Reminiscence' },
  'reminiscence le rem': { nome: 'Reminiscence Le Rem EDT', nomeBase: 'Reminiscence Le Rem', genero: 'U', conc: 'EDT', familia: 'Nicho', nicho: true, preco: {'100ml': 261800}, notas: 'Reminiscence' },
  'reminiscence le patchouli': { nome: 'Reminiscence Le Patchouli EDT', nomeBase: 'Reminiscence Le Patchouli', genero: 'U', conc: 'EDT', familia: 'Nicho', nicho: true, preco: {'100ml': 261800}, notas: 'Reminiscence' },
  'obvious une figue': { nome: 'Obvious Une Figue EDP', nomeBase: 'Obvious Une Figue', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 374000}, notas: 'Obvious' },
  'obvious un eté': { nome: 'Obvious Un Eté EDP', nomeBase: 'Obvious Un Eté', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 374000}, notas: 'Obvious' },
  'obvious un patchouli': { nome: 'Obvious Un Patchouli EDP', nomeBase: 'Obvious Un Patchouli', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 374000}, notas: 'Obvious' },
  'obvious un musc': { nome: 'Obvious Un Musc EDP', nomeBase: 'Obvious Un Musc', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 374000}, notas: 'Obvious' },
  'lalique noir premier or intemporel 1888': { nome: 'Lalique Noir Premier Or Intemporel 1888 EDP', nomeBase: 'Lalique Noir Premier Or Intemporel 1888', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 952000}, notas: 'Lalique' },
  'gisada luxury magenta': { nome: 'Gisada Luxury Magenta Parfum', nomeBase: 'Gisada Luxury Magenta', genero: 'U', conc: 'Parfum', familia: 'Designer', nicho: false, preco: {'75ml': 750000}, notas: 'Gisada' },
  'gisada luxury madagascar': { nome: 'Gisada Luxury Madagascar Parfum', nomeBase: 'Gisada Luxury Madagascar', genero: 'U', conc: 'Parfum', familia: 'Designer', nicho: false, preco: {'75ml': 750000}, notas: 'Gisada' },
  'gisada luxury fata morgana': { nome: 'Gisada Luxury Fata Morgana Parfum', nomeBase: 'Gisada Luxury Fata Morgana', genero: 'U', conc: 'Parfum', familia: 'Designer', nicho: false, preco: {'75ml': 750000}, notas: 'Gisada' },
  'xerjoff 1861 naxos': { nome: 'Xerjoff 1861 Naxos EDP', nomeBase: 'Xerjoff 1861 Naxos', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 833000}, notas: 'Xerjoff' },
  'liquides imaginaires blanche bete': { nome: 'Liquides Imaginaires Blanche Bete EDP', nomeBase: 'Liquides Imaginaires Blanche Bete', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 676600}, notas: 'Liquides Imaginaires' },
  'amouage jubilation xxv man': { nome: 'Amouage Jubilation XXV Man EDP', nomeBase: 'Amouage Jubilation XXV Man', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1241000}, notas: 'Amouage' },
  'amouage love delight woman': { nome: 'Amouage Love Delight Woman EDP', nomeBase: 'Amouage Love Delight Woman', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1241000}, notas: 'Amouage' },
  'xerjoff torino21': { nome: 'Xerjoff Torino21 EDP', nomeBase: 'Xerjoff Torino21', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1003000}, notas: 'Xerjoff' },
  'parfums de marly haltane': { nome: 'Parfums de Marly Haltane EDP', nomeBase: 'Parfums de Marly Haltane', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'125ml': 1105000}, notas: 'Parfums de Marly' },
  'orto parisi megamare': { nome: 'Orto Parisi Megamare EDP', nomeBase: 'Orto Parisi Megamare', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 527000}, notas: 'Orto Parisi' },
  'amouage interlude black iris man': { nome: 'Amouage Interlude Black Iris Man EDP', nomeBase: 'Amouage Interlude Black Iris Man', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1241000}, notas: 'Amouage' },
  'xerjoff tony iommi monkey special': { nome: 'Xerjoff Tony Iommi Monkey Special EDP', nomeBase: 'Xerjoff Tony Iommi Monkey Special', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1343000}, notas: 'Xerjoff' },
  'liquides imaginaires liquide gold': { nome: 'Liquides Imaginaires Liquide Gold EDP', nomeBase: 'Liquides Imaginaires Liquide Gold', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 608600}, notas: 'Liquides Imaginaires' },
  'james heeley sel marin': { nome: 'James Heeley Sel Marin EDP', nomeBase: 'James Heeley Sel Marin', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 493000}, notas: 'James Heeley' },
  'ormonde jayne ormonde woman': { nome: 'Ormonde Jayne Ormonde Woman EDP', nomeBase: 'Ormonde Jayne Ormonde Woman', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'120ml': 731000}, notas: 'Ormonde Jayne' },
  'argos fragrances danaë': { nome: 'Argos Fragrances DANAË EDP', nomeBase: 'Argos Fragrances DANAË', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'Argos Fragrances' },
  'imaginary authors memoirs of a trespasser': { nome: 'Imaginary Authors Memoirs Of A Trespasser EDP', nomeBase: 'Imaginary Authors Memoirs Of A Trespasser', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 370400}, notas: 'Imaginary Authors' },
  'marc-antoine barrois ganymede': { nome: 'Marc-Antoine Barrois Ganymede EDP', nomeBase: 'Marc-Antoine Barrois Ganymede', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'30ml': 408000}, notas: 'Marc-Antoine Barrois' },
  'essential parfums divine vanille': { nome: 'Essential Parfums Divine Vanille EDP', nomeBase: 'Essential Parfums Divine Vanille', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 291000}, notas: 'Essential Parfums' },
  'initio parfums privés absolute aphrodisiac': { nome: 'Initio Parfums Privés Absolute Aphrodisiac EDP', nomeBase: 'Initio Parfums Privés Absolute Aphrodisiac', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'90ml': 918000}, notas: 'Initio Parfums Privés' },
  'initio parfums privés narcotic delight': { nome: 'Initio Parfums Privés Narcotic Delight EDP', nomeBase: 'Initio Parfums Privés Narcotic Delight', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'90ml': 918000}, notas: 'Initio Parfums Privés' },
  'liquides imaginaires desert suave': { nome: 'Liquides Imaginaires Desert Suave EDP', nomeBase: 'Liquides Imaginaires Desert Suave', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 472600}, notas: 'Liquides Imaginaires' },
  'argos fragrances fall of phaeton': { nome: 'Argos Fragrances Fall Of Phaeton EDP', nomeBase: 'Argos Fragrances Fall Of Phaeton', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'30ml': 595000}, notas: 'Argos Fragrances' },
  'trussardi passeggiata galleria vittorio ii': { nome: 'Trussardi Passeggiata Galleria Vittorio II EDP', nomeBase: 'Trussardi Passeggiata Galleria Vittorio II', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Trussardi' },
  'clive christian crab apple blossom': { nome: 'Clive Christian Crab Apple Blossom EDP', nomeBase: 'Clive Christian Crab Apple Blossom', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1530000}, notas: 'Clive Christian' },
  'liquides imaginaires dom rosa': { nome: 'Liquides Imaginaires Dom Rosa EDP', nomeBase: 'Liquides Imaginaires Dom Rosa', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 472600}, notas: 'Liquides Imaginaires' },
  'argos fragrances adonis awakens': { nome: 'Argos Fragrances Adonis Awakens EDP', nomeBase: 'Argos Fragrances Adonis Awakens', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 700400}, notas: 'Argos Fragrances' },
  'by kilian apple brandy on the rocks': { nome: 'By Kilian Apple Brandy on the Rocks EDP', nomeBase: 'By Kilian Apple Brandy on the Rocks', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 833000}, notas: 'By Kilian' },
  'gritti gossip night': { nome: 'Gritti Gossip Night EDP', nomeBase: 'Gritti Gossip Night', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 663000}, notas: 'Gritti' },
  'rosendo mateu rosendo mateu no.7': { nome: 'Rosendo Mateu Rosendo Mateu No.7 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu No.7', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 646000}, notas: 'Rosendo Mateu' },
  'xerjoff tony iommi deified': { nome: 'Xerjoff Tony Iommi Deified EDP', nomeBase: 'Xerjoff Tony Iommi Deified', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 935000}, notas: 'Xerjoff' },
  'initio parfums privés blessed baraka': { nome: 'Initio Parfums Privés Blessed Baraka EDP', nomeBase: 'Initio Parfums Privés Blessed Baraka', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'90ml': 918000}, notas: 'Initio Parfums Privés' },
  'nobile 1942 la danza delle libellule': { nome: 'Nobile 1942 La Danza Delle Libellule EDP', nomeBase: 'Nobile 1942 La Danza Delle Libellule', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 442000}, notas: 'Nobile 1942' },
  'goldfield & banks silky woods': { nome: 'Goldfield & Banks Silky Woods EDP', nomeBase: 'Goldfield & Banks Silky Woods', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 809200}, notas: 'Goldfield & Banks' },
  'atelier des ors blue madeleine': { nome: 'Atelier Des Ors Blue Madeleine EDP', nomeBase: 'Atelier Des Ors Blue Madeleine', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 782000}, notas: 'Atelier Des Ors' },
  'masque milano lost alice': { nome: 'Masque Milano Lost Alice EDP', nomeBase: 'Masque Milano Lost Alice', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1258000}, notas: 'Masque Milano' },
  'matiere premiere french flower': { nome: 'Matiere Premiere French Flower EDP', nomeBase: 'Matiere Premiere French Flower', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 561000}, notas: 'Matiere Premiere' },
  'rosendo mateu rosendo mateu no.6': { nome: 'Rosendo Mateu Rosendo Mateu No.6 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu No.6', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 646000}, notas: 'Rosendo Mateu' },
  'juliette has a gun not a perfume': { nome: 'Juliette Has A Gun Not a Perfume EDP', nomeBase: 'Juliette Has A Gun Not a Perfume', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 234600}, notas: 'Juliette Has A Gun' },
  'by kilian moonlight in heaven': { nome: 'By Kilian Moonlight In Heaven EDP', nomeBase: 'By Kilian Moonlight In Heaven', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 884000}, notas: 'By Kilian' },
  'liquides imaginaires fortis': { nome: 'Liquides Imaginaires Fortis EDP', nomeBase: 'Liquides Imaginaires Fortis', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 472600}, notas: 'Liquides Imaginaires' },
  'frapin the orchid man': { nome: 'Frapin The Orchid Man EDP', nomeBase: 'Frapin The Orchid Man', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'15ml': 146200}, notas: 'Frapin' },
  'nobile 1942 cafe chantant': { nome: 'Nobile 1942 Cafe Chantant EDP', nomeBase: 'Nobile 1942 Cafe Chantant', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 442000}, notas: 'Nobile 1942' },
  'by kilian love dont be shy extreme': { nome: 'By Kilian Love Dont Be Shy Extreme EDP', nomeBase: 'By Kilian Love Dont Be Shy Extreme', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1071000}, notas: 'By Kilian' },
  'clive christian x masculine': { nome: 'Clive Christian X Masculine EDP', nomeBase: 'Clive Christian X Masculine', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1190000}, notas: 'Clive Christian' },
  'argos fragrances sacred flame': { nome: 'Argos Fragrances Sacred Flame EDP', nomeBase: 'Argos Fragrances Sacred Flame', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 744600}, notas: 'Argos Fragrances' },
  'bdk parfums villa neroli': { nome: 'BDK Parfums Villa Neroli EDP', nomeBase: 'BDK Parfums Villa Neroli', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 697000}, notas: 'BDK Parfums' },
  'bdk parfums citrus riviera': { nome: 'BDK Parfums Citrus Riviera EDP', nomeBase: 'BDK Parfums Citrus Riviera', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 697000}, notas: 'BDK Parfums' },
  'akro bake': { nome: 'Akro Bake EDP', nomeBase: 'Akro Bake', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 425000}, notas: 'Akro' },
  'essential parfums fig infusion': { nome: 'Essential Parfums Fig Infusion EDP', nomeBase: 'Essential Parfums Fig Infusion', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 291000}, notas: 'Essential Parfums' },
  'matiere premiere cologne cedrat': { nome: 'Matiere Premiere Cologne Cedrat EDP', nomeBase: 'Matiere Premiere Cologne Cedrat', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Matiere Premiere' },
  'papillon artisan salome': { nome: 'Papillon Artisan Salome EDP', nomeBase: 'Papillon Artisan Salome', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 574600}, notas: 'Papillon Artisan' },
  'liquides imaginaires dom rosa millesime': { nome: 'Liquides Imaginaires Dom Rosa Millesime EDP', nomeBase: 'Liquides Imaginaires Dom Rosa Millesime', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Liquides Imaginaires' },
  'initio parfums privés high frequency': { nome: 'Initio Parfums Privés High Frequency EDP', nomeBase: 'Initio Parfums Privés High Frequency', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'90ml': 918000}, notas: 'Initio Parfums Privés' },
  'orto parisi seminalis': { nome: 'Orto Parisi Seminalis EDP', nomeBase: 'Orto Parisi Seminalis', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 527000}, notas: 'Orto Parisi' },
  'atelier des ors riviera sunrise': { nome: 'Atelier Des Ors Riviera Sunrise EDP', nomeBase: 'Atelier Des Ors Riviera Sunrise', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 680000}, notas: 'Atelier Des Ors' },
  'miller harris tea tonique': { nome: 'Miller Harris Tea Tonique EDP', nomeBase: 'Miller Harris Tea Tonique', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 442000}, notas: 'Miller Harris' },
  'marc-antoine barrois b683': { nome: 'Marc-Antoine Barrois B683 EDP', nomeBase: 'Marc-Antoine Barrois B683', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 680000}, notas: 'Marc-Antoine Barrois' },
  'ormonde jayne tolu': { nome: 'Ormonde Jayne Tolu EDP', nomeBase: 'Ormonde Jayne Tolu', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'120ml': 731000}, notas: 'Ormonde Jayne' },
  'liquides imaginaires sancti': { nome: 'Liquides Imaginaires Sancti EDP', nomeBase: 'Liquides Imaginaires Sancti', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 714000}, notas: 'Liquides Imaginaires' },
  'clive christian queen anne rock rose': { nome: 'Clive Christian Queen Anne Rock Rose EDP', nomeBase: 'Clive Christian Queen Anne Rock Rose', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1870000}, notas: 'Clive Christian' },
  'bdk parfums bouquet de hongrie': { nome: 'BDK Parfums Bouquet De Hongrie EDP', nomeBase: 'BDK Parfums Bouquet De Hongrie', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 697000}, notas: 'BDK Parfums' },
  'kajal perfumes almaz': { nome: 'Kajal Perfumes Almaz EDP', nomeBase: 'Kajal Perfumes Almaz', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 782000}, notas: 'Kajal Perfumes' },
  'widian widian london': { nome: 'Widian WIDIAN London EDP', nomeBase: 'Widian WIDIAN London', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1122000}, notas: 'Widian' },
  'liquides imaginaires beaute du diable': { nome: 'Liquides Imaginaires Beaute du Diable EDP', nomeBase: 'Liquides Imaginaires Beaute du Diable', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 901000}, notas: 'Liquides Imaginaires' },
  'room 1015 sweet leaf': { nome: 'Room 1015 Sweet Leaf EDP', nomeBase: 'Room 1015 Sweet Leaf', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 336600}, notas: 'Room 1015' },
  'nobile 1942 malia': { nome: 'Nobile 1942 Malia EDP', nomeBase: 'Nobile 1942 Malia', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 697000}, notas: 'Nobile 1942' },
  'marc-antoine barrois encelade': { nome: 'Marc-Antoine Barrois Encelade EDP', nomeBase: 'Marc-Antoine Barrois Encelade', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 629000}, notas: 'Marc-Antoine Barrois' },
  'frederic malle french lover': { nome: 'Frederic Malle French Lover EDP', nomeBase: 'Frederic Malle French Lover', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1037000}, notas: 'Frederic Malle' },
  'tom ford cafe rose': { nome: 'Tom Ford Cafe Rose EDP', nomeBase: 'Tom Ford Cafe Rose', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 731000}, notas: 'Tom Ford' },
  'bois 1920 sushi imperiale': { nome: 'Bois 1920 Sushi Imperiale EDP', nomeBase: 'Bois 1920 Sushi Imperiale', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 561000}, notas: 'Bois 1920' },
  'by kilian straight to heaven': { nome: 'By Kilian Straight To Heaven EDP', nomeBase: 'By Kilian Straight To Heaven', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 884000}, notas: 'By Kilian' },
  'miller harris peau santal': { nome: 'Miller Harris Peau Santal EDP', nomeBase: 'Miller Harris Peau Santal', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 595000}, notas: 'Miller Harris' },
  'liquides imaginaires ile pourpre': { nome: 'Liquides Imaginaires ILE Pourpre EDP', nomeBase: 'Liquides Imaginaires ILE Pourpre', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 459000}, notas: 'Liquides Imaginaires' },
  'nobile 1942 shamal': { nome: 'Nobile 1942 Shamal EDP', nomeBase: 'Nobile 1942 Shamal', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 697000}, notas: 'Nobile 1942' },
  'frederic malle carnal flower': { nome: 'Frederic Malle Carnal Flower EDP', nomeBase: 'Frederic Malle Carnal Flower', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1173000}, notas: 'Frederic Malle' },
  'borntostandout drunk lovers': { nome: 'BORNTOSTANDOUT Drunk Lovers EDP', nomeBase: 'BORNTOSTANDOUT Drunk Lovers', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 710600}, notas: 'BORNTOSTANDOUT' },
  'bdk parfums nuit de sable': { nome: 'BDK Parfums Nuit De Sable EDP', nomeBase: 'BDK Parfums Nuit De Sable', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 697000}, notas: 'BDK Parfums' },
  'frederic malle en passant': { nome: 'Frederic Malle En Passant EDP', nomeBase: 'Frederic Malle En Passant', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1037000}, notas: 'Frederic Malle' },
  'rosendo mateu rosendo mateu no.3': { nome: 'Rosendo Mateu Rosendo Mateu No.3 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu No.3', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 646000}, notas: 'Rosendo Mateu' },
  'bohoboco sea salt caramel': { nome: 'Bohoboco Sea Salt Caramel EDP', nomeBase: 'Bohoboco Sea Salt Caramel', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 561000}, notas: 'Bohoboco' },
  'imaginary authors untamable': { nome: 'Imaginary Authors Untamable EDP', nomeBase: 'Imaginary Authors Untamable', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 370400}, notas: 'Imaginary Authors' },
  '27 87 elixir de bombe': { nome: '27 87 Elixir de Bombe EDP', nomeBase: '27 87 Elixir de Bombe', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'87ml': 629000}, notas: '27 87' },
  'orto parisi brutus': { nome: 'Orto Parisi Brutus EDP', nomeBase: 'Orto Parisi Brutus', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 527000}, notas: 'Orto Parisi' },
  'marc-antoine barrois aldebaran': { nome: 'Marc-Antoine Barrois Aldebaran EDP', nomeBase: 'Marc-Antoine Barrois Aldebaran', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 629000}, notas: 'Marc-Antoine Barrois' },
  'frederic malle rose tonnerre': { nome: 'Frederic Malle Rose Tonnerre EDP', nomeBase: 'Frederic Malle Rose Tonnerre', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1173000}, notas: 'Frederic Malle' },
  'rosendo mateu rosendo mateu no.4': { nome: 'Rosendo Mateu Rosendo Mateu No.4 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu No.4', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 646000}, notas: 'Rosendo Mateu' },
  'argos fragrances la primavera': { nome: 'Argos Fragrances La Primavera Extrait', nomeBase: 'Argos Fragrances La Primavera', genero: 'U', conc: 'Extrait', familia: 'Nicho', nicho: true, preco: {'100ml': 676600}, notas: 'Argos Fragrances' },
  'by kilian intoxicated': { nome: 'By Kilian Intoxicated EDP', nomeBase: 'By Kilian Intoxicated', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 884000}, notas: 'By Kilian' },
  'acca kappa muschio bianco (white moss)': { nome: 'Acca Kappa Muschio Bianco (White Moss) EDP', nomeBase: 'Acca Kappa Muschio Bianco (White Moss)', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 425000}, notas: 'Acca Kappa' },
  'essential parfums orange x santal': { nome: 'Essential Parfums Orange X Santal EDP', nomeBase: 'Essential Parfums Orange X Santal', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 299200}, notas: 'Essential Parfums' },
  'liquides imaginaires fleur de sable': { nome: 'Liquides Imaginaires Fleur de Sable EDP', nomeBase: 'Liquides Imaginaires Fleur de Sable', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 459000}, notas: 'Liquides Imaginaires' },
  'frederic malle music for a while': { nome: 'Frederic Malle Music For A While EDP', nomeBase: 'Frederic Malle Music For A While', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1037000}, notas: 'Frederic Malle' },
  'masque milano madeleine': { nome: 'Masque Milano Madeleine EDP', nomeBase: 'Masque Milano Madeleine', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'10ml': 176800}, notas: 'Masque Milano' },
  'miller harris la feuille': { nome: 'Miller Harris La Feuille EDP', nomeBase: 'Miller Harris La Feuille', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 765000}, notas: 'Miller Harris' },
  'creed creed aventus': { nome: 'Creed Creed Aventus EDP', nomeBase: 'Creed Creed Aventus', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 935000}, notas: 'Creed' },
  'bohoboco red wine brown sugar': { nome: 'Bohoboco Red Wine Brown Sugar EDP', nomeBase: 'Bohoboco Red Wine Brown Sugar', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 561000}, notas: 'Bohoboco' },
  'rosendo mateu rosendo mateu no.2': { nome: 'Rosendo Mateu Rosendo Mateu No.2 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu No.2', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 646000}, notas: 'Rosendo Mateu' },
  'nobile 1942 nobile 1942 1001': { nome: 'Nobile 1942 Nobile 1942 1001 EDP', nomeBase: 'Nobile 1942 Nobile 1942 1001', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 425000}, notas: 'Nobile 1942' },
  'ormonde jayne verano': { nome: 'Ormonde Jayne Verano EDP', nomeBase: 'Ormonde Jayne Verano', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'88ml': 765000}, notas: 'Ormonde Jayne' },
  'goldfield & banks desert rosewood': { nome: 'Goldfield & Banks Desert Rosewood EDP', nomeBase: 'Goldfield & Banks Desert Rosewood', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 612000}, notas: 'Goldfield & Banks' },
  'goldfield & banks purple suede': { nome: 'Goldfield & Banks Purple Suede EDP', nomeBase: 'Goldfield & Banks Purple Suede', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 809200}, notas: 'Goldfield & Banks' },
  'moth and rabbit la haine no 5': { nome: 'Moth and Rabbit La Haine No 5 EDP', nomeBase: 'Moth and Rabbit La Haine No 5', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 493000}, notas: 'Moth and Rabbit' },
  'nobile 1942 pontevecchio': { nome: 'Nobile 1942 Pontevecchio EDP', nomeBase: 'Nobile 1942 Pontevecchio', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 442000}, notas: 'Nobile 1942' },
  'royal crown upper class': { nome: 'Royal Crown Upper Class EDP', nomeBase: 'Royal Crown Upper Class', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1825800}, notas: 'Royal Crown' },
  'imaginary authors sundrunk': { nome: 'Imaginary Authors Sundrunk EDP', nomeBase: 'Imaginary Authors Sundrunk', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 370400}, notas: 'Imaginary Authors' },
  'ormonde jayne levant': { nome: 'Ormonde Jayne Levant EDP', nomeBase: 'Ormonde Jayne Levant', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'88ml': 663000}, notas: 'Ormonde Jayne' },
  'orto parisi stercus': { nome: 'Orto Parisi Stercus EDP', nomeBase: 'Orto Parisi Stercus', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 527000}, notas: 'Orto Parisi' },
  'the different company sublime balkiss': { nome: 'The Different Company Sublime Balkiss EDP', nomeBase: 'The Different Company Sublime Balkiss', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 731000}, notas: 'The Different Company' },
  'zarkoperfume cloud collection no.1': { nome: 'Zarkoperfume Cloud Collection No.1 EDP', nomeBase: 'Zarkoperfume Cloud Collection No.1', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 754800}, notas: 'Zarkoperfume' },
  '27 87 sonar': { nome: '27 87 Sonar EDP', nomeBase: '27 87 Sonar', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'87ml': 629000}, notas: '27 87' },
  'by kilian back to black': { nome: 'By Kilian Back to Black EDP', nomeBase: 'By Kilian Back to Black', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 884000}, notas: 'By Kilian' },
  'nobile 1942 anti malocchio': { nome: 'Nobile 1942 Anti Malocchio EDP', nomeBase: 'Nobile 1942 Anti Malocchio', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 323000}, notas: 'Nobile 1942' },
  'liquides imaginaires buveur de vent': { nome: 'Liquides Imaginaires Buveur de Vent EDP', nomeBase: 'Liquides Imaginaires Buveur de Vent', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 714000}, notas: 'Liquides Imaginaires' },
  'clive christian x feminine': { nome: 'Clive Christian X Feminine EDP', nomeBase: 'Clive Christian X Feminine', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1190000}, notas: 'Clive Christian' },
  'trussardi walking on via fiori oscuri': { nome: 'Trussardi Walking on Via Fiori Oscuri EDP', nomeBase: 'Trussardi Walking on Via Fiori Oscuri', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Trussardi' },
  'orto parisi viride': { nome: 'Orto Parisi Viride EDP', nomeBase: 'Orto Parisi Viride', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 527000}, notas: 'Orto Parisi' },
  'liquides imaginaires ame de fleur': { nome: 'Liquides Imaginaires Ame De Fleur EDP', nomeBase: 'Liquides Imaginaires Ame De Fleur', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 714000}, notas: 'Liquides Imaginaires' },
  'clive christian no1 masculine': { nome: 'Clive Christian No1 Masculine EDP', nomeBase: 'Clive Christian No1 Masculine', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 2550000}, notas: 'Clive Christian' },
  'trussardi i via fiori chiari': { nome: 'Trussardi I Via Fiori Chiari EDP', nomeBase: 'Trussardi I Via Fiori Chiari', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Trussardi' },
  'akro awake': { nome: 'Akro Awake EDP', nomeBase: 'Akro Awake', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 544000}, notas: 'Akro' },
  'dusita fleur de lalita': { nome: 'Dusita Fleur de Lalita EDP', nomeBase: 'Dusita Fleur de Lalita', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 748000}, notas: 'Dusita' },
  'liquides imaginaires phantasma': { nome: 'Liquides Imaginaires Phantasma EDP', nomeBase: 'Liquides Imaginaires Phantasma', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 714000}, notas: 'Liquides Imaginaires' },
  'nobile 1942 patchouli nobile': { nome: 'Nobile 1942 Patchouli Nobile EDP', nomeBase: 'Nobile 1942 Patchouli Nobile', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 442000}, notas: 'Nobile 1942' },
  'bohoboco coffee white flowers': { nome: 'Bohoboco Coffee White Flowers EDP', nomeBase: 'Bohoboco Coffee White Flowers', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 561000}, notas: 'Bohoboco' },
  'rosendo mateu rosendo mateu 1968': { nome: 'Rosendo Mateu Rosendo Mateu 1968 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu 1968', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 748000}, notas: 'Rosendo Mateu' },
  'rosendo mateu rosendo mateu 2010': { nome: 'Rosendo Mateu Rosendo Mateu 2010 EDP', nomeBase: 'Rosendo Mateu Rosendo Mateu 2010', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 748000}, notas: 'Rosendo Mateu' },
  'trussardi the street artists of isola': { nome: 'Trussardi The Street Artists of Isola EDP', nomeBase: 'Trussardi The Street Artists of Isola', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Trussardi' },
  'floraiku between two trees': { nome: 'Floraiku Between Two Trees EDP', nomeBase: 'Floraiku Between Two Trees', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1003000}, notas: 'Floraiku' },
  'acca kappa sakura tokyo': { nome: 'Acca Kappa Sakura Tokyo EDP', nomeBase: 'Acca Kappa Sakura Tokyo', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 425000}, notas: 'Acca Kappa' },
  'lattafa asad zanzibar': { nome: 'Lattafa Asad Zanzibar EDP', nomeBase: 'Lattafa Asad Zanzibar', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 132600}, notas: 'Lattafa' },
  'sospiro erba pura magica': { nome: 'Sospiro Erba Pura Magica EDP', nomeBase: 'Sospiro Erba Pura Magica', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 778600}, notas: 'Sospiro' },
  'by kilian vodka on the rocks': { nome: 'By Kilian Vodka on the Rocks EDP', nomeBase: 'By Kilian Vodka on the Rocks', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 884000}, notas: 'By Kilian' },
  'by kilian good girl gone bad extreme': { nome: 'By Kilian Good Girl Gone Bad Extreme EDP', nomeBase: 'By Kilian Good Girl Gone Bad Extreme', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'50ml': 1071000}, notas: 'By Kilian' },
  'parfums de marly palatine': { nome: 'Parfums de Marly Palatine EDP', nomeBase: 'Parfums de Marly Palatine', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'75ml': 969000}, notas: 'Parfums de Marly' },
  'masque milano love kills': { nome: 'Masque Milano Love Kills EDP', nomeBase: 'Masque Milano Love Kills', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 1258000}, notas: 'Masque Milano' },
  'zarkoperfume cloud collection no.3 deep forest': { nome: 'Zarkoperfume Cloud Collection No.3 Deep Forest EDP', nomeBase: 'Zarkoperfume Cloud Collection No.3 Deep Forest', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 850000}, notas: 'Zarkoperfume' },
  'trussardi behind the curtain piazza alla scala': { nome: 'Trussardi Behind the Curtain Piazza alla Scala EDP', nomeBase: 'Trussardi Behind the Curtain Piazza alla Scala', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 642600}, notas: 'Trussardi' },
  'akro smile': { nome: 'Akro Smile EDP', nomeBase: 'Akro Smile', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'100ml': 425000}, notas: 'Akro' },
  'parfums de marly galloway': { nome: 'Parfums de Marly Galloway EDP', nomeBase: 'Parfums de Marly Galloway', genero: 'U', conc: 'EDP', familia: 'Nicho', nicho: true, preco: {'125ml': 986000}, notas: 'Parfums de Marly' },
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

  // Distinção rigorosa: nicho puro / zona cinzenta / designer
  const ZONA_CINZENTA = ['Tom Ford', 'MFK', 'Maison Francis Kurkdjian', 'Byredo', 'Le Labo', 'Jo Malone'];
  const ehZonaCinzenta = ZONA_CINZENTA.some(m => nomeBase.includes(m));
  const ehNichoPuro = p0.nicho && !ehZonaCinzenta;

  let categoriaLabel = '';
  let categoriaNota = '';
  if (ehNichoPuro) {
    categoriaLabel = ' _(Nicho)_';
    categoriaNota = '';
  } else if (ehZonaCinzenta) {
    categoriaLabel = ' _(Zona cinzenta)_';
    categoriaNota = `\n_Nota: esta casa situa-se entre o designer e o nicho puro — distribuição mais alargada que o nicho tradicional, mas com ADN de luxo._\n`;
  } else {
    categoriaLabel = '';
    categoriaNota = '';
  }

  const CASAS = {
    'Dior': 'Dior',
    'Chanel': 'Chanel',
    'YSL': 'Yves Saint Laurent',
    'Armani': 'Giorgio Armani',
    'Rabanne': 'Rabanne',
    'Versace': 'Versace',
    'Hugo Boss': 'Hugo Boss',
    'Lancôme': 'Lancôme',
    'Guerlain': 'Guerlain',
    'Mugler': 'Thierry Mugler',
    'Tom Ford': 'Tom Ford Private Blend',
    'Calvin Klein': 'Calvin Klein',
    'Narciso Rodriguez': 'Narciso Rodriguez',
    'Issey Miyake': 'Issey Miyake',
    'Creed': 'Creed',
    'Mancera': 'Mancera',
    'Montale': 'Montale',
    'MFK': 'Maison Francis Kurkdjian',
    'By Kilian': 'By Kilian',
    'Amouage': 'Amouage',
    'Parfums de Marly': 'Parfums de Marly',
    'Nishane': 'Nishane',
    'Initio': 'Initio Parfums Privés',
    'Xerjoff': 'Xerjoff',
    'Frederic Malle': 'Éditions de Parfums Frédéric Malle',
    'Roja Dove': 'Roja Parfums',
  };
  let casa = 'casa de perfumaria';
  for (const [marca, desc] of Object.entries(CASAS)) {
    if (nomeBase.includes(marca)) { casa = desc; break; }
  }

  // Descrições evocativas por perfume específico e por família
  const DESCRICOES_ESPECIFICAS = {
    'Dior Sauvage': 'Berço de rocha árida e bergamota eléctrica. Abre com intensidade que acalma — não é agressão, é presença. Na pele de quem o usa bem, torna-se uma segunda natureza.',
    'Bleu de Chanel': 'Madeiras que não gritam. Uma frescura que tem peso. É o perfume de quem não precisa de se anunciar — a sala percebe antes de qualquer palavra.',
    'Mancera Instant Crush': 'Laranja que queima levemente, rosa que se abre devagar, baunilha que fica. Uma fragrância que começa doce e termina numa quentura difícil de largar.',
    'MFK Baccarat Rouge 540': 'Açafrão e jasmim dissolvidos em cedro âmbar. É o perfume que as pessoas identificam sem conseguir nomear — o rasto que fica num elevador dois minutos depois.',
    'Creed Aventus': 'Groselha preta e bétula numa base de almíscar fumado. É ambição transformada em aroma. Projecta-se com autoridade — não da variante de hoje, mas da ideia original.',
    'Parfums de Marly Layton': 'Maçã fria, lavanda e um fundo de baunilha e sândalo que aquece progressivamente. Formal na abertura, envolvente na base — funciona tanto num jantar como numa reunião.',
    'Tom Ford Black Orchid': 'Trufa, orquídea preta e patchouli. Escuro desde o primeiro spray. Não é para todos os contextos — é para os contextos certos.',
    'Tom Ford Tobacco Vanille': 'Uma lareira com conhaque. Tabaco doce, especiarias e baunilha num fundo que persiste horas depois. Para climas frios ou noites de inverno — em Angola, reservado para ambientes fechados e à noite.',
    'Nishane Hacivat': 'Abacaxi e bergamota que cedem espaço a cedro e patchouli. Uma assinatura turca com alcance internacional — dura, projecta, surpreende.',
    'Nishane Hundred Silent Ways': 'Rosa turca sobre cedro e âmbar branco. Começa floral com substância, termina amadeirado com suavidade. O tipo de perfume que quem está perto pede o nome.',
    'Initio Oud for Greatness': 'Oud, especiarias e almíscar em concentração total. Não é subtil — não foi feito para ser. Para quem quer que a entrada seja definitiva.',
    'By Kilian Angels Share': 'Conhaque, canela e baunilha. Começa como uma destilaria elegante, termina como algo que fica na memória das pessoas que o sentiram. Gourmand com classe.',
    'Armani Acqua di Giò': 'Maresia, pedra molhada e cipreste. O aquático que definiu uma categoria. Ideal para calor — leve o suficiente para Luanda às 14h.',
    'Chanel N°5': 'Aldeídos, ylang-ylang e íris sobre um fundo de almíscar e âmbar. A fragrância mais referenciada da história. Não é moda — é presença atemporal.',
    'YSL Black Opium': 'Café, flor branca e baunilha preta. Abre com energia, termina com sedução. Funciona à noite, funciona em ambientes fechados, funciona sempre que quer ser notada.',
    'Lancôme La Vie est Belle': 'Íris com pralinê e baunilha. O gourmand feminino mais reconhecível dos últimos anos — doce com dignidade, marcante sem ser agressivo.',
  };

  function getDescricaoEvocativa(p) {
    // Tenta descrição específica primeiro
    for (const [key, desc] of Object.entries(DESCRICOES_ESPECIFICAS)) {
      if (nomeBase.includes(key)) return desc;
    }
    // Fallback por família — evocativo, nunca técnico
    const f = (p.familia || '').toLowerCase();
    if (/aquatico|citrico/.test(f))
      return 'Frescura que tem substância. Discreto sem ser apagado — a escolha para quem quer estar sempre em ordem sem forçar presença.';
    if (/gourmand/.test(f))
      return 'Quente e envolvente. Quem está perto não fica indiferente — e não percebe logo o que é, o que o torna ainda mais interessante.';
    if (/floral.*oriental|oriental.*floral/.test(f))
      return 'Floral à superfície, com uma profundidade que só aparece com o tempo. Para quem quer ser lembrado depois de sair da sala.';
    if (/floral/.test(f))
      return 'Floral com carácter. Não é a flor óbvia — é a flor com algo por baixo que prende.';
    if (/oriental|especiado/.test(f))
      return 'Especiarias, resinas, profundidade. Para os contextos onde quer que a presença fique mesmo depois de sair.';
    if (/amadeirado/.test(f))
      return 'Madeiras nobres que não gritam. Uma elegância seca que combina com autoridade e discrição em simultâneo.';
    return 'Uma fragrância que evolui — diferente na abertura, diferente no fundo, diferente em cada pele.';
  }

  // Pirâmide de notas estruturada
  function getNotasEstruturadas(p) {
    // Se as notas já têm separação, usa tal como está
    // Senão, apresenta como notas principais
    return `*Notas:* ${p.notas}`;
  }

  const descricao = getDescricaoEvocativa(p0);
  const contexto = getContextoSazonal(p0);

  let reply = `${emoji} *${nomeBase}*${categoriaLabel}${banner}\n`;
  reply += `_${casa}_\n`;
  if (categoriaNota) reply += categoriaNota;
  reply += `\n*Género:* ${generoLabel} | *Família:* ${p0.familia}\n`;
  reply += `${getNotasEstruturadas(p0)}\n\n`;
  reply += `${descricao}\n\n`;
  reply += `✦ ${contexto.charAt(0).toUpperCase() + contexto.slice(1)}.\n\n`;

  if (versoes.length === 1) {
    reply += `*Concentração:* ${p0.conc} — ${getDuracao(p0.conc)}.\n\n`;
    reply += `💰 *Preço:*\n${formatPrecos(p0.preco)}\n`;
    reply += `\n📦 Entrega em Luanda incluída.`;

    const versoesRelacionadas = Object.values(CATALOGO).filter(p =>
      p.nomeBase !== nomeBase &&
      normalizar(p.nomeBase).startsWith(normalizar(nomeBase).split(' ').slice(0,2).join(' ')) &&
      p.preco && Object.keys(p.preco).length > 0
    );
    const nomesRelUnicos = new Set(versoesRelacionadas.map(p => p.nomeBase));

    if (nomesRelUnicos.size > 0) {
      reply += `\n\n_Também disponível:_\n`;
      nomesRelUnicos.forEach(nb => {
        const vs = versoesRelacionadas.filter(p => p.nomeBase === nb);
        const kzMin = Math.min(...vs.map(p => precoMin(p.preco)));
        reply += `• *${nb}* — a partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
      });
    }
    reply += `\n\nDeseja encomendar? Escreva *encomendar* ou diga-me se quer explorar outras opções.`;
  } else {
    reply += `💰 *Versões disponíveis:*\n`;
    versoes.forEach((p, i) => {
      reply += `\n*${i+1}. ${p.conc}* _(${getDuracao(p.conc).split(' — ')[0]})_\n`;
      reply += formatPrecos(p.preco) + `\n`;
    });
    reply += `\n📦 Entrega em Luanda incluída.`;
    reply += `\n\nQual das versões prefere? Pode indicar o número ou o nome _(EDT, EDP, Parfum...)_.`;
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
// FORMATAR SUGESTÕES — tom consultor, não lista de vendas
// ===================================================
function formatarSugestoes(sugestoes, tituloContexto, orcamento) {
  const { designers, nicho } = sugestoes;
  if (!designers.length && !nicho.length) return null;

  const ABERTURAS = [
    `Três opções. Cada uma faz sentido por razões diferentes.`,
    `Com base no que descreveu, estas são as escolhas certas.`,
    `Seleccionei isto para si.`,
    `Para o que procura, estas são as que fazem sentido.`,
  ];
  const abertura = ABERTURAS[Math.floor(Math.random() * ABERTURAS.length)];

  let reply = abertura;
  if (tituloContexto) reply += ` Para *${tituloContexto}*:\n`;
  else reply += `\n`;

  function descricaoBreve(p) {
    const f = (p.familia || '').toLowerCase();
    if (/aquatico|citrico/.test(f)) return 'Fresco, limpo, presente sem incomodar.';
    if (/gourmand/.test(f)) return 'Quente e envolvente — quem está perto pergunta o que é.';
    if (/floral.*oriental|oriental.*floral/.test(f)) return 'Floral à superfície, quente por baixo. Evolui bem.';
    if (/floral/.test(f)) return 'Floral com substância — não é superficial.';
    if (/oriental|especiado/.test(f)) return 'Intenso, profundo, marcante.';
    if (/amadeirado/.test(f)) return 'Madeiras secas, elegância discreta.';
    return 'Uma assinatura própria.';
  }

  if (designers.length) {
    reply += `\n🏷️ *Designer:*\n`;
    designers.forEach(p => {
      const kzMin = precoMin(p.preco);
      reply += `\n*${p.nomeBase}*\n`;
      reply += `_${p.notas}_\n`;
      reply += `${descricaoBreve(p)}\n`;
      reply += `A partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
    });
  }
  if (nicho.length) {
    reply += `\n💎 *Nicho:*\n`;
    nicho.forEach(p => {
      const kzMin = precoMin(p.preco);
      reply += `\n*${p.nomeBase}*\n`;
      reply += `_${p.notas}_\n`;
      reply += `${descricaoBreve(p)}\n`;
      reply += `A partir de ${kzMin.toLocaleString('pt-PT')} Kz\n`;
    });
  }
  if (orcamento) reply += `\n_Dentro do orçamento de ${orcamento.toLocaleString('pt-PT')} Kz._`;
  reply += `\n\nQuer saber mais sobre algum destes? Escreva o nome para ver a descrição completa, notas e preços.`;
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
  // P0 — Comandos de navegação (ANTES de qualquer pesquisa)
  // Evita que "perfumes de nicho" seja interpretado como perfume
  // ================================================
  const ehComandoNavegacao =
    /^(catalogo|nicho|luxo|exclusiv|premium|masculin|feminin|unissex|ola|oi|bom dia|boa tarde|boa noite|obrigad|tchau|xau|adeus|bye)\b/.test(txtNorm) ||
    /perfumes?\s+(de\s+)?(nicho|designer|masculin|feminin|unissex|luxo|calor|frio|noite|dia\b)/.test(txtNorm) ||
    /^(ver|mostrar|listar|explorar)\s+(nicho|catalogo|masculin|feminin)/.test(txtNorm);

  // ================================================
  // P1 — Perfume específico nomeado (PRIORIDADE MÁXIMA)
  // Só corre se não for um comando de navegação
  // ================================================
  const perfumeDirecto = ehComandoNavegacao ? null : pesquisaDirecta(txtLow);
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
    // =============================================
    // QUALIFICAÇÃO — 3 perguntas obrigatórias
    // Pergunta 1: intenção (para quem / o quê)
    // Pergunta 2: impressão (o que quer provocar)
    // Pergunta 3: contexto de uso (quando / onde)
    // =============================================

    if (sessao.tipo === 'qualificar_intencao') {
      // Recebeu resposta à pergunta de intenção
      // Reflecte + avança para pergunta de impressão
      const n = txtNorm;
      let reflexo = '';
      if (/oferecer|presente|prenda|oferta/.test(n)) reflexo = 'Um presente. Algo que fique.';
      else if (/para mim|uso proprio|eu mesmo|uso pessoal/.test(n)) reflexo = 'Para si. Bem.';
      else if (/mulher|namorada|esposa|mae\b|ela\b|irma|menina/.test(n)) reflexo = 'Para ela. Certo.';
      else if (/homem|namorado|marido|pai\b|ele\b|irmao|rapaz/.test(n)) reflexo = 'Para ele.';
      else reflexo = 'Entendido.';

      const generoRespondido =
        /mulher|namorada|esposa|mae\b|ela\b|irma|menina|feminin/.test(n) ? 'F' :
        /homem|namorado|marido|pai\b|ele\b|irmao|rapaz|masculin/.test(n) ? 'M' :
        /para mim/.test(n) ? (sessao.generoSelf || null) : null;

      updateSessao(from, {
        tipo: 'qualificar_impressao',
        intencao: txt,
        genero: generoRespondido,
        criterio: sessao.criterio || ''
      });

      return `${reflexo}\n\nQue impressão quer que este perfume deixe — presença marcante, algo que só quem está perto sente, ou algo que varia ao longo do dia?`;
    }

    if (sessao.tipo === 'qualificar_impressao') {
      // Recebeu resposta à pergunta de impressão
      // Reflecte + avança para pergunta de contexto
      const n = txtNorm;
      let reflexo = '';
      let estiloMapped = '';

      if (/marcante|presenca|forte|poderoso|impacto|notar|chamar|intenso|pesado|chamativo/.test(n)) {
        reflexo = 'Uma entrada. Não um perfume.';
        estiloMapped = 'intenso oriental marcante noite';
      } else if (/discreto|intimo|perto|suave|leve|delicado|subtil|nao.*forte/.test(n)) {
        reflexo = 'A pele que cheira melhor do que o perfume.';
        estiloMapped = 'discreto leve suave fresco';
      } else if (/varia|evolui|transforma|diferente.*dia|fresco.*noite|versatil/.test(n)) {
        reflexo = 'Um perfume que muda. Como quem o usa.';
        estiloMapped = 'versatil floral amadeirado';
      } else if (/fresc|limpo|aquatico|natural|ar livre/.test(n)) {
        reflexo = 'Frescura com personalidade.';
        estiloMapped = 'fresco aquatico citrico';
      } else if (/doce|baunilha|quente|envolvente|aconcheg/.test(n)) {
        reflexo = 'Calor que fica na memória.';
        estiloMapped = 'doce gourmand baunilha oriental';
      } else if (/sensual|sedutor|romantico|conquista|atrair/.test(n)) {
        reflexo = 'Sedução, então.';
        estiloMapped = 'sensual oriental romantico gourmand';
      } else {
        reflexo = 'Compreendido.';
        estiloMapped = n;
      }

      updateSessao(from, {
        tipo: 'qualificar_contexto',
        intencao: sessao.intencao,
        impressao: txt,
        estiloMapped,
        genero: sessao.genero,
        criterio: sessao.criterio || ''
      });

      return `${reflexo}\n\nE onde vai ser usado — no dia a dia, numa ocasião especial, ou tem um contexto específico em mente?`;
    }

    if (sessao.tipo === 'qualificar_contexto') {
      // Recebeu resposta ao contexto de uso — tem tudo para sugerir
      const n = txtNorm;
      let criterioContexto = '';
      let reflexo = '';

      if (/calor|quente|angola|clima|sol\b|dia.*a.*dia|diario|trabalho|escritorio|casual/.test(n)) {
        criterioContexto = 'fresco aquatico dia calor';
        reflexo = 'Angola exige isso. Sabe como é.';
      } else if (/noite|festa|jantar|evento|especial|sair|saida|balada/.test(n)) {
        criterioContexto = 'intenso oriental noite especial';
        reflexo = 'Então tem de ficar.';
      } else if (/romantico|encontro|conquista|date\b|seduzir/.test(n)) {
        criterioContexto = 'sensual oriental romantico gourmand';
        reflexo = 'Para isso, a escolha tem de ser precisa.';
      } else if (/casamento|batizado|formatura|cerimonia/.test(n)) {
        criterioContexto = 'floral oriental elegante';
        reflexo = 'Uma ocasião que merece estar à altura.';
      } else if (/frio|inverno|viagem|europa|lisboa|portugal/.test(n)) {
        criterioContexto = 'intenso oriental amadeirado inverno';
        reflexo = 'Para climas frios, o perfume pede mais profundidade.';
      } else {
        criterioContexto = n;
        reflexo = 'Com esse contexto em mente,';
      }

      const estiloMapped = sessao.estiloMapped || '';
      const criterioBase = sessao.criterio || '';
      const criterioFinal = [criterioBase, estiloMapped, criterioContexto].filter(Boolean).join(' ');
      const genero = sessao.genero;
      const orc = extrairOrcamento(txt) || orcamento;
      clearSessao(from);

      const sugestoes = sugerirPorCriterio(criterioFinal, genero, orc);
      if (sugestoes && (sugestoes.designers.length || sugestoes.nicho.length)) {
        setSessao(from, { tipo: 'sugestao_activa', criterio: criterioFinal, genero, orcamento: orc });
        const titulo = getTituloContexto(criterioFinal);
        const genLabel = genero === 'M' ? 'masculinos' : genero === 'F' ? 'femininos' : '';
        return `${reflexo}\n\n` + formatarSugestoes(sugestoes, titulo + (genLabel ? ` — ${genLabel}` : ''), orc);
      }
      return `${reflexo}\n\nPara esse perfil, as fragrâncias orientais e amadeiradas da nossa colecção são as mais indicadas. Escreva *catálogo* para ver tudo ou diga-me um nome específico.`;
    }

    // Compatibilidade: estados antigos redirecciona para novo fluxo
    if (sessao.tipo === 'qualificar_genero') {
      const generoRespondido = extrairGenero(txtNorm) ||
        (/masculin|homem|ele\b|rapaz|para mim/.test(txtNorm) ? 'M' :
         /feminin|mulher|ela\b|menina/.test(txtNorm) ? 'F' : null);
      const criterioBase = sessao.criterio || '';
      updateSessao(from, { tipo: 'qualificar_impressao', intencao: txt, genero: generoRespondido, criterio: criterioBase });
      return `Que impressão quer que este perfume deixe — presença marcante, algo íntimo e discreto, ou algo versátil que evolui ao longo do dia?`;
    }

    if (sessao.tipo === 'qualificar_epoca') {
      const genero = sessao.genero;
      const criterioBase = sessao.criterio || '';
      const n = txtNorm;
      let criterioEpoca = /calor|quente|fresc|dia\b|casual/.test(n) ? 'fresco aquatico dia' :
        /noite|intenso|marcante|festa/.test(n) ? 'intenso oriental noite' : n;
      const criterioFinal = criterioBase + ' ' + criterioEpoca;
      const sugestoes = sugerirPorCriterio(criterioFinal, genero, orcamento);
      clearSessao(from);
      if (sugestoes && (sugestoes.designers.length || sugestoes.nicho.length)) {
        const titulo = getTituloContexto(criterioFinal);
        const genLabel = genero === 'M' ? 'masculinos' : genero === 'F' ? 'femininos' : '';
        return formatarSugestoes(sugestoes, titulo + (genLabel ? ` — ${genLabel}` : ''), orcamento);
      }
      return `Para esse perfil, as fragrâncias orientais e amadeiradas são as mais indicadas. Escreva *catálogo* para ver tudo.`;
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

  // Navegação pura: só a palavra sozinha → mostra lista
  // Com intenção de sugestão → entra nas 3 perguntas
  const ehNavegacaoPura = (
    /^masculin(os)?$/.test(txtNorm) ||
    /^feminin(os|as)?$/.test(txtNorm) ||
    /^(nicho|luxo|exclusiv|premium)$/.test(txtNorm)
  );

  const ehSugestaoComTipo = (
    /perfumes?\s+(de\s+)?(nicho|designer|masculin|feminin|luxo)/.test(txtNorm) ||
    /quero\s+(algo\s+)?(nicho|masculin|feminin|designer|luxo)/.test(txtNorm) ||
    /suger.*nicho|recomendar.*nicho|nicho.*suger|nicho.*para/.test(txtNorm) ||
    /masculin.*para|feminin.*para|para.*masculin|para.*feminin/.test(txtNorm)
  );

  if (ehSugestaoComTipo) {
    // Tem intenção de sugestão — entra no fluxo de 3 perguntas
    const generoMsg = /masculin|homem|ele\b|rapaz/.test(txtNorm) ? 'M' :
                      /feminin|mulher|ela\b|menina/.test(txtNorm) ? 'F' : null;
    const criterio = txtNorm;
    if (generoMsg) {
      setSessao(from, { tipo: 'qualificar_impressao', intencao: txt, genero: generoMsg, criterio, orcamento });
      const genLabel = generoMsg === 'F' ? 'ela' : 'ele';
      return `Que impressão quer que este perfume deixe em ${genLabel} — presença marcante, algo discreto e íntimo, ou algo versátil?`;
    }
    setSessao(from, { tipo: 'qualificar_intencao', criterio, orcamento });
    return `Para fazer uma sugestão certeira — o perfume é para si ou para oferecer?`;
  }

  if (ehNavegacaoPura || /^(masculin|perfume.*homem|homem.*perfume)$/.test(txtNorm)) {
    if (/^(masculin|perfume.*homem|homem.*perfume)$/.test(txtNorm) || /^masculin/.test(txtNorm)) {
      const designer = getNomesAgrupados('M');
      const nichoM = (() => { const map = {}; Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'M').forEach(p => { if (!map[p.nomeBase]) map[p.nomeBase] = []; if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc); }); return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`); })();
      return `👔 *Perfumes Masculinos*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoM.length ? nichoM.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
    }
    if (/^feminin/.test(txtNorm)) {
      const designer = getNomesAgrupados('F');
      const nichoF = (() => { const map = {}; Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'F').forEach(p => { if (!map[p.nomeBase]) map[p.nomeBase] = []; if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc); }); return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`); })();
      return `👗 *Perfumes Femininos*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoF.length ? nichoF.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
    }
    // nicho/luxo sozinho
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

  if (/^(masculin|perfume.*homem|homem.*perfume)/.test(txtNorm) && !ehSugestaoComTipo) {
    const designer = getNomesAgrupados('M');
    const nichoM = (() => { const map = {}; Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'M').forEach(p => { if (!map[p.nomeBase]) map[p.nomeBase] = []; if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc); }); return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`); })();
    return `👔 *Perfumes Masculinos*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoM.length ? nichoM.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
  }

  if (/^(feminin|perfume.*mulher|mulher.*perfume)/.test(txtNorm) && !ehSugestaoComTipo) {
    const designer = getNomesAgrupados('F');
    const nichoF = (() => { const map = {}; Object.values(CATALOGO).filter(p => p.nicho && p.genero === 'F').forEach(p => { if (!map[p.nomeBase]) map[p.nomeBase] = []; if (!map[p.nomeBase].includes(p.conc)) map[p.nomeBase].push(p.conc); }); return Object.entries(map).map(([b, c]) => `• ${b} _(${c.join(' / ')})`); })();
    return `👗 *Perfumes Femininos*${getBannerDesconto()}\n\n🏷️ *Designer:*\n${designer.join('\n')}\n\n💎 *Nicho:*\n${nichoF.length ? nichoF.join('\n') : '_(em breve)_'}\n\n_Escreva o nome para ver versões e preços._`;
  }

  if (/^(nicho|luxo|exclusiv|premium)/.test(txtNorm) && !ehSugestaoComTipo) {
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
  // 3 perguntas obrigatórias antes de qualquer sugestão
  // ================================================
  const TEM_CONTEXTO = /calor|quente|verao|frio|inverno|noite|festa|casamento|jantar|romantico|encontro|trabalho|escritorio|reuniao|diario|casual|intenso|marcante|leve|fresco|discreto|doce|sensual|elegante|baunilha|floral|oriental|amadeirado|aquatico|gourmand|oud|rosa\b|suger|recomendar|quero algo|quero um|procuro algo|preciso de|para.*dia\b|para.*noite|para.*ocasiao|para.*evento|para.*ele\b|para.*ela\b|para.*homem|para.*mulher|calor|quente|praia|sol\b|frio|chuva|nublado|clima|impressionar|conquistar|seduzir|balada|saida/.test(txtNorm) || ehSugestaoComTipo;

  if (TEM_CONTEXTO) {
    const generoMsg = extrairGenero(txtNorm);

    // Tem género + ocasião/clima definidos → faz pergunta 2 (impressão)
    if (generoMsg) {
      const temContextoRico = /calor|quente|noite|festa|casamento|romantico|encontro|trabalho|frio|inverno|especial/.test(txtNorm);
      if (temContextoRico) {
        // Tem tudo — mas ainda faz a pergunta de impressão para personalizar
        setSessao(from, { tipo: 'qualificar_impressao', intencao: txt, genero: generoMsg, criterio: txtNorm, orcamento });
        const genLabel = generoMsg === 'F' ? 'ela' : generoMsg === 'M' ? 'ele' : 'quem o vai usar';
        return `Percebo. E que impressão quer que este perfume deixe em ${genLabel} — presença marcante, algo íntimo que só quem está perto sente, ou algo versátil?`;
      }
      setSessao(from, { tipo: 'qualificar_impressao', intencao: txt, genero: generoMsg, criterio: txtNorm, orcamento });
      return `Que impressão quer que este perfume deixe — presença marcante, algo discreto e íntimo, ou algo que evolui ao longo do dia?`;
    }

    // Sem género — começa pelo início
    setSessao(from, { tipo: 'qualificar_intencao', criterio: txtNorm, orcamento });
    return `Para fazer uma sugestão certeira — o perfume é para si ou para oferecer?`;
  }

  // Pedido vago de orçamento
  if (/mais barato|mais acessivel|orcamento|cabe no|dentro do.*orcamento/.test(txtNorm)) {
    return `Claro! Qual é o orçamento que tem em mente? E é para uso próprio ou para oferecer?`;
  }

  // ================================================
  // P6 — Fuzzy (só msgs curtas sem preposições)
  // ================================================
  const palavrasMsg = txtNorm.split(' ').filter(w => w.length > 0);
  const temPreposicao = /\b(para|com|sobre|de|do|da|um|uma|o\b|a\b|que|como|qual|quero|queria|procuro|tens|tem|mas|porque|logo|esse|esta|isto|aqui|mal|uso|bem|nao|sim)\b/.test(txtNorm);
  const msgCurta = palavrasMsg.length >= 1 && palavrasMsg.length <= 4;
  // Bloquear fuzzy em frases claramente conversacionais
  const ehFraseConversa = /^(mas|porque|logo|esse|esta|isso|aqui|mal|uso|bem|nao|sim|ok|certo|entend|percebi|obrigad|tchau|ola|oi|bom|boa|claro|perfeito|exacto|errado|diferente|outro|outra|nada)/.test(txtNorm);

  if (msgCurta && !temPreposicao && !ehFraseConversa && txt.length > 2 && txt.length < 40) {
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
