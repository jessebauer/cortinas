import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, ArrowLeft, Download, Blinds } from 'lucide-react'
import { api, formatCurrency } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function NewQuote() {
    const [clients, setClients] = useState([])
    const [products, setProducts] = useState([])
    const [selectedClient, setSelectedClient] = useState('')
    const [items, setItems] = useState([])
    const [discount, setDiscount] = useState(0)
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        Promise.all([api.getClients(), api.getProducts()])
            .then(([c, p]) => { setClients(c); setProducts(p) })
    }, [])

    const addItem = () => {
        setItems([...items, { product_id: '', product_name: '', width: '', height: '', quantity: 1, unit_price: 0, installation_price: 0, subtotal: 0, room: '' }])
    }

    const updateItem = (index, field, value) => {
        const newItems = [...items]
        newItems[index][field] = value

        if (field === 'product_id') {
            const product = products.find(p => p.id === parseInt(value))
            if (product) {
                newItems[index].product_name = product.name
                newItems[index].installation_price = product.installation_price
                recalcItem(newItems, index, product.price_per_sqm)
            }
        } else if (field === 'width' || field === 'height' || field === 'quantity') {
            const product = products.find(p => p.id === parseInt(newItems[index].product_id))
            if (product) {
                recalcItem(newItems, index, product.price_per_sqm)
            }
        }

        setItems(newItems)
    }

    const recalcItem = (itemsArr, index, pricePerSqm) => {
        const item = itemsArr[index]
        const w = parseFloat(item.width) || 0
        const h = parseFloat(item.height) || 0
        const qty = parseInt(item.quantity) || 1
        const area = w * h
        item.unit_price = area * pricePerSqm
        item.subtotal = item.unit_price * qty
    }

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const installationTotal = items.reduce((sum, item) => sum + ((item.installation_price || 0) * (parseInt(item.quantity) || 1)), 0)
    const discountValue = subtotal * (discount / 100)
    const total = subtotal - discountValue + installationTotal

    const handleSave = async () => {
        if (!selectedClient || items.length === 0) return
        setSaving(true)
        try {
            await api.createQuote({
                client_id: parseInt(selectedClient),
                items: items.map(i => ({
                    ...i,
                    width: parseFloat(i.width),
                    height: parseFloat(i.height),
                    quantity: parseInt(i.quantity),
                })),
                discount_percent: discount,
                notes,
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            })
            navigate('/quotes')
        } catch (e) {
            alert('Erro ao salvar orçamento')
        }
        setSaving(false)
    }

    const handleGeneratePDF = async () => {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()
        const client = clients.find(c => c.id === parseInt(selectedClient))

        // Header
        doc.setFillColor(99, 102, 241)
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('ORÇAMENTO', 20, 20)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('CortinaApp - Cortinas e Persianas', 20, 30)
        doc.text(new Date().toLocaleDateString('pt-BR'), 170, 20)

        // Client
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('CLIENTE', 20, 55)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        if (client) {
            doc.text(client.name, 20, 63)
            if (client.phone) doc.text(`Tel: ${client.phone}`, 20, 70)
            if (client.email) doc.text(`Email: ${client.email}`, 20, 77)
            if (client.address) doc.text(`End: ${client.address}${client.city ? ` - ${client.city}` : ''}`, 20, 84)
        }

        // Items table header
        let y = 100
        doc.setFillColor(240, 240, 250)
        doc.rect(20, y - 6, 170, 10, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text('PRODUTO', 22, y)
        doc.text('MEDIDAS', 90, y)
        doc.text('QTD', 120, y)
        doc.text('UNIT.', 138, y)
        doc.text('SUBTOTAL', 160, y)
        y += 8

        // Items
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        items.forEach(item => {
            doc.text(item.product_name || '-', 22, y)
            doc.text(`${item.width}m × ${item.height}m`, 90, y)
            doc.text(String(item.quantity), 122, y)
            doc.text(formatCurrency(item.unit_price), 135, y)
            doc.text(formatCurrency(item.subtotal), 160, y)
            y += 8
        })

        // Totals
        y += 10
        doc.setDrawColor(200, 200, 200)
        doc.line(120, y - 5, 190, y - 5)
        doc.setFontSize(10)
        doc.text('Subtotal:', 120, y)
        doc.text(formatCurrency(subtotal), 160, y)
        y += 7
        if (discount > 0) {
            doc.setTextColor(220, 50, 50)
            doc.text(`Desconto (${discount}%):`, 120, y)
            doc.text(`-${formatCurrency(discountValue)}`, 160, y)
            doc.setTextColor(0, 0, 0)
            y += 7
        }
        doc.text('Instalação:', 120, y)
        doc.text(formatCurrency(installationTotal), 160, y)
        y += 10
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(16, 185, 129)
        doc.text('TOTAL:', 120, y)
        doc.text(formatCurrency(total), 157, y)

        // Footer
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('Orçamento válido por 30 dias. Sujeito a confirmação de estoque.', 20, 270)
        doc.text('CortinaApp © 2026', 20, 277)

        doc.save(`orcamento_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    return (
        <div>
            <div className="page-header">
                <h1>
                    <button className="btn btn-ghost" onClick={() => navigate('/quotes')}><ArrowLeft size={20} /></button>
                    <FileText size={28} /> Novo Orçamento
                </h1>
                <div className="flex gap-1">
                    <button className="btn btn-secondary" onClick={handleGeneratePDF} disabled={items.length === 0}><Download size={16} /> Gerar PDF</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!selectedClient || items.length === 0 || saving}>
                        {saving ? 'Salvando...' : '💾 Salvar Orçamento'}
                    </button>
                </div>
            </div>

            <div className="quote-builder">
                <div>
                    {/* Client Selection */}
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>👤 Cliente</h3>
                        <select className="form-select" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                            <option value="">Selecione um cliente...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                        </select>
                    </div>

                    {/* Items */}
                    <div className="card">
                        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                            <h3>📦 Itens do Orçamento</h3>
                            <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={14} /> Adicionar Item</button>
                        </div>

                        {items.length === 0 ? (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <Blinds size={48} />
                                <h3>Nenhum item adicionado</h3>
                                <p>Clique em "Adicionar Item" para começar</p>
                            </div>
                        ) : (
                            <div className="quote-items-list">
                                {items.map((item, index) => (
                                    <div className="quote-item-card" key={index}>
                                        <div className="item-info" style={{ flex: 1 }}>
                                            <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Produto</label>
                                                    <select className="form-select" value={item.product_id} onChange={e => updateItem(index, 'product_id', e.target.value)}>
                                                        <option value="">Selecione...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price_per_sqm)}/m²</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Ambiente</label>
                                                    <input className="form-input" value={item.room} onChange={e => updateItem(index, 'room', e.target.value)} placeholder="Ex: Sala, Quarto" />
                                                </div>
                                            </div>
                                            <div className="form-row-3">
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Largura (m)</label>
                                                    <input className="form-input" type="number" step="0.01" value={item.width} onChange={e => updateItem(index, 'width', e.target.value)} placeholder="0.00" />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Altura (m)</label>
                                                    <input className="form-input" type="number" step="0.01" value={item.height} onChange={e => updateItem(index, 'height', e.target.value)} placeholder="0.00" />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Quantidade</label>
                                                    <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                                                </div>
                                            </div>
                                            {item.subtotal > 0 && (
                                                <div className="item-measures" style={{ marginTop: '0.5rem' }}>
                                                    <span>📐 Área: {((parseFloat(item.width) || 0) * (parseFloat(item.height) || 0)).toFixed(2)} m²</span>
                                                    <span>💰 Subtotal: <strong className="text-success">{formatCurrency(item.subtotal)}</strong></span>
                                                    <span>🔧 Instalação: {formatCurrency(item.installation_price * (parseInt(item.quantity) || 1))}</span>
                                                </div>
                                            )}
                                        </div>
                                        <button className="btn btn-danger btn-sm" onClick={() => removeItem(index)}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="quote-summary">
                    <h3>📋 Resumo</h3>
                    {selectedClient && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            👤 {clients.find(c => c.id === parseInt(selectedClient))?.name}
                        </div>
                    )}
                    <div className="quote-summary-row">
                        <span>Subtotal ({items.length} itens)</span>
                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="quote-summary-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Desconto</span>
                            <input className="form-input" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} />
                            <span>%</span>
                        </div>
                        <span className="font-mono text-danger">{discount > 0 ? `-${formatCurrency(discountValue)}` : '-'}</span>
                    </div>
                    <div className="quote-summary-row">
                        <span>Instalação</span>
                        <span className="font-mono">{formatCurrency(installationTotal)}</span>
                    </div>
                    <div className="quote-summary-row total">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Observações</label>
                        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..." style={{ minHeight: '60px' }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
