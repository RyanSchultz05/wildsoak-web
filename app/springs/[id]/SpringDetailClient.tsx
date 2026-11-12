'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HotSpring, Review } from '@/types'
import { useParams } from 'next/navigation'
import { MapPin, Thermometer, Navigation, Star, ArrowLeft, Info, Calendar, Mountain, Pencil, HelpCircle, Footprints } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RichText } from '@/components/RichText'
import ReviewComposer from '@/components/ReviewComposer'
import { User } from '@supabase/supabase-js'
import SpringArtwork from '@/components/SpringArtwork'
import { directionsUrl, displayName, fahrenheit, isUnconfirmed, photoUrl, placeLabel, temperatureCategory } from '@/lib/springs'

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

    if (!spring) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Spring not found</h1>
                <p className="text-slate-600">This spring may have been removed, or the link is incomplete.</p>
                <Link href="/" className="font-semibold text-primary underline">Back to all springs</Link>
            </div>
        )
    }

    const name = displayName(spring.name)
    const place = placeLabel(spring)
    const unconfirmed = isUnconfirmed(spring)
    const approved = reviews.filter((review) => (review as Review & { status?: string }).status !== 'rejected')
    const firstPhoto = approved.flatMap((review) => review.photos || [])[0]
    const heroUrl = spring.hero_image_url || (firstPhoto ? firstPhoto.public_url || photoUrl(firstPhoto.storage_path) : null)
    const averageRating = approved.length ? approved.reduce((sum, review) => sum + review.rating, 0) / approved.length : null

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative">
                <div className="relative h-[40vh] min-h-[280px] md:h-[65vh] md:min-h-[500px]">
                {heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroUrl} alt={`Photo of ${name}`} className="h-full w-full object-cover" />
                ) : (
                    <SpringArtwork
                        seed={spring.id}
                        category={temperatureCategory(spring.water_temperature_c)}
                        shift={-0.13}
                        className="h-full w-full"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-slate-50" />
                </div>

                <div className="absolute left-4 top-4 z-20 md:left-8 md:top-24">
                    <Link href="/">
                        <Button variant="secondary" size="icon" aria-label="Back to all springs" className="rounded-full w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/10 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>

                <div className="container mx-auto px-6 pb-2 pt-6 md:absolute md:bottom-0 md:left-0 md:right-0 md:p-8 md:pb-16">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-widest border border-white/20 shadow-sm">
                                <MapPin className="w-3.5 h-3.5 mr-2" />
                                {place || 'Location not listed'}
                            </span>
                            {unconfirmed && (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800 shadow-sm">
                                    <HelpCircle className="mr-2 h-3.5 w-3.5" />
                                    Unconfirmed
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-7xl font-bold text-slate-900 mb-6 md:mb-8 tracking-tight drop-shadow-sm">
                            {name}
                        </h1>

                        <div className="flex flex-wrap gap-3 md:gap-6 text-slate-600 font-medium">
                            {spring.water_temperature_c && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40 transition-transform hover:scale-105">
                                    <Thermometer className="w-5 h-5 mr-3 text-primary" />
                                    <span className="text-slate-900 font-bold">{fahrenheit(spring.water_temperature_c)}°F at the source</span>
                                </div>
                            )}
                            {averageRating !== null && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40">
                                    <Star className="w-5 h-5 mr-3 text-amber-500 fill-amber-500" />
                                    <span className="text-slate-900 font-bold">{averageRating.toFixed(1)} · {approved.length} review{approved.length === 1 ? '' : 's'}</span>
                                </div>
                            )}
                            {spring.hike_distance_km !== null && spring.hike_distance_km > 0 && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40 transition-transform hover:scale-105">
                                    <Footprints className="w-5 h-5 mr-3 text-primary" />
                                    <span className="text-slate-900 font-bold">{(spring.hike_distance_km * 0.621371).toFixed(1)} mi hike each way</span>
                                </div>
                            )}
                            {spring.elevation_m !== null && (
                                <div className="flex items-center bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/40 transition-transform hover:scale-105">
                                    <Mountain className="w-5 h-5 mr-3 text-primary" />
                                    <span className="text-slate-900 font-bold">{Math.round(spring.elevation_m * 3.28084).toLocaleString()} ft elevation</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8 md:-mt-8 relative z-10 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* About Section */}
                        <section className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-white/50">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                                <Info className="w-6 h-6 mr-3 text-primary" />
                                About
                            </h2>
                            {unconfirmed && (
                                <p className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
                                    <strong className="font-semibold">Details here are unconfirmed.</strong> This listing was written
                                    from the spring’s map location and general knowledge of the area, not a documented visit. Treat
                                    access, temperature and soaking details as a starting point and confirm locally.
                                </p>
                            )}
                            <div className="prose prose-lg prose-slate max-w-none">
                                <RichText content={spring.description} />
                            </div>

                            {spring.access_notes && (
                                <div className="mt-10 bg-slate-50 border border-slate-100 rounded-2xl p-8">
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center text-lg">
                                        Access information
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
                                                                src={photo.public_url || photoUrl(photo.storage_path)}
                                                                alt={`Photo from a review of ${name}`}
                                                                loading="lazy"
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
                                    <span className="text-slate-900 font-bold">{spring.elevation_m !== null ? `${Math.round(spring.elevation_m * 3.28084).toLocaleString()} ft` : 'Not listed'}</span>
                                </div>
                            </div>

                            <a
                                href={directionsUrl(spring)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-5 text-lg font-semibold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-primary"
                            >
                                <Navigation className="h-5 w-5" aria-hidden="true" />
                                Get Directions
                            </a>
                            <p className="mt-4 text-xs leading-relaxed text-slate-500">
                                Directions go to the spring’s map pin. Remote roads can be slower than any app predicts, and
                                some springs need a hike from the road.
                            </p>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
