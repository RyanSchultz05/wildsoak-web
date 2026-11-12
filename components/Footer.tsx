import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="border-t border-stone-200 bg-white">
            <div className="container mx-auto flex flex-col gap-6 px-6 py-10 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-semibold text-stone-800">WildSoak</p>
                    <p className="mt-1 max-w-md">
                        Hot springs across the United States. Always confirm access and conditions before you travel.
                    </p>
                </div>
                <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
                    <Link className="hover:text-primary" href="/explore">Map</Link>
                    <Link className="hover:text-primary" href="/road-trip">Road Trip</Link>
                    <Link className="hover:text-primary" href="/privacy">Privacy</Link>
                    <Link className="hover:text-primary" href="/terms">Terms</Link>
                    <a className="hover:text-primary" href="mailto:feedback@wildsoak.app">Contact</a>
                </nav>
            </div>
        </footer>
    )
}
