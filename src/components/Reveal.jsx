import { useReveal } from '../hooks/useReveal'

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const { ref, visible } = useReveal()
  const delayClass = delay ? `animate-delay-${delay}` : ''

  return (
    <Tag
      ref={ref}
      className={`${className} ${visible ? `animate-fadeUp ${delayClass}` : 'opacity-0'}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
