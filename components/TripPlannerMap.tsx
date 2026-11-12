'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Map, { Source, Layer, MapRef, Popup, NavigationControl, Marker } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { HotSpring } from '@/types'
import { Thermometer, MapPin, Star, ExternalLink, X } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { displayName, fahrenheit } from '@/lib/springs'

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

interface TripPlannerMapProps {
    routeGeoJSON: any
    springs: HotSpring[]
}

export default function TripPlannerMap({ routeGeoJSON, springs }: TripPlannerMapProps) {
    const mapRef = useRef<MapRef>(null)
    const [selectedSpring, setSelectedSpring] = useState<HotSpring | null>(null)
    const [hoveredSpringId, setHoveredSpringId] = useState<string | null>(null)

    // Initial view state (center of US)
    const [viewState, setViewState] = useState({
        longitude: -115.0,
        latitude: 42.0,
        zoom: 4
    })

    // Fit bounds when route changes
    useEffect(() => {
        if (routeGeoJSON && mapRef.current) {
            let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90
            routeGeoJSON.coordinates.forEach((coord: number[]) => {
                minLng = Math.min(minLng, coord[0])
                maxLng = Math.max(maxLng, coord[0])
                minLat = Math.min(minLat, coord[1])
                maxLat = Math.max(maxLat, coord[1])
            })

            // Add springs to bounds calculation
            springs.forEach(spring => {
                minLng = Math.min(minLng, spring.longitude)
                maxLng = Math.max(maxLng, spring.longitude)
                minLat = Math.min(minLat, spring.latitude)
                maxLat = Math.max(maxLat, spring.latitude)
            })

            mapRef.current.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                { padding: 60, duration: 1000 }
            )
        }
    }, [routeGeoJSON, springs])

    const handleMapClick = useCallback((e: any) => {
        const feature = e.features?.[0]
        if (feature && feature.layer.id === 'springs-point') {
            const spring = springs.find(s => s.id === feature.properties.id)
            if (spring) setSelectedSpring(spring)
        }
    }, [springs])

    const springsGeoJSON: FeatureCollection = {
        type: 'FeatureCollection',
        features: springs.map(spring => ({
            type: 'Feature',
            properties: { 
                id: spring.id,
                name: spring.name,
                temperature: spring.water_temperature_c
            },
            geometry: {
                type: 'Point',
                coordinates: [spring.longitude, spring.latitude]
            }
        }))
    }

    return (
        <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MAP_STYLE}
            interactiveLayerIds={['springs-point']}
            onClick={handleMapClick}
            cursor={hoveredSpringId ? 'pointer' : 'grab'}
            onMouseEnter={(e) => {
                if (e.features?.[0]?.layer.id === 'springs-point') {
                    setHoveredSpringId(e.features[0].properties.id)
                }
            }}
            onMouseLeave={() => setHoveredSpringId(null)}
        >
            <NavigationControl position="top-right" showCompass={false} />

            {/* Route Line Shadow */}
            {routeGeoJSON && (
                <Source id="route-shadow" type="geojson" data={{ type: 'Feature', geometry: routeGeoJSON, properties: {} }}>
                    <Layer
                        id="route-line-shadow"
                        type="line"
                        layout={{
                            'line-join': 'round',
                            'line-cap': 'round'
                        }}
                        paint={{
                            'line-color': '#000000',
                            'line-width': 10,
                            'line-opacity': 0.1,
                            'line-blur': 4
                        }}
                    />
                </Source>
            )}

            {/* Route Line */}
            {routeGeoJSON && (
                <Source id="route" type="geojson" data={{ type: 'Feature', geometry: routeGeoJSON, properties: {} }}>
                    <Layer
                        id="route-line"
                        type="line"
                        layout={{
                            'line-join': 'round',
                            'line-cap': 'round'
                        }}
                        paint={{
                            'line-color': '#3b82f6',
                            'line-width': 5,
                            'line-opacity': 0.9
                        }}
                    />
                </Source>
            )}

            {/* Start/End Markers */}
            {routeGeoJSON && routeGeoJSON.coordinates.length > 0 && (
                <>
                    {/* Start Marker */}
                    <Marker
                        longitude={routeGeoJSON.coordinates[0][0]}
                        latitude={routeGeoJSON.coordinates[0][1]}
                        anchor="center"
                    >
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                            A
                        </div>
                    </Marker>
                    {/* End Marker */}
                    <Marker
                        longitude={routeGeoJSON.coordinates[routeGeoJSON.coordinates.length - 1][0]}
                        latitude={routeGeoJSON.coordinates[routeGeoJSON.coordinates.length - 1][1]}
                        anchor="center"
                    >
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                            B
                        </div>
                    </Marker>
                </>
            )}

            {/* Springs Glow Effect */}
            <Source id="springs-glow" type="geojson" data={springsGeoJSON}>
                <Layer
                    id="springs-glow"
                    type="circle"
                    paint={{
                        'circle-color': '#ef4444',
                        'circle-radius': 20,
                        'circle-opacity': 0.15,
                        'circle-blur': 1
                    }}
                />
            </Source>

            {/* Springs Markers */}
            <Source id="springs" type="geojson" data={springsGeoJSON}>
                <Layer
                    id="springs-point"
                    type="circle"
                    paint={{
                        'circle-color': [
                            'case',
                            ['has', 'temperature'],
                            [
                                'interpolate',
                                ['linear'],
                                ['get', 'temperature'],
                                20, '#22c55e',  // Cool - green
                                35, '#eab308',  // Warm - yellow
                                45, '#f97316',  // Hot - orange
                                55, '#ef4444'   // Very hot - red
                            ],
                            '#ef4444'
                        ],
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            4, 6,
                            8, 10,
                            12, 14
                        ],
                        'circle-stroke-width': 3,
                        'circle-stroke-color': '#ffffff'
                    }}
                />
            </Source>

            {/* Selected Spring Popup */}
            <AnimatePresence>
                {selectedSpring && (
                    <Popup
                        longitude={selectedSpring.longitude}
                        latitude={selectedSpring.latitude}
                        anchor="bottom"
                        offset={25}
                        onClose={() => setSelectedSpring(null)}
                        closeButton={false}
                        className="z-50"
                        maxWidth="340px"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="rounded-2xl overflow-hidden shadow-2xl font-sans bg-white"
                        >
                            {/* Header Image */}
                            <div className="relative h-40 bg-gradient-to-br from-stone-100 to-stone-200">
                                {selectedSpring.hero_image_url ? (
                                    <img
                                        src={selectedSpring.hero_image_url}
                                        alt={displayName(selectedSpring.name)}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Thermometer className="w-12 h-12 text-stone-300" />
                                    </div>
                                )}
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedSpring(null)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Temperature Badge */}
                                {selectedSpring.water_temperature_c && (
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-bold text-orange-600 shadow-sm flex items-center gap-1">
                                        <Thermometer className="w-3.5 h-3.5" />
                                        {fahrenheit(selectedSpring.water_temperature_c)}°F
                                    </div>
                                )}

                                {/* Title on Image */}
                                <div className="absolute bottom-3 left-3 right-3">
                                    <h3 className="font-bold text-white text-lg leading-tight drop-shadow-lg">
                                        {displayName(selectedSpring.name)}
                                    </h3>
                                    <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {selectedSpring.state || 'Unknown Location'}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                {selectedSpring.description && (
                                    <p className="text-sm text-stone-600 line-clamp-2 mb-4">
                                        {selectedSpring.description}
                                    </p>
                                )}
                                
                                <Link href={`/springs/${selectedSpring.id}`} className="block">
                                    <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold h-11 shadow-lg shadow-primary/20 transition-all group">
                                        View Details
                                        <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </Popup>
                )}
            </AnimatePresence>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-stone-100">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Temperature</p>
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-stone-600">Cool</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-stone-600">Warm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-stone-600">Hot</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-stone-600">Very Hot</span>
                    </div>
                </div>
            </div>
        </Map>
    )
}

