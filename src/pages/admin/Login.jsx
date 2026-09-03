import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'

export default function Login() {
  const { login, user } = useAuth()
  const settings = useStoreSettings()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-dim px-4">
      <div className="card w-full max-w-sm p-7">
        <div className="w-11 h-11 rounded-full bg-palm-50 flex items-center justify-center mb-4">
          <LockKeyhole size={20} className="text-palm-500" />
        </div>
        <h1 className="text-xl font-display font-medium mb-1">{settings.store_name} Admin</h1>
        <p className="text-sm text-ink/55 mb-6">Sign in to manage your store.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-rust-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
