'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return
        }

        setLoading(true)
        const { error } = await supabase.functions.invoke('delete-account')

        if (error) {
            alert('Error deleting account: ' + error.message)
        } else {
            await supabase.auth.signOut()
            router.push('/')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                <h1 className="text-3xl font-bold text-stone-900 mb-8">Settings</h1>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-stone-800 mb-4">Account</h2>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                            <h3 className="font-bold text-red-900 mb-2">Danger Zone</h3>
                            <p className="text-red-800/80 mb-4 text-sm">
                                Deleting your account will permanently remove all your data, including reviews and photos.
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {loading ? 'Deleting...' : 'Delete Account'}
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
