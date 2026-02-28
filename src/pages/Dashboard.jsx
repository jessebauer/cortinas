import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, FileText, DollarSign, TrendingUp, ClipboardList, MessageCircle, ShoppingBag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { api, formatCurrency, formatDate, getStatusLabel, getStatusBadge } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        api.getDashboard()
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="flex items-center justify-center" style={{ height: '50vh' }}><div className="loading-spinner"></div></div>
    if (!data) return <p>Erro ao carregar dados.</p>

    const chartData = (data.monthlyRevenue || []).map(m => ({
        name: m.month?.substring(5) || '',
        receita: m.revenue || 0,
        orcamentos: m.quotes_count || 0,
    }))

    return (
        <div>
            <div className="page-header">
                <h1><LayoutDashboard size={28} /> Dashboard</h1>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Visão geral do negócio</span>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card" onClick={() => navigate('/quotes')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-header">
                        <div className="kpi-icon blue"><FileText size={20} /></div>
                        <span className="kpi-label">Orçamentos</span>
                    </div>
                    <div className="kpi-value">{data.totalQuotes}</div>
                    <div className="kpi-change">{data.pendingQuotes} pendentes</div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/reports')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-header">
                        <div className="kpi-icon green"><DollarSign size={20} /></div>
                        <span className="kpi-label">Faturamento</span>
                    </div>
                    <div className="kpi-value text-success">{formatCurrency(data.totalRevenue)}</div>
                    <div className="kpi-change">Total aprovado</div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-header">
                        <div className="kpi-icon purple"><Users size={20} /></div>
                        <span className="kpi-label">Clientes</span>
                    </div>
                    <div className="kpi-value">{data.totalClients}</div>
                    <div className="kpi-change">cadastrados</div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon yellow"><TrendingUp size={20} /></div>
                        <span className="kpi-label">Conversão</span>
                    </div>
                    <div className="kpi-value">{data.conversionRate}%</div>
                    <div className="kpi-change">orç. aprovados</div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-header">
                        <div className="kpi-icon blue"><ClipboardList size={20} /></div>
                        <span className="kpi-label">Pedidos</span>
                    </div>
                    <div className="kpi-value">{data.totalOrders}</div>
                    <div className="kpi-change">em andamento</div>
                </div>

                <div className="kpi-card" onClick={() => navigate('/whatsapp')} style={{ cursor: 'pointer' }}>
                    <div className="kpi-header">
                        <div className="kpi-icon whatsapp"><MessageCircle size={20} /></div>
                        <span className="kpi-label">WhatsApp</span>
                    </div>
                    <div className="kpi-value">{data.unreadMessages}</div>
                    <div className="kpi-change">mensagens não lidas</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>📈 Receita Mensal</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ background: '#1a2035', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                                formatter={(value) => [formatCurrency(value), 'Receita']}
                            />
                            <Area type="monotone" dataKey="receita" stroke="#6366f1" fill="url(#colorReceita)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3>📊 Orçamentos por Mês</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: '#1a2035', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                            />
                            <Bar dataKey="orcamentos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orçamentos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <div className="chart-header">
                    <h3>📋 Orçamentos Recentes</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/quotes')}>Ver Todos</button>
                </div>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.recentQuotes || []).map(q => (
                                <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/quotes')}>
                                    <td style={{ fontWeight: 600 }}>#{q.id.toString().padStart(4, '0')}</td>
                                    <td>{q.client_name || 'Sem cliente'}</td>
                                    <td className="font-mono" style={{ fontWeight: 600 }}>{formatCurrency(q.total)}</td>
                                    <td><span className={`badge ${getStatusBadge(q.status)}`}><span className="badge-dot"></span>{getStatusLabel(q.status)}</span></td>
                                    <td className="text-muted">{formatDate(q.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
