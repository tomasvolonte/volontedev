# VolonteDev — Generador de Landing Pages con IA

SaaS argentino que genera landing pages usando Claude Haiku para el copy y templates HTML/CSS pre-diseñados. El operador publica manualmente en Hostinger y gestiona cambios post-publicación por WhatsApp.

---

## Stack

- **Next.js 16** (App Router) — Vercel Hobby (gratis)
- **Supabase** — PostgreSQL + Auth + Storage (plan gratuito)
- **Claude Haiku 4.5** — generación de copy (JSON, no HTML)
- **Mercado Pago Subscriptions** — pagos recurrentes
- **Vercel Cron** — control diario de mora y baja automática

---

## Variables de entorno

Crear `.env.local` en la raíz con las siguientes variables:

### Anthropic (IA)
| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic. Obtener en console.anthropic.com |

### Supabase (base de datos)
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. Ej: `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública). Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (privada, bypasa RLS). Settings → API |

### Mercado Pago (pagos)
| Variable | Descripción |
|---|---|
| `MP_ACCESS_TOKEN` | Access token de producción. Credenciales → Producción |
| `MP_PUBLIC_KEY` | Public key de producción (para el frontend si se necesita) |
| `MP_WEBHOOK_SECRET` | Secreto para validar la firma de los webhooks de MP |

### WhatsApp (notificaciones)
| Variable | Descripción |
|---|---|
| `OPERATOR_WA_NUMBER` | Número del operador con código de país. Ej: `5491112345678` |
| `WHATSAPP_API_TOKEN` | Token de la API de WhatsApp Cloud (Meta). Opcional — si no está configurado se loggea el link wa.me |
| `WHATSAPP_PHONE_ID` | ID del número de teléfono en Meta Business. Requerido si se usa `WHATSAPP_API_TOKEN` |

### Panel admin
| Variable | Descripción |
|---|---|
| `ADMIN_PASSWORD` | Contraseña del panel `/admin`. Cualquier string seguro. El middleware deriva un token HMAC-SHA256 para la cookie |

### Cron job
| Variable | Descripción |
|---|---|
| `CRON_SECRET` | Secreto para proteger `/api/cron/check-overdue`. Configurar también en Vercel Dashboard → Settings → Environment Variables |

### App
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL pública de la app. Ej: `https://volontedev.com` |

---

## Instalación local

```bash
# Instalar dependencias
npm install

# Crear .env.local con todas las variables (ver sección anterior)

# Aplicar esquema de base de datos en Supabase
# Ir a Supabase Dashboard → SQL Editor → pegar contenido de supabase/schema.sql

# Correr en desarrollo
npm run dev
```

---

## Estructura del proyecto

```
landingai/
├── app/
│   ├── page.tsx                        # Landing principal del producto
│   ├── crear/page.tsx                  # Wizard de 4 pasos
│   ├── editor/[landingId]/page.tsx     # Editor visual inline
│   ├── admin/page.tsx                  # Panel del operador
│   ├── admin/login/page.tsx            # Login del admin
│   └── api/
│       ├── generate-copy/route.ts      # POST → Claude Haiku
│       ├── mp-webhook/route.ts         # Webhook de Mercado Pago
│       ├── checkout/route.ts           # Crea preapproval en MP
│       ├── landings/[landingId]/       # GET/PATCH landing
│       ├── admin/login/route.ts        # POST login / DELETE logout
│       ├── admin/orders/[orderId]/     # PATCH publish/suspend/reactivate
│       └── cron/check-overdue/route.ts # Control diario de mora
├── components/
│   ├── templates/
│   │   ├── themes.ts                   # 6 temas visuales
│   │   ├── renderTemplate.tsx          # Combina tema + bloques + copy
│   │   └── blocks/                     # 8 bloques (Hero, Services, etc.)
│   └── editor/
│       ├── InlineEditor.tsx            # Editor con contentEditable
│       └── EditableText.tsx            # Campo editable individual
├── lib/
│   ├── supabase.ts                     # Cliente Supabase (lazy init)
│   ├── claude.ts                       # Wrapper Claude Haiku
│   ├── mercadopago.ts                  # Preapprovals + webhook validation
│   ├── whatsapp.ts                     # Mensajes wa.me + Meta Cloud API
│   └── adminAuth.ts                    # HMAC-SHA256 con Web Crypto API
├── proxy.ts                            # Middleware Edge (protege /admin)
├── vercel.json                         # Cron job config
└── supabase/schema.sql                 # Esquema completo de la DB
```

---

## Deploy en Vercel

1. Conectar el repositorio en vercel.com
2. Configurar todas las variables de entorno en **Settings → Environment Variables**
3. `CRON_SECRET` es inyectada automáticamente por Vercel en los headers del cron — igual debe estar definida como variable
4. El cron `0 12 * * *` (UTC) corre a las 9 AM hora Argentina — verificar en **Settings → Cron Jobs**

### Webhook de Mercado Pago
Después del deploy, configurar en el panel de MP:
- URL: `https://volontedev.com/api/mp-webhook`
- Eventos: `payment`, `subscription_preapproval`

---

## Modelo de negocio

| Concepto | Precio |
|---|---|
| Primera cuota (con dominio propio) | $100.000 ARS |
| Primera cuota (subdominio o dominio nuevo) | $150.000 ARS |
| Mantenimiento mensual | $100.000 ARS/mes |
| Reactivación por mora | $50.000 ARS adicionales |

El sistema envía avisos automáticos por WhatsApp al día 1 y 3 de mora, y suspende el sitio al día 5.

---

## Costo operativo estimado

| Servicio | Costo/mes |
|---|---|
| Vercel Hobby | USD 0 |
| Supabase Free | USD 0 |
| Claude Haiku (100 previews/día) | ~USD 2 |
| Hostinger (publicación) | ~USD 10-20 |
| Dominio | ~USD 2 |
| **Total** | **~USD 14-22/mes** |
