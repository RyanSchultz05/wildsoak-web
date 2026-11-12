'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as turf from '@turf/turf'
import { HotSpring } from '@/types'

interface RoadTripFormProps {
    onRouteFound: (route: any, springs: HotSpring[]) => void
    onLoadingChange: (isLoading: boolean) => void
}

export default function RoadTripForm({ onRouteFound, onLoadingChange }: RoadTripFormProps) {
    const [startQuery, setStartQuery] = useState('')
    const [endQuery, setEndQuery] = useState('')
    const [distance, setDistance] = useState(50) // km
    const [error, setError] = useState<string | null>(null)

    const [startSuggestions, setStartSuggestions] = useState<any[]>([])
    const [endSuggestions, setEndSuggestions] = useState<any[]>([])
    const [showStartSuggestions, setShowStartSuggestions] = useState(false)
    const [showEndSuggestions, setShowEndSuggestions] = useState(false)

    const fetchSuggestions = async (query: string, setSuggestions: (data: any[]) => void) => {
        if (query.length < 3) {
            setSuggestions([])
            return
        }
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`)
            const data = await response.json()
            setSuggestions(data)
        } catch (err) {
            console.error('Error fetching suggestions:', err)
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setQuery: (val: string) => void,
        setSuggestions: (data: any[]) => void,
        setShowSuggestions: (show: boolean) => void
    ) => {
        const val = e.target.value
        setQuery(val)
        setShowSuggestions(true)
        // Debounce could be added here, but for simplicity calling directly
        fetchSuggestions(val, setSuggestions)
    }

    const selectSuggestion = (
        suggestion: any,
        setQuery: (val: string) => void,
        setShowSuggestions: (show: boolean) => void
    ) => {
        setQuery(suggestion.display_name)
        setShowSuggestions(false)
    }

    const geocode = async (query: string) => {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        const data = await response.json()
        if (!data || data.length === 0) throw new Error(`Location not found: ${query}`)
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        onLoadingChange(true)
        setShowStartSuggestions(false)
        setShowEndSuggestions(false)

        try {
            // 1. Geocode Start and End
            const start = await geocode(startQuery)
            const end = await geocode(endQuery)

            // 2. Get Route from OSRM
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`
            const routeRes = await fetch(osrmUrl)
            const routeData = await routeRes.json()

            if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
                throw new Error('Could not calculate route.')
            }

            const routeGeoJSON = routeData.routes[0].geometry

            // 3. Fetch all springs (optimized: could filter by bounding box first if DB supports it, but for now fetching all is okay as per existing explore page pattern, or we can fetch a large bounding box)
            // For better performance, let's fetch all. The dataset isn't huge yet.
            const { data: allSprings, error: dbError } = await supabase
                .from('hot_springs')
                .select('*')

            if (dbError) throw dbError

            // 4. Filter springs along route using Turf
            const routeLine = turf.lineString(routeGeoJSON.coordinates)
            const bufferedRoute = turf.buffer(routeLine, distance, { units: 'kilometers' })

            if (!bufferedRoute) throw new Error('Could not calculate buffer.')

            const nearbySprings = allSprings.filter(spring => {
                const point = turf.point([spring.longitude, spring.latitude])
                return turf.booleanPointInPolygon(point, bufferedRoute)
            })

            onRouteFound(routeGeoJSON, nearbySprings)

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'An error occurred while planning the trip.')
        } finally {
            onLoadingChange(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                <Navigation className="w-6 h-6 text-primary" />
                Plan Your Trip
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Start Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={startQuery}
                            onChange={(e) => handleInputChange(e, setStartQuery, setStartSuggestions, setShowStartSuggestions)}
                            onFocus={() => setShowStartSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)} // Delay to allow click
                            placeholder="e.g. Portland, OR"
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border-none rounded-xl text-stone-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required
                            autoComplete="off"
                        />
                    </div>
                    {showStartSuggestions && startSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden max-h-60 overflow-y-auto">
                            {startSuggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => selectSuggestion(suggestion, setStartQuery, setShowStartSuggestions)}
                                    className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm text-stone-700 border-b border-stone-50 last:border-none"
                                >
                                    {suggestion.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">End Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={endQuery}
                            onChange={(e) => handleInputChange(e, setEndQuery, setEndSuggestions, setShowEndSuggestions)}
                            onFocus={() => setShowEndSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
                            placeholder="e.g. Boise, ID"
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border-none rounded-xl text-stone-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required
                            autoComplete="off"
                        />
                    </div>
                    {showEndSuggestions && endSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden max-h-60 overflow-y-auto">
                            {endSuggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => selectSuggestion(suggestion, setEndQuery, setShowEndSuggestions)}
                                    className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm text-stone-700 border-b border-stone-50 last:border-none"
                                >
                                    {suggestion.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        Max Detour: <span className="text-primary">{distance} km</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="200"
                        step="10"
                        value={distance}
                        onChange={e => setDistance(parseInt(e.target.value))}
                        className="w-full accent-primary h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-stone-400 font-medium">
                        <span>10 km</span>
                        <span>200 km</span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all">
                    Find Hot Springs
                </Button>
            </form>
        </div>
    )
}
