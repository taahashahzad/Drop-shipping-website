export function formatMoney(value, currency = 'PKR') {
  const num = Number(value || 0)
  const formatted = num.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return currency === 'PKR' ? `Rs ${formatted}` : `${currency} ${formatted}`
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function discountPercent(price, compareAt) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}
