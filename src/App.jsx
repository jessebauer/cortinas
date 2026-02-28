import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Clients from './pages/Clients'
import Quotes from './pages/Quotes'
import NewQuote from './pages/NewQuote'
import Orders from './pages/Orders'
import WhatsApp from './pages/WhatsApp'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'

export default function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/quotes" element={<Quotes />} />
                    <Route path="/quotes/new" element={<NewQuote />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/whatsapp" element={<WhatsApp />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/reports" element={<Reports />} />
                </Routes>
            </main>
        </div>
    )
}
