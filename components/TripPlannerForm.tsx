'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
    Search, 
    MapPin, 
    Navigation, 
    Loader2, 
    AlertCircle, 
    Locate,
    ArrowRight,
    Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as turf from '@turf/turf'
import { HotSpring } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface RouteInfo {
    distance: number
    duration: number
    startName: string
    endName: string
}

interface TripPlannerFormProps {
    onRouteFound: (route: any, springs: HotSpring[], info: RouteInfo) => void
    onLoadingChange: (isLoading: boolean) => void
}

export default function TripPlannerForm({ onRouteFound, onLoadingChange }: TripPlannerFormProps) {
    const [startQuery, setStartQuery] = useState('')
    const [endQuery, setEndQuery] = useState('')
    const [distance, setDistance] = useState(50) // km
    const [error, setError] = useState<string | null>(null)
    const [isLoadingLocation, setIsLoadingLocation] = useState(false)

    const [startSuggestions, setStartSuggestions] = useState<any[]>([])
    const [endSuggestions, setEndSuggestions] = useState<any[]>([])
    const [showStartSuggestions, setShowStartSuggestions] = useState(false)
    const [showEndSuggestions, setShowEndSuggestions] = useState(false)
    
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const fetchSuggestions = async (query: string, setSuggestions: (data: any[]) => void) => {
        if (query.length < 3) {
            setSuggestions([])
            return
        }
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=us,ca`
            )
            const data = await response.json()
            setSuggestions(data)
        } catch (err) {
            console.error('Error fetching suggestions:', err)
        }
    }

    const handleInputChange = (
        value: string,
        setQuery: (val: string) => void,
        setSuggestions: (data: any[]) => void,
        setShowSuggestions: (show: boolean) => void
    ) => {
        setQuery(value)
        setShowSuggestions(true)
        
        // Debounce API calls
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value, setSuggestions)
        }, 300)
    }

    const selectSuggestion = (
        suggestion: any,
        setQuery: (val: string) => void,
        setShowSuggestions: (show: boolean) => void
    ) => {
        // Format a cleaner display name
        const parts = suggestion.display_name.split(', ')
        const cleanName = parts.slice(0, 3).join(', ')
        setQuery(cleanName)
        setShowSuggestions(false)
    }

    const geocode = async (query: string) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us,ca`
        )
        const data = await response.json()
        if (!data || data.length === 0) throw new Error(`Location not found: ${query}`)
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        }
    }

    const getCurrentLocation = () => {
        setIsLoadingLocation(true)
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            setIsLoadingLocation(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    // Reverse geocode to get location name
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    )
                    const data = await response.json()
                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.village || ''
                        const state = data.address.state || ''
                        setStartQuery(`${city}, ${state}`.trim().replace(/^,\s*|,\s*$/g, ''))
                    }
                } catch (err) {
                    console.error('Error reverse geocoding:', err)
                } finally {
                    setIsLoadingLocation(false)
                }
            },
            (err) => {
                setError('Unable to get your location')
                setIsLoadingLocation(false)
            }
        )
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
                throw new Error('Could not calculate route between these locations.')
            }

            const routeGeoJSON = routeData.routes[0].geometry
            const routeDistance = routeData.routes[0].distance / 1000 // Convert to km
            const routeDuration = routeData.routes[0].duration / 60 // Convert to minutes

            // 3. Fetch all springs
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

            // Sort by distance along route (approximate)
            nearbySprings.sort((a, b) => {
                const pointA = turf.point([a.longitude, a.latitude])
                const pointB = turf.point([b.longitude, b.latitude])
                const distA = turf.pointToLineDistance(pointA, routeLine, { units: 'kilometers' })
                const distB = turf.pointToLineDistance(pointB, routeLine, { units: 'kilometers' })
                return distA - distB
            })

            onRouteFound(routeGeoJSON, nearbySprings, {
                distance: routeDistance,
                duration: routeDuration,
                startName: startQuery,
                endName: endQuery
            })

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'An error occurred while planning the trip.')
        } finally {
            onLoadingChange(false)
        }
    }

    const distanceMarks = [10, 50, 100, 150, 200]

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-xl border border-stone-100"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Start Location */}
                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">A</span>
                        Start Location
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={startQuery}
                            onChange={(e) => handleInputChange(e.target.value, setStartQuery, setStartSuggestions, setShowStartSuggestions)}
                            onFocus={() => setShowStartSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                            placeholder="e.g. Portland, OR"
                            className="w-full pl-10 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                            required
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isLoadingLocation}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-primary transition-colors rounded-lg hover:bg-stone-100"
                            title="Use my location"
                        >
                            {isLoadingLocation ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Locate className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <AnimatePresence>
                        {showStartSuggestions && startSuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden max-h-60 overflow-y-auto"
                            >
                                {startSuggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectSuggestion(suggestion, setStartQuery, setShowStartSuggestions)}
                                        className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm text-stone-700 border-b border-stone-50 last:border-none flex items-start gap-2"
                                    >
                                        <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{suggestion.display_name}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Route Connector */}
                <div className="flex items-center justify-center py-1">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-0.5 h-3 bg-stone-200"></div>
                        <ArrowRight className="w-4 h-4 text-stone-300 rotate-90" />
                        <div className="w-0.5 h-3 bg-stone-200"></div>
                    </div>
                </div>

                {/* End Location */}
                <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">B</span>
                        End Location
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={endQuery}
                            onChange={(e) => handleInputChange(e.target.value, setEndQuery, setEndSuggestions, setShowEndSuggestions)}
                            onFocus={() => setShowEndSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
                            placeholder="e.g. Boise, ID"
                            className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                            required
                            autoComplete="off"
                        />
                    </div>
                    <AnimatePresence>
                        {showEndSuggestions && endSuggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden max-h-60 overflow-y-auto"
                            >
                                {endSuggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectSuggestion(suggestion, setEndQuery, setShowEndSuggestions)}
                                        className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm text-stone-700 border-b border-stone-50 last:border-none flex items-start gap-2"
                                    >
                                        <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{suggestion.display_name}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Distance Slider */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Max Detour Distance
                        </label>
                        <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm">
                            {Math.round(distance * 0.621371)} mi
                        </span>
                    </div>
                    <div className="relative pt-2">
                        <input
                            type="range"
                            min="10"
                            max="200"
                            step="10"
                            value={distance}
                            onChange={e => setDistance(parseInt(e.target.value))}
                            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                            style={{
                                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((distance - 10) / 190) * 100}%, #e7e5e4 ${((distance - 10) / 190) * 100}%, #e7e5e4 100%)`
                            }}
                        />
                        <div className="flex justify-between text-xs text-stone-400 font-medium mt-2">
                            {distanceMarks.map(mark => (
                                <span key={mark} className={distance === mark ? 'text-primary font-bold' : ''}>
                                    {Math.round(mark * 0.621371)} mi
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all group"
                >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Find Hot Springs
                </Button>
            </form>
        </motion.div>
    )
}

