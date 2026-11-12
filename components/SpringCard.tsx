import Link from 'next/link'
import { MapPin, Star, Thermometer, Droplets, HelpCircle } from 'lucide-react'
import type { HotSpring } from '@/types'
import SpringArtwork from '@/components/SpringArtwork'
import { displayName, fahrenheit, isUnconfirmed, placeLabel, temperatureCategory } from '@/lib/springs'

/** One spring as a tall photo card, used on the home page and in search results. */
export default function SpringCard({ spring }: { spring: HotSpring }) {
    const name = displayName(spring.name)
    const place = placeLabel(spring)
    const unconfirmed = isUnconfirmed(spring)

    return (
        <Link
            href={`/springs/${spring.id}`}
            className="group block rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
            <article className="relative h-80 overflow-hidden rounded-3xl bg-stone-900 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                {spring.hero_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={spring.hero_image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <SpringArtwork
                        seed={spring.id}
                        category={temperatureCategory(spring.water_temperature_c)}
                        className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                <div className="absolute left-4 right-4 top-4 flex flex-wrap justify-end gap-2">
                    {spring.water_temperature_c !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
                            <Thermometer className="h-4 w-4" aria-hidden="true" />
                            {fahrenheit(spring.water_temperature_c)}°F
                        </span>
                    )}
                    {(spring.average_rating || 0) > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-sm font-semibold text-amber-300 backdrop-blur-md">
                            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                            {(spring.average_rating || 0).toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold leading-tight">{name}</h3>
                    {place && (
                        <p className="mt-1 flex items-center text-sm font-medium text-white/85">
                            <MapPin className="mr-1 h-4 w-4" aria-hidden="true" />
                            {place}
                        </p>
                    )}
                    {unconfirmed ? (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-200">
                            <HelpCircle className="h-4 w-4" aria-hidden="true" />
                            Unconfirmed details
                        </p>
                    ) : (
                        (spring.review_count || 0) > 0 && (
                            <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                                <Droplets className="h-4 w-4" aria-hidden="true" />
                                {spring.review_count} review{spring.review_count === 1 ? '' : 's'}
                            </p>
                        )
                    )}
                </div>
            </article>
        </Link>
    )
}
