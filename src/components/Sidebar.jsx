import { useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Package, Users, FileText, ClipboardList,
    MessageCircle, CalendarDays, BarChart3, Blinds
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
    { section: 'Principal' },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, badgeType: 'whatsapp' },
    { section: 'Comercial' },
    { path: '/quotes', label: 'Orçamentos', icon: FileText },
    { path: '/orders', label: 'Pedidos', icon: ClipboardList, hideOnMobile: true },
    { path: '/clients', label: 'Clientes', icon: Users },
    { section: 'Catálogo' },
    { path: '/products', label: 'Produtos', icon: Package },
    { section: 'Gestão' },
    { path: '/calendar', label: 'Agenda', icon: CalendarDays, hideOnMobile: true },
    { path: '/reports', label: 'Relatórios', icon: BarChart3, hideOnMobile: true },
]

export default function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [unreadMessages, setUnreadMessages] = useState(0)

    useEffect(() => {
        fetch('/api/dashboard')
            .then(r => r.json())
            .then(data => setUnreadMessages(data.unreadMessages || 0))
            .catch(() => { })

        const interval = setInterval(() => {
            fetch('/api/dashboard')
                .then(r => r.json())
                .then(data => setUnreadMessages(data.unreadMessages || 0))
                .catch(() => { })
        }, 10000)

        return () => clearInterval(interval)
    }, [])

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Blinds size={22} />
                    </div>
                    <div className="sidebar-logo-text">
                        <h2>CortinaApp</h2>
                        <span>Gestão Inteligente</span>
                    </div>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item, i) => {
                    if (item.section) {
                        return <div key={i} className="sidebar-section-title">{item.section}</div>
                    }
                    const Icon = item.icon
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path))
                    return (
                        <div
                            key={item.path}
                            className={`sidebar-link ${isActive ? 'active' : ''} ${item.hideOnMobile ? 'hide-on-mobile' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                            {item.badgeType === 'whatsapp' && unreadMessages > 0 && (
                                <span className="sidebar-badge whatsapp">{unreadMessages}</span>
                            )}
                        </div>
                    )
                })}
            </nav>
        </aside>
    )
}
