'use client'

import { useState } from 'react'
import type { Theme } from '../themes'
import type { CopyData } from '@/types/database'

interface FaqBlockProps {
  copy: CopyData
  theme: Theme
  accentColor: string
}

export default function FaqBlock({ copy, theme, accentColor }: FaqBlockProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className={`${theme.sectionA} ${theme.sectionPad}`}>
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Preguntas frecuentes</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {copy.faq.map((item, i) => (
            <div key={i} className={`${theme.card} overflow-hidden`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className={`${theme.h3} pr-4`}>{item.q}</span>
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform"
                  style={{
                    backgroundColor: accentColor,
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className={`${theme.body} mt-4 pt-4 border-t ${theme.divider.replace('my-12', '')}`}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
