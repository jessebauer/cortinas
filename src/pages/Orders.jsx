import { useState, useEffect } from 'react'
import { ClipboardList, Clock, Wrench, Truck, CheckCircle2 } from 'lucide-react'
import { api, formatCurrency, formatDate, getStatusLabel } from '../lib/api'

const statusColumns = [
    { key: 'aguardando', label: 'Aguardando', icon: Clock },
    { key: 'em_producao', label: 'Em Produção', icon: Wrench },
    { key: 'instalacao', label: 'Instalação', icon: Truck },
    { key: 'concluido', label: 'Concluído', icon: CheckCircle2 },
]

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const load = () => {
        api.getOrders().then(o => { setOrders(o); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(load, [])

    const handleStatusChange = async (id, newStatus) => {
        await api.updateOrderStatus(id, newStatus)
        load()
    }

    const getNextStatus = (current) => {
        const idx = statusColumns.findIndex(s => s.key === current)
        return idx < statusColumns.length - 1 ? statusColumns[idx + 1].key : null
    }

    if (loading) return <div className="flex items-center justify-center" style={{ height: '50vh' }}><div className="loading-spinner"></div></div>

    return (
        <div>
            <div className="page-header">
                <h1><ClipboardList size={28} /> Pedidos</h1>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{orders.length} pedidos no total</span>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <ClipboardList size={64} />
                    <h3>Nenhum pedido ainda</h3>
                    <p>Pedidos são criados a partir de orçamentos aprovados</p>
                </div>
            ) : (
                <div className="pipeline-grid">
                    {statusColumns.map(col => {
                        const Icon = col.icon
                        const colOrders = orders.filter(o => o.status === col.key)
                        return (
                            <div className="pipeline-column" key={col.key}>
                                <div className="pipeline-column-header">
                                    <Icon size={16} />
                                    {col.label}
                                    <span className="count">{colOrders.length}</span>
                                </div>
                                {colOrders.map(order => {
                                    const next = getNextStatus(order.status)
                                    return (
                                        <div className="pipeline-card" key={order.id} onClick={() => next && handleStatusChange(order.id, next)}>
                                            <h4>Pedido #{order.id.toString().padStart(4, '0')}</h4>
                                            <p>{order.client_name || 'Cliente'}</p>
                                            <div className="pipeline-card-footer">
                                                <span>{formatDate(order.created_at)}</span>
                                                <strong>{formatCurrency(order.total)}</strong>
                                            </div>
                                            {next && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--accent-primary)', textAlign: 'center' }}>
                                                    Clique para mover → {getStatusLabel(next)}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {colOrders.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        Nenhum pedido
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
