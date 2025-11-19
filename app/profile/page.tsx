'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/types'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setProfile(data)
            }
            setLoading(false)
        }

        getProfile()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-24 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/50 p-10">
                <div className="flex items-center gap-8 mb-10">
                    <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-primary shadow-inner">
                        {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                            {profile?.display_name || 'Explorer'}
                        </h1>
                        <p className="text-slate-500 font-medium">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">Bio</h2>
                        <p className="text-slate-600 leading-relaxed text-lg font-light">
                            {profile?.bio || 'No bio yet. Tell us about your adventures!'}
                        </p>
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <Button className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-primary text-white shadow-lg shadow-slate-900/10 transition-all">
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
