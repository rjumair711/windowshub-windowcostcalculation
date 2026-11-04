import Link from 'next/link'

export default function Page() {
  return <main className="min-h-screen bg-[#f7f9fa] px-5 py-10 text-[#172c3c] lg:px-8"><div className="mx-auto max-w-[900px]"><Link href="/guides" className="text-sm font-semibold text-[#087e8b]">← Guides</Link><article className="mt-8 panel"><p className="eyebrow">GUIDE</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">How to Calculate Window Square Feet</h1><p className="mt-5 leading-7 text-[#64748b]">Multiply width in feet by height in feet for one window, then multiply by the number of windows. Keep this area calculation separate from running-foot profile requirements.</p><p className="mt-5 rounded bg-[#eef6f5] p-4 font-mono">Area = width × height × quantity</p></article></div></main>
}
