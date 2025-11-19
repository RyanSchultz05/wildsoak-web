
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const pnwSprings = [
    // Washington
    {
        name: "Goldmyer Hot Springs",
        description: "A gem of the Cascades, located in the foothills of the Alpine Lakes Wilderness. Requires a high-clearance vehicle and a 4.5-mile hike (or bike). Reservations required.",
        latitude: 47.4865,
        longitude: -121.3948,
        state: "WA",
        water_temperature_c: 40,
        hike_distance_km: 7.2,
        elevation_m: 600,
        access_notes: "High-clearance vehicle required. Reservations mandatory.",

    },
    {
        name: "Scenic Hot Springs",
        description: "Private hot springs on a steep hillside with stunning views of the Cascades. Three tubs with varying temperatures. Clothing optional.",
        latitude: 47.7154,
        longitude: -121.1337,
        state: "WA",
        water_temperature_c: 39,
        hike_distance_km: 3.5,
        elevation_m: 1100,
        access_notes: "Private property. Permission required.",

    },
    {
        name: "Olympic Hot Springs",
        description: "Located in Olympic National Park, these natural pools are accessible via a 2.5-mile hike on an old road. Several pools vary in temperature.",
        latitude: 47.9765,
        longitude: -123.6948,
        state: "WA",
        water_temperature_c: 38,
        hike_distance_km: 4.0,
        elevation_m: 650,
        access_notes: "Road closed at Madison Falls. Hike/bike required.",

    },
    {
        name: "Baker Hot Springs",
        description: "Two natural pools located in the Mt. Baker-Snoqualmie National Forest. Accessible via a short trail from a forest service road.",
        latitude: 48.7676,
        longitude: -121.6876,
        state: "WA",
        water_temperature_c: 37,
        hike_distance_km: 0.5,
        elevation_m: 800,
        access_notes: "Forest road can be rough.",

    },
    // Oregon
    {
        name: "Umpqua Hot Springs",
        description: "Famous terraced pools overlooking the North Umpqua River. Very popular and can be crowded. Clothing optional.",
        latitude: 43.2948,
        longitude: -122.3665,
        state: "OR",
        water_temperature_c: 42,
        hike_distance_km: 0.6,
        elevation_m: 800,
        access_notes: "Steep, short hike. Day use fee.",

    },
    {
        name: "Bagby Hot Springs",
        description: "Historic hot springs in the Mount Hood National Forest featuring hollowed-out cedar log tubs in a private bathhouse setting.",
        latitude: 44.9362,
        longitude: -122.1726,
        state: "OR",
        water_temperature_c: 50,
        hike_distance_km: 2.4,
        elevation_m: 670,
        access_notes: "Fee required. 1.5 mile hike.",

    },
    {
        name: "Terwilliger (Cougar) Hot Springs",
        description: "A series of four cascading pools in the Willamette National Forest. The upper pool is the hottest.",
        latitude: 44.0832,
        longitude: -122.2326,
        state: "OR",
        water_temperature_c: 40,
        hike_distance_km: 0.8,
        elevation_m: 500,
        access_notes: "Fee required. Often closed for cleaning on Thursdays.",

    },
    {
        name: "Alvord Hot Springs",
        description: "Located on the edge of the Alvord Desert, offering expansive views of the playa and Steens Mountain. Private facility with rustic soaking pools.",
        latitude: 42.5443,
        longitude: -118.5321,
        state: "OR",
        water_temperature_c: 76,
        hike_distance_km: 0,
        elevation_m: 1200,
        access_notes: "Private property. Fee required.",

    }
]

async function seed() {
    console.log(`Seeding ${pnwSprings.length} springs...`)

    for (const spring of pnwSprings) {
        const { error } = await supabase
            .from('hot_springs')
            .insert(spring)

        if (error) {
            console.error(`Error adding ${spring.name}:`, error.message)
        } else {
            console.log(`Added ${spring.name}`)
        }
    }
    console.log('Done!')
}

seed()
