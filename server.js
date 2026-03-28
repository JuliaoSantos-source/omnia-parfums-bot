const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://evolution-api-production-e0f4.up.railway.app';
const EVOLUTION_KEY = process.env.EVOLUTION_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'omnia-parfums';

const CATALOGO = {
  'sauvage': { nome: 'Dior Sauvage', genero: 'M', preco: { '60ml': 68500, '100ml': 89500, '200ml': 125000 }, notas: 'Bergamota, Ambroxan, Cedro' },
  'bleu de chanel': { nome: 'Bleu de Chanel', genero: 'M', preco: { '50ml': 72000, '100ml': 98000 }, notas: 'Citrus, Sandalo, Cedro' },
  'chanel bleu': { nome: 'Bleu de Chanel', genero: 'M', preco: { '50ml': 72000, '100ml': 98000 }, notas: 'Citrus, Sandalo, Cedro' },
  '1 million': { nome: 'Paco 1 Million', genero: 'M', preco: { '50ml': 58000, '100ml': 78000 }, notas: 'Toranja, Canela, Couro' },
  'one million': { nome: 'Paco 1 Million', genero: 'M', preco: { '50ml': 58000, '100ml': 78000 }, notas: 'Toranja, Canela, Couro' },
  'invictus': { nome: 'Paco Invictus', genero: 'M', preco: { '50ml': 55000, '100ml': 74000 }, notas: 'Toranja, Guaiaco, Ambar' },
  'aventus': { nome: 'Creed Aventus', genero: 'M', preco: { '50ml': 185000, '100ml': 295000 }, notas: 'Abacaxi, Betula, Musgo' },
  'boss bottled': { nome: 'Hugo Boss Bottled', genero: 'M', preco: { '50ml': 48000, '100ml': 65000 }, notas: 'Maca, Canela, Sandalo' },
  'acqua di gio': { nome: 'Armani Acqua di Gio', genero: 'M', preco: { '50ml': 52000, '100ml': 72000 }, notas: 'Marine, Bergamota, Musgo' },
  'libre': { nome: 'YSL Libre', genero: 'F', preco: { '30ml': 58000, '50ml': 78000, '90ml': 110000 }, notas: 'Lavanda, Flor de Laranjeira, Musgo' },
  'ysl libre': { nome: 'YSL Libre', genero: 'F', preco: { '30ml': 58000, '50ml': 78000, '90ml': 110000 }, notas: 'Lavanda, Flor de Laranjeira, Musgo' },
  'jadore': { nome: 'Dior Jadore', genero: 'F', preco: { '30ml': 55000, '50ml': 74000, '100ml': 105000 }, notas: 'Ylang-Ylang, Rosa, Jasmim' },
  'coco mademoiselle': { nome: 'Chanel Coco Mademoiselle', genero: 'F', preco: { '35ml': 68000, '50ml': 88000, '100ml': 125000 }, notas: 'Bergamota, Rosa, Patchouli' },
  'chance': { nome: 'Chanel Chance', genero: 'F', preco: { '35ml': 62000, '50ml': 82000, '100ml': 115000 }, notas: 'Toranja, Jacinto, Ambar Branco' },
  'flowerbomb': { nome: 'Viktor Rolf Flowerbomb', genero: 'F', preco: { '30ml': 65000, '50ml': 88000, '100ml': 122000 }, notas: 'Bergamota, Jasmim, Patchouli' },
  'black orchid': { nome: 'Tom Ford Black Orchid', genero: 'U', preco: { '30ml': 95000, '50ml': 138000, '100ml': 195000 }, notas: 'Trufas Negras, Ylang, Patchouli' },
  'baccarat rouge': { nome: 'Baccarat Rouge 540', genero: 'U', preco: { '35ml': 165000, '70ml': 285000 }, notas: 'Jasmim, Acafrao, Cedro, Ambar' },
  'good girl': { nome: 'Carolina Herrera Good Girl', genero: 'F', preco: { '30ml': 58000, '50ml': 78000, '80ml': 105000 }, notas: 'Jasmim, Cacau, Baunilha' },
  'light blue': { nome: 'DG Light Blue', genero: 'F', preco: { '25ml': 42000, '50ml': 62000, '100ml': 88000 }, notas: 'Maca, Cedro, Ambar Branco' },
};

function formatPrecos(preco) {
  return Object.entries(preco).map(([ml, kz]) => `  - ${ml}: ${kz.toLocaleString('pt-PT')} Kz`).join('\n');
}

function getBotReply(msg) {
  const txt = msg.toLowerCase().trim();

  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey|olá)/.test(txt)) {
    return `🖤 *Bem-vindo a Omnia Parfums!*\n\nSomos a tua perfumaria de confianca em Luanda. 🇦🇴\n\nPodes:\n- Escrever o nome de um perfume para ver o preco\n- Escrever *masculinos* para ver perfumes de homem\n- Escrever *femininos* para ver perfumes de mulher\n- Escrever *catalogo* para ver todos\n- Escrever *encomendar* para fazer encomenda\n\n_Entrega em Luanda incluida_ 📦`;
  }

  if (/cat.logo|todos|lista/.test(txt)) {
    const masc = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>`- ${p.nome}`))];
    const fem = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>`- ${p.nome}`))];
    const uni = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='U').map(p=>`- ${p.nome}`))];
    return `🖤 *Catalogo Omnia Parfums*\n\n👔 *MASCULINOS*\n${masc.join('\n')}\n\n👗 *FEMININOS*\n${fem.join('\n')}\n\n✨ *UNISSEXO*\n${uni.join('\n')}\n\n_Escreve o nome para ver o preco_ 💛`;
  }

  if (/masculin|homem/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='M').map(p=>`- ${p.nome}`))];
    return `👔 *Perfumes Masculinos*\n\n${lista.join('\n')}\n\n_Escreve o nome para ver preco_ 💛`;
  }

  if (/feminin|mulher/.test(txt)) {
    const lista = [...new Set(Object.values(CATALOGO).filter(p=>p.genero==='F').map(p=>`- ${p.nome}`))];
    return `👗 *Perfumes Femininos*\n\n${lista.join('\n')}\n\n_Escreve o nome para ver preco_ 💛`;
  }

  if (/encomendar|encomenda|comprar|quero|pedido/.test(txt)) {
    return `📦 *Fazer Encomenda*\n\nEnvia-nos:\n1. Nome do perfume\n2. Tamanho (ml)\n3. O teu nome\n4. Morada em Luanda\n\nRespondemos em 30 minutos! 💛\n\n_Pagamento: Transferencia, Multicaixa Express ou a entrega_`;
  }

  if (/entrega|envio/.test(txt)) {
    return `📦 *Entregas Omnia Parfums*\n\n✅ Entrega em toda Luanda\n⏰ Prazo: 24-48 horas\n💰 Entrega incluida no preco\n\n_Encomenda minima: 1 frasco_`;
  }

  for (const [key, p] of Object.entries(CATALOGO)) {
    if (txt.includes(key)) {
      const emoji = p.genero==='M' ? '👔' : p.genero==='F' ? '👗' : '✨';
      return `${emoji} *${p.nome}*\n\n🌸 Notas: ${p.notas}\n\n💰 *Precos:*\n${formatPrecos(p.preco)}\n\n📦 Entrega em Luanda incluida\n\n_Para encomendar, escreve *encomendar*_ 🖤`;
    }
  }

  return `🖤 *Omnia Parfums*\n\nNao encontrei esse perfume no nosso catalogo.\n\nExperimenta:\n- Escrever *catalogo*\n- Escrever *masculinos* ou *femininos*\n- Ou o nome completo do perfume\n\n_Tens duvidas? Escreve *encomendar*_ 💛`;
}

async function sendMessage(to, text) {
  try {
    await axios.post(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      number: to,
      text: text
    }, {
      headers: {
        'apikey': EVOLUTION_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Mensagem enviada para ${to}`);
  } catch(e) {
    console.error('Erro ao enviar:', e.response?.data || e.message);
  }
}

// Webhook da Evolution API
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    console.log('📩 Webhook recebido:', JSON.stringify(req.body).substring(0, 200));

    const body = req.body;

    // Formato Evolution API v2
    const event = body.event;
    if (event !== 'messages.upsert') return;

    const data = body.data;
    if (!data) return;

    const msg = data.message;
    if (!msg) return;

    // Ignorar mensagens do proprio bot
    if (data.key?.fromMe) return;

    // Ignorar grupos
    if (data.key?.remoteJid?.includes('@g.us')) return;

    const from = data.key?.remoteJid;
    const text = msg.conversation || msg.extendedTextMessage?.text || '';

    if (!from || !text) return;

    console.log(`📩 De: ${from} | Msg: ${text}`);
    const reply = getBotReply(text);
    await sendMessage(from, reply);

  } catch(e) {
    console.error('Erro webhook:', e.message);
  }
});

// Verificacao webhook
app.get('/webhook', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send('🖤 Omnia Parfums Bot - Activo!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot activo na porta ${PORT}`));
