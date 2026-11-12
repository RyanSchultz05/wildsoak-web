import type { HotSpring } from '@/types'

const STORAGE_BASE = 'https://ventasuugmeocsmcoiqs.supabase.co/storage/v1/object/public/review-photos/'

/** Catalog names are stored in capitals; show them in title case. */
export function displayName(name: string): string {
    const trimmed = name.trim()
    if (trimmed !== trimmed.toUpperCase()) return trimmed
    return trimmed
        .toLowerCase()
        .replace(/(^|[\s(\-/])([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase())
}

/** "King County, WA", or just the state when the county is not known. */
export function placeLabel(spring: Pick<HotSpring, 'county' | 'state'>): string | null {
    const parts = [spring.county, spring.state].filter((part): part is string => !!part && part.trim() !== '')
    return parts.length ? parts.join(', ') : null
}

export function fahrenheit(celsius: number): number {
    return Math.round((celsius * 9) / 5 + 32)
}

export type TemperatureCategory = 'hot' | 'warm' | 'cool' | 'unknown'

export function temperatureCategory(celsius: number | null | undefined): TemperatureCategory {
    if (celsius === null || celsius === undefined) return 'unknown'
    if (celsius >= 40) return 'hot'
    if (celsius >= 30) return 'warm'
    return 'cool'
}

export function photoUrl(storagePath: string): string {
    return storagePath.startsWith('http') ? storagePath : STORAGE_BASE + storagePath
}

const INFERRED_PHRASES = [
    'given the coordinates', 'based on the coordinates', 'based on its coordinates', 'given its coordinates',
    'no well-known', 'not well documented', 'not well-documented', 'is not documented', "isn't documented",
    'no specific, named', 'little documented', 'poorly documented', 'no reliable information',
    'limited information', 'little public information', 'not widely documented', 'sparsely documented',
    'undocumented', 'no documented',
]

/** Whether the listing's details were written from the map location and not a documented visit. */
export function isUnconfirmed(spring: Pick<HotSpring, 'info_confidence' | 'description'>): boolean {
    if (spring.info_confidence === 'inferred') return true
    if (spring.info_confidence === 'documented') return false
    const text = (spring.description || '').toLowerCase()
    return INFERRED_PHRASES.some((phrase) => text.includes(phrase))
}

/** The opening sentence or two of the description, without the markdown headings. */
export function summary(description: string | null, limit = 170): string | null {
    if (!description) return null
    const body = description
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/^\*\*.*\*\*$/.test(line))
        .join(' ')
        .replace(/\*\*/g, '')
    if (!body) return null
    const sentences = body.match(/[^.!?]+[.!?]+(\s|$)/g) || [body]
    let result = ''
    for (const sentence of sentences) {
        if (!result) result = sentence.trim()
        else if (result.length + sentence.length < limit) result += ' ' + sentence.trim()
        else break
    }
    return result
}

export function directionsUrl(spring: Pick<HotSpring, 'latitude' | 'longitude'>): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${spring.latitude},${spring.longitude}&travelmode=driving`
}
