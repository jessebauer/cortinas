import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, TrendingUp, FileText, Users, ShoppingBag } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { api, formatCurrency } from '../lib/api'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function Reports() {
    const [data, setData] = useState(null)
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([api.getDashboard(), api.getQuotes()])
            .then(([d, q]) => { setData(d); setQuotes(q); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="flex items-center justify-center" style={{ height: '50vh' }}><div className="loading-spinner"></div></div>
    if (!data) return <p>Erro ao carregar dados.</p>

    // Quote status distribution
    const statusData = [
        { name: 'Pendentes', value: quotes.filter(q => q.status === 'pendente').length, color: '#f59e0b' },
        { name: 'Aprovados', value: quotes.filter(q => q.status === 'aprovado').length, color: '#10b981' },
        { name: 'Rejeitados', value: quotes.filter(q => q.status === 'rejeitado').length, color: '#ef4444' },
    ].filter(d => d.value > 0)

    // Revenue data
    const chartData = (data.monthlyRevenue || []).map(m => ({
        name: m.month?.substring(5) || '',
        receita: m.revenue || 0,
        orcamentos: m.quotes_count || 0,
    }))

    // Totals
    const totalApproved = quotes.filter(q => q.status === 'aprovado').reduce((s, q) => s + q.total, 0)
    const totalPending = quotes.filter(q => q.status === 'pendente').reduce((s, q) => s + q.total, 0)
    const avgTicket = data.approvedQuotes > 0 ? totalApproved / data.approvedQuotes : 0

    return (
        <div>
            <div className="page-header">
                <h1><BarChart3 size={28} /> Relatórios</h1>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon green"><DollarSign size={20} /></div>
                        <span className="kpi-label">Receita Total</span>
                    </div>
                    <div className="kpi-value text-success">{formatCurrency(totalApproved)}</div>
                    <div className="kpi-change">de orçamentos aprovados</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon yellow"><FileText size={20} /></div>
                        <span className="kpi-label">Em Negociação</span>
                    </div>
                    <div className="kpi-value text-warning">{formatCurrency(totalPending)}</div>
                    <div className="kpi-change">{data.pendingQuotes} orçamentos pendentes</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon purple"><TrendingUp size={20} /></div>
                        <span className="kpi-label">Ticket Médio</span>
                    </div>
                    <div className="kpi-value">{formatCurrency(avgTicket)}</div>
                    <div className="kpi-change">por orçamento aprovado</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-header">
                        <div className="kpi-icon blue"><ShoppingBag size={20} /></div>
                        <span className="kpi-label">Taxa de Conversão</span>
                    </div>
                    <div className="kpi-value">{data.conversionRate}%</div>
                    <div className="kpi-change">{data.approvedQuotes} de {data.totalQuotes} orçamentos</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>📊 Receita por Mês</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ background: '#1a2035', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                                formatter={(value, name) => [name === 'receita' ? formatCurrency(value) : value, name === 'receita' ? 'Receita' : 'Orçamentos']}
                            />
                            <Legend />
                            <Bar dataKey="receita" fill="#6366f1" radius={[4, 4, 0, 0]} name="Receita" />
                            <Bar dataKey="orcamentos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orçamentos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <div className="chart-header">
                        <h3>📈 Distribuição de Orçamentos</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1a2035', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-between" style={{ padding: '0 1rem', marginTop: '0.5rem' }}>
                        {statusData.map(d => (
                            <div key={d.name} className="flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></div>
                                <span className="text-muted">{d.name}: {d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary table */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📋 Resumo Geral</h3>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Métrica</th>
                                <th className="text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Total de Clientes</td><td className="text-right font-mono" style={{ fontWeight: 600 }}>{data.totalClients}</td></tr>
                            <tr><td>Total de Produtos Ativos</td><td className="text-right font-mono" style={{ fontWeight: 600 }}>{data.totalProducts}</td></tr>
                            <tr><td>Total de Orçamentos</td><td className="text-right font-mono" style={{ fontWeight: 600 }}>{data.totalQuotes}</td></tr>
                            <tr><td>Orçamentos Aprovados</td><td className="text-right font-mono text-success" style={{ fontWeight: 600 }}>{data.approvedQuotes}</td></tr>
                            <tr><td>Orçamentos Pendentes</td><td className="text-right font-mono text-warning" style={{ fontWeight: 600 }}>{data.pendingQuotes}</td></tr>
                            <tr><td>Total de Pedidos</td><td className="text-right font-mono" style={{ fontWeight: 600 }}>{data.totalOrders}</td></tr>
                            <tr><td>Receita Total (Aprovados)</td><td className="text-right font-mono text-success" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(totalApproved)}</td></tr>
                            <tr><td>Ticket Médio</td><td className="text-right font-mono" style={{ fontWeight: 600 }}>{formatCurrency(avgTicket)}</td></tr>
                            <tr><td>Taxa de Conversão</td><td className="text-right font-mono" style={{ fontWeight: 600 }}>{data.conversionRate}%</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
