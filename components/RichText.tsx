import React from 'react'

interface RichTextProps {
    content: string | null
    className?: string
}

export function RichText({ content, className = '' }: RichTextProps) {
    if (!content) return null

    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/)

    return (
        <div className={`space-y-4 ${className}`}>
            {paragraphs.map((paragraph, i) => {
                // Check for header pattern **Header** at start of line
                const headerMatch = paragraph.match(/^\*\*(.*?)\*\*$/)
                if (headerMatch) {
                    return (
                        <h3 key={i} className="text-xl font-bold text-stone-900 mt-6 first:mt-0">
                            {headerMatch[1]}
                        </h3>
                    )
                }

                // Process inline bolding **text**
                const parts = paragraph.split(/(\*\*.*?\*\*)/g)

                return (
                    <p key={i} className="text-stone-600 leading-relaxed">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <strong key={j} className="font-bold text-stone-800">
                                        {part.slice(2, -2)}
                                    </strong>
                                )
                            }
                            return part
                        })}
                    </p>
                )
            })}
        </div>
    )
}
