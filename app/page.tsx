'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HotSpring } from '@/types'
import Link from 'next/link'
import { MapPin, Thermometer, Heart, Search, Mountain, Tent, Accessibility, Footprints, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [springs, setSprings] = useState<HotSpring[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch springs (featured or search results)
  useEffect(() => {
    const fetchSprings = async () => {
      setLoading(true)
      let query = supabase
        .from('hot_springs')
        .select('*, spring_reviews(rating)')

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`)
      } else {
        // If no search, just get some featured ones (we'll sort by rating later)
        // We fetch more to ensure we have enough high-rated ones after client-side sort
        query = query.limit(20)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching springs:', error)
      } else {
        // Calculate average rating and sort
        const springsWithRating = data.map((spring: any) => {
          const ratings = spring.spring_reviews?.map((r: any) => r.rating) || []
          const avg = ratings.length > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
            : 0
          return { ...spring, average_rating: avg }
        })

        // Sort by rating (desc) then by name
        const sorted = springsWithRating.sort((a, b) => {
          if (b.average_rating !== a.average_rating) {
            return b.average_rating - a.average_rating
          }
          return a.name.localeCompare(b.name)
        })

        setSprings(sorted.slice(0, searchQuery ? 50 : 6))
      }
      setLoading(false)
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchSprings()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="hero-pattern py-32 px-4 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            Find Your Primitive Paradise
          </h1>
          <p className="text-xl text-white/80 font-medium max-w-2xl mx-auto">
            Discover, rate, and preserve natural hot springs across America.
          </p>

          <div className="pt-8 max-w-2xl mx-auto w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-stone-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-16 pr-6 py-5 bg-white rounded-full text-stone-900 placeholder-stone-400 focus:ring-4 focus:ring-white/20 focus:outline-none shadow-xl text-lg font-medium"
                placeholder="Search by name or state (e.g., 'Oregon')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center gap-8 mt-8 text-white/70 font-medium text-sm">
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <Tent className="w-4 h-4" /> Primitive
              </button>
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <Accessibility className="w-4 h-4" /> Accessible
              </button>
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <Footprints className="w-4 h-4" /> Hike-in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-3xl font-bold text-stone-900">
            Popular Soaks
          </h2>
          <p className="text-stone-500 font-medium">
            {springs.length} locations found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-stone-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {springs.map((spring) => (
              <Link href={`/springs/${spring.id}`} key={spring.id} className="group block h-full">
                <div className="relative h-80 rounded-2xl overflow-hidden bg-[#2d5a4c] shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  {/* Image or Placeholder */}
                  {spring.hero_image_url ? (
                    <img
                      src={spring.hero_image_url}
                      alt={spring.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <Mountain className="w-32 h-32 text-white" strokeWidth={1} />
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Favorite Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-stone-300 hover:text-red-500 transition-colors shadow-md">
                    <Heart className="w-5 h-5 fill-current" />
                  </button>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-1 text-shadow-sm">{spring.name}</h3>
                    <div className="flex items-center text-sm font-medium opacity-90 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {spring.state}
                    </div>

                    <div className="flex items-center gap-3">
                      {spring.water_temperature_c && (
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-white/10">
                          <Thermometer className="w-4 h-4" />
                          {Math.round(spring.water_temperature_c * 9 / 5 + 32)}°F
                        </div>
                      )}
                      {(spring.average_rating || 0) > 0 && (
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-white/10 text-amber-400">
                          <Star className="w-4 h-4 fill-current" />
                          {(spring.average_rating || 0).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
