import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'cortina.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'cortina',
    description TEXT,
    price_per_sqm REAL NOT NULL DEFAULT 0,
    installation_price REAL NOT NULL DEFAULT 80,
    min_width REAL DEFAULT 0.5,
    max_width REAL DEFAULT 6.0,
    min_height REAL DEFAULT 0.5,
    max_height REAL DEFAULT 4.0,
    fabric TEXT,
    color TEXT,
    image_url TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    city TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    status TEXT DEFAULT 'pendente',
    subtotal REAL DEFAULT 0,
    discount_percent REAL DEFAULT 0,
    discount_value REAL DEFAULT 0,
    installation_total REAL DEFAULT 0,
    total REAL DEFAULT 0,
    notes TEXT,
    valid_until TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT,
    width REAL NOT NULL,
    height REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    installation_price REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    room TEXT,
    notes TEXT,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER,
    client_id INTEGER,
    status TEXT DEFAULT 'aguardando',
    installation_date TEXT,
    installation_time TEXT,
    installer_name TEXT,
    total REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    client_name TEXT,
    client_phone TEXT,
    direction TEXT DEFAULT 'incoming',
    content TEXT NOT NULL,
    is_bot INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS message_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'geral'
  );

  CREATE TABLE IF NOT EXISTS installations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    client_id INTEGER,
    client_name TEXT,
    address TEXT,
    date TEXT NOT NULL,
    time_start TEXT,
    time_end TEXT,
    installer TEXT,
    status TEXT DEFAULT 'agendada',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

// Seed data if empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
    const insertProduct = db.prepare(`
    INSERT INTO products (name, category, description, price_per_sqm, installation_price, fabric, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    const products = [
        ['Cortina Voil Liso', 'cortina', 'Cortina em tecido voil liso, toque suave e elegante. Permite passagem de luz difusa.', 89.90, 80, 'Voil', 'Branco'],
        ['Cortina Blackout Premium', 'cortina', 'Cortina blackout 100% vedação de luz. Ideal para quartos.', 159.90, 80, 'Blackout', 'Cinza'],
        ['Cortina Linho Natural', 'cortina', 'Cortina em tecido de linho natural, visual rústico e sofisticado.', 129.90, 80, 'Linho', 'Bege'],
        ['Cortina Jacquard Floral', 'cortina', 'Cortina em jacquard com estampa floral delicada.', 179.90, 90, 'Jacquard', 'Dourado'],
        ['Cortina Dupla (Voil + Blackout)', 'cortina', 'Cortina dupla composta por voil e blackout para versatilidade.', 249.90, 120, 'Voil + Blackout', 'Branco/Cinza'],
        ['Persiana Horizontal Alumínio', 'persiana', 'Persiana horizontal em alumínio 25mm. Prática e durável.', 119.90, 70, 'Alumínio', 'Branco'],
        ['Persiana Vertical PVC', 'persiana', 'Persiana vertical em PVC, ideal para grandes janelas e portas.', 99.90, 70, 'PVC', 'Bege'],
        ['Persiana Romana', 'persiana', 'Persiana romana em tecido, combina a elegância de cortina com praticidade.', 199.90, 90, 'Tecido', 'Linho'],
        ['Persiana Rolô Screen', 'persiana', 'Persiana rolô em tela screen, permite visibilidade e controle solar.', 169.90, 80, 'Screen', 'Cinza'],
        ['Persiana Double Vision', 'persiana', 'Persiana double vision (dia e noite). Controle variável de luz.', 189.90, 85, 'Poliéster', 'Branco'],
        ['Cortina Painel Deslizante', 'cortina', 'Painel deslizante para portas e grandes vãos. Visual moderno.', 219.90, 100, 'Tecido Painel', 'Cinza Claro'],
        ['Trilho Suíço Branco', 'acessorio', 'Trilho suíço de alta qualidade para cortinas. Inclui suportes.', 45.00, 40, 'Metal', 'Branco'],
        ['Varão Cromado 28mm', 'acessorio', 'Varão cromado com ponteiras decorativas. Até 3m.', 89.90, 50, 'Metal', 'Cromado'],
        ['Bandô Estofado', 'acessorio', 'Bandô estofado sob medida para arremate superior da cortina.', 79.90, 60, 'Tecido', 'Sob Consulta'],
    ];

    const insertMany = db.transaction((items) => {
        for (const item of items) {
            insertProduct.run(...item);
        }
    });
    insertMany(products);
}

// Seed message templates
const templateCount = db.prepare('SELECT COUNT(*) as count FROM message_templates').get();
if (templateCount.count === 0) {
    const insertTemplate = db.prepare('INSERT INTO message_templates (name, content, category) VALUES (?, ?, ?)');
    const templates = [
        ['Boas-vindas', 'Olá! 😊 Seja bem-vindo(a) à nossa loja de cortinas e persianas! Como posso te ajudar hoje?', 'atendimento'],
        ['Solicitar Medidas', 'Para preparar seu orçamento, preciso de algumas informações:\n\n📏 Largura da janela (em metros)\n📐 Altura da janela (em metros)\n🏠 Tipo de ambiente (sala, quarto, etc.)\n\nPode me enviar?', 'orcamento'],
        ['Enviar Orçamento', 'Preparei seu orçamento! 📋\n\nVou enviar o PDF com todos os detalhes. Qualquer dúvida, estou à disposição! 😊', 'orcamento'],
        ['Agendamento de Visita', 'Ótimo! Vou agendar uma visita técnica para fazer a medição. 📐\n\nQual o melhor dia e horário para você?\n\n🕐 Segunda a Sexta: 8h às 18h\n🕐 Sábado: 8h às 12h', 'agendamento'],
        ['Confirmação de Pedido', 'Seu pedido foi confirmado! ✅\n\nPrazo de produção: 5 a 10 dias úteis.\nEntraremos em contato para agendar a instalação.\n\nObrigado pela confiança! 🙏', 'pedido'],
        ['Pós-Instalação', 'Olá! A instalação foi realizada com sucesso? 😊\n\nFicamos felizes em atender você!\nSe precisar de qualquer ajuste, é só nos chamar.\n\n⭐ Se puder, avalie nosso atendimento!', 'pos-venda'],
        ['Promoção', '🔥 PROMOÇÃO ESPECIAL!\n\nEsta semana com descontos imperdíveis:\n\n✅ Cortinas com até 20% OFF\n✅ Persianas a partir de R$ 99,90/m²\n✅ Instalação GRÁTIS\n\nAproveite! Condições por tempo limitado.', 'marketing'],
    ];

    const insertManyTemplates = db.transaction((items) => {
        for (const item of items) {
            insertTemplate.run(...item);
        }
    });
    insertManyTemplates(templates);
}

// Seed demo clients
const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();
if (clientCount.count === 0) {
    const insertClient = db.prepare(`
    INSERT INTO clients (name, email, phone, whatsapp, address, city, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    const clients = [
        ['Maria Silva', 'maria@email.com', '(11) 98765-4321', '5511987654321', 'Rua das Flores, 123', 'São Paulo', 'whatsapp'],
        ['João Santos', 'joao@email.com', '(11) 91234-5678', '5511912345678', 'Av. Brasil, 456', 'São Paulo', 'indicação'],
        ['Ana Oliveira', 'ana@email.com', '(21) 99876-5432', '5521998765432', 'Rua do Comércio, 789', 'Rio de Janeiro', 'whatsapp'],
        ['Carlos Pereira', 'carlos@email.com', '(31) 98765-1234', '5531987651234', 'Rua Minas Gerais, 321', 'Belo Horizonte', 'site'],
        ['Fernanda Costa', 'fernanda@email.com', '(11) 97654-3210', '5511976543210', 'Al. Santos, 654', 'São Paulo', 'whatsapp'],
    ];

    const insertManyClients = db.transaction((items) => {
        for (const item of items) {
            insertClient.run(...item);
        }
    });
    insertManyClients(clients);
}

// Seed demo quotes
const quoteCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
if (quoteCount.count === 0) {
    db.exec(`
    INSERT INTO quotes (client_id, status, subtotal, discount_percent, installation_total, total, notes, valid_until, created_at) VALUES
    (1, 'aprovado', 2850.00, 10, 240, 2805.00, 'Cortinas para sala e quartos', '2026-03-30', '2026-02-20'),
    (2, 'pendente', 1450.00, 0, 160, 1610.00, 'Persianas para escritório', '2026-03-30', '2026-02-25'),
    (3, 'aprovado', 3200.00, 5, 320, 3360.00, 'Projeto completo apartamento', '2026-03-15', '2026-02-15'),
    (4, 'rejeitado', 890.00, 0, 80, 970.00, 'Persiana para quarto', '2026-03-10', '2026-02-10'),
    (5, 'pendente', 1980.00, 0, 200, 2180.00, 'Cortinas blackout salas', '2026-04-01', '2026-02-27');
  `);

    db.exec(`
    INSERT INTO quote_items (quote_id, product_id, product_name, width, height, quantity, unit_price, installation_price, subtotal, room) VALUES
    (1, 1, 'Cortina Voil Liso', 2.5, 2.8, 1, 629.30, 80, 629.30, 'Sala'),
    (1, 2, 'Cortina Blackout Premium', 2.0, 2.8, 2, 895.44, 80, 1790.88, 'Quarto'),
    (2, 6, 'Persiana Horizontal Alumínio', 1.5, 1.6, 2, 287.76, 70, 575.52, 'Escritório'),
    (2, 9, 'Persiana Rolô Screen', 2.0, 2.0, 1, 679.60, 80, 679.60, 'Sala de Reunião'),
    (3, 5, 'Cortina Dupla (Voil + Blackout)', 3.0, 2.8, 2, 2098.32, 120, 4196.64, 'Sala')
  `);
}

// Seed demo orders
const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
if (orderCount.count === 0) {
    db.exec(`
    INSERT INTO orders (quote_id, client_id, status, installation_date, total, created_at) VALUES
    (1, 1, 'em_producao', '2026-03-10', 2805.00, '2026-02-22'),
    (3, 3, 'aguardando', NULL, 3360.00, '2026-02-18');
  `);

    db.exec(`
    INSERT INTO installations (order_id, client_id, client_name, address, date, time_start, time_end, installer, status) VALUES
    (1, 1, 'Maria Silva', 'Rua das Flores, 123 - São Paulo', '2026-03-10', '09:00', '12:00', 'Carlos Instalador', 'agendada');
  `);
}

// Seed demo messages
const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get();
if (msgCount.count === 0) {
    db.exec(`
    INSERT INTO messages (client_id, client_name, client_phone, direction, content, is_bot, read, created_at) VALUES
    (1, 'Maria Silva', '(11) 98765-4321', 'incoming', 'Olá, gostaria de fazer um orçamento de cortinas para minha sala', 0, 1, '2026-02-27 10:30:00'),
    (1, 'Maria Silva', '(11) 98765-4321', 'outgoing', 'Olá Maria! 😊 Seja bem-vinda! Ficarei feliz em ajudar com seu orçamento. Poderia me informar as medidas da janela (largura x altura)?', 1, 1, '2026-02-27 10:30:15'),
    (1, 'Maria Silva', '(11) 98765-4321', 'incoming', 'A janela tem 2,50m de largura por 2,80m de altura', 0, 1, '2026-02-27 10:32:00'),
    (1, 'Maria Silva', '(11) 98765-4321', 'outgoing', 'Perfeito! Para uma janela de 2,50m x 2,80m, temos ótimas opções. Você prefere cortina com tecido leve (voil) ou blackout? 🏠', 1, 1, '2026-02-27 10:32:10'),
    (5, 'Fernanda Costa', '(11) 97654-3210', 'incoming', 'Boa tarde! Vocês fazem instalação de persiana?', 0, 0, '2026-02-28 14:20:00'),
    (5, 'Fernanda Costa', '(11) 97654-3210', 'outgoing', 'Boa tarde, Fernanda! Sim, trabalhamos com diversos modelos de persianas e realizamos a instalação completa! 😊 Qual tipo de persiana você procura?', 1, 0, '2026-02-28 14:20:12');
  `);
}

export default db;
