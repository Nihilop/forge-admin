<script setup lang="ts">
// Saisie des champs `datetime` — date picker du kit (Popover + Calendar) +
// champ heure. La row porte un ISO-8601 (UTC) : affiché/édité en heure LOCALE,
// et la valeur repart en "YYYY-MM-DDTHH:mm" local (le moteur normalise en ISO
// à l'écriture).
import { computed } from "vue"
import { CalendarDate, type DateValue } from "@internationalized/date"
import { PhCalendarBlank } from "@phosphor-icons/vue"
import { Button } from "@forge/primitives/button"
import { Calendar } from "@forge/primitives/calendar"
import { Input } from "@forge/primitives/input"
import { Popover, PopoverContent, PopoverTrigger } from "@forge/primitives/popover"
import type { PublicField } from "../fields"

const model = defineModel<string>()
defineProps<{ field: PublicField }>()

const pad = (n: number) => String(n).padStart(2, "0")

/** La valeur du modèle en Date LOCALE (null si vide/invalide). */
const parsed = computed<Date | null>(() => {
  if (!model.value) return null
  const d = new Date(model.value)
  return Number.isNaN(d.getTime()) ? null : d
})

function emit(date: { year: number; month: number; day: number }, time: string) {
  model.value = `${date.year}-${pad(date.month)}-${pad(date.day)}T${time || "00:00"}`
}

/** Partie DATE — pilotée par le Calendar (reka / @internationalized/date). */
const calendarDate = computed<DateValue | undefined>({
  get: () => {
    const d = parsed.value
    return d ? new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()) : undefined
  },
  set: (v) => {
    if (!v) return
    emit({ year: v.year, month: v.month, day: v.day }, timeValue.value)
  },
})

/** Partie HEURE — input natif type=time ("HH:mm"). */
const timeValue = computed<string>({
  get: () => {
    const d = parsed.value
    return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : ""
  },
  set: (t) => {
    const d = parsed.value ?? new Date()
    emit({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }, t)
  },
})

const display = computed(() => {
  const d = parsed.value
  if (!d) return null
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
})

function clear() {
  model.value = ""
}
</script>

<template>
  <div class="flex gap-2">
    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          class="min-w-0 flex-1 justify-start font-normal"
          :class="display ? '' : 'text-muted-foreground'"
          :disabled="field.locked"
        >
          <PhCalendarBlank :size="16" />
          <span class="truncate">{{ display ?? "—" }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <Calendar v-model="calendarDate" />
        <div class="flex items-center gap-2 border-t p-3">
          <Input v-model="timeValue" type="time" class="h-8" :disabled="field.locked" />
          <Button
            v-if="display"
            variant="ghost"
            size="sm"
            class="text-muted-foreground"
            @click="clear"
          >
            ✕
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
