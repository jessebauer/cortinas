import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
app.use(cors());
app.use(express.json());

// ===================== PRODUCTS =====================
app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price_per_sqm, installation_price, fabric, color, image_url } = req.body;
    const result = db.prepare(
        'INSERT INTO products (name, category, description, price_per_sqm, installation_price, fabric, color, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, category || 'cortina', description, price_per_sqm || 0, installation_price || 80, fabric, color, image_url);
    res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/products/:id', (req, res) => {
    const { name, category, description, price_per_sqm, installation_price, fabric, color, image_url, active } = req.body;
    db.prepare(
        'UPDATE products SET name=?, category=?, description=?, price_per_sqm=?, installation_price=?, fabric=?, color=?, image_url=?, active=? WHERE id=?'
    ).run(name, category, description, price_per_sqm, installation_price, fabric, color, image_url, active ?? 1, req.params.id);
    res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/products/:id', (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ===================== CLIENTS =====================
app.get('/api/clients', (req, res) => {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
    res.json(clients);
});

app.get('/api/clients/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(client);
});

app.post('/api/clients', (req, res) => {
    const { name, email, phone, whatsapp, address, city, notes, source } = req.body;
    const result = db.prepare(
        'INSERT INTO clients (name, email, phone, whatsapp, address, city, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email, phone, whatsapp, address, city, notes, source || 'manual');
    res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/clients/:id', (req, res) => {
    const { name, email, phone, whatsapp, address, city, notes, source } = req.body;
    db.prepare(
        'UPDATE clients SET name=?, email=?, phone=?, whatsapp=?, address=?, city=?, notes=?, source=? WHERE id=?'
    ).run(name, email, phone, whatsapp, address, city, notes, source, req.params.id);
    res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/clients/:id', (req, res) => {
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ===================== QUOTES =====================
app.get('/api/quotes', (req, res) => {
    const quotes = db.prepare(`
    SELECT q.*, c.name as client_name, c.phone as client_phone
    FROM quotes q
    LEFT JOIN clients c ON q.client_id = c.id
    ORDER BY q.created_at DESC
  `).all();
    res.json(quotes);
});

app.get('/api/quotes/:id', (req, res) => {
    const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address
    FROM quotes q
    LEFT JOIN clients c ON q.client_id = c.id
    WHERE q.id = ?
  `).get(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado' });

    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
    res.json({ ...quote, items });
});

app.post('/api/quotes', (req, res) => {
    const { client_id, items, discount_percent, notes, valid_until } = req.body;

    let subtotal = 0;
    let installationTotal = 0;

    if (items && items.length > 0) {
        for (const item of items) {
            subtotal += item.subtotal;
            installationTotal += (item.installation_price || 0) * (item.quantity || 1);
        }
    }

    const discountValue = subtotal * ((discount_percent || 0) / 100);
    const total = subtotal - discountValue + installationTotal;

    const result = db.prepare(
        'INSERT INTO quotes (client_id, subtotal, discount_percent, discount_value, installation_total, total, notes, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(client_id, subtotal, discount_percent || 0, discountValue, installationTotal, total, notes, valid_until);

    const quoteId = result.lastInsertRowid;

    if (items && items.length > 0) {
        const insertItem = db.prepare(
            'INSERT INTO quote_items (quote_id, product_id, product_name, width, height, quantity, unit_price, installation_price, subtotal, room, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const item of items) {
            insertItem.run(quoteId, item.product_id, item.product_name, item.width, item.height, item.quantity || 1, item.unit_price, item.installation_price || 0, item.subtotal, item.room, item.notes);
        }
    }

    res.json({ id: quoteId, total });
});

app.put('/api/quotes/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare(`UPDATE quotes SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    res.json({ success: true });
});

app.delete('/api/quotes/:id', (req, res) => {
    db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(req.params.id);
    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ===================== ORDERS =====================
app.get('/api/orders', (req, res) => {
    const orders = db.prepare(`
    SELECT o.*, c.name as client_name, c.phone as client_phone
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    ORDER BY o.created_at DESC
  `).all();
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    const { quote_id, client_id, total, notes } = req.body;
    const result = db.prepare(
        'INSERT INTO orders (quote_id, client_id, total, notes) VALUES (?, ?, ?, ?)'
    ).run(quote_id, client_id, total, notes);

    // Update quote status
    if (quote_id) {
        db.prepare(`UPDATE quotes SET status = 'aprovado', updated_at = datetime('now') WHERE id = ?`).run(quote_id);
    }

    res.json({ id: result.lastInsertRowid });
});

app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    res.json({ success: true });
});

// ===================== MESSAGES / WHATSAPP =====================
app.get('/api/messages', (req, res) => {
    // Get conversations (grouped by client)
    const conversations = db.prepare(`
    SELECT m.client_id, m.client_name, m.client_phone,
           MAX(m.created_at) as last_message_at,
           (SELECT content FROM messages WHERE client_id = m.client_id ORDER BY created_at DESC LIMIT 1) as last_message,
           SUM(CASE WHEN m.read = 0 AND m.direction = 'incoming' THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    GROUP BY m.client_id
    ORDER BY last_message_at DESC
  `).all();
    res.json(conversations);
});

app.get('/api/messages/:clientId', (req, res) => {
    const messages = db.prepare(
        'SELECT * FROM messages WHERE client_id = ? ORDER BY created_at ASC'
    ).all(req.params.clientId);

    // Mark as read
    db.prepare(`UPDATE messages SET read = 1 WHERE client_id = ? AND direction = 'incoming'`).run(req.params.clientId);

    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const { client_id, client_name, client_phone, content, direction, is_bot } = req.body;
    const result = db.prepare(
        'INSERT INTO messages (client_id, client_name, client_phone, content, direction, is_bot) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(client_id, client_name, client_phone, content, direction || 'outgoing', is_bot || 0);
    res.json({ id: result.lastInsertRowid });
});

// Bot auto-reply endpoint
app.post('/api/messages/bot-reply', (req, res) => {
    const { client_id, client_name, client_phone, message } = req.body;

    const lowerMsg = message.toLowerCase();
    let reply = '';

    if (lowerMsg.includes('olá') || lowerMsg.includes('oi') || lowerMsg.includes('bom dia') || lowerMsg.includes('boa tarde') || lowerMsg.includes('boa noite')) {
        const greetings = [
            `Olá, ${client_name}! 😊 Que bom te ver por aqui! Somos especialistas em cortinas e persianas. Como posso te ajudar hoje?`,
            `Oi, ${client_name}! 👋 Bem-vindo(a)! Temos lindas opções em cortinas e persianas. Posso te ajudar com algo?`,
            `Olá! 😄 Seja bem-vindo(a) à nossa loja! Estou aqui para te ajudar a encontrar a cortina ou persiana perfeita!`,
        ];
        reply = greetings[Math.floor(Math.random() * greetings.length)];
    } else if (lowerMsg.includes('orçamento') || lowerMsg.includes('orcamento') || lowerMsg.includes('preço') || lowerMsg.includes('preco') || lowerMsg.includes('valor') || lowerMsg.includes('quanto custa')) {
        reply = `Claro, ${client_name}! 📋 Ficarei feliz em preparar um orçamento para você!\n\nPara isso, preciso de algumas informações:\n\n📏 Largura da janela (em metros)\n📐 Altura da janela (em metros)\n🏠 Tipo de ambiente (sala, quarto, escritório...)\n💡 Preferência: cortina ou persiana?\n\nPode me enviar esses dados?`;
    } else if (lowerMsg.includes('cortina') && !lowerMsg.includes('persiana')) {
        reply = `Temos ótimas opções em cortinas! 🪟\n\n✨ **Voil Liso** - a partir de R$ 89,90/m² (leve e elegante)\n🌙 **Blackout Premium** - a partir de R$ 159,90/m² (100% vedação de luz)\n🏡 **Linho Natural** - a partir de R$ 129,90/m² (sofisticado)\n🌸 **Jacquard Floral** - a partir de R$ 179,90/m² (delicado)\n🔄 **Dupla (Voil + Blackout)** - a partir de R$ 249,90/m² (versátil)\n\nQual tipo te interessa mais? Posso fazer um orçamento personalizado! 😊`;
    } else if (lowerMsg.includes('persiana')) {
        reply = `Trabalhamos com diversas persianas! 🪟\n\n🔲 **Horizontal Alumínio** - a partir de R$ 119,90/m²\n📏 **Vertical PVC** - a partir de R$ 99,90/m²\n🎨 **Romana** - a partir de R$ 199,90/m² (elegante!)\n☀️ **Rolô Screen** - a partir de R$ 169,90/m² (controle solar)\n🌓 **Double Vision** - a partir de R$ 189,90/m² (dia e noite)\n\nQual modelo chamou sua atenção? 😊`;
    } else if (lowerMsg.includes('instala') || lowerMsg.includes('coloca')) {
        reply = `Sim! Fazemos a instalação completa! 🔧\n\n✅ Visita técnica para medição\n✅ Instalação profissional\n✅ Garantia do serviço\n\n📅 Prazo de produção: 5 a 10 dias úteis\n💰 Instalação a partir de R$ 70,00 por peça\n\nGostaria de agendar uma visita técnica? É gratuita! 📐`;
    } else if (lowerMsg.includes('visita') || lowerMsg.includes('agend') || lowerMsg.includes('medir') || lowerMsg.includes('medição') || lowerMsg.includes('medicao')) {
        reply = `Ótimo! Vou agendar uma visita técnica gratuita! 📐\n\nNossos horários disponíveis:\n\n🕐 Segunda a Sexta: 8h às 18h\n🕐 Sábado: 8h às 12h\n\nQual o melhor dia e horário para você?\nE por favor, confirme o endereço completo. 📍`;
    } else if (lowerMsg.includes('obrigad') || lowerMsg.includes('valeu') || lowerMsg.includes('agradeç')) {
        reply = `Por nada, ${client_name}! 😊 Estamos sempre à disposição!\n\nSe precisar de algo mais, é só chamar! 🙌\n\nTenha um ótimo dia! ☀️`;
    } else if (lowerMsg.includes('prazo') || lowerMsg.includes('entrega') || lowerMsg.includes('demora')) {
        reply = `Nossos prazos são:\n\n📦 **Produção**: 5 a 10 dias úteis\n🚚 **Entrega + Instalação**: Agendamos o melhor dia para você\n\nDepois de aprovado o orçamento, trabalhamos o mais rápido possível! ⚡\n\nDeseja que eu prepare um orçamento?`;
    } else if (lowerMsg.includes('pag') || lowerMsg.includes('parcela') || lowerMsg.includes('cartão') || lowerMsg.includes('pix')) {
        reply = `Aceitamos diversas formas de pagamento! 💳\n\n💵 Dinheiro ou PIX: 5% de desconto\n💳 Cartão de crédito: até 10x sem juros\n📄 Boleto bancário: à vista\n\n💡 Parcelas mínimas de R$ 150,00\n\nPosso te ajudar com mais alguma coisa? 😊`;
    } else {
        const defaultReplies = [
            `Entendi, ${client_name}! 😊 Posso te ajudar com:\n\n🪟 Informações sobre cortinas e persianas\n📋 Orçamento personalizado\n📐 Agendar visita técnica\n💰 Formas de pagamento\n\nO que você prefere?`,
            `Obrigado pela mensagem, ${client_name}! 😊 Como posso te ajudar? Trabalhamos com cortinas, persianas e acessórios. Posso preparar um orçamento ou agendar uma visita técnica gratuita!`,
            `Oi ${client_name}! 👋 Estou aqui para te ajudar! Pode me dizer mais sobre o que você precisa? Cortinas? Persianas? Orçamento? Estou à disposição! 😊`,
        ];
        reply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
    }

    // Save bot reply
    const result = db.prepare(
        'INSERT INTO messages (client_id, client_name, client_phone, content, direction, is_bot, read) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(client_id, client_name, client_phone, reply, 'outgoing', 1, 1);

    res.json({ id: result.lastInsertRowid, content: reply });
});

app.get('/api/message-templates', (req, res) => {
    const templates = db.prepare('SELECT * FROM message_templates ORDER BY category, name').all();
    res.json(templates);
});

// ===================== INSTALLATIONS =====================
app.get('/api/installations', (req, res) => {
    const installations = db.prepare('SELECT * FROM installations ORDER BY date ASC').all();
    res.json(installations);
});

app.post('/api/installations', (req, res) => {
    const { order_id, client_id, client_name, address, date, time_start, time_end, installer, notes } = req.body;
    const result = db.prepare(
        'INSERT INTO installations (order_id, client_id, client_name, address, date, time_start, time_end, installer, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(order_id, client_id, client_name, address, date, time_start, time_end, installer, notes);
    res.json({ id: result.lastInsertRowid });
});

app.put('/api/installations/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE installations SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
});

// ===================== DASHBOARD STATS =====================
app.get('/api/dashboard', (req, res) => {
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get().count;
    const totalQuotes = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count;
    const pendingQuotes = db.prepare(`SELECT COUNT(*) as count FROM quotes WHERE status = 'pendente'`).get().count;
    const approvedQuotes = db.prepare(`SELECT COUNT(*) as count FROM quotes WHERE status = 'aprovado'`).get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(total), 0) as total FROM quotes WHERE status = 'aprovado'`).get().total;
    const monthRevenue = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total FROM quotes 
    WHERE status = 'aprovado' AND created_at >= date('now', '-30 days')
  `).get().total;
    const conversionRate = totalQuotes > 0 ? ((approvedQuotes / totalQuotes) * 100).toFixed(1) : 0;
    const unreadMessages = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE read = 0 AND direction = 'incoming'`).get().count;

    // Monthly revenue data for charts
    const monthlyRevenue = db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      SUM(CASE WHEN status = 'aprovado' THEN total ELSE 0 END) as revenue,
      COUNT(*) as quotes_count
    FROM quotes
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 6
  `).all().reverse();

    // Recent quotes
    const recentQuotes = db.prepare(`
    SELECT q.id, q.total, q.status, q.created_at, c.name as client_name
    FROM quotes q LEFT JOIN clients c ON q.client_id = c.id
    ORDER BY q.created_at DESC LIMIT 5
  `).all();

    res.json({
        totalClients,
        totalProducts,
        totalQuotes,
        pendingQuotes,
        approvedQuotes,
        totalOrders,
        totalRevenue,
        monthRevenue,
        conversionRate,
        unreadMessages,
        monthlyRevenue,
        recentQuotes
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Cortina API rodando em http://localhost:${PORT}`);
});
