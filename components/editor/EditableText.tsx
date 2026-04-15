'use client'

import { useRef, useLayoutEffect, useCallback } from 'react'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  tag?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p'
  style?: React.CSSProperties
}

export default function EditableText({
  value,
  onChange,
  className = '',
  multiline = false,
  placeholder = 'Escribí acá…',
  tag: Tag = 'span',
  style,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null)
  // Flag para saber si el usuario está editando (evitar sincronización durante el foco)
  const isFocused = useRef(false)

  // Sincronizar el DOM cuando value cambia externamente (ej: reset)
  useLayoutEffect(() => {
    if (!ref.current || isFocused.current) return
    if (ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  const handleBlur = useCallback(() => {
    isFocused.current = false
    const newValue = ref.current?.textContent?.trim() ?? ''
    if (newValue !== value) {
      onChange(newValue || value) // No permitir vaciado accidental
    }
  }, [value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).blur()
    }
    // Esc cancela la edición
    if (e.key === 'Escape') {
      if (ref.current) ref.current.textContent = value
      ;(e.currentTarget as HTMLElement).blur()
    }
  }, [multiline, value])

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { isFocused.current = true }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      style={style}
      className={[
        className,
        // Indicadores visuales de campo editable
        'outline-none cursor-text',
        'hover:ring-2 hover:ring-blue-300 hover:ring-offset-1',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'rounded transition-shadow',
        // Placeholder via CSS cuando está vacío
        'empty:before:content-[attr(data-placeholder)] empty:before:opacity-30 empty:before:italic',
      ].join(' ')}
    />
  )
}
