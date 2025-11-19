import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ventasuugmeocsmcoiqs.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnRhc3V1Z21lb2NzbWNvaXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzE4MTUsImV4cCI6MjA3ODEwNzgxNX0.TMclJa5UJ_LX9v5N5WwrxqyEB53ZnlRgLmHNotqGyCg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
