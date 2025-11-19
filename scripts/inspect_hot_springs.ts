
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

async function inspectHotSprings() {
    console.log('Inspecting hot_springs table...')

    const { count, error } = await supabase
        .from('hot_springs')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting hot_springs:', error)
        return
    }

    console.log('Total hot springs:', count)
}

inspectHotSprings()
