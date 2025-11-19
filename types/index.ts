export interface HotSpring {
    id: string
    name: string
    slug: string
    latitude: number
    longitude: number
    elevation_m: number | null
    description: string | null
    state: string | null
    access_notes: string | null
    permit_required: boolean
    drive_distance_km: number | null
    hike_distance_km: number | null
    water_temperature_c: number | null
    last_verified_at: string | null
    created_at: string
    updated_at: string | null
    hero_image_url: string | null
    average_rating?: number
}

export interface Review {
    id: string
    spring_id: string
    user_id: string
    rating: number
    body: string
    visit_date: string | null
    created_at: string
    updated_at: string | null
    photos?: ReviewPhoto[]
    author?: {
        display_name: string
        avatar_url: string | null
    }
}

export interface ReviewPhoto {
    id: string
    review_id: string
    storage_path: string
    created_at: string
    public_url?: string
}

export interface UserProfile {
    user_id: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
}
