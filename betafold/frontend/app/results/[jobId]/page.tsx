'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import SecondaryStructureViewer from '@/components/SecondaryStructureViewer'
import AnalysisPanel from '@/components/AnalysisPanel'
import MutationPanel from '@/components/MutationPanel'
import MolstarViewer from '@/components/MolstarViewer'
import AIChat from '@/components/AIChat'

export default function Results() {
  const { jobId } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'2d'|'3d'|'analysis'|'chat'|'mutations'|'metadata'>('2d')
  const [showCopilot, setShowCopilot] = useState(false)
  const pollRef = useRef<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchJob(token)
  }, [jobId])

  const fetchJob = async (token?: string) => {
    const t = token || localStorage.getItem('token')
    try {
      const res = await api.get(`/jobs/${jobId}`)
      setJob(res.data)
      if (res.data.status === 'pending' || res.data.status === 'processing') {
        pollRef.current = setTimeout(() => fetchJob(), 3000)
      }
    } catch { toast.error('Failed to load results') }
    finally { setLoading(false) }
  }

  useEffect(() => () => clearTimeout(pollRef.current), [])

  const tabs = [
    { id: '2d', label: '🧬 2D Structure' },
    { id: '3d', label: '🌐 3D Structure' },
    { id: 'analysis', label: '🧠 AI Insights' },
    { id: 'chat', label: '💬 AI Chat' },
    { id: 'mutations', label: '🔧 Mutations' },
    { id: 'metadata', label: '📋 Metadata' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Loading analysis...</p>
      </div>
    </div>
  )

  if (!job) return <div style={{ padding: 40, color: 'var(--muted)' }}>Job not found.</div>

  const isPending = job.status === 'pending' || job.status === 'processing'

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          🧬 BetaFold
        </Link>
        <Link href="/dashboard"><button className="btn-secondary">← Dashboard</button></Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Results — Job {String(jobId).slice(0,8)}...</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace', fontSize: 13 }}>
            {job.sequence?.slice(0,60)}{job.sequence?.length > 60 ? '...' : ''}
          </p>
        </div>

        {isPending ? (
          <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
            <h2 style={{ marginBottom: 8 }}>Analysis in progress...</h2>
            <p style={{ color: 'var(--muted)' }}>Status: <strong style={{ color: '#f59e0b' }}>{job.status}</strong></p>
            <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>This page auto-refreshes every 3 seconds</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 4, paddingBottom: 0 }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', color: activeTab === t.id ? 'var(--accent)' : 'var(--muted)', borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === t.id ? 600 : 400, fontSize: 14, transition: 'all 0.2s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {activeTab === '3d' && (
                <button 
                  onClick={() => setShowCopilot(!showCopilot)} 
                  className={showCopilot ? 'btn-secondary' : 'btn-primary'}
                  style={{ marginBottom: 12, padding: '8px 16px', borderRadius: 8, fontSize: 14 }}
                >
                  {showCopilot ? 'Hide AI Support' : '✨ Enable AI Support'}
                </button>
              )}
            </div>

            {/* Tab content */}
            {activeTab === '2d' && <SecondaryStructureViewer data={job.analysis} sequence={job.sequence} />}
            {activeTab === '3d' && (
              <div style={{ display: 'grid', gridTemplateColumns: showCopilot ? '2fr 1.2fr' : '1fr', gap: 24, alignItems: 'start', transition: 'all 0.3s ease' }}>
                <MolstarViewer pdbId={job.analysis?.pdb_id} />
                {showCopilot && (
                  <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                    <AIChat context={job} />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'analysis' && <AnalysisPanel data={job.analysis} />}
            {activeTab === 'chat' && <AIChat context={job} />}
            {activeTab === 'mutations' && <MutationPanel data={job.analysis} sequence={job.sequence} />}
            {activeTab === 'metadata' && (
              <div className="glass" style={{ padding: 32 }}>
                <h2 style={{ marginBottom: 20 }}>Protein Metadata</h2>
                {job.analysis?.metadata ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {Object.entries(job.analysis.metadata).map(([k, v]) => (
                      <div key={k} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{k}</div>
                        <div style={{ fontSize: 15 }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: 'var(--muted)' }}>No metadata available for this sequence.</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}