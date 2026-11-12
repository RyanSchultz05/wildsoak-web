'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HotSpring } from '@/types'
import { 
    Navigation, 
    MapPin, 
    Thermometer, 
    Clock, 
    Route, 
    List, 
    Map as MapIcon,
    Sparkles,
    ChevronRight,
    Star,
    Mountain,
    Car
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import TripPlannerForm from '@/components/TripPlannerForm'
import TripPlannerMap from '@/components/TripPlannerMap'
import TripSpringCard from '@/components/TripSpringCard'
import Link from 'next/link'

interface RouteInfo {
    distance: number // in km
    duration: number // in minutes
    startName: string
    endName: string
}

export default function RoadTripPage() {
    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null)
    const [springs, setSprings] = useState<HotSpring[]>([])
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split')
    const [sortBy, setSortBy] = useState<'distance' | 'temperature' | 'rating'>('distance')
    const [hasSearched, setHasSearched] = useState(false)

    const handleRouteFound = (route: any, foundSprings: HotSpring[], info: RouteInfo) => {
        setRouteGeoJSON(route)
        setSprings(foundSprings)
        setRouteInfo(info)
        setHasSearched(true)
    }

    // Sort springs
    const sortedSprings = [...springs].sort((a, b) => {
        if (sortBy === 'temperature') {
            return (b.water_temperature_c || 0) - (a.water_temperature_c || 0)
        }
        if (sortBy === 'rating') {
            return (b.average_rating || 0) - (a.average_rating || 0)
        }
        return 0 // distance - keep original order from route
    })

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
            {/* Hero Header */}
            <div className="hero-pattern">
                <div className="container mx-auto px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl"
                    >
                        <div className="flex items-center gap-2 text-emerald-300 mb-4">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-semibold tracking-wide uppercase">Trip Planner</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                            Plan Your Hot Spring Road Trip
                        </h1>
                        <p className="text-lg text-emerald-100/80 leading-relaxed">
                            Enter your start and destination to discover natural hot springs along your route. 
                            Perfect for planning the ultimate relaxation road trip.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 -mt-6 pb-12">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - Form & Results */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`${viewMode === 'map' ? 'hidden lg:block' : ''} ${viewMode === 'list' ? 'lg:w-full' : 'lg:w-[420px]'} shrink-0`}
                    >
                        {/* Form Card */}
                        <TripPlannerForm 
                            onRouteFound={handleRouteFound} 
                            onLoadingChange={setIsLoading} 
                        />

                        {/* Route Stats */}
                        <AnimatePresence>
                            {routeInfo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm"
                                >
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-50 rounded-xl">
                                                <Route className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <p className="text-lg font-bold text-stone-800">{Math.round(routeInfo.distance * 0.621371)} mi</p>
                                            <p className="text-xs text-stone-400 font-medium">Distance</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-amber-50 rounded-xl">
                                                <Clock className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <p className="text-lg font-bold text-stone-800">
                                                {Math.floor(routeInfo.duration / 60)}h {Math.round(routeInfo.duration % 60)}m
                                            </p>
                                            <p className="text-xs text-stone-400 font-medium">Drive Time</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-xl">
                                                <Thermometer className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <p className="text-lg font-bold text-stone-800">{springs.length}</p>
                                            <p className="text-xs text-stone-400 font-medium">Hot Springs</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* View Toggle & Sort */}
                        {hasSearched && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 flex items-center justify-between"
                            >
                                <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('split')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            viewMode === 'split' 
                                                ? 'bg-white text-stone-800 shadow-sm' 
                                                : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                    >
                                        Split
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                                            viewMode === 'list' 
                                                ? 'bg-white text-stone-800 shadow-sm' 
                                                : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                    >
                                        <List className="w-4 h-4" />
                                        List
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                                            viewMode === 'map' 
                                                ? 'bg-white text-stone-800 shadow-sm' 
                                                : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                    >
                                        <MapIcon className="w-4 h-4" />
                                        Map
                                    </button>
                                </div>

                                {springs.length > 0 && (
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="text-sm bg-white border border-stone-200 rounded-lg px-3 py-1.5 font-medium text-stone-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="distance">Sort by Distance</option>
                                        <option value="temperature">Sort by Temperature</option>
                                        <option value="rating">Sort by Rating</option>
                                    </select>
                                )}
                            </motion.div>
                        )}

                        {/* Results List */}
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                        <Car className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                                    </div>
                                    <p className="text-stone-600 font-medium">Calculating route...</p>
                                    <p className="text-stone-400 text-sm mt-1">Finding hot springs along the way</p>
                                </div>
                            ) : springs.length > 0 ? (
                                <div className={`grid gap-3 ${viewMode === 'list' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
                                    {sortedSprings.map((spring, index) => (
                                        <TripSpringCard 
                                            key={spring.id} 
                                            spring={spring} 
                                            index={index}
                                        />
                                    ))}
                                </div>
                            ) : hasSearched ? (
                                <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-stone-50 rounded-full flex items-center justify-center">
                                        <Mountain className="w-8 h-8 text-stone-300" />
                                    </div>
                                    <p className="text-stone-600 font-medium">No hot springs found</p>
                                    <p className="text-stone-400 text-sm mt-1">Try increasing the detour distance</p>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-stone-50 to-emerald-50/30 rounded-2xl border border-dashed border-stone-200 p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Navigation className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="text-stone-600 font-medium">Ready to explore?</p>
                                    <p className="text-stone-400 text-sm mt-1">Enter your start and end locations above</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Map Area */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`flex-1 ${viewMode === 'list' ? 'hidden' : ''}`}
                    >
                        <div className={`sticky top-24 rounded-2xl overflow-hidden shadow-xl border border-stone-200 ${
                            viewMode === 'map' ? 'h-[calc(100vh-180px)]' : 'h-[600px]'
                        }`}>
                            <TripPlannerMap 
                                routeGeoJSON={routeGeoJSON} 
                                springs={sortedSprings} 
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
