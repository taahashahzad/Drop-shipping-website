import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, ShieldCheck, RotateCcw, Phone, ArrowRight } from 'lucide-react'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { useToast } from '../../contexts/ToastContext'

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.4c0-.2.2-.4.4-.4H14Z" />
    </svg>
  )
}

export default function Footer() {
  const settings = useStoreSettings()
  const toast = useToast()
  const [email, setEmail] = useState('')

  function handleSubscribe(e) {
    e.preventDefault()
    if (!email.trim()) return
    toast.success("Thanks — we'll keep you posted.")
    setEmail('')
  }

  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="container-store grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2.5">
          <Truck size={20} className="text-palm-300" />
          <p className="text-sm font-medium text-white">Cash on Delivery</p>
          <p className="text-xs text-paper/50">Pay when your order arrives at your door</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <ShieldCheck size={20} className="text-palm-300" />
          <p className="text-sm font-medium text-white">Genuine products</p>
          <p className="text-xs text-paper/50">Quality checked before every dispatch</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <RotateCcw size={20} className="text-palm-300" />
          <p className="text-sm font-medium text-white">Easy returns</p>
          <p className="text-xs text-paper/50">Hassle-free return policy</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Phone size={20} className="text-palm-300" />
          <p className="text-sm font-medium text-white">Need help?</p>
          <p className="text-xs text-paper/50">{settings.phone || 'Available 7 days a week'}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-store grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <h3 className="font-display text-2xl text-white">{settings.store_name}</h3>
            <p className="mt-3 max-w-sm text-sm text-paper/55">{settings.store_description}</p>
            <div className="mt-5 flex gap-3">
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-paper/70 hover:border-white/40 hover:text-white">
                  <InstagramIcon width={16} height={16} />
                </a>
              )}
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-paper/70 hover:border-white/40 hover:text-white">
                  <FacebookIcon width={16} height={16} />
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="eyebrow text-paper/40">Shop</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-paper/65">
              <Link to="/shop" className="w-fit hover:text-white">All products</Link>
              <Link to="/cart" className="w-fit hover:text-white">Your cart</Link>
            </div>
          </div>

          <div>
            <p className="eyebrow text-paper/40">Stay in the loop</p>
            <p className="mt-3 text-sm text-paper/55">New arrivals and offers, straight to your inbox.</p>
            <form onSubmit={handleSubscribe} className="mt-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 pl-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full bg-transparent text-sm text-white placeholder:text-paper/40 focus:outline-none"
              />
              <button type="submit" aria-label="Subscribe" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-palm-500 text-white transition-colors hover:bg-palm-600">
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-store flex flex-col items-center justify-between gap-3 py-6 text-xs text-paper/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.store_name}. All rights reserved.</p>
          <p>{settings.footer_text}</p>
        </div>
      </div>
    </footer>
  )
}
