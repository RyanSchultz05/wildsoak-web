'use client'

import { useEffect, useState, useRef, useMemo, Suspense } from 'react'
import Map, { Source, Layer, Marker, Popup, NavigationControl, MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { supabase } from '@/lib/supabase'
import { HotSpring } from '@/types'
import Link from 'next/link'
import { MapPin, Search, Thermometer, X, SlidersHorizontal, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FeatureCollection } from 'geojson'
import { useSearchParams, useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Premium Map Style (CartoDB Voyager)
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

type TempCategory = 'hot' | 'warm' | 'cool' | 'unknown'

function ExplorePageContent() {
    const [springs, setSprings] = useState<HotSpring[]>([])
    const [selectedSpring, setSelectedSpring] = useState<HotSpring | null>(null)
    const mapRef = useRef<MapRef>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const initialSearch = searchParams.get('search') || ''
    const [searchQuery, setSearchQuery] = useState(initialSearch)

    // Filter State
    const [selectedTemps, setSelectedTemps] = useState<TempCategory[]>([])

    const [viewState, setViewState] = useState({
        longitude: -115.5,
        latitude: 44.0,
        zoom: 4
    })

    useEffect(() => {
        async function fetchSprings() {
            let allSprings: HotSpring[] = []
            let page = 0
            const pageSize = 1000

            while (true) {
                const { data, error } = await supabase
                    .from('hot_springs')
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1)

                if (error) {
                    console.error('Error fetching springs:', error)
                    break
                }

                if (!data || data.length === 0) break

                allSprings = [...allSprings, ...data]

                if (data.length < pageSize) break
                page++
            }

            setSprings(allSprings)
        }
        fetchSprings()
    }, [])

    // Helper to categorize temperature
    const getTempCategory = (temp: number | null): TempCategory => {
        if (temp === null) return 'unknown'
        if (temp >= 40) return 'hot'
        if (temp >= 30) return 'warm'
        return 'cool'
    }

    // Filter springs
    const filteredSprings = useMemo(() => {
        let result = springs

        // 1. Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            result = result.filter(spring =>
                spring.name.toLowerCase().includes(lowerQuery) ||
                (spring.state && spring.state.toLowerCase().includes(lowerQuery))
            )
        }

        // 2. Temperature Filter
        if (selectedTemps.length > 0) {
            result = result.filter(spring => {
                const category = getTempCategory(spring.water_temperature_c)
                return selectedTemps.includes(category)
            })
        }

        return result
    }, [springs, searchQuery, selectedTemps])

    // Convert to GeoJSON
    const springsGeoJSON: FeatureCollection = useMemo(() => ({
        type: 'FeatureCollection',
        features: filteredSprings.map(spring => ({
            type: 'Feature',
            properties: { ...spring },
            geometry: {
                type: 'Point',
                coordinates: [spring.longitude, spring.latitude]
            }
        }))
    }), [filteredSprings])

    // Zoom to results
    useEffect(() => {
        if (filteredSprings.length > 0 && filteredSprings.length < springs.length && mapRef.current) {
            let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90
            filteredSprings.forEach(s => {
                minLng = Math.min(minLng, s.longitude)
                maxLng = Math.max(maxLng, s.longitude)
                minLat = Math.min(minLat, s.latitude)
                maxLat = Math.max(maxLat, s.latitude)
            })

            mapRef.current.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                { padding: 100, duration: 1000 }
            )
        }
    }, [filteredSprings, springs.length])

    const onMapClick = (event: any) => {
        const feature = event.features?.[0]
        if (!feature) return

        const clusterId = feature.properties.cluster_id
        const map = mapRef.current?.getMap()

        if (clusterId && map) {
            (map.getSource('springs') as any).getClusterExpansionZoom(
                clusterId,
                (err: any, zoom: number) => {
                    if (err) return
                    map.easeTo({
                        center: (feature.geometry as any).coordinates,
                        zoom,
                        duration: 500
                    })
                }
            )
        } else if (feature.properties.id) {
            const spring = springs.find(s => s.id === feature.properties.id)
            if (spring) setSelectedSpring(spring)
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
            params.set('search', searchQuery)
        } else {
            params.delete('search')
        }
        router.push(`/explore?${params.toString()}`)
    }

    const clearSearch = () => {
        setSearchQuery('')
        router.push('/explore')
    }

    const toggleTemp = (category: TempCategory) => {
        setSelectedTemps(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    return (
        <div className="h-[calc(100vh-80px)] relative bg-slate-50">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLE}
                interactiveLayerIds={['clusters', 'unclustered-point']}
                onClick={onMapClick}
            >
                <NavigationControl position="top-right" showCompass={false} />

                <Source
                    id="springs"
                    type="geojson"
                    data={springsGeoJSON}
                    cluster={true}
                    clusterMaxZoom={14}
                    clusterRadius={50}
                >
                    {/* Clusters: Vibrant Azure Circles */}
                    <Layer
                        id="clusters"
                        type="circle"
                        filter={['has', 'point_count']}
                        paint={{
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                '#0ea5e9', // Sky-500 (Light Azure)
                                10,
                                '#0284c7', // Sky-600 (Medium Azure)
                                30,
                                '#0369a1'  // Sky-700 (Deep Azure)
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                20, 10, 30, 30, 40
                            ],
                            'circle-stroke-width': 4,
                            'circle-stroke-color': 'rgba(255,255,255,0.6)'
                        }}
                    />

                    {/* Cluster Counts: Text */}
                    <Layer
                        id="cluster-count"
                        type="symbol"
                        filter={['has', 'point_count']}
                        layout={{
                            'text-field': '{point_count_abbreviated}',
                            'text-font': ['Open Sans Bold'],
                            'text-size': 14,
                            'text-offset': [0, 0]
                        }}
                        paint={{
                            'text-color': '#ffffff'
                        }}
                    />

                    {/* Unclustered Points: Dark Slate Dots */}
                    <Layer
                        id="unclustered-point"
                        type="circle"
                        filter={['!', ['has', 'point_count']]}
                        paint={{
                            'circle-color': '#0f172a', // Slate-900
                            'circle-radius': 8,
                            'circle-stroke-width': 3,
                            'circle-stroke-color': '#ffffff'
                        }}
                    />
                </Source>

                {selectedSpring && (
                    <Popup
                        longitude={selectedSpring.longitude}
                        latitude={selectedSpring.latitude}
                        anchor="bottom"
                        offset={20}
                        onClose={() => setSelectedSpring(null)}
                        closeButton={false}
                        className="z-50"
                        maxWidth="320px"
                    >
                        <div className="p-0 rounded-2xl overflow-hidden shadow-2xl border border-white/50 font-sans">
                            <div className="relative h-36 bg-slate-100">
                                {selectedSpring.hero_image_url ? (
                                    <img
                                        src={selectedSpring.hero_image_url}
                                        alt={selectedSpring.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                        <Thermometer className="w-8 h-8 text-slate-300" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-slate-900 shadow-sm">
                                    {selectedSpring.water_temperature_c ? `${selectedSpring.water_temperature_c}°C` : 'N/A'}
                                </div>
                            </div>

                            <div className="p-5 bg-white">
                                <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">{selectedSpring.name}</h3>
                                <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {selectedSpring.state || 'Unknown'}
                                </div>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                                    {selectedSpring.description || 'No description available.'}
                                </p>
                                <Link href={`/springs/${selectedSpring.id}`} className="block">
                                    <Button className="w-full rounded-xl bg-slate-900 hover:bg-primary text-white shadow-lg shadow-slate-900/10 transition-colors">
                                        View Details
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Search & Filter Overlay */}
            <div className="absolute top-6 left-6 right-6 md:left-auto md:right-6 md:w-auto z-10 flex gap-3 items-start">
                <form onSubmit={handleSearchSubmit} className="flex-1 md:w-80 bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-xl shadow-slate-900/5 border border-white/50 flex items-center transition-all hover:shadow-2xl hover:bg-white group focus-within:ring-2 focus-within:ring-primary/20">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-focus-within:text-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 w-full px-3 py-2 text-sm font-medium outline-none"
                    />
                    {searchQuery && (
                        <button type="button" onClick={clearSearch} className="p-2 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </form>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="icon" className={`h-12 w-12 rounded-2xl shadow-xl border border-white/50 transition-all ${selectedTemps.length > 0 ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20' : 'bg-white/90 text-slate-600 hover:bg-white'}`}>
                            <SlidersHorizontal className="w-5 h-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 rounded-2xl shadow-2xl border-slate-100" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900">Filters</h4>
                                {selectedTemps.length > 0 && (
                                    <button onClick={() => setSelectedTemps([])} className="text-xs font-bold text-red-500 hover:text-red-600">
                                        Reset
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temperature</label>
                                {[
                                    { id: 'hot', label: 'Hot (≥40°C)', color: 'bg-red-100 text-red-700' },
                                    { id: 'warm', label: 'Warm (30-39°C)', color: 'bg-orange-100 text-orange-700' },
                                    { id: 'cool', label: 'Cool (<30°C)', color: 'bg-blue-100 text-blue-700' },
                                    { id: 'unknown', label: 'Unknown', color: 'bg-slate-100 text-slate-600' }
                                ].map((temp) => (
                                    <button
                                        key={temp.id}
                                        onClick={() => toggleTemp(temp.id as TempCategory)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedTemps.includes(temp.id as TempCategory) ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        <span className="font-medium text-sm">{temp.label}</span>
                                        {selectedTemps.includes(temp.id as TempCategory) && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
            <ExplorePageContent />
        </Suspense>
    )
}
