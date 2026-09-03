export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square bg-ink/5" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 bg-ink/5 rounded w-1/3" />
        <div className="h-4 bg-ink/10 rounded w-4/5" />
        <div className="h-4 bg-ink/10 rounded w-1/2 mt-1" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-ink/10 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}
