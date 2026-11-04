'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, FileText, Plus, Trash2 } from 'lucide-react'

export type Rate = { id: string; name: string; code: string; rate: number; unit: 'running ft'; verified: boolean }

const defaultRates: Rate[] = [
  { id: 'sliding-frame', name: 'Sliding Frame', code: 'EP-SF', rate: 691, unit: 'running ft', verified: false },
  { id: 'sliding-sash', name: 'Sliding Sash', code: 'EP-SS', rate: 682, unit: 'running ft', verified: false },
  { id: 'beading', name: 'Beading', code: 'EP-BEAD', rate: 210, unit: 'running ft', verified: false },
  { id: 'net-sash', name: 'Net Sash', code: 'EP-NS', rate: 728, unit: 'running ft', verified: false },
  { id: 'interlock', name: 'Interlock', code: 'EP-IL', rate: 335, unit: 'running ft', verified: false },
]

export function useRates() {
  const [rates, setRates] = useState<Rate[]>(() => {
    if (typeof window === 'undefined') return defaultRates
    try { return JSON.parse(localStorage.getItem('windows-hub-rates') || '') || defaultRates } catch { return defaultRates }
  })
  function save(next: Rate[]) { setRates(next); localStorage.setItem('windows-hub-rates', JSON.stringify(next)) }
  return { rates, save }
}

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f7f9fa] px-5 py-10 text-[#172c3c] lg:px-8"><div className="mx-auto max-w-[1120px]"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#087e8b]"><ArrowLeft size={16} /> Windows Hub</Link><header className="mb-8"><p className="eyebrow">WINDOWS HUB TOOL</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">{description}</p></header>{children}</div></main>
}

function NumberField({ label, value, onChange, min = 0, step = '0.01' }: { label: string; value: string; onChange: (value: string) => void; min?: number; step?: string }) { return <label className="field"><span>{label}</span><input type="number" min={min} step={step} value={value} onChange={e => onChange(e.target.value)} /></label> }

export function SquareFootCalculator() {
  const [width, setWidth] = useState('4'); const [height, setHeight] = useState('4'); const [quantity, setQuantity] = useState('1')
  const w = Number(width), h = Number(height), q = Number(quantity); const valid = [w,h,q].every(Number.isFinite) && w > 0 && h > 0 && q > 0
  return <Shell title="Square Foot Calculator" description="Calculate area separately from profile quantity. Dimensions are entered in feet."><div className="grid gap-6 md:grid-cols-2"><section className="panel grid gap-4 sm:grid-cols-3"><NumberField label="Width (ft)" value={width} onChange={setWidth} /><NumberField label="Height (ft)" value={height} onChange={setHeight} /><NumberField label="Quantity" value={quantity} onChange={setQuantity} min={1} step="1" /><div className="sm:col-span-3 border-t border-[#e3e9ed] pt-5"><p className="text-xs uppercase tracking-[.15em] text-[#64748b]">Total square footage</p><p className="mt-2 text-4xl font-semibold">{valid ? (w * h * q).toFixed(2) : '—'} <span className="text-base font-normal text-[#64748b]">sq ft</span></p></div></section><section className="panel"><h2 className="font-semibold">Formula</h2><p className="mt-3 text-sm leading-6 text-[#64748b]">Width × height × quantity. This area result is not used as a running-foot profile quantity.</p><p className="mt-5 rounded bg-[#eef6f5] p-4 font-mono text-sm">{valid ? `${w} × ${h} × ${q} = ${(w*h*q).toFixed(2)} sq ft` : 'Enter positive values'}</p></section></div></Shell>
}

type CutRule = { basis: 'perimeter' | 'width' | 'height' | 'manual'; multiplier: number; verified: boolean }

function useCutRules() {
  const [rules, setRules] = useState<Record<string, CutRule>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('windows-hub-cut-rules') || '{}') } catch { return {} }
  })
  function update(id: string, next: CutRule) { setRules(current => { const updated = { ...current, [id]: next }; localStorage.setItem('windows-hub-cut-rules', JSON.stringify(updated)); return updated }) }
  return { rules, update }
}

export function WindowMaterialCalculator() {
  const { rates } = useRates(); const { rules, update } = useCutRules(); const [width, setWidth] = useState('4'); const [height, setHeight] = useState('4'); const [qty, setQty] = useState('1'); const [selected, setSelected] = useState('sliding-frame')
  const w = Number(width), h = Number(height), q = Number(qty); const valid = [w, h, q].every(Number.isFinite) && w > 0 && h > 0 && q > 0; const rate = rates.find(r => r.id === selected) || rates[0]; const rule = rules[selected]
  const basisValue = rule?.basis === 'perimeter' ? 2 * (w + h) : rule?.basis === 'width' ? w : rule?.basis === 'height' ? h : rule?.basis === 'manual' ? 1 : 0
  const quantity = valid && rule ? basisValue * rule.multiplier * q : 0
  const total = quantity * (rate?.rate || 0)
  function setBasis(basis: CutRule['basis']) { update(selected, { basis, multiplier: rule?.multiplier || 1, verified: false }) }
  function setMultiplier(value: string) { update(selected, { basis: rule?.basis || 'perimeter', multiplier: Math.max(0, Number(value) || 0), verified: false }) }
  return <Shell title="Window Material Calculator" description="Europrofilo estimate with explicit running-foot quantities. No cutting relationship is assumed: configure each profile rule and confirm it with the manufacturer before production."><div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><section className="panel grid gap-4 sm:grid-cols-3"><NumberField label="Width (ft)" value={width} onChange={setWidth} /><NumberField label="Height (ft)" value={height} onChange={setHeight} /><NumberField label="Quantity" value={qty} onChange={setQty} min={1} step="1" /><label className="field sm:col-span-3"><span>Primary profile</span><select value={selected} onChange={e => setSelected(e.target.value)}>{rates.map(r => <option key={r.id} value={r.id}>{r.name} · Rs. {r.rate}/running ft</option>)}</select></label><label className="field"><span>Quantity basis</span><select value={rule?.basis || ''} onChange={e => setBasis(e.target.value as CutRule['basis'])}><option value="">Not configured</option><option value="perimeter">Perimeter</option><option value="width">Width</option><option value="height">Height</option><option value="manual">Manual unit</option></select></label><NumberField label="Rule multiplier" value={String(rule?.multiplier || 1)} onChange={setMultiplier} min={0} /></section><section className="panel"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.15em] text-[#64748b]">Estimate</p><p className="mt-2 text-4xl font-semibold">{quantity.toFixed(2)} <span className="text-base font-normal text-[#64748b]">running ft</span></p></div><p className="text-right text-sm font-semibold text-[#087e8b]">Rs. {valid && rule ? total.toFixed(2) : '—'}</p></div><p className="mt-5 text-xs leading-5 text-[#64748b]">{rule ? 'Configured rule is unverified. Confirm the basis, multiplier, allowances, joins, and cutting optimization with the client.' : 'No rule configured for this profile. Select a basis and multiplier to enable the estimate.'}</p></section></div></Shell>
}

export function MaterialRates() {
  const { rates, save } = useRates(); const [status, setStatus] = useState('')
  function update(id: string, value: string) { save(rates.map(r => r.id === id ? { ...r, rate: Math.max(0, Number(value) || 0) } : r)) }
  function exportCsv() { const csv = ['name,code,rate,unit,verified', ...rates.map(r => [r.name,r.code,r.rate,r.unit,r.verified].join(','))].join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'windows-hub-rates.csv'; a.click(); URL.revokeObjectURL(a.href); setStatus('CSV exported') }
  function importCsv(file: File) { const reader = new FileReader(); reader.onload = () => { const lines = String(reader.result).split(/\r?\n/).slice(1).filter(Boolean); const imported = lines.map(line => { const [name,code,rate,unit,verified] = line.split(','); return { id: code.toLowerCase(), name, code, rate: Number(rate), unit: 'running ft' as const, verified: verified === 'true' } }).filter(r => r.name && Number.isFinite(r.rate)); if (imported.length) { save(imported); setStatus(`${imported.length} rates imported`) } }; reader.readAsText(file) }
  return <Shell title="Material Rate Manager" description="Rates are stored in the browser for this project and are always labelled per running foot. Imported rules remain unverified unless explicitly marked verified."><div className="panel"><div className="mb-5 flex flex-wrap gap-3"><button className="action" onClick={exportCsv}><Download size={16} /> Export CSV</button><label className="action cursor-pointer"><Upload size={16} /> Import CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && importCsv(e.target.files[0])} /></label><span className="self-center text-sm text-[#087e8b]">{status}</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-[#e3e9ed] text-xs uppercase tracking-wider text-[#64748b]"><th className="py-3">Component</th><th>Code</th><th>Rate / running ft</th><th>Rule status</th></tr></thead><tbody>{rates.map(r => <tr key={r.id} className="border-b border-[#eef2f4]"><td className="py-4 font-semibold">{r.name}</td><td className="text-[#64748b]">{r.code}</td><td><input className="w-32 rounded border border-[#cbd8dd] px-3 py-2" type="number" min="0" value={r.rate} onChange={e => update(r.id, e.target.value)} /></td><td><span className="text-xs text-[#b06f28]">{r.verified ? 'Verified' : 'Unverified — confirm'}</span></td></tr>)}</tbody></table></div></div></Shell>
}

export function QuotationGenerator() { const [customer, setCustomer] = useState(''); const [amount, setAmount] = useState('0'); function downloadPdf() { const safe = customer.replace(/[()\\]/g, ''); const body = `BT\n/F1 18 Tf\n72 740 Td\n(Windows Hub Quotation) Tj\n/F1 12 Tf\n0 -28 Td\n(Customer: ${safe || 'Not specified'}) Tj\n0 -20 Td\n(Total: Rs. ${Number(amount) || 0}) Tj\n`; const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${body.length} >>\nstream\n${body}endstream`]; let pdf = '%PDF-1.4\n'; const offsets = [0]; objects.forEach((o,i) => { offsets.push(pdf.length); pdf += `${i+1} 0 obj\n${o}\nendobj\n` }); const xref = pdf.length; pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o => `${String(o).padStart(10,'0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([pdf], {type:'application/pdf'})); a.download = 'windows-hub-quotation.pdf'; a.click(); URL.revokeObjectURL(a.href) } return <Shell title="Quotation Generator" description="Generate a real downloadable PDF quotation from the estimate summary."><section className="panel grid max-w-xl gap-4"><label className="field"><span>Customer</span><input value={customer} onChange={e => setCustomer(e.target.value)} /></label><NumberField label="Total (Rs.)" value={amount} onChange={setAmount} /><button className="action w-fit" onClick={downloadPdf}><FileText size={16} /> Download PDF</button></section></Shell> }

export function PlaceholderTool({ title, description }: { title: string; description: string }) { return <Shell title={title} description={description}><div className="panel"><p className="text-sm text-[#64748b]">This tool is available as a dedicated route. Enter positive dimensions and confirm component rules before using estimates for fabrication.</p><Link href="/calculators/window-material-calculator" className="action mt-5 w-fit">Open material calculator</Link></div></Shell> }
