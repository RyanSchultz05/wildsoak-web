'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Map as MapIcon, Navigation } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { HotSpring } from '@/types'
import SpringCard from '@/components/SpringCard'
import { photoUrl } from '@/lib/springs'

const STATES: Record<string, string> = {
  alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', florida: 'FL',
  georgia: 'GA', hawaii: 'HI', idaho: 'ID', massachusetts: 'MA', montana: 'MT', nevada: 'NV',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', oregon: 'OR', 'south dakota': 'SD',
  texas: 'TX', utah: 'UT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wyoming: 'WY',
}

const POPULAR_STATES = ['Oregon', 'Idaho', 'California', 'Nevada', 'Wyoming', 'Utah', 'Montana', 'Colorado', 'New Mexico', 'Washington']

type ReviewJoin = { rating: number; status?: string; review_photos?: { storage_path: string }[] }
type SpringRow = HotSpring & { spring_reviews?: ReviewJoin[] }

/** Adds the average rating, review count and first review photo to a spring row. */
function withReviewSummary(row: SpringRow): HotSpring {
  const reviews = (row.spring_reviews || []).filter((review) => !review.status || review.status === 'approved')
  const ratings = reviews.map((review) => review.rating)
  const photo = reviews.flatMap((review) => review.review_photos || [])[0]
  const { spring_reviews: _unused, ...spring } = row
  void _unused
  return {
    ...spring,
    average_rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
    review_count: ratings.length,
    hero_image_url: spring.hero_image_url || (photo ? photoUrl(photo.storage_path) : null),
  }
}

const SPRING_SELECT = '*, spring_reviews(rating, status, review_photos(storage_path))'

export default function Home() {
  const [springs, setSprings] = useState<HotSpring[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const query = searchQuery.trim()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setFailed(false)

      let rows: SpringRow[] = []
      let error: unknown = null

      if (query.length >= 2) {
        const pattern = query.replace(/[,()*"\\%]/g, ' ').trim()
        const stateCode = STATES[pattern.toLowerCase()] || (pattern.length === 2 ? pattern.toUpperCase() : null)
        const filters = [`name.ilike.%${pattern}%`]
        if (stateCode && Object.values(STATES).includes(stateCode)) filters.push(`state.eq.${stateCode}`)
        const result = await supabase.from('hot_springs').select(SPRING_SELECT).or(filters.join(',')).order('name').limit(60)
        rows = (result.data as SpringRow[]) || []
        error = result.error
      } else {
        // Top rated: every spring that has at least one published review.
        const reviewed = await supabase.from('spring_reviews').select('spring_id').eq('status', 'approved')
        const ids = Array.from(new Set((reviewed.data || []).map((review) => review.spring_id as string)))
        if (reviewed.error) {
          error = reviewed.error
        } else if (ids.length) {
          const result = await supabase.from('hot_springs').select(SPRING_SELECT).in('id', ids)
          rows = (result.data as SpringRow[]) || []
          error = result.error
        }
      }

      if (cancelled) return
      if (error) {
        setFailed(true)
        setSprings([])
      } else {
        const summarized = rows.map(withReviewSummary)
        if (query.length < 2) {
          summarized.sort(
            (a, b) =>
              Number(!!b.hero_image_url) - Number(!!a.hero_image_url) ||
              (b.average_rating || 0) - (a.average_rating || 0) ||
              (b.review_count || 0) - (a.review_count || 0) ||
              a.name.localeCompare(b.name),
          )
        }
        setSprings(query.length < 2 ? summarized.slice(0, 9) : summarized)
      }
      setLoading(false)
    }

    const timeout = setTimeout(load, query ? 350 : 0)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [query])

  const searching = query.length >= 2

  return (
    <div className="min-h-screen bg-white">
      <section className="hero-pattern px-4 pb-24 pt-28 text-center md:pt-36">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">Find your kind of quiet.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-white/80 md:text-xl">
            More than 1,500 hot springs across the United States, with what to know before you go.
          </p>

          <form className="relative mx-auto mt-10 max-w-2xl" role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="spring-search" className="sr-only">Search springs by name or state</label>
            <Search className="pointer-events-none absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              id="spring-search"
              type="search"
              autoComplete="off"
              className="block w-full rounded-full bg-white py-5 pl-16 pr-6 text-lg font-medium text-stone-900 shadow-xl placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-white/30"
              placeholder="Search by name or state"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Browse the map
            </Link>
            <Link
              href="/road-trip"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" /> Plan a road trip
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">{searching ? 'Search results' : 'Top rated'}</h2>
            <p className="mt-1 font-medium text-stone-500">
              {searching ? `Springs matching “${query}”` : 'Favorites from people who’ve been'}
            </p>
          </div>
          {searching && !loading && !failed && (
            <p className="font-medium text-stone-500" aria-live="polite">
              {springs.length === 60 ? 'First 60 matches' : `${springs.length} ${springs.length === 1 ? 'spring' : 'springs'}`}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading springs">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-80 animate-pulse rounded-3xl bg-stone-100" />
            ))}
          </div>
        ) : failed ? (
          <p className="rounded-3xl bg-stone-50 p-10 text-center text-stone-600">
            Springs couldn’t be loaded. Check your connection and refresh the page.
          </p>
        ) : springs.length === 0 ? (
          <p className="rounded-3xl bg-stone-50 p-10 text-center text-stone-600">
            {searching ? 'No springs match that search. Try a shorter name or a state.' : 'No reviewed springs yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {springs.map((spring) => (
              <SpringCard key={spring.id} spring={spring} />
            ))}
          </div>
        )}
      </section>

      {!searching && (
        <section className="container mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-stone-900">Browse by state</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {POPULAR_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => {
                  setSearchQuery(state)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-secondary hover:text-primary"
              >
                {state}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
