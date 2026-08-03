// Sert le site de doc buildé (docs:build → .vitepress/dist) — statique pur,
// Deno Deploy ready : `deployctl deploy --entrypoint docs/serve.ts`.

import { serveDir } from "jsr:@std/http@^1/file-server"
import { fromFileUrl } from "jsr:@std/path@^1"

const fsRoot = fromFileUrl(new URL("./.vitepress/dist", import.meta.url))

Deno.serve((req) => serveDir(req, { fsRoot, quiet: true }))
