'use client'

import { HotSpring } from '@/types'
import { Thermometer, MapPin, Star, ChevronRight, Mountain, Footprints, Car } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { displayName, fahrenheit } from '@/lib/springs'

interface TripSpringCardProps {
    spring: HotSpring
    index: number
}

export default function TripSpringCard({ spring, index }: TripSpringCardProps) {
    // Get temperature color
    const getTemperatureColor = (temp: number | null) => {
        if (!temp) return 'bg-stone-100 text-stone-500'
        if (temp < 30) return 'bg-green-100 text-green-700'
        if (temp < 40) return 'bg-yellow-100 text-yellow-700'
        if (temp < 50) return 'bg-orange-100 text-orange-700'
        return 'bg-red-100 text-red-700'
    }

    // Get temperature label
    const getTemperatureLabel = (temp: number | null) => {
        if (!temp) return 'Unknown'
        if (temp < 30) return 'Cool'
        if (temp < 40) return 'Warm'
        if (temp < 50) return 'Hot'
        return 'Very Hot'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link href={`/springs/${spring.id}`}>
                <div className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    {/* Image */}
                    <div className="relative h-36 bg-gradient-to-br from-stone-100 to-stone-50 overflow-hidden">
                        {spring.hero_image_url ? (
                            <img
                                src={spring.hero_image_url}
                                alt={displayName(spring.name)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Mountain className="w-10 h-10 text-stone-200" />
                            </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Index Badge */}
                        <div className="absolute top-2 left-2 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center text-xs font-bold text-stone-600 shadow-sm">
                            {index + 1}
                        </div>

                        {/* Temperature Badge */}
                        {spring.water_temperature_c && (
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm ${getTemperatureColor(spring.water_temperature_c)}`}>
                                {fahrenheit(spring.water_temperature_c)}°F
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-stone-800 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                {displayName(spring.name)}
                            </h4>
                            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                        </div>
                        
                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-stone-500 mb-3">
                            <MapPin className="w-3 h-3" />
                            <span>{spring.state || 'Unknown Location'}</span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 text-xs">
                            {/* Temperature */}
                            <div className="flex items-center gap-1.5">
                                <div className={`p-1 rounded ${getTemperatureColor(spring.water_temperature_c)}`}>
                                    <Thermometer className="w-3 h-3" />
                                </div>
                                <span className="text-stone-600 font-medium">
                                    {getTemperatureLabel(spring.water_temperature_c)}
                                </span>
                            </div>

                            {/* Rating if available */}
                            {spring.average_rating && spring.average_rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span className="text-stone-600 font-medium">
                                        {spring.average_rating.toFixed(1)}
                                    </span>
                                </div>
                            )}

                            {/* Hike Distance if available */}
                            {spring.hike_distance_km && spring.hike_distance_km > 0 && (
                                <div className="flex items-center gap-1 text-stone-400">
                                    <Footprints className="w-3 h-3" />
                                    <span>{(spring.hike_distance_km * 0.621371).toFixed(1)} mi hike</span>
                                </div>
                            )}
                        </div>

                        {/* Description Preview */}
                        {spring.description && (
                            <p className="text-xs text-stone-400 line-clamp-2 mt-3">
                                {spring.description}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

