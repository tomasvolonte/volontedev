import Anthropic from '@anthropic-ai/sdk'
import type { CopyData } from '@/types/database'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1200

export interface GenerateCopyInput {
  bizName: string
  rubro: string
  desc: string
  cta: string
  activeBlocks: string[]
}

export async function generateCopy(input: GenerateCopyInput): Promise<CopyData> {
  const { bizName, rubro, desc, cta, activeBlocks } = input

  const prompt = `Sos un copywriter experto. Generá textos persuasivos en español argentino para este negocio.
Respondé ÚNICAMENTE con JSON válido (sin markdown, sin bloques de código, sin texto adicional).

Negocio: ${bizName} | Rubro: ${rubro} | Descripción: ${desc} | CTA: ${cta}
Bloques requeridos: ${activeBlocks.join(', ')}

Estructura JSON esperada:
{
  "headline": "max 8 palabras",
  "subheadline": "max 15 palabras",
  "about": "2-3 oraciones",
  "cta_text": "texto del botón",
  "services": [{"icon":"emoji","title":"...","desc":"..."}],
  "testimonials": [{"name":"...","text":"..."}],
  "faq": [{"q":"...","a":"..."}]
}

Reglas:
- headline: máximo 8 palabras, impactante, sin signos de exclamación al inicio
- subheadline: máximo 15 palabras, complementa el headline
- about: 2-3 oraciones que transmitan confianza y propuesta de valor
- cta_text: usá exactamente "${cta}" o una variación concisa
- services: exactamente 4 items con emoji relevante al rubro
- testimonials: exactamente 3 testimonios realistas con nombre argentino
- faq: exactamente 3 preguntas frecuentes del rubro`

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Respuesta inesperada de Claude')
  }

  // Limpiar posible markdown que el modelo incluya a pesar del prompt
  const raw = content.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed: CopyData
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Claude devolvió JSON inválido')
  }

  return parsed
}
