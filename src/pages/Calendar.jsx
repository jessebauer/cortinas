import { useState, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { api, formatDate } from '../lib/api'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [installations, setInstallations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ client_name: '', address: '', date: '', time_start: '09:00', time_end: '12:00', installer: '', notes: '' })

    useEffect(() => {
        api.getInstallations().then(i => { setInstallations(i); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const goToday = () => setCurrentDate(new Date())

    const cells = []
    // Previous month filler
    const prevDays = new Date(year, month, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: prevDays - i, otherMonth: true })
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const events = installations.filter(inst => inst.date === dateStr)
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
        cells.push({ day: d, isToday, events, dateStr })
    }
    // Next month filler
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, otherMonth: true })
    }

    const handleSave = async () => {
        await api.createInstallation(form)
        const i = await api.getInstallations()
        setInstallations(i)
        setShowModal(false)
        setForm({ client_name: '', address: '', date: '', time_start: '09:00', time_end: '12:00', installer: '', notes: '' })
    }

    const statusColors = { agendada: 'var(--info)', realizada: 'var(--success)', cancelada: 'var(--danger)' }

    return (
        <div>
            <div className="page-header">
                <h1><CalendarDays size={28} /> Agenda de Instalações</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nova Instalação</button>
            </div>

            <div className="calendar-nav">
                <button className="btn btn-ghost" onClick={prevMonth}><ChevronLeft size={20} /></button>
                <h2>{MONTHS[month]} {year}</h2>
                <button className="btn btn-ghost" onClick={nextMonth}><ChevronRight size={20} /></button>
                <button className="btn btn-secondary btn-sm" onClick={goToday}>Hoje</button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: '40vh' }}><div className="loading-spinner"></div></div>
            ) : (
                <div className="calendar-grid">
                    {DAYS.map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
                    {cells.map((cell, i) => (
                        <div key={i} className={`calendar-cell ${cell.otherMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}`}>
                            <div className="calendar-date">{cell.day}</div>
                            {(cell.events || []).map(ev => (
                                <div key={ev.id} className="calendar-event" style={{ borderLeftColor: statusColors[ev.status] || 'var(--accent-primary)' }}>
                                    {ev.time_start && `${ev.time_start} `}{ev.client_name}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Upcoming installations list */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📋 Próximas Instalações</h3>
                {installations.filter(i => i.status !== 'cancelada').length === 0 ? (
                    <p className="text-muted">Nenhuma instalação agendada</p>
                ) : (
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Endereço</th>
                                    <th>Data</th>
                                    <th>Horário</th>
                                    <th>Instalador</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {installations.filter(i => i.status !== 'cancelada').map(inst => (
                                    <tr key={inst.id}>
                                        <td style={{ fontWeight: 600 }}>{inst.client_name}</td>
                                        <td className="text-muted">{inst.address || '-'}</td>
                                        <td>{formatDate(inst.date)}</td>
                                        <td>{inst.time_start}{inst.time_end ? ` - ${inst.time_end}` : ''}</td>
                                        <td>{inst.installer || '-'}</td>
                                        <td>
                                            <span className={`badge ${inst.status === 'agendada' ? 'badge-info' : inst.status === 'realizada' ? 'badge-success' : 'badge-danger'}`}>
                                                <span className="badge-dot"></span>
                                                {inst.status === 'agendada' ? 'Agendada' : inst.status === 'realizada' ? 'Realizada' : 'Cancelada'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📅 Agendar Instalação</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Nome do Cliente</label>
                                <input className="form-input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Nome do cliente" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Endereço</label>
                                <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Endereço completo" />
                            </div>
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label className="form-label">Data</label>
                                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Início</label>
                                    <input className="form-input" type="time" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fim</label>
                                    <input className="form-input" type="time" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instalador</label>
                                <input className="form-input" value={form.installer} onChange={e => setForm({ ...form, installer: e.target.value })} placeholder="Nome do instalador" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Observações</label>
                                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas..." />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!form.client_name || !form.date}>Agendar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
