import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-indigo-600 text-xl tracking-tight">VolonteDev</span>
          <Link
            href="/crear"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Crear mi sitio
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            Generador de landing pages con IA
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Tu sitio web listo<br />en minutos
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            Describí tu negocio, elegí un diseño y la IA genera el contenido. Vos solo editás y pagás. Nosotros publicamos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/crear"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Empezar gratis →
            </Link>
          </div>
          <p className="text-sm text-gray-400">Sin tarjeta de crédito. El pago es solo si querés publicar.</p>
        </div>
      </main>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="text-3xl">✍️</div>
              <h3 className="font-bold text-gray-900">1. Contanos tu negocio</h3>
              <p className="text-gray-500 text-sm">Completá el nombre, rubro y una descripción. La IA genera los textos de tu sitio automáticamente.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="text-3xl">🎨</div>
              <h3 className="font-bold text-gray-900">2. Elegí tu diseño</h3>
              <p className="text-gray-500 text-sm">6 templates profesionales. Editá textos, colores y bloques directamente sobre el preview.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="text-3xl">🚀</div>
              <h3 className="font-bold text-gray-900">3. Pagá y publicamos</h3>
              <p className="text-gray-500 text-sm">Abonás la primera cuota y nosotros publicamos tu sitio en Hostinger. Te avisamos por WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Precios en pesos argentinos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-gray-200 rounded-2xl p-6 space-y-3 text-left">
              <div className="font-bold text-gray-900">Con dominio propio</div>
              <div className="text-3xl font-bold text-indigo-600">$100.000 <span className="text-base font-normal text-gray-400">ARS</span></div>
              <p className="text-sm text-gray-500">Primera cuota. Ya tenés tu dominio y lo apuntamos nosotros.</p>
              <div className="text-sm text-gray-500">+ $100.000 ARS/mes mantenimiento</div>
            </div>
            <div className="border-2 border-indigo-600 rounded-2xl p-6 space-y-3 text-left relative">
              <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">MÁS ELEGIDO</div>
              <div className="font-bold text-gray-900">Con subdominio gratis</div>
              <div className="text-3xl font-bold text-indigo-600">$150.000 <span className="text-base font-normal text-gray-400">ARS</span></div>
              <p className="text-sm text-gray-500">Primera cuota. Tu sitio en tunegocio.volontedev.com</p>
              <div className="text-sm text-gray-500">+ $100.000 ARS/mes mantenimiento</div>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            ⚠️ El mantenimiento mensual es obligatorio para mantener el sitio en línea. Si no se abona dentro de los 5 días hábiles del vencimiento, el sitio será dado de baja.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-indigo-600 px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-white">¿Listo para tener tu sitio?</h2>
          <p className="text-indigo-200">Creá tu landing page ahora. Es gratis hasta que decidís publicar.</p>
          <Link
            href="/crear"
            className="inline-block bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-indigo-50 transition-colors"
          >
            Crear mi sitio →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-sm text-gray-400">
        © 2026 VolonteDev. Todos los derechos reservados.
      </footer>
    </div>
  )
}
