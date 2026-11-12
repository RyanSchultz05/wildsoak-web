import React from 'react'

interface RichTextProps {
    content: string | null
    className?: string
}

/** Renders a spring description: `**Heading**` lines become headings, other lines paragraphs. */
export function RichText({ content, className = '' }: RichTextProps) {
    if (!content) return null

    type Block = { heading: boolean; text: string }
    const blocks: Block[] = []
    let paragraph: string[] = []
    const flush = () => {
        if (paragraph.length) blocks.push({ heading: false, text: paragraph.join(' ') })
        paragraph = []
    }

    for (const rawLine of content.replace(/\r\n/g, '\n').split('\n')) {
        const line = rawLine.trim()
        const heading = line.match(/^\*\*([^*]+)\*\*:?$/) || line.match(/^#{1,3}\s+(.*)$/)
        if (!line) {
            flush()
        } else if (heading) {
            flush()
            blocks.push({ heading: true, text: heading[1].trim() })
        } else {
            paragraph.push(line)
        }
    }
    flush()

    return (
        <div className={`space-y-4 ${className}`}>
            {blocks.map((block, index) =>
                block.heading ? (
                    <h3 key={index} className="mt-8 text-xl font-bold text-stone-900 first:mt-0">
                        {block.text}
                    </h3>
                ) : (
                    <p key={index} className="leading-relaxed text-stone-600">
                        {block.text.split(/(\*\*.*?\*\*)/g).map((part, partIndex) =>
                            part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={partIndex} className="font-semibold text-stone-800">
                                    {part.slice(2, -2)}
                                </strong>
                            ) : (
                                part
                            ),
                        )}
                    </p>
                ),
            )}
        </div>
    )
}
