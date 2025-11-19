'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HotSpring, Review } from '@/types'
import { useParams } from 'next/navigation'
import { MapPin, Thermometer, Navigation, Star, ArrowLeft, Info, Calendar, Mountain, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RichText } from '@/components/RichText'
import ReviewComposer from '@/components/ReviewComposer'
import { User } from '@supabase/supabase-js'

export default function SpringDetailClient() {
    const { id } = useParams()
    const [spring, setSpring] = useState<HotSpring | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [editingReview, setEditingReview] = useState<Review | null>(null)
    const [isWritingReview, setIsWritingReview] = useState(false)

    const fetchData = async () => {
        if (!id) return

        // Fetch spring details
        const { data: springData } = await supabase
            .from('hot_springs')
            .select('*')
            .eq('id', id)
            .single()

        if (springData) setSpring(springData)

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
            .from('spring_reviews')
            .select('*, photos:review_photos(*)')
            .eq('spring_id', id)
            .order('created_at', { ascending: false })

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError)
        } else if (reviewsData) {
            let reviewsWithAuthors = reviewsData

            // Attempt to fetch profiles
            try {
                const userIds = Array.from(new Set(reviewsData.map((r) => r.user_id)))
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('user_profiles')
                        .select('user_id, display_name')
                        .in('user_id', userIds)

                    if (profiles) {
                        reviewsWithAuthors = reviewsData.map((review) => ({
                            ...review,
                            author: profiles.find((p) => p.user_id === review.user_id),
                        }))
                    }
                }
            } catch (e) {
                console.error('Error fetching profiles:', e)
            }

            setReviews(reviewsWithAuthors)
        }
        setLoading(false)
    }

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
        fetchData()
    }, [id])

    const handleReviewSuccess = () => {
        setIsWritingReview(false)
        setEditingReview(null)
        fetchData()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!spring) return null

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative h-[65vh] min-h-[500px]">
                {spring.hero_image_url ? (
                    <img
                        src={spring.hero_image_url}
                        alt={spring.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Thermometer className="w-32 h-32 text-slate-300" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-slate-50" />

                <div className="absolute top-24 left-8 z-20">
                    <Link href="/">
                        <Button variant="secondary" size="icon" className="rounded-full w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/10 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 pb-16 container mx-auto">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-widest border border-white/20 shadow-sm">
                                <MapPin className="w-3.5 h-3.5 mr-2" />
                                {spring.state || 'Unknown Location'}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight drop-shadow-sm">
                            {spring.name}
                        </h1>

                        <div className="flex flex-wrap gap-6 text-slate-600 font-medium">
                            {spring.water_temperature_c && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40 transition-transform hover:scale-105">
                                    <Thermometer className="w-5 h-5 mr-3 text-primary" />
                                    <span className="text-slate-900 font-bold">{spring.water_temperature_c}°C</span>
                                </div>
                            )}
                            {spring.hike_distance_km !== null && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40 transition-transform hover:scale-105">
                                    <Navigation className="w-5 h-5 mr-3 text-primary" />
                                    <span className="text-slate-900 font-bold">{spring.hike_distance_km}km Hike</span>
                                </div>
                            )}
                            {spring.elevation_m !== null && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40 transition-transform hover:scale-105">
                                    <Mountain className="w-5 h-5 mr-3 text-primary" />
                                    <span className="text-slate-900 font-bold">{spring.elevation_m}m Elev.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* About Section */}
                        <section className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-white/50">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                                <Info className="w-6 h-6 mr-3 text-primary" />
                                About
                            </h2>
                            <div className="prose prose-lg prose-slate max-w-none">
                                <RichText content={spring.description} />
                            </div>

                            {spring.access_notes && (
                                <div className="mt-10 bg-slate-50 border border-slate-100 rounded-2xl p-8">
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center text-lg">
                                        ⚠️ Access Information
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">{spring.access_notes}</p>
                                </div>
                            )}
                        </section>

                        {/* Reviews Section */}
                        <section>
                            <div className="flex items-center justify-between mb-10 px-2">
                                <h2 className="text-3xl font-bold text-slate-900">Reviews</h2>
                                {!isWritingReview && !editingReview && (
                                    <Button
                                        onClick={() => setIsWritingReview(true)}
                                        className="rounded-full px-8 bg-slate-900 hover:bg-primary text-white shadow-lg shadow-slate-900/20 transition-all hover:shadow-primary/30"
                                    >
                                        Write a Review
                                    </Button>
                                )}
                            </div>

                            {/* Review Composer (New or Edit) */}
                            {(isWritingReview || editingReview) && (
                                <div className="mb-10">
                                    <ReviewComposer
                                        springId={spring.id}
                                        initialReview={editingReview || undefined}
                                        onSuccess={handleReviewSuccess}
                                        onCancel={() => {
                                            setIsWritingReview(false)
                                            setEditingReview(null)
                                        }}
                                    />
                                </div>
                            )}

                            <div className="space-y-8">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                        <p className="text-slate-400 text-lg">No reviews yet.</p>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div key={review.id} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                                        {(review.author?.display_name || 'A')[0].toUpperCase()}
                                                    </div>
                                                    <div className="ml-5">
                                                        <p className="font-bold text-slate-900 text-lg">
                                                            {review.author?.display_name || 'Anonymous'}
                                                        </p>
                                                        <div className="flex items-center text-sm text-slate-400 font-medium mt-1">
                                                            <Calendar className="w-3.5 h-3.5 mr-2" />
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                                        <div className="flex gap-1 mr-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-slate-200 fill-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="font-bold text-slate-900">{review.rating}</span>
                                                    </div>

                                                    {currentUser && currentUser.id === review.user_id && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingReview(review)
                                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                                            }}
                                                            className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-slate-600 mb-8 leading-relaxed text-lg font-light">{review.body}</p>

                                            {
                                                review.photos && review.photos.length > 0 && (
                                                    <div className="flex gap-4 overflow-x-auto pb-4">
                                                        {review.photos.map((photo) => (
                                                            <img
                                                                key={photo.id}
                                                                src={photo.public_url || `https://ventasuugmeocsmcoiqs.supabase.co/storage/v1/object/public/review-photos/${photo.storage_path}`}
                                                                alt="Review photo"
                                                                className="h-40 w-40 object-cover rounded-2xl cursor-pointer hover:opacity-90 transition-all hover:scale-105 shadow-md"
                                                            />
                                                        ))}
                                                    </div>
                                                )
                                            }
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 sticky top-28">
                            <h3 className="text-xl font-bold text-slate-900 mb-8">Location Details</h3>

                            <div className="aspect-square bg-slate-100 rounded-3xl mb-8 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden relative group">
                                <MapPin className="w-12 h-12 text-slate-300 group-hover:text-primary transition-colors duration-500" />
                                {/* Mini Map could go here */}
                            </div>

                            <div className="space-y-5 text-sm">
                                <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Latitude</span>
                                    <span className="font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">{spring.latitude.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Longitude</span>
                                    <span className="font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">{spring.longitude.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Elevation</span>
                                    <span className="text-slate-900 font-bold">{spring.elevation_m ? `${spring.elevation_m} m` : 'N/A'}</span>
                                </div>
                            </div>

                            <Button className="w-full mt-10 bg-slate-900 hover:bg-primary text-white rounded-2xl py-7 text-lg shadow-xl shadow-slate-900/20 transition-all hover:shadow-primary/30">
                                Get Directions
                            </Button>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
