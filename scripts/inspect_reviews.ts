
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

async function inspectReviews() {
    console.log('Inspecting spring_reviews table...')

    const { count, error } = await supabase
        .from('spring_reviews')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting reviews:', error)
        return
    }

    console.log('Total reviews:', count)
}

inspectReviews()
