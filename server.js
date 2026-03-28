const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Catálogo Omnia Parfums (preços em Kz)
const CATALOGO = {
  'sauvage': { nome: 'Dior Sauvage', genero: 'M', preco: { '60ml': 68500, '100ml': 89500, '200ml': 125000 }, notas: 'Bergamota · Ambroxan · Cedro' },
  'bleu de chanel': { nome: 'Bleu de Chanel', genero: 'M', preco: { '50ml': 72000, '100ml': 98000 }, notas: 'Citrus · Sândalo · Cedro' },
  'chanel bleu': { nome: 'Bleu de Chanel', genero: 'M', preco: { '50ml': 72000, '100ml': 98000 }, notas: 'Citrus · Sândalo · Cedro' },
  '1 million': { nome: 'Paco 1 Million', genero: 'M', preco: { '50ml': 58000, '100ml': 78000 }, notas: 'Toranja · Canela · Couro' },
  'one million': { nome: 'Paco 1 Million', genero: 'M', preco: { '50ml': 58000, '100ml': 78000 }, notas: 'Toranja · Canela · Couro' },
  'invictus': { nome: 'Paco Invictus', genero: 'M', preco: { '50ml': 55000, '100ml': 74000 }, notas: 'Toranja · Guaiaco · Âmbar' },
  'aventus': { nome: 'Creed Aventus', genero: 'M', preco: { '50ml': 185000, '100ml': 295000 }, notas: 'Abacaxi · Bétula · Musgo de Carvalho' },
  'boss bottled': { nome: 'Hugo Boss Bottled', genero: 'M', preco: { '50ml': 48000, '100ml': 65000 }, notas: 'Maçã · Canela · Sândalo' },
  'acqua di gio': { nome: 'Armani Acqua di Giò', genero: 'M', preco: { '50ml': 52000, '100ml': 72000 }, notas: 'Marine · Bergamota · Musgo' },
  'libre': { nome: 'YSL Libre', genero: 'F', preco: { '30ml': 58000, '50ml': 78000, '90ml': 110000 }, notas: 'Lavanda · Flor de Laranjeira · Musgo' },
  'ysl libre': { nome: 'YSL Libre', genero: 'F', preco: { '30ml': 58000, '50ml': 78000, '90ml': 110000 }, notas: 'Lavanda · Flor de Laranjeira · Musgo' },
  'jadore': { nome: 'Dior J\'adore', genero: 'F', preco: { '30ml': 55000, '50ml': 74000, '100ml': 105000 }, notas: 'Ylang-Ylang · Rosa · Jasmim' },
  "j'adore": { nome: 'Dior J\'adore', genero: 'F', preco: { '30ml': 55000, '50ml': 74000, '100ml': 105000 }, notas: 'Ylang-Ylang · Rosa · Jasmim' },
  'coco mademoiselle': { nome: 'Chanel Coco Mademoiselle', genero: 'F', preco: { '35ml': 68000, '50ml': 88000, '100ml': 125000 }, notas: 'Bergamota · Rosa · Patchouli' },
  'chance': { nome: 'Chanel Chance', genero: 'F', preco: { '35ml': 62000, '50ml': 82000, '100ml': 115000 }, notas: 'Toranja · Jacinto · Âmbar Branco' },
  'flowerbomb': { nome: 'Viktor & Rolf Flowerbomb', genero: 'F', preco: { '30ml': 65000, '50ml': 88000, '100ml': 122000 }, notas: 'Bergamota · Jasmim · Patchouli' },
  'black orchid': { nome: 'Tom Ford Black Orchid', genero: 'U', preco: { '30ml': 95000, '50ml': 138000, '100ml': 195000 }, notas: 'Trufas Negras · Ylang-Ylang · Patchouli' },
  'baccarat rouge': { nome: 'Maison Baccarat Rouge 540', genero: 'U', preco: { '35ml': 165000, '70ml': 285000 }, notas: 'Jasmim · Açafrão · Cedro · Âmbar' },
  'good girl': { nome: 'Carolina Herrera Good Girl', genero: 'F', preco: { '30ml': 58000, '50ml': 78000, '80ml': 105000 }, notas: 'Jasmim · Cacau · Baunilha' },
  'light blue': { nome: 'D&G Light Blue', genero: 'F', preco: { '25ml': 42000, '50ml': 62000, '100ml': 88000 }, notas: 'Maçã · Cedro · Âmbar Branco' },
};

function formatPrecos(preco) {
  return Object.entries(preco).map(([ml, kz]) => `  • ${ml}: ${kz.toLocaleString('pt-PT')} Kz`).join('\n');
}

function getBotReply(msg) {
  const txt = msg.toLowerCase().trim();

  // Saudações
  if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite|hello|hi|hey)/.test(txt)) {
    return `🖤 *Bem-vindo à Omnia Parfums!*\n\nSomos a tua perfumaria de confiança em Luanda. 🇦🇴\n\nPodes:\n• Escrever o nome de um perfume para ver o preço\n• Escrever *masculinos* para ver perfumes de homem\n• Escrever *femininos* para ver perfumes de mulher\n• Escrever *catálogo* para ver todos os perfumes\n• Escrever *encomendar* para fazer uma encomenda\n\n_Entrega em Luanda incluída_ 📦`;
  }

  // Catálogo completo
  if (/cat[aá]logo|todos|lista|ver tudo/.test(txt)) {
    const masc = Object.values(CATALOGO).filter(p => p.genero === 'M').map(p => `• ${p.nome}`);
    const fem = Object.values(CATALOGO).filter(p => p.genero === 'F').map(p => `• ${p.nome}`);
    const uni = Object.values(CATALOGO).filter(p => p.genero === 'U').map(p => `• ${p.nome}`);
    const uniqueMasc = [...new Set(masc)];
    const uniqueFem = [...new Set(fem)];
    const uniqueUni = [...new Set(uni)];
    return `🖤 *Catálogo Omnia Parfums*\n\n👔 *MASCULINOS*\n${uniqueMasc.join('\n')}\n\n👗 *FEMININOS*\n${uniqueFem.join('\n')}\n\n✨ *UNISSEXO*\n${uniqueUni.join('\n')}\n\n_Escreve o nome do perfume para ver o preço_ 👆`;
  }

  // Masculinos
  if (/masculin|homem|man|men/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p => p.genero === 'M').map(p => `• ${p.nome}`))];
    return `👔 *Perfumes Masculinos — Omnia Parfums*\n\n${lista.join('\n')}\n\n_Escreve o nome para ver preço e tamanhos_ 💛`;
  }

  // Femininos
  if (/feminin|mulher|woman|women/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p => p.genero === 'F').map(p => `• ${p.nome}`))];
    return `👗 *Perfumes Femininos — Omnia Parfums*\n\n${lista.join('\n')}\n\n_Escreve o nome para ver preço e tamanhos_ 💛`;
  }

  // Encomendar
  if (/encomendar|encomenda|comprar|quero|pedido|order/.test(txt)) {
    return `📦 *Fazer Encomenda*\n\nPara encomendar, envia-nos:\n\n1️⃣ Nome do perfume\n2️⃣ Tamanho (ml)\n3️⃣ O teu nome\n4️⃣ Morada de entrega em Luanda\n\n💛 Respondemos em menos de 30 minutos!\n\n_Pagamento: Transferência bancária, Multicaixa Express ou à entrega_`;
  }

  // Preço/stock
  if (/pre[çc]o|quanto|valor|stock|tens|disponivel/.test(txt)) {
    return `💛 Diz-me o nome do perfume que procuras e mostro-te os preços disponíveis!\n\nOu escreve *catálogo* para ver todos.`;
  }

  // Entrega
  if (/entrega|deliver|envio/.test(txt)) {
    return `📦 *Entregas Omnia Parfums*\n\n✅ Entrega em toda a Luanda\n⏰ Prazo: 24-48 horas\n💰 Entrega incluída no preço\n\n_Encomenda mínima: 1 frasco_`;
  }

  // Procura no catálogo
  for (const [key, produto] of Object.entries(CATALOGO)) {
    if (txt.includes(key)) {
      const generoEmoji = produto.genero === 'M' ? '👔' : produto.genero === 'F' ? '👗' : '✨';
      return `${generoEmoji} *${produto.nome}*\n\n🌸 Notas: ${produto.notas}\n\n💰 *Preços:*\n${formatPrecos(produto.preco)}\n\n📦 Entrega em Luanda incluída\n\n_Para encomendar, escreve *encomendar*_ 🖤`;
    }
  }

  // Resposta padrão
  return `🖤 *Omnia Parfums*\n\nNão encontrei esse perfume no nosso catálogo.\n\nExperimenta:\n• Escrever *catálogo* para ver todos os perfumes\n• Escrever *masculinos* ou *femininos*\n• Ou o nome completo do perfume\n\n_Tens alguma dúvida? Envia *encomendar* e falamos!_ 💛`;
}

async function sendMessage(to, text) {
  await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  }, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
}

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook messages
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const msg = changes?.value?.messages?.[0];
    if (!msg || msg.type !== 'text') return;
    const from = msg.from;
    const text = msg.text.body;
    console.log(`📩 De: ${from} | Msg: ${text}`);
    const reply = getBotReply(text);
    await sendMessage(from, reply);
    console.log(`✅ Resposta enviada para ${from}`);
  } catch (err) {
    console.error('Erro:', err.message);
  }
});

app.get('/', (req, res) => res.send('🖤 Omnia Parfums Bot — Activo!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Omnia Parfums Bot a correr na porta ${PORT}`));
