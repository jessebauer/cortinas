import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Bot, Search, Zap } from 'lucide-react'
import { api, formatDateTime } from '../lib/api'

export default function WhatsApp() {
    const [conversations, setConversations] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [templates, setTemplates] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        loadConversations()
        api.getTemplates().then(setTemplates).catch(() => { })
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConversations = () => {
        api.getConversations().then(setConversations).catch(() => { })
    }

    const openChat = async (conv) => {
        setActiveChat(conv)
        const msgs = await api.getMessages(conv.client_id)
        setMessages(msgs)
        loadConversations() // refresh unread counts
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return
        setSending(true)

        // Save outgoing message
        await api.sendMessage({
            client_id: activeChat.client_id,
            client_name: activeChat.client_name,
            client_phone: activeChat.client_phone,
            content: newMessage,
            direction: 'outgoing',
            is_bot: 0,
        })

        setNewMessage('')
        const msgs = await api.getMessages(activeChat.client_id)
        setMessages(msgs)
        setSending(false)
    }

    const simulateIncoming = async (text) => {
        if (!activeChat) return
        setSending(true)

        // Save incoming message
        await api.sendMessage({
            client_id: activeChat.client_id,
            client_name: activeChat.client_name,
            client_phone: activeChat.client_phone,
            content: text,
            direction: 'incoming',
            is_bot: 0,
        })

        // Get bot auto-reply
        await api.getBotReply({
            client_id: activeChat.client_id,
            client_name: activeChat.client_name,
            client_phone: activeChat.client_phone,
            message: text,
        })

        const msgs = await api.getMessages(activeChat.client_id)
        setMessages(msgs)
        loadConversations()
        setSending(false)
    }

    const useTemplate = (template) => {
        setNewMessage(template.content)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const getInitials = (name) => {
        return (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    }

    const filteredConversations = conversations.filter(c =>
        (c.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.client_phone || '').includes(searchTerm)
    )

    const formatChatTime = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        return isToday ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    return (
        <div>
            <div className="page-header">
                <h1><MessageCircle size={28} /> WhatsApp Manager</h1>
                <div className="flex gap-1">
                    <span className="badge badge-success"><Bot size={12} /> Bot Ativo</span>
                </div>
            </div>

            <div className="whatsapp-layout">
                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <div style={{ width: 32, height: 32, background: 'var(--whatsapp)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={16} color="white" />
                        </div>
                        <h3>Conversas</h3>
                    </div>
                    <div className="chat-search">
                        <input placeholder="Buscar conversa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="chat-list">
                        {filteredConversations.map(conv => (
                            <div
                                key={conv.client_id}
                                className={`chat-item ${activeChat?.client_id === conv.client_id ? 'active' : ''}`}
                                onClick={() => openChat(conv)}
                            >
                                <div className="chat-avatar">{getInitials(conv.client_name)}</div>
                                <div className="chat-item-info">
                                    <h4>{conv.client_name}</h4>
                                    <p>{conv.last_message}</p>
                                </div>
                                <div className="chat-item-meta">
                                    <span className="chat-item-time">{formatChatTime(conv.last_message_at)}</span>
                                    {conv.unread_count > 0 && <span className="chat-unread">{conv.unread_count}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Main */}
                {activeChat ? (
                    <div className="chat-main">
                        <div className="chat-main-header">
                            <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>{getInitials(activeChat.client_name)}</div>
                            <div>
                                <h3>{activeChat.client_name}</h3>
                                <span>{activeChat.client_phone}</span>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message-bubble ${msg.direction === 'incoming' ? 'message-incoming' : 'message-outgoing'}`}>
                                    {msg.is_bot === 1 && msg.direction === 'outgoing' && (
                                        <span className="message-bot-tag">🤖 Bot</span>
                                    )}
                                    {msg.content}
                                    <div className="message-time">{formatChatTime(msg.created_at)}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Templates */}
                        <div className="chat-templates">
                            <h4>⚡ Respostas Rápidas</h4>
                            <div className="template-chips">
                                {templates.map(t => (
                                    <button key={t.id} className="template-chip" onClick={() => useTemplate(t)}>
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Simulate incoming messages */}
                        <div style={{ padding: '0.5rem 1.25rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Bot size={12} /> Simular mensagem do cliente (para testar o bot):
                            </div>
                            <div className="template-chips">
                                {['Olá, boa tarde!', 'Quero um orçamento', 'Vocês têm cortinas?', 'Fazem instalação?', 'Quero agendar visita', 'Quais formas de pagamento?', 'Obrigada!'].map(txt => (
                                    <button key={txt} className="template-chip" onClick={() => simulateIncoming(txt)} disabled={sending}>
                                        {txt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Digite uma mensagem..."
                                disabled={sending}
                            />
                            <button className="chat-send-btn" onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="chat-main">
                        <div className="chat-empty">
                            <MessageCircle size={64} />
                            <h3>Selecione uma conversa</h3>
                            <p>Escolha um contato para iniciar o atendimento</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
