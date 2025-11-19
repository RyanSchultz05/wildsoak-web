'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Star, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Review, ReviewPhoto } from '@/types'

interface ReviewComposerProps {
    springId: string
    initialReview?: Review
    onSuccess?: () => void
    onCancel?: () => void
}

export default function ReviewComposer({ springId, initialReview, onSuccess, onCancel }: ReviewComposerProps) {
    const [rating, setRating] = useState(initialReview?.rating || 0)
    const [body, setBody] = useState(initialReview?.body || '')
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [existingPhotos, setExistingPhotos] = useState<ReviewPhoto[]>(initialReview?.photos || [])
    const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let reviewId = initialReview?.id

        if (initialReview) {
            // Update existing review
            const { error } = await supabase
                .from('spring_reviews')
                .update({ rating, body })
                .eq('id', initialReview.id)

            if (error) {
                alert('Error updating review')
                setLoading(false)
                return
            }
        } else {
            // Create new review
            const { data, error } = await supabase
                .from('spring_reviews')
                .insert({
                    spring_id: springId,
                    user_id: user.id,
                    rating,
                    body
                })
                .select()
                .single()

            if (error) {
                alert('Error posting review')
                setLoading(false)
                return
            }
            reviewId = data.id
        }

        if (!reviewId) return

        // Handle Deleted Photos
        if (deletedPhotoIds.length > 0) {
            await supabase
                .from('review_photos')
                .delete()
                .in('id', deletedPhotoIds)

            // Ideally we should also delete from storage, but we need the path.
            // For now, we just remove the DB record.
        }

        // Handle New Photos
        if (newFiles.length > 0) {
            for (const file of newFiles) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${reviewId}/${Math.random()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('review-photos')
                    .upload(fileName, file)

                if (!uploadError) {
                    await supabase
                        .from('review_photos')
                        .insert({
                            review_id: reviewId,
                            storage_path: fileName
                        })
                }
            }
        }

        setLoading(false)
        if (onSuccess) {
            onSuccess()
        } else {
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                    {initialReview ? 'Edit Review' : 'Write a Review'}
                </h3>
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} size="sm" className="text-slate-500 hover:text-slate-900">
                        Cancel
                    </Button>
                )}
            </div>

            <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-8 h-8 ${star <= rating ? 'text-accent fill-accent' : 'text-slate-200 fill-slate-200'}`}
                        />
                    </button>
                ))}
            </div>

            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your experience..."
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[150px] mb-6 text-slate-700 placeholder:text-slate-400"
                required
            />

            <div className="mb-8">
                <label className="block mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Photos</label>
                <div className="flex flex-wrap gap-4">
                    {/* Existing Photos */}
                    {existingPhotos.map((photo) => (
                        <div key={photo.id} className="relative w-24 h-24 group">
                            <img
                                src={photo.public_url || `https://ventasuugmeocsmcoiqs.supabase.co/storage/v1/object/public/review-photos/${photo.storage_path}`}
                                className="w-full h-full object-cover rounded-xl shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setExistingPhotos(existingPhotos.filter(p => p.id !== photo.id))
                                    setDeletedPhotoIds([...deletedPhotoIds, photo.id])
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {/* New Files */}
                    {newFiles.map((file, i) => (
                        <div key={i} className="relative w-24 h-24 group">
                            <img
                                src={URL.createObjectURL(file)}
                                className="w-full h-full object-cover rounded-xl shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setNewFiles(newFiles.filter((_, index) => index !== i))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    setNewFiles([...newFiles, ...Array.from(e.target.files)])
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            <Button type="submit" disabled={loading || rating === 0} className="w-full rounded-xl py-6 bg-slate-900 hover:bg-primary text-white shadow-lg shadow-slate-900/20 transition-all hover:shadow-primary/30 font-bold text-lg">
                {loading ? 'Saving...' : (initialReview ? 'Update Review' : 'Post Review')}
            </Button>
        </form>
    )
}
