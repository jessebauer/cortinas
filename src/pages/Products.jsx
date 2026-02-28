import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit, Trash2, Blinds, X } from 'lucide-react'
import { api, formatCurrency } from '../lib/api'

const emptyProduct = { name: '', category: 'cortina', description: '', price_per_sqm: '', installation_price: '80', fabric: '', color: '' }
const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'cortina', label: 'Cortinas' },
    { value: 'persiana', label: 'Persianas' },
    { value: 'acessorio', label: 'Acessórios' },
]

export default function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [editProduct, setEditProduct] = useState(null)
    const [form, setForm] = useState(emptyProduct)

    const load = () => {
        api.getProducts().then(p => { setProducts(p); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(load, [])

    const filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.fabric || '').toLowerCase().includes(search.toLowerCase())
        const matchFilter = filter === 'all' || p.category === filter
        return matchSearch && matchFilter
    })

    const openNew = () => { setForm(emptyProduct); setEditProduct(null); setShowModal(true) }
    const openEdit = (p) => { setForm({ ...p, price_per_sqm: p.price_per_sqm.toString(), installation_price: p.installation_price.toString() }); setEditProduct(p); setShowModal(true) }

    const handleSave = async () => {
        const data = { ...form, price_per_sqm: parseFloat(form.price_per_sqm) || 0, installation_price: parseFloat(form.installation_price) || 0 }
        if (editProduct) {
            await api.updateProduct(editProduct.id, data)
        } else {
            await api.createProduct(data)
        }
        setShowModal(false)
        load()
    }

    const handleDelete = async (id) => {
        if (confirm('Deseja realmente excluir este produto?')) {
            await api.deleteProduct(id)
            load()
        }
    }

    const getCategoryLabel = (cat) => categories.find(c => c.value === cat)?.label || cat
    const getCategoryBadge = (cat) => {
        const badges = { cortina: 'badge-purple', persiana: 'badge-info', acessorio: 'badge-warning' }
        return badges[cat] || 'badge-info'
    }

    return (
        <div>
            <div className="page-header">
                <h1><Package size={28} /> Produtos</h1>
                <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Novo Produto</button>
            </div>

            <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
                <div className="search-input-wrapper">
                    <Search size={16} />
                    <input placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-tabs">
                    {categories.map(c => (
                        <button key={c.value} className={`filter-tab ${filter === c.value ? 'active' : ''}`} onClick={() => setFilter(c.value)}>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: '40vh' }}><div className="loading-spinner"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Blinds size={64} />
                    <h3>Nenhum produto encontrado</h3>
                    <p>Comece adicionando seus produtos ao catálogo</p>
                </div>
            ) : (
                <div className="product-grid">
                    {filtered.map(p => (
                        <div className="product-card" key={p.id}>
                            <div className="product-card-image">
                                <Blinds size={48} />
                                <span className="product-card-category">
                                    <span className={`badge ${getCategoryBadge(p.category)}`}>{getCategoryLabel(p.category)}</span>
                                </span>
                            </div>
                            <div className="product-card-body">
                                <h3>{p.name}</h3>
                                <p>{p.description || 'Sem descrição'}</p>
                                {p.fabric && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🧵 {p.fabric} {p.color ? `• ${p.color}` : ''}</div>}
                                <div className="product-card-footer">
                                    <div className="product-price">
                                        {formatCurrency(p.price_per_sqm)} <span>/m²</span>
                                    </div>
                                    <div className="product-card-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit size={14} /></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Nome do Produto</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Cortina Blackout Premium" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Categoria</label>
                                    <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        <option value="cortina">Cortina</option>
                                        <option value="persiana">Persiana</option>
                                        <option value="acessorio">Acessório</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preço por m²</label>
                                    <input className="form-input" type="number" step="0.01" value={form.price_per_sqm} onChange={e => setForm({ ...form, price_per_sqm: e.target.value })} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tecido / Material</label>
                                    <input className="form-input" value={form.fabric} onChange={e => setForm({ ...form, fabric: e.target.value })} placeholder="Ex: Blackout, Voil, Alumínio" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cor</label>
                                    <input className="form-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Ex: Branco, Cinza" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Preço Instalação (por peça)</label>
                                <input className="form-input" type="number" step="0.01" value={form.installation_price} onChange={e => setForm({ ...form, installation_price: e.target.value })} placeholder="80.00" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o produto..." />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!form.name}>{editProduct ? 'Salvar' : 'Criar Produto'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
