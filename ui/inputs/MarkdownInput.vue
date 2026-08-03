<script setup lang="ts">
// Input Forge « markdown » — un VRAI éditeur markdown-first : barre d'outils
// (gras/italique/titres/listes/code/lien) qui agit sur la sélection, + aperçu
// live (réutilise MarkdownDisplay). Zéro dépendance : textarea natif piloté.
import { nextTick, ref } from "vue"
import {
  PhCode, PhEye, PhEyeSlash, PhLink, PhListBullets, PhListNumbers,
  PhQuotes, PhTextB, PhTextHOne, PhTextItalic,
} from "@phosphor-icons/vue"
import MarkdownDisplay from "../displays/MarkdownDisplay.vue"
import type { PublicField } from "../fields"

const model = defineModel<string>()
const props = defineProps<{ field: PublicField }>()

const ta = ref<HTMLTextAreaElement | null>(null)
const preview = ref(true)

/** Entoure la sélection de `before`/`after` (gras, italique, code, lien…). */
function surround(before: string, after = before, placeholder = "") {
  const el = ta.value
  if (!el || props.field.locked) return
  const s = el.selectionStart, e = el.selectionEnd
  const v = model.value ?? ""
  const sel = v.slice(s, e) || placeholder
  model.value = v.slice(0, s) + before + sel + after + v.slice(e)
  nextTick(() => {
    el.focus()
    el.selectionStart = s + before.length
    el.selectionEnd = s + before.length + sel.length
  })
}

/** Préfixe chaque ligne de la sélection (titres, listes, citations). */
function prefixLines(prefix: string) {
  const el = ta.value
  if (!el || props.field.locked) return
  const s = el.selectionStart, e = el.selectionEnd
  const v = model.value ?? ""
  const start = v.lastIndexOf("\n", s - 1) + 1
  const block = v.slice(start, e) || prefix.trim()
  const out = block.split("\n").map((l) => prefix + l.replace(/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/, "")).join("\n")
  model.value = v.slice(0, start) + out + v.slice(e)
  nextTick(() => el.focus())
}

const tools = [
  { icon: PhTextB, title: "Gras (Ctrl+B)", run: () => surround("**", "**", "gras") },
  { icon: PhTextItalic, title: "Italique (Ctrl+I)", run: () => surround("*", "*", "italique") },
  { icon: PhTextHOne, title: "Titre", run: () => prefixLines("## ") },
  { icon: PhListBullets, title: "Liste", run: () => prefixLines("- ") },
  { icon: PhListNumbers, title: "Liste numérotée", run: () => prefixLines("1. ") },
  { icon: PhQuotes, title: "Citation", run: () => prefixLines("> ") },
  { icon: PhCode, title: "Code", run: () => surround("`", "`", "code") },
  { icon: PhLink, title: "Lien", run: () => surround("[", "](https://)", "texte") },
]

function onKeydown(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey)) return
  if (e.key === "b") { e.preventDefault(); surround("**", "**", "gras") }
  else if (e.key === "i") { e.preventDefault(); surround("*", "*", "italique") }
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border bg-card/40 focus-within:border-primary/50">
    <!-- Barre d'outils -->
    <div class="flex items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
      <button
        v-for="t in tools"
        :key="t.title"
        type="button"
        :title="t.title"
        :disabled="field.locked"
        class="grid size-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        @click="t.run"
      >
        <component :is="t.icon" :size="16" />
      </button>
      <div class="ml-auto flex items-center gap-2 pr-1">
        <span class="text-[11px] text-muted-foreground">Markdown</span>
        <button
          type="button"
          :title="preview ? 'Masquer l’aperçu' : 'Afficher l’aperçu'"
          class="grid size-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :class="preview ? 'text-primary' : ''"
          @click="preview = !preview"
        >
          <component :is="preview ? PhEye : PhEyeSlash" :size="16" />
        </button>
      </div>
    </div>

    <!-- Éditeur + aperçu (deux volets sur large écran, empilés sinon) -->
    <div class="grid" :class="preview ? 'md:grid-cols-2' : ''">
      <textarea
        ref="ta"
        v-model="model"
        :readonly="field.locked"
        rows="12"
        spellcheck="false"
        placeholder="Écris en markdown…"
        class="min-h-64 w-full resize-y bg-transparent p-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
        @keydown="onKeydown"
      />
      <div
        v-if="preview"
        class="min-h-64 max-h-[60vh] overflow-auto border-t p-3 md:border-t-0 md:border-l"
      >
        <MarkdownDisplay v-if="model?.trim()" :value="model" />
        <p v-else class="text-sm text-muted-foreground/60">L’aperçu s’affiche ici.</p>
      </div>
    </div>
  </div>
</template>
