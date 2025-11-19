
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testJoin() {
    console.log('Testing join hot_springs with spring_reviews...')

    const { data, error } = await supabase
        .from('hot_springs')
        .select('id, name, spring_reviews(rating)')
        .limit(5)

    if (error) {
        console.error('Error fetching join:', error)
        return
    }

    console.log('Data sample:', JSON.stringify(data, null, 2))
}

testJoin()
