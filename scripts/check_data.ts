
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

async function checkSprings() {
    const { count, error } = await supabase
        .from('hot_springs')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting springs:', error)
        return
    }
    console.log(`Total springs in DB: ${count}`)

    const { data: states, error: stateError } = await supabase
        .from('hot_springs')
        .select('state')

    if (stateError) {
        console.error('Error fetching states:', stateError)
        return
    }

    const stateCounts = states.reduce((acc: any, curr: any) => {
        const state = curr.state || 'Unknown'
        acc[state] = (acc[state] || 0) + 1
        return acc
    }, {})

    console.log('Springs by state:', stateCounts)
}

checkSprings()
