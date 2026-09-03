import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function Account() {
  const { user, changePassword } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await changePassword(password)
      toast.success('Password updated')
      setPassword('')
      setConfirm('')
    } catch (err) {
      toast.error(err.message || 'Could not update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-medium mb-6">Admin Account</h1>

      <div className="card p-5 mb-6">
        <p className="text-sm text-ink/50">Signed in as</p>
        <p className="font-medium text-ink">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink">Change password</h2>
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
