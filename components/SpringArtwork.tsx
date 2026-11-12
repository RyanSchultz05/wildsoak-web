import type { TemperatureCategory } from '@/lib/springs'

/**
 * A painted landscape for springs that have no photo: layered ridgelines under a glowing
 * sky with steam rising off a pool. Drawn from the spring's id so it never changes, and
 * coloured by water temperature. Matches the artwork in the iOS app.
 */

type Palette = {
    skyTop: string; skyMid: string; horizon: string; sun: string; ridgeFar: string; ridgeNear: string; stars?: boolean
}

const PALETTES: Record<TemperatureCategory, Palette[]> = {
    hot: [
        { skyTop: '#2B1B3D', skyMid: '#8C3B5E', horizon: '#F2996B', sun: '#FFD9A0', ridgeFar: '#6B3A5B', ridgeNear: '#1E1426' },
        { skyTop: '#3A2A5C', skyMid: '#C2566B', horizon: '#F7B267', sun: '#FFE7B8', ridgeFar: '#7A4A66', ridgeNear: '#23162B' },
        { skyTop: '#43264F', skyMid: '#D9695A', horizon: '#FBC88A', sun: '#FFF0CC', ridgeFar: '#8A4B52', ridgeNear: '#2A1620' },
    ],
    warm: [
        { skyTop: '#35507A', skyMid: '#E8A27C', horizon: '#F9D9A6', sun: '#FFF3D6', ridgeFar: '#6F7FA3', ridgeNear: '#1F2B45' },
        { skyTop: '#4A4E8C', skyMid: '#D98BA0', horizon: '#F6CFB5', sun: '#FFF1E0', ridgeFar: '#7C76A8', ridgeNear: '#25244A' },
        { skyTop: '#3B3F73', skyMid: '#A98CC2', horizon: '#F4D2C4', sun: '#FFF5E8', ridgeFar: '#6F6C9E', ridgeNear: '#1F2040' },
    ],
    cool: [
        { skyTop: '#123B4A', skyMid: '#2F7C86', horizon: '#A9D6CF', sun: '#EAFBF4', ridgeFar: '#3F8088', ridgeNear: '#0C2A30' },
        { skyTop: '#0B1F3A', skyMid: '#1F4E79', horizon: '#7FB7C9', sun: '#E6F4FF', ridgeFar: '#2D5F84', ridgeNear: '#081728', stars: true },
    ],
    unknown: [
        { skyTop: '#1D3B33', skyMid: '#4F8573', horizon: '#CFE3D2', sun: '#F4FBF2', ridgeFar: '#5E8F7E', ridgeNear: '#12261F' },
        { skyTop: '#27384A', skyMid: '#6E8C8A', horizon: '#E3D9C3', sun: '#FFF6E2', ridgeFar: '#6C8791', ridgeNear: '#172530' },
        { skyTop: '#101C2E', skyMid: '#2C4A5C', horizon: '#8FB3B0', sun: '#EEF6F2', ridgeFar: '#35596A', ridgeNear: '#0A1620', stars: true },
    ],
}

/** Small deterministic generator seeded from the spring id. */
function generator(seed: string) {
    let state = 2166136261
    for (let i = 0; i < seed.length; i++) {
        state ^= seed.charCodeAt(i)
        state = Math.imul(state, 16777619)
    }
    return () => {
        state += 0x6d2b79f5
        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function mix(a: string, b: string, amount: number): string {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
    const t = Math.min(Math.max(amount, 0), 1)
    return '#' + pa.map((value, i) => Math.round(value + (pb[i] - value) * t).toString(16).padStart(2, '0')).join('')
}

const W = 400
const H = 500

export default function SpringArtwork({
    seed,
    category = 'unknown',
    className = '',
    shift = 0,
}: {
    seed: string
    category?: TemperatureCategory
    className?: string
    /** Moves the scene up (negative) so the pool clears text laid over the bottom. */
    shift?: number
}) {
    const random = generator(seed)
    const between = (low: number, high: number) => low + (high - low) * random()
    const options = PALETTES[category]
    const palette = options[Math.floor(random() * options.length) % options.length]
    const id = 'a' + seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)

    const stars = palette.stars
        ? Array.from({ length: 34 }, () => ({ x: random() * W, y: random() * 0.42 * H, r: between(1.2, 3), o: between(0.35, 0.9) }))
        : []

    const sun = { x: W * between(0.22, 0.78), y: H * (between(0.34, 0.46) + shift) }

    const ridges = Array.from({ length: 4 }, (_, layer) => {
        const depth = layer / 3
        const base = H * (0.5 + shift + 0.115 * layer)
        const amplitude = H * (0.17 - 0.035 * layer)
        const jagged = 1 - depth
        const waves = Array.from({ length: 4 }, (_, index) => ({
            frequency: between(0.7, 1.5) * Math.pow(1.9, index),
            phase: between(0, Math.PI * 2),
            weight: 1 / Math.pow(1.85, index),
        }))
        const total = waves.reduce((sum, wave) => sum + wave.weight, 0)
        let d = `M0 ${H}`
        for (let step = 0; step <= 64; step++) {
            const t = step / 64
            let value = 0
            for (const wave of waves) {
                const smooth = (Math.sin(t * wave.frequency * 2 * Math.PI + wave.phase) + 1) / 2
                const peaked = 1 - Math.abs(Math.sin(t * wave.frequency * Math.PI + wave.phase))
                value += wave.weight * (smooth * (1 - jagged) + peaked * jagged)
            }
            d += ` L${(W * t).toFixed(1)} ${(base - (amplitude * value) / total).toFixed(1)}`
        }
        d += ` L${W} ${H} Z`
        const tint = mix(palette.ridgeFar, palette.ridgeNear, depth)
        return { d, fill: mix(tint, palette.horizon, 0.22 * (1 - depth)), base, amplitude, layer }
    })

    const pool = { cx: W * between(0.36, 0.64), cy: H * (0.74 + shift), rx: (W * between(0.46, 0.62)) / 2, ry: H * 0.0275 }
    const wisps = Array.from({ length: 4 }, (_, index) => {
        const x = pool.cx - pool.rx + pool.rx * 2 * (0.2 + 0.2 * index) + between(-12, 12)
        const rise = H * between(0.2, 0.34)
        const sway = between(20, 44) * (index % 2 === 0 ? 1 : -1)
        return {
            d: `M${x} ${pool.cy} C${x + sway} ${pool.cy - rise * 0.35}, ${x - sway} ${pool.cy - rise * 0.7}, ${x + sway * 0.4} ${pool.cy - rise}`,
            width: between(14, 24),
        }
    })

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="0.8">
                    <stop offset="0" stopColor={palette.skyTop} />
                    <stop offset="0.52" stopColor={palette.skyMid} />
                    <stop offset="1" stopColor={palette.horizon} />
                </linearGradient>
                <radialGradient id={`${id}-glow`}>
                    <stop offset="0" stopColor={palette.sun} stopOpacity="0.75" />
                    <stop offset="0.5" stopColor={palette.sun} stopOpacity="0.22" />
                    <stop offset="1" stopColor={palette.sun} stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${id}-disc`}>
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" stopColor={palette.sun} />
                </radialGradient>
                <linearGradient id={`${id}-steam`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="11" />
                </filter>
                <filter id={`${id}-pool`} x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="2.4" />
                </filter>
            </defs>

            <rect width={W} height={H} fill={palette.horizon} />
            <rect width={W} height={H * 0.8} fill={`url(#${id}-sky)`} />
            {stars.map((star, index) => (
                <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o} />
            ))}
            <circle cx={sun.x} cy={sun.y} r={W * 0.62} fill={`url(#${id}-glow)`} />
            <circle cx={sun.x} cy={sun.y} r={W * 0.075} fill={`url(#${id}-disc)`} />

            {ridges.map((ridge) => (
                <path key={ridge.layer} d={ridge.d} fill={ridge.fill} />
            ))}

            <ellipse cx={pool.cx} cy={pool.cy} rx={pool.rx} ry={pool.ry} fill={palette.horizon} opacity="0.85" filter={`url(#${id}-pool)`} />
            {[0, 1, 2].map((index) => {
                const y = pool.cy - pool.ry + pool.ry * 2 * (0.3 + 0.2 * index)
                const inset = pool.rx * 2 * (0.18 + 0.1 * index)
                return (
                    <line
                        key={index}
                        x1={pool.cx - pool.rx + inset}
                        x2={pool.cx + pool.rx - inset}
                        y1={y}
                        y2={y}
                        stroke={palette.sun}
                        strokeOpacity="0.5"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                )
            })}

            <g filter={`url(#${id}-soft)`}>
                {wisps.map((wisp, index) => (
                    <path key={index} d={wisp.d} stroke={`url(#${id}-steam)`} strokeWidth={wisp.width} strokeLinecap="round" fill="none" />
                ))}
            </g>
        </svg>
    )
}
