import { useEffect, useRef, useState } from 'react'

/**
 * Reveals an element with a fade-up animation the first time it scrolls
 * into view. Returns a ref to attach and a boolean for the visible state,
 * so it can be composed with Tailwind's `animate-fadeUp` utility:
 *
 *   const { ref, visible } = useReveal()
 *   <div ref={ref} className={visible ? 'animate-fadeUp' : 'opacity-0'}>
 */
export function useReveal(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, ...options }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [options])

  return { ref, visible }
}
