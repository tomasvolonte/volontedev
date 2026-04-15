-- ============================================================
-- VolonteDev — Esquema de base de datos
-- Aplicar en: Supabase > SQL Editor > New query
-- ============================================================

-- ─────────────────────────────────────────────
-- Usuarios / clientes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Landing pages generadas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  rubro         TEXT,
  -- Template y bloques
  template      TEXT NOT NULL CHECK (template IN ('minimal','bold','elegant','dark','warm','corporate')),
  active_blocks JSONB,   -- ['hero','services','testimonials','contact']
  -- Copy
  copy_data     JSONB,   -- JSON generado por Claude Haiku (original, no modificar)
  edited_copy   JSONB,   -- Copy editado manualmente por el cliente
  -- Diseño
  accent_color  TEXT DEFAULT '#534AB7',
  -- Estado
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','paid','published','suspended')),
  -- Dominio
  domain_type   TEXT CHECK (domain_type IN ('subdomain','own','new')),
  domain_value  TEXT,    -- ej: 'mitienda' | 'mitienda.com.ar' | 'mitienda.com'
  domain_notes  TEXT,    -- instrucciones DNS si tiene dominio propio
  published_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landings_updated_at
  BEFORE UPDATE ON landings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- Pedidos / suscripciones
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  landing_id            UUID REFERENCES landings(id) ON DELETE CASCADE,
  -- Dominio al momento del pago (snapshot)
  domain_type           TEXT NOT NULL CHECK (domain_type IN ('subdomain','own','new')),
  domain_value          TEXT,
  -- Precios
  first_payment_ars     NUMERIC NOT NULL,       -- 300000 o 250000 según opción de dominio
  monthly_fee_ars       NUMERIC DEFAULT 50000,
  -- Mercado Pago
  mp_subscription_id    TEXT,
  mp_preapproval_id     TEXT,
  -- Estado
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','cancelled')),
  -- Control de pagos mensuales
  last_payment_date     TIMESTAMPTZ,
  next_due_date         TIMESTAMPTZ,
  overdue_notif_1_sent  BOOLEAN DEFAULT FALSE,  -- aviso día 1 de mora
  overdue_notif_2_sent  BOOLEAN DEFAULT FALSE,  -- aviso día 3 de mora
  suspended_at          TIMESTAMPTZ,            -- fecha de baja por falta de pago
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Solicitudes de cambio post-publicación
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  landing_id  UUID REFERENCES landings(id) ON DELETE CASCADE,
  description TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Log de notificaciones enviadas (evitar duplicados)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications_log (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type     TEXT CHECK (type IN ('payment_confirmed','overdue_1','overdue_2','suspended','published','reactivated')),
  sent_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Índices para performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_landings_user_id       ON landings(user_id);
CREATE INDEX IF NOT EXISTS idx_landings_status        ON landings(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id         ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_landing_id      ON orders(landing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_next_due_date   ON orders(next_due_date);  -- cron de mora
CREATE INDEX IF NOT EXISTS idx_change_requests_landing ON change_requests(landing_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id  ON notifications_log(order_id);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE landings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- users: cada usuario solo ve sus propios datos
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

-- landings: cada usuario solo ve sus propias landing pages
CREATE POLICY "landings_own_data" ON landings
  FOR ALL USING (auth.uid() = user_id);

-- orders: cada usuario solo ve sus propios pedidos
CREATE POLICY "orders_own_data" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- change_requests: cada usuario solo ve sus propias solicitudes
CREATE POLICY "change_requests_own_data" ON change_requests
  FOR ALL USING (auth.uid() = user_id);

-- notifications_log: solo lectura propia (a través de la orden)
CREATE POLICY "notifications_own_data" ON notifications_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = notifications_log.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Service role: acceso total para API Routes y cron
-- (las API routes usan SUPABASE_SERVICE_ROLE_KEY que bypasea RLS)
-- ─────────────────────────────────────────────
