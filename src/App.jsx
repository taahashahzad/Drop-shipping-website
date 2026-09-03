import { Routes, Route } from 'react-router-dom'
import StorefrontLayout from './layouts/StorefrontLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/storefront/Home'
import ProductListPage from './pages/storefront/ProductListPage'
import ProductDetails from './pages/storefront/ProductDetails'
import Cart from './pages/storefront/Cart'
import Checkout from './pages/storefront/Checkout'
import OrderConfirmation from './pages/storefront/OrderConfirmation'

import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import ProductForm from './pages/admin/ProductForm'
import Categories from './pages/admin/Categories'
import Orders from './pages/admin/Orders'
import ZambeelExport from './pages/admin/ZambeelExport'
import ExportHistory from './pages/admin/ExportHistory'
import StoreSettingsPage from './pages/admin/StoreSettingsPage'
import Account from './pages/admin/Account'

export default function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ProductListPage mode="shop" />} />
        <Route path="/category/:slug" element={<ProductListPage mode="category" />} />
        <Route path="/search" element={<ProductListPage mode="search" />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:reference" element={<OrderConfirmation />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="zambeel-export" element={<ZambeelExport />} />
        <Route path="export-history" element={<ExportHistory />} />
        <Route path="settings" element={<StoreSettingsPage />} />
        <Route path="account" element={<Account />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-3xl font-display font-medium mb-2">Page not found</h1>
        <a href="/" className="text-palm-600 font-medium hover:underline">Back to home</a>
      </div>
    </div>
  )
}
