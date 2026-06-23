'use client'
import { useState, useRef, useEffect } from 'react'
import api from '@/utils/api'

interface Props { context: any }

export default function AIChat({ context }: Props) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const send = async () => {
    if (!input.trim()) return
    const newMsg = { role: 'user', content: input }
    const newMessages = [...messages, newMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chat', {
        messages: newMessages,
        context: context
      })
      
      let replyText = res.data.reply
      
      // Look for [ACTION: {...}]
      const actionMatch = replyText.match(/\[ACTION:\s*({[\s\S]*?})\s*\]/i);
      if (actionMatch) {
         try {
             const actionJson = JSON.parse(actionMatch[1]);
             // Dispatch event to reach MolstarViewer
             window.dispatchEvent(new CustomEvent('molstar-action', { detail: actionJson }));
             // Remove the action block from chat
             replyText = replyText.replace(actionMatch[0], '').trim();
         } catch(e) {
             console.error("Failed to parse AI action code", e);
         }
      }
      
      setMessages([...newMessages, { role: 'assistant', content: replyText }])
    } catch(e: any) {
      const errMsg = e.response?.data?.detail || 'Connection error contacting AI engine.'
      setMessages([...newMessages, { role: 'assistant', content: errMsg }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', height: 600, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>🧠</span> BetaFold AI Assistant
      </div>
      
      <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>
            Ask me anything about this protein's structure, stability, or predicted functions!
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            padding: '12px 16px', borderRadius: 8, maxWidth: '80%',
            color: m.role === 'user' ? 'white' : 'var(--text)',
            lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-wrap'
          }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: 'var(--muted)', fontSize: 13, alignSelf: 'flex-start' }}>AI is thinking...</div>}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
        <input 
          value={input} onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask a question about this protein analysis..."
          style={{ flex: 1, padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text)', outline: 'none' }}
        />
        <button className="btn-primary" onClick={send} disabled={loading} style={{ padding: '0 24px' }}>Send</button>
      </div>
    </div>
  )
}
