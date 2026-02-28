import { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, X, MessageCircle } from 'lucide-react'
import { api, formatDate } from '../lib/api'
import { useNavigate } from 'react-router-dom'

const emptyClient = { name: '', email: '', phone: '', whatsapp: '', address: '', city: '', notes: '', source: 'manual' }

export default function Clients() {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editClient, setEditClient] = useState(null)
    const [form, setForm] = useState(emptyClient)
    const navigate = useNavigate()

    const load = () => {
        api.getClients().then(c => { setClients(c); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(load, [])

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(search.toLowerCase())
    )

    const openNew = () => { setForm(emptyClient); setEditClient(null); setShowModal(true) }
    const openEdit = (c) => { setForm({ ...c }); setEditClient(c); setShowModal(true) }

    const handleSave = async () => {
        if (editClient) {
            await api.updateClient(editClient.id, form)
        } else {
            await api.createClient(form)
        }
        setShowModal(false)
        load()
    }

    const handleDelete = async (id) => {
        if (confirm('Deseja realmente excluir este cliente?')) {
            await api.deleteClient(id)
            load()
        }
    }

    const getSourceBadge = (source) => {
        const badges = { whatsapp: 'badge-success', manual: 'badge-info', indicação: 'badge-purple', site: 'badge-warning' }
        const labels = { whatsapp: 'WhatsApp', manual: 'Manual', indicação: 'Indicação', site: 'Site' }
        return { badge: badges[source] || 'badge-info', label: labels[source] || source }
    }

    return (
        <div>
            <div className="page-header">
                <h1><Users size={28} /> Clientes</h1>
                <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Novo Cliente</button>
            </div>

            <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
                <div className="search-input-wrapper">
                    <Search size={16} />
                    <input placeholder="Buscar por nome, telefone, email ou cidade..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: '40vh' }}><div className="loading-spinner"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Users size={64} />
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Adicione seus clientes para começar</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Contato</th>
                                <th>Cidade</th>
                                <th>Origem</th>
                                <th>Desde</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => {
                                const src = getSourceBadge(c.source)
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                                            {c.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}><MapPin size={11} /> {c.address}</div>}
                                        </td>
                                        <td>
                                            {c.phone && <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Phone size={12} /> {c.phone}</div>}
                                            {c.email && <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}><Mail size={12} /> {c.email}</div>}
                                        </td>
                                        <td className="text-muted">{c.city || '-'}</td>
                                        <td><span className={`badge ${src.badge}`}>{src.label}</span></td>
                                        <td className="text-muted">{formatDate(c.created_at)}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-ghost btn-sm" title="Enviar WhatsApp" onClick={() => navigate('/whatsapp')}><MessageCircle size={14} /></button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit size={14} /></button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editClient ? '✏️ Editar Cliente' : '👤 Novo Cliente'}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Nome Completo</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Telefone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">WhatsApp</label>
                                    <input className="form-input" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Endereço</label>
                                    <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rua, número" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cidade</label>
                                    <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Cidade" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Origem</label>
                                <select className="form-select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                                    <option value="manual">Manual</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="indicação">Indicação</option>
                                    <option value="site">Site</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Observações</label>
                                <textarea className="form-textarea" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Anotações sobre o cliente..." />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!form.name}>{editClient ? 'Salvar' : 'Cadastrar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
