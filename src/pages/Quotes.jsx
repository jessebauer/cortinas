import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Eye, Trash2, CheckCircle, XCircle, ShoppingBag } from 'lucide-react'
import { api, formatCurrency, formatDate, getStatusLabel, getStatusBadge } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Quotes() {
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const navigate = useNavigate()

    const load = () => {
        api.getQuotes().then(q => { setQuotes(q); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(load, [])

    const filtered = quotes.filter(q => {
        const matchSearch = (q.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
            q.id.toString().includes(search)
        const matchFilter = filter === 'all' || q.status === filter
        return matchSearch && matchFilter
    })

    const handleStatusChange = async (id, status) => {
        await api.updateQuoteStatus(id, status)
        load()
    }

    const handleCreateOrder = async (quote) => {
        await api.createOrder({
            quote_id: quote.id,
            client_id: quote.client_id,
            total: quote.total,
        })
        load()
    }

    const handleDelete = async (id) => {
        if (confirm('Deseja excluir este orçamento?')) {
            await api.deleteQuote(id)
            load()
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1><FileText size={28} /> Orçamentos</h1>
                <button className="btn btn-primary" onClick={() => navigate('/quotes/new')}><Plus size={16} /> Novo Orçamento</button>
            </div>

            <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
                <div className="search-input-wrapper">
                    <Search size={16} />
                    <input placeholder="Buscar por cliente ou número..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-tabs">
                    {[{ v: 'all', l: 'Todos' }, { v: 'pendente', l: 'Pendentes' }, { v: 'aprovado', l: 'Aprovados' }, { v: 'rejeitado', l: 'Rejeitados' }].map(f => (
                        <button key={f.v} className={`filter-tab ${filter === f.v ? 'active' : ''}`} onClick={() => setFilter(f.v)}>{f.l}</button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: '40vh' }}><div className="loading-spinner"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <FileText size={64} />
                    <h3>Nenhum orçamento encontrado</h3>
                    <p>Crie seu primeiro orçamento</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Cliente</th>
                                <th>Subtotal</th>
                                <th>Desconto</th>
                                <th>Instalação</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(q => (
                                <tr key={q.id}>
                                    <td style={{ fontWeight: 700 }}>#{q.id.toString().padStart(4, '0')}</td>
                                    <td>{q.client_name || 'Sem cliente'}</td>
                                    <td className="font-mono">{formatCurrency(q.subtotal)}</td>
                                    <td className="font-mono text-danger">{q.discount_percent > 0 ? `-${q.discount_percent}%` : '-'}</td>
                                    <td className="font-mono">{formatCurrency(q.installation_total)}</td>
                                    <td className="font-mono" style={{ fontWeight: 700 }}>{formatCurrency(q.total)}</td>
                                    <td><span className={`badge ${getStatusBadge(q.status)}`}><span className="badge-dot"></span>{getStatusLabel(q.status)}</span></td>
                                    <td className="text-muted">{formatDate(q.created_at)}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            {q.status === 'pendente' && (
                                                <>
                                                    <button className="btn btn-ghost btn-sm" title="Aprovar" onClick={() => handleStatusChange(q.id, 'aprovado')}><CheckCircle size={14} style={{ color: 'var(--success)' }} /></button>
                                                    <button className="btn btn-ghost btn-sm" title="Rejeitar" onClick={() => handleStatusChange(q.id, 'rejeitado')}><XCircle size={14} style={{ color: 'var(--danger)' }} /></button>
                                                </>
                                            )}
                                            {q.status === 'aprovado' && (
                                                <button className="btn btn-sm btn-success" onClick={() => handleCreateOrder(q)}><ShoppingBag size={12} /> Pedido</button>
                                            )}
                                            <button className="btn btn-ghost btn-sm" title="Excluir" onClick={() => handleDelete(q.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
