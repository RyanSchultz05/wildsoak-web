'use client'

import { useState, useRef, useEffect } from 'react'
import Map, { Source, Layer, MapRef, Popup, NavigationControl } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { HotSpring } from '@/types'
import { Thermometer, MapPin } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { displayName } from '@/lib/springs'

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

interface RoadTripMapProps {
    routeGeoJSON: any
    springs: HotSpring[]
}

export default function RoadTripMap({ routeGeoJSON, springs }: RoadTripMapProps) {
    const mapRef = useRef<MapRef>(null)
    const [selectedSpring, setSelectedSpring] = useState<HotSpring | null>(null)

    // Initial view state (center of US approx)
    const [viewState, setViewState] = useState({
        longitude: -98.5795,
        latitude: 39.8283,
        zoom: 3
    })

    // Fit bounds when route changes
    useEffect(() => {
        if (routeGeoJSON && mapRef.current) {
            const coordinates = routeGeoJSON.coordinates
            const bounds = coordinates.reduce((bounds: any, coord: any) => {
                return bounds.extend(coord)
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]))

            mapRef.current.fitBounds(bounds, {
                padding: 50,
                duration: 1000
            })
        }
    }, [routeGeoJSON])

    // Need to import maplibregl for LngLatBounds if not available on window
    // But react-map-gl usually handles this. Let's use a simpler bounding box calculation if needed,
    // or just rely on the fact that we can calculate min/max easily.
    useEffect(() => {
        if (routeGeoJSON && mapRef.current) {
            let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90
            routeGeoJSON.coordinates.forEach((coord: number[]) => {
                minLng = Math.min(minLng, coord[0])
                maxLng = Math.max(maxLng, coord[0])
                minLat = Math.min(minLat, coord[1])
                maxLat = Math.max(maxLat, coord[1])
            })

            mapRef.current.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                { padding: 50, duration: 1000 }
            )
        }
    }, [routeGeoJSON])


    const springsGeoJSON: FeatureCollection = {
        type: 'FeatureCollection',
        features: springs.map(spring => ({
            type: 'Feature',
            properties: { ...spring },
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
            onClick={(e) => {
                const feature = e.features?.[0]
                if (feature) {
                    const spring = springs.find(s => s.id === feature.properties.id)
                    if (spring) setSelectedSpring(spring)
                }
            }}
        >
            <NavigationControl position="top-right" showCompass={false} />

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
                            'line-color': '#3b82f6', // Blue-500
                            'line-width': 6,
                            'line-opacity': 0.8
                        }}
                    />
                </Source>
            )}

            {/* Springs Markers */}
            <Source id="springs" type="geojson" data={springsGeoJSON}>
                <Layer
                    id="springs-point"
                    type="circle"
                    paint={{
                        'circle-color': '#ef4444', // Red-500
                        'circle-radius': 8,
                        'circle-stroke-width': 2,
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
                                    alt={displayName(selectedSpring.name)}
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
                            <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">{displayName(selectedSpring.name)}</h3>
                            <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                <MapPin className="w-3 h-3 mr-1" />
                                {selectedSpring.state || 'Unknown'}
                            </div>
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
    )
}
