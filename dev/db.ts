// Mock backend du harnais : Postgres EMBARQUÉ (PGlite, WASM in-process). Zéro
// dépendance externe — aucun serveur ni docker. Tables démo créées + seedées au
// 1er accès, en mémoire. Le moteur Forge génère du vrai SQL Postgres → PGlite
// (un vrai Postgres compilé en WASM) l'exécute tel quel.

import { PGlite } from "@electric-sql/pglite"

let pg: Promise<PGlite> | null = null

function client(): Promise<PGlite> {
  return (pg ??= (async () => {
    const p = new PGlite() // en mémoire
    await p.exec(`
      CREATE TABLE products (
        id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name         TEXT NOT NULL,
        sku          TEXT,
        price        NUMERIC,
        stock        INT NOT NULL DEFAULT 0,
        featured     BOOLEAN NOT NULL DEFAULT false,
        status       TEXT NOT NULL DEFAULT 'draft',
        description  TEXT,
        metadata     JSONB,
        published_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE orders (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id BIGINT REFERENCES products (id),
        customer   TEXT NOT NULL,
        qty        INT NOT NULL DEFAULT 1,
        status     TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      INSERT INTO products (name, sku, price, stock, featured, status, description, metadata, published_at) VALUES
        ('Clavier mécanique', 'KB-01', 129.90, 42, true,  'active',
         'Switches tactiles, châssis aluminium, layout ISO-FR.',
         '{"couleur": "noir", "garantie_mois": 24}', now() - interval '3 days'),
        ('Souris ergonomique', 'MS-02', 49.00, 8, false, 'active',
         NULL, '{"couleur": "graphite"}', now() - interval '1 day'),
        ('Écran 27 pouces',   'SC-03', 329.00, 0, false, 'draft', NULL, NULL, NULL);
      INSERT INTO orders (product_id, customer, qty, status, created_at) VALUES
        (1, 'alice@example.com', 2, 'paid',    now() - interval '6 days'),
        (2, 'bob@example.com',   1, 'pending', now() - interval '5 days'),
        (1, 'carol@example.com', 3, 'paid',    now() - interval '4 days'),
        (3, 'dave@example.com',  1, 'paid',    now() - interval '3 days'),
        (2, 'erin@example.com',  2, 'pending', now() - interval '2 days'),
        (1, 'frank@example.com', 1, 'paid',    now() - interval '2 days'),
        (2, 'grace@example.com', 4, 'paid',    now() - interval '1 day'),
        (1, 'heidi@example.com', 1, 'pending', now());
    `)
    return p
  })())
}

/** Contrat ForgeContext.query. */
export async function query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
  const p = await client()
  const r = await p.query(sql, (params ?? []) as unknown[])
  return r.rows as Record<string, unknown>[]
}
