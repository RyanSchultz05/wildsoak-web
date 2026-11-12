import { supabase } from '@/lib/supabase'
import SpringDetailClient from './SpringDetailClient'

/** Every spring gets a page. The API returns at most 1,000 rows per request, so page through. */
export async function generateStaticParams() {
    const pageSize = 1000
    const ids: { id: string }[] = []

    for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
            .from('hot_springs')
            .select('id')
            .order('id')
            .range(from, from + pageSize - 1)

        if (error) throw new Error(`Could not list springs: ${error.message}`)
        ids.push(...(data || []).map((spring) => ({ id: spring.id as string })))
        if (!data || data.length < pageSize) break
    }

    return ids
}

export default function SpringDetailPage() {
    return <SpringDetailClient />
}
