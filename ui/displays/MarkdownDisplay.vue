<script setup lang="ts">
// Display « markdown » (builtin du kit) — rendu formaté d'un contenu long.
// Mini-renderer maison (zéro dépendance) : le HTML source est ÉCHAPPÉ d'abord
// (aucune injection possible), puis la syntaxe md usuelle est appliquée :
// titres, gras/italique, code inline & blocs, listes, citations, liens, ¶.
import { computed } from "vue"
import { router } from "@inertiajs/vue3"

const props = defineProps<{ value: unknown }>()

/** Liens INTERNES (href relatif, ex. le CRUD) : navigation Inertia au lieu d'un full reload. */
function onClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest("a")
  if (a?.getAttribute("href")?.startsWith("/")) {
    e.preventDefault()
    router.visit(a.getAttribute("href")!)
  }
}

// Échappe AUSSI les guillemets : le HTML est échappé en entier avant que les
// regex n'injectent des valeurs capturées dans des attributs (href) — sans ça,
// `[x](/a"onmouseover=…)` sortirait de l'attribut (XSS). L'ordre importe : `&`
// d'abord (sinon on ré-échapperait les entités produites ensuite).
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;")

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
}

const html = computed(() => {
  const raw = typeof props.value === "string" ? props.value : ""
  if (!raw.trim()) return ""
  const src = esc(raw.replaceAll("\r\n", "\n"))
  const out: string[] = []
  // Blocs de code ``` isolés d'abord.
  const parts = src.split(/^```.*$/m)
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      out.push(`<pre><code>${part.replace(/^\n|\n$/g, "")}</code></pre>`)
      return
    }
    for (const block of part.split(/\n{2,}/)) {
      const b = block.trim()
      if (!b) continue
      const h = b.match(/^(#{1,4})\s+(.*)$/s)
      if (h) {
        const level = Math.min(h[1].length + 1, 5) // # → h2 (h1 = titre de page)
        out.push(`<h${level}>${inline(h[2].split("\n")[0])}</h${level}>`)
        continue
      }
      if (/^(-|\*|\d+\.)\s/.test(b)) {
        const ordered = /^\d+\./.test(b)
        const items = b.split("\n").filter((l) => l.trim())
          .map((l) => `<li>${inline(l.replace(/^\s*(-|\*|\d+\.)\s+/, ""))}</li>`).join("")
        out.push(ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`)
        continue
      }
      if (b.startsWith("&gt;")) {
        out.push(`<blockquote>${inline(b.replaceAll(/^&gt;\s?/gm, "").replaceAll("\n", "<br>"))}</blockquote>`)
        continue
      }
      if (/^(---|\*\*\*)$/.test(b)) {
        out.push("<hr>")
        continue
      }
      out.push(`<p>${inline(b).replaceAll("\n", "<br>")}</p>`)
    }
  })
  return out.join("")
})
</script>

<template>
  <div v-if="html" class="md-prose max-w-3xl text-sm leading-relaxed" v-html="html" @click="onClick" />
  <span v-else class="text-sm text-muted-foreground">—</span>
</template>

<style scoped>
.md-prose :deep(h2) { font-size: 1.2rem; margin: 1.1em 0 0.4em; }
.md-prose :deep(h3) { font-size: 1.05rem; margin: 1em 0 0.35em; }
.md-prose :deep(h4), .md-prose :deep(h5) { font-size: 0.95rem; margin: 0.9em 0 0.3em; }
.md-prose :deep(h2:first-child), .md-prose :deep(h3:first-child) { margin-top: 0; }
.md-prose :deep(p) { margin: 0.5em 0; }
.md-prose :deep(ul), .md-prose :deep(ol) { margin: 0.5em 0; padding-left: 1.4em; display: grid; gap: 0.2em; }
.md-prose :deep(ul) { list-style: disc; }
.md-prose :deep(ol) { list-style: decimal; }
.md-prose :deep(code) {
  background: var(--muted);
  border-radius: 4px;
  padding: 0.1em 0.35em;
  font-size: 0.85em;
  font-family: ui-monospace, monospace;
}
.md-prose :deep(pre) {
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  margin: 0.6em 0;
  overflow-x: auto;
}
.md-prose :deep(pre code) { background: transparent; padding: 0; }
.md-prose :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding-left: 0.9em;
  margin: 0.6em 0;
  color: var(--muted-foreground);
}
.md-prose :deep(a) { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
.md-prose :deep(hr) { margin: 1em 0; border-color: var(--border); }
.md-prose :deep(strong) { font-weight: 600; }
</style>
