const API = '/api'

async function request(url, options = {}) {
    const res = await fetch(`${API}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    })
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(error.error || 'Erro na requisição')
    }
    return res.json()
}

export const api = {
    // Dashboard
    getDashboard: () => request('/dashboard'),

    // Products
    getProducts: () => request('/products'),
    getProduct: (id) => request(`/products/${id}`),
    createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

    // Clients
    getClients: () => request('/clients'),
    getClient: (id) => request(`/clients/${id}`),
    createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
    updateClient: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

    // Quotes
    getQuotes: () => request('/quotes'),
    getQuote: (id) => request(`/quotes/${id}`),
    createQuote: (data) => request('/quotes', { method: 'POST', body: JSON.stringify(data) }),
    updateQuoteStatus: (id, status) => request(`/quotes/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    deleteQuote: (id) => request(`/quotes/${id}`, { method: 'DELETE' }),

    // Orders
    getOrders: () => request('/orders'),
    createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    // Messages
    getConversations: () => request('/messages'),
    getMessages: (clientId) => request(`/messages/${clientId}`),
    sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
    getBotReply: (data) => request('/messages/bot-reply', { method: 'POST', body: JSON.stringify(data) }),
    getTemplates: () => request('/message-templates'),

    // Installations
    getInstallations: () => request('/installations'),
    createInstallation: (data) => request('/installations', { method: 'POST', body: JSON.stringify(data) }),
    updateInstallationStatus: (id, status) => request(`/installations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

export function getStatusLabel(status) {
    const labels = {
        pendente: 'Pendente',
        aprovado: 'Aprovado',
        rejeitado: 'Rejeitado',
        aguardando: 'Aguardando',
        em_producao: 'Em Produção',
        instalacao: 'Instalação',
        concluido: 'Concluído',
        agendada: 'Agendada',
        realizada: 'Realizada',
        cancelada: 'Cancelada',
    }
    return labels[status] || status
}

export function getStatusBadge(status) {
    const badges = {
        pendente: 'badge-warning',
        aprovado: 'badge-success',
        rejeitado: 'badge-danger',
        aguardando: 'badge-warning',
        em_producao: 'badge-info',
        instalacao: 'badge-purple',
        concluido: 'badge-success',
        agendada: 'badge-info',
        realizada: 'badge-success',
        cancelada: 'badge-danger',
    }
    return badges[status] || 'badge-info'
}
