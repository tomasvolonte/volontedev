import type { Theme } from '../themes'

interface GalleryBlockProps {
  theme: Theme
  accentColor: string
}

const PLACEHOLDER_EMOJIS = ['📸', '🖼️', '🎨', '✨', '💡', '🌟']

export default function GalleryBlock({ theme, accentColor }: GalleryBlockProps) {
  return (
    <section id="galeria" className={`${theme.sectionA} ${theme.sectionPad}`}>
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Galería</h2>
          <p className={`${theme.muted} mt-2`}>Nuestros trabajos y proyectos</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PLACEHOLDER_EMOJIS.map((emoji, i) => (
            <div
              key={i}
              className={`aspect-square ${theme.radius} flex items-center justify-center text-5xl relative overflow-hidden`}
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <span>{emoji}</span>
              {/* Overlay con texto placeholder */}
              <div className="absolute inset-0 flex items-end p-3 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                <span className="text-white text-xs font-medium">Foto {i + 1}</span>
              </div>
            </div>
          ))}
        </div>
        <p className={`${theme.muted} text-center mt-6 text-xs`}>
          Las imágenes se reemplazan con tus fotos al publicar el sitio
        </p>
      </div>
    </section>
  )
}
