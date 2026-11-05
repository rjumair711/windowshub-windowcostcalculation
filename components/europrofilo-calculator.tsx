'use client'

import { useMemo, useState } from 'react'
import { Calculator, Check, ChevronDown, Copy } from 'lucide-react'
import { useRates, type Rate } from '@/components/calculator-suite'

type RuleBasis = 'perimeter' | 'height' | 'width' | 'manual'
type Rule = { basis: RuleBasis; multiplier: number; verified: boolean }

type ComponentChoice = {
  id: string
  label: string
  profile: string
  rateId: string
  defaultRule: Rule
}

const components: ComponentChoice[] = [
  { id: 'sliding-frame', label: 'Sliding Frame', profile: '88mm Architect Series', rateId: 'sliding-frame', defaultRule: { basis: 'perimeter', multiplier: 1, verified: false } },
  { id: 'sliding-sash', label: 'Sliding Sash', profile: '66mm', rateId: 'sliding-sash', defaultRule: { basis: 'manual', multiplier: 0, verified: false } },
  { id: 'beading', label: 'Glass Beading', profile: 'For 5–6mm Glass', rateId: 'beading', defaultRule: { basis: 'manual', multiplier: 0, verified: false } },
  { id: 'net-sash', label: 'Net Sash', profile: '52mm', rateId: 'net-sash', defaultRule: { basis: 'manual', multiplier: 0, verified: false } },
  { id: 'interlock', label: 'Interlock', profile: 'Configured vertical', rateId: 'interlock', defaultRule: { basis: 'manual', multiplier: 0, verified: false } },
]

const fallbackRates: Rate[] = [
  { id: 'sliding-frame', name: 'Sliding Frame', code: 'SP-3001', rate: 691, unit: 'running ft', verified: false },
  { id: 'sliding-sash', name: 'Sliding Sash', code: 'SP-5011', rate: 660, unit: 'running ft', verified: false },
  { id: 'beading', name: 'Glass Beading', code: 'SP-5021', rate: 174, unit: 'running ft', verified: false },
  { id: 'net-sash', name: 'Net Sash', code: 'SP-2014', rate: 289, unit: 'running ft', verified: false },
  { id: 'interlock', name: 'Interlock', code: 'SP-5024', rate: 194, unit: 'running ft', verified: false },
]

function numberValue(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatRs(value: number) {
  return `Rs. ${value.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
}

function readRules(): Record<string, Rule> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('windows-hub-demo-rules') || '{}') } catch { return {} }
}

export default function EuroprofiloCalculator() {
  const { rates, save } = useRates()
  const availableRates = rates.length === components.length ? rates : fallbackRates
  const [width, setWidth] = useState('4')
  const [height, setHeight] = useState('5')
  const [windowQuantity, setWindowQuantity] = useState('1')
  const [selections, setSelections] = useState<Record<string, string>>(() => Object.fromEntries(components.map(component => [component.id, component.rateId])))
  const [rules, setRules] = useState<Record<string, Rule>>(readRules)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'sliding-frame': true })
  const [copied, setCopied] = useState(false)

  const w = numberValue(width)
  const h = numberValue(height)
  const quantity = numberValue(windowQuantity)
  const valid = w > 0 && h > 0 && Number.isInteger(quantity) && quantity > 0
  const squareFeetPerWindow = valid ? w * h : 0
  const squareFeet = squareFeetPerWindow * quantity
  const perimeter = valid ? 2 * (w + h) : 0

  function updateRule(id: string, patch: Partial<Rule>) {
    setRules(current => {
      const next = { ...current, [id]: { ...(current[id] || components.find(item => item.id === id)!.defaultRule), ...patch } }
      localStorage.setItem('windows-hub-demo-rules', JSON.stringify(next))
      return next
    })
  }

  const rows = useMemo(() => components.map(component => {
    const rate = availableRates.find(item => item.id === selections[component.id]) || availableRates.find(item => item.id === component.rateId)
    const rule = rules[component.id] || component.defaultRule
    const basisValue = rule.basis === 'perimeter' ? perimeter : rule.basis === 'height' ? h : rule.basis === 'width' ? w : 1
    const configured = rule.basis !== 'manual' || rule.multiplier > 0
    const perWindow = valid && configured ? basisValue * Math.max(0, rule.multiplier) : 0
    const required = perWindow * quantity
    const cost = configured && rate && rate.rate > 0 ? required * rate.rate : null
    return { component, rate, rule, configured, perWindow, required, cost }
  }), [availableRates, h, perimeter, quantity, rules, selections, valid, w])

  const totalCost = rows.every(row => row.cost !== null) ? rows.reduce((sum, row) => sum + (row.cost || 0), 0) : null

  function changeRate(componentId: string, rateId: string) {
    setSelections(current => ({ ...current, [componentId]: rateId }))
  }

  function cuttingDetails(row: (typeof rows)[number]) {
    if (!valid) return 'Enter valid measurements to calculate cutting details.'
    if (row.component.id === 'sliding-frame' && row.rule.basis === 'perimeter') {
      return `Horizontal: 2 × ${w} ft = ${(2 * w).toFixed(2)} ft\nVertical: 2 × ${h} ft = ${(2 * h).toFixed(2)} ft\nPer window: ${row.perWindow.toFixed(2)} running ft\nAll ${quantity} windows: ${row.required.toFixed(2)} running ft`
    }
    if (row.rule.basis === 'manual') return row.rule.multiplier > 0 ? `Configured manual quantity: ${row.rule.multiplier} running ft per window\nAll ${quantity} windows: ${row.required.toFixed(2)} running ft` : 'No cutting rule configured. Enter a multiplier or choose a basis.'
    const label = row.rule.basis === 'height' ? 'height' : row.rule.basis === 'width' ? 'width' : 'perimeter'
    return `${label[0].toUpperCase() + label.slice(1)} basis: ${row.rule.multiplier} × ${row.rule.basis === 'height' ? h : row.rule.basis === 'width' ? w : perimeter} ft\nPer window: ${row.perWindow.toFixed(2)} running ft\nAll ${quantity} windows: ${row.required.toFixed(2)} running ft`
  }

  async function copyCalculation() {
    if (!valid || totalCost === null) return
    const lines = ['Europrofilo Window Costing', `Width: ${w} ft`, `Height: ${h} ft`, `Quantity: ${quantity}`, `Total square feet: ${squareFeet.toFixed(2)}`, '', 'Material requirements:', ...rows.map(row => `${row.component.label} (${row.component.profile}): ${row.required.toFixed(2)} running ft total; ${formatRs(row.cost || 0)}`), `Total material cost: ${formatRs(totalCost)}`]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-[#f7f9fa] px-4 py-8 text-[#172c3c] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-[820px]">
        <section className="rounded-2xl border border-[#dfe7ea] bg-white p-5 shadow-[0_18px_50px_rgba(23,44,60,0.08)] sm:p-8">
          <header className="relative border-b border-[#e7edef] pb-6 pr-10">
            <div className="absolute right-0 top-0 grid size-9 place-items-center rounded-lg bg-[#eaf6f6] text-[#087e8b]"><Calculator size={19} aria-hidden="true" /></div>
            <p className="eyebrow">WINDOWS HUB</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Europrofilo Window Costing</h1>
            <p className="mt-2 text-sm text-[#64748b]">Separate running-foot requirements for every selected component</p>
          </header>

          <section className="mt-7">
            <h2 className="section-heading">1. Window measurements</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="field"><span>Width (feet)</span><input type="number" min="0.01" step="0.01" value={width} onChange={event => setWidth(event.target.value)} aria-invalid={!valid && width !== ''} /></label>
              <label className="field"><span>Length / Height (feet)</span><input type="number" min="0.01" step="0.01" value={height} onChange={event => setHeight(event.target.value)} aria-invalid={!valid && height !== ''} /></label>
              <label className="field sm:col-span-2"><span>Window Quantity</span><input type="number" min="1" step="1" value={windowQuantity} onChange={event => setWindowQuantity(event.target.value)} aria-invalid={!valid && windowQuantity !== ''} /></label>
            </div>
            {!valid && <p className="mt-3 text-xs font-medium text-[#b42318]">Enter positive dimensions and a whole-number quantity.</p>}
          </section>

          <section className="mt-8 border-t border-[#e7edef] pt-7">
            <h2 className="section-heading">2. Select the five window materials</h2>
            <div className="mt-4 grid gap-3">
              {components.map(component => (
                <label className="material-select" key={component.id}>
                  <span><strong>{component.label}</strong><small>{component.profile}</small></span>
                  <select value={selections[component.id]} onChange={event => changeRate(component.id, event.target.value)} aria-label={`${component.label} profile`}>
                    {availableRates.map(rate => <option key={rate.id} value={rate.id}>{component.profile} — {rate.name} ({rate.unit})</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section className="mt-8 border-t border-[#e7edef] pt-7">
            <h2 className="section-heading">Window Material Requirements</h2>
            <div className="mt-4 rounded-xl bg-[#f3f6f7] p-4 text-sm sm:p-5">
              <p className="result-label">Window measurements</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4"><span>Width: <strong>{valid ? w : '—'} ft</strong></span><span>Height: <strong>{valid ? h : '—'} ft</strong></span><span>Quantity: <strong>{valid ? quantity : '—'}</strong></span><span>Total square feet: <strong>{valid ? squareFeet.toFixed(2) : '—'} sq ft</strong></span></div>
            </div>
            <div className="mt-4 grid gap-3">
              {rows.map(row => (
                <article className="material-card" key={row.component.id}>
                  <div className="material-card-main">
                    <div className="min-w-0"><strong>{row.component.label}</strong><span>{row.component.profile} · {row.rate?.code || 'No profile rate'}</span></div>
                    <div className="required-cell"><span>Required running feet</span><strong>{!valid ? '—' : row.configured ? `${row.required.toFixed(2)} ft` : 'Not configured'}</strong><small>Per window: {!valid ? '—' : row.configured ? `${row.perWindow.toFixed(2)} ft` : 'Configure cutting rule'}</small></div>
                    <div className="rate-cell"><label><span>Rate / ft</span><input type="number" min="0" step="0.01" value={row.rate?.rate ?? ''} onChange={event => row.rate && save(availableRates.map(rate => rate.id === row.rate!.id ? { ...rate, rate: numberValue(event.target.value) } : rate))} /></label><strong>{row.cost === null ? 'Rate required' : formatRs(row.cost)}</strong></div>
                  </div>
                  <div className="material-card-controls"><label>Calculation basis<select value={row.rule.basis} onChange={event => updateRule(row.component.id, { basis: event.target.value as RuleBasis, verified: false })}><option value="perimeter">Outer perimeter</option><option value="height">Height</option><option value="width">Width</option><option value="manual">Manual configured</option></select></label><label>Multiplier<input type="number" min="0" step="0.01" value={row.rule.multiplier} onChange={event => updateRule(row.component.id, { multiplier: numberValue(event.target.value), verified: false })} /></label><label className="verify-rule"><input type="checkbox" checked={row.rule.verified} onChange={event => updateRule(row.component.id, { verified: event.target.checked })} /> Client-verified rule</label><button className="details-button" type="button" onClick={() => setExpanded(current => ({ ...current, [row.component.id]: !current[row.component.id] }))} aria-expanded={Boolean(expanded[row.component.id])}>View Cutting Details <ChevronDown size={15} aria-hidden="true" /></button></div>
                  {expanded[row.component.id] && <pre className="cutting-details">{cuttingDetails(row)}</pre>}
                  {!row.rule.verified && <p className="estimate-note">Estimate requiring fabrication confirmation.</p>}
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[#cfe8e8] bg-[#f3fbfb] p-5 sm:p-6">
            <p className="result-label">Final estimate</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><span className="text-sm text-[#64748b]">Total material cost for {valid ? quantity : '—'} window{quantity === 1 ? '' : 's'}</span><strong className="text-2xl font-semibold text-[#087e8b]">{totalCost === null ? 'Rate required' : formatRs(totalCost)}</strong></div>
          </section>

          <button className="action mt-6 w-full justify-center py-3" type="button" onClick={copyCalculation} disabled={!valid || totalCost === null}><Copy size={17} aria-hidden="true" />{copied ? <><Check size={16} aria-hidden="true" /> Copied</> : 'Copy Calculation'}</button>
          <p className="mt-4 text-center text-xs leading-5 text-[#8a98a0]">Running-foot rates and cutting rules are configurable estimates. Confirm profile compatibility, deductions, allowances, and manufacturing rules with the client before issuing a quotation.</p>
        </section>
      </div>
    </main>
  )
}
