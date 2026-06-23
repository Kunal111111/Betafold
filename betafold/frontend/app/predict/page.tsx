'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import api from '@/utils/api'

const EXAMPLE = 'MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGEDEDTIEDAVEEGEHHHHHH'

export default function Predict() {
  const [sequence, setSequence] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    setOcrLoading(true)
    try {
      const res = await api.post('/jobs/ocr', formData)
      if (res.data.sequence) {
        setSequence(res.data.sequence)
        toast.success("Sequence extracted successfully from image!")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to extract text from image")
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const submit = async () => {
    const clean = sequence.replace(/\s/g, '').toUpperCase()
    if (!clean) { toast.error('Enter a protein sequence'); return }
    if (!/^[ACDEFGHIKLMNPQRSTVWY]+$/.test(clean)) { toast.error('Invalid amino acid sequence'); return }
    if (clean.length < 10) { toast.error('Sequence too short (min 10 residues)'); return }

    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await api.post('/jobs/submit', { sequence: clean })
      toast.success('Analysis started!')
      router.push(`/results/${res.data.job_id}`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Submission failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          🧬 BetaFold
        </Link>
        <Link href="/dashboard"><button className="btn-secondary">← Dashboard</button></Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '50px 20px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>New Protein Analysis</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Paste your amino acid sequence below. Single-letter codes only.</p>

        <div className="glass" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontWeight: 600 }}>Protein Sequence</label>
            <div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={ocrLoading}
                className="btn-secondary"
                style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border)' }}>
                {ocrLoading ? '⏳ Scanning...' : '📷 OCR Scan Image'}
              </button>
            </div>
          </div>
          <textarea value={sequence} onChange={e => setSequence(e.target.value)}
            placeholder="Enter amino acid sequence (e.g. MKTAYIAKQR...)"
            rows={8}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontSize: 14, fontFamily: 'monospace', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              {sequence.replace(/\s/g,'').length} residues
            </span>
            <button onClick={() => setSequence(EXAMPLE)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Load example sequence
            </button>
          </div>

          <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(99,102,241,0.1)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              ✅ Valid amino acids: A C D E F G H I K L M N P Q R S T V W Y<br/>
              ✅ FASTA format supported (header line starting with {'>'} is ignored)<br/>
              ⚠ Max recommended: 1000 residues for fast results
            </p>
          </div>

          <button className="btn-primary" onClick={submit} disabled={loading}
            style={{ width: '100%', marginTop: 24, padding: '14px', fontSize: 16 }}>
            {loading ? '⏳ Submitting analysis...' : '🚀 Analyze Protein'}
          </button>
        </div>
      </div>
    </div>
  )
}