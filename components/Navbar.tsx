'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Droplets, Map as MapIcon, Heart, User as UserIcon, LogOut, Navigation } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const pathname = usePathname()

    const [profile, setProfile] = useState<{ display_name: string } | null>(null)

    useEffect(() => {
        const fetchProfile = async (userId: string) => {
            const { data } = await supabase
                .from('user_profiles')
                .select('display_name')
                .eq('user_id', userId)
                .single()
            if (data) setProfile(data)
        }

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) fetchProfile(user.id)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <nav className="bg-white border-b border-stone-100 py-4 sticky top-0 z-50">
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-primary rounded-lg p-1.5 text-white">
                        <Droplets className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xl font-bold text-primary tracking-tight">
                        WildSoak
                    </span>
                </Link>

                {/* Center Navigation */}
                <div className="hidden md:flex items-center gap-2 bg-white">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            className={`rounded-full px-6 font-medium ${pathname === '/' ? 'bg-secondary text-primary hover:bg-secondary/80' : 'text-stone-500 hover:text-primary hover:bg-stone-50'}`}
                        >
                            <Droplets className="w-4 h-4 mr-2" />
                            Explore
                        </Button>
                    </Link>
                    <Link href="/explore">
                        <Button
                            variant="ghost"
                            className={`rounded-full px-6 font-medium ${pathname === '/explore' ? 'bg-secondary text-primary hover:bg-secondary/80' : 'text-stone-500 hover:text-primary hover:bg-stone-50'}`}
                        >
                            <MapIcon className="w-4 h-4 mr-2" />
                            Map View
                        </Button>
                    </Link>
                    <Link href="/road-trip">
                        <Button
                            variant="ghost"
                            className={`rounded-full px-6 font-medium ${pathname === '/road-trip' ? 'bg-secondary text-primary hover:bg-secondary/80' : 'text-stone-500 hover:text-primary hover:bg-stone-50'}`}
                        >
                            <Navigation className="w-4 h-4 mr-2" />
                            Road Trip
                        </Button>
                    </Link>

                </div>

                {/* Right Profile */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-stone-100">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-sm">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-stone-700 hidden lg:block">
                                            {profile?.display_name || user.email?.split('@')[0] || 'Explorer'}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="end">
                                    <div className="flex flex-col gap-1">
                                        <Link href="/profile" className="w-full">
                                            <Button variant="ghost" className="w-full justify-start font-medium text-stone-600">
                                                <UserIcon className="w-4 h-4 mr-2" />
                                                Profile
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={handleSignOut}
                                            variant="ghost"
                                            className="w-full justify-start font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Log Out
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button className="rounded-full px-6 bg-primary text-white hover:bg-primary/90">
                                Sign In
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Phone navigation: the center links don't fit beside the logo, so they get their own row. */}
            <div className="container mx-auto mt-3 flex items-center gap-2 overflow-x-auto px-6 md:hidden" aria-label="Sections">
                {[
                    { href: '/', label: 'Explore', icon: Droplets },
                    { href: '/explore', label: 'Map', icon: MapIcon },
                    { href: '/road-trip', label: 'Road Trip', icon: Navigation },
                ].map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        aria-current={pathname === href ? 'page' : undefined}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${pathname === href ? 'bg-secondary text-primary' : 'text-stone-500 hover:bg-stone-50 hover:text-primary'}`}
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                    </Link>
                ))}
            </div>
        </nav>
    )
}
