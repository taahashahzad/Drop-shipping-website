import { Outlet } from 'react-router-dom'
import Header from '../components/storefront/Header'
import Footer from '../components/storefront/Footer'

export default function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
