import { supabase } from '@/lib/supabase'
import SpringDetailClient from './SpringDetailClient'

export async function generateStaticParams() {
    const { data: springs } = await supabase
        .from('hot_springs')
        .select('id')

    return (springs || []).map((spring) => ({
        id: spring.id,
    }))
}

export default function SpringDetailPage() {
    return <SpringDetailClient />
}
