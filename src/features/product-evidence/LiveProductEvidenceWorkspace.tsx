"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decideProductClaim,
  loadEvidencePortfolio,
  loadProductEvidence,
  saveProductClaim,
  type ClaimType,
  type EvidencePortfolio,
  type EvidenceStrength,
  type ProductClaim,
  type ProductEvidenceState,
} from "./product-evidence-client";

const emptyPortfolio: EvidencePortfolio = {
  schema_ready: false,
  summary: { products: 0, claims: 0, verified: 0, customer_facing_eligible: 0, chatbot_eligible: 0, review_required: 0 },
  products: [],
};

export function LiveProductEvidenceWorkspace() {
  const [portfolio, setPortfolio] = useState<EvidencePortfolio>(emptyPortfolio);
  const [detail, setDetail] = useState<ProductEvidenceState | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [claimId, setClaimId] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("benefit");
  const [claimText, setClaimText] = useState("");
  const [strength, setStrength] = useState<EvidenceStrength>("insufficient");
  const [owner, setOwner] = useState("Admin");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [reviewer, setReviewer] = useState("Admin");
  const [reason, setReason] = useState("");

  const loadPortfolio = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await loadEvidencePortfolio(signal);
      setPortfolio(next);
      setSelectedId((current) => next.products.some((item) => item.product_id === current) ? current : next.products[0]?.product_id || "");
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Evidence readiness could not be loaded.");
    }
  }, []);

  const loadDetail = useCallback(async (productId: string, signal?: AbortSignal) => {
    if (!productId) return setDetail(null);
    try { setDetail(await loadProductEvidence(productId, signal)); }
    catch (caught) { if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Product evidence could not be loaded."); }
  }, []);

  useEffect(() => { const c = new AbortController(); void loadPortfolio(c.signal); return () => c.abort(); }, [loadPortfolio]);
  useEffect(() => { const c = new AbortController(); void loadDetail(selectedId, c.signal); return () => c.abort(); }, [loadDetail, selectedId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return portfolio.products.filter((item) => !needle || `${item.name} ${item.sku} ${item.brand} ${item.category}`.toLowerCase().includes(needle));
  }, [portfolio.products, query]);

  function resetDraft() { setClaimId(""); setClaimType("benefit"); setClaimText(""); setStrength("insufficient"); setOwner("Admin"); setSourceIds([]); }
  function editClaim(claim: ProductClaim) { setClaimId(claim.id); setClaimType(claim.claim_type); setClaimText(claim.claim_text); setStrength(claim.evidence_strength); setOwner(claim.owner || "Admin"); setSourceIds(claim.sources.map((s) => s.id)); }

  async function save() {
    if (!selectedId) return;
    setBusy(true); setError("");
    try {
      setDetail(await saveProductClaim({ claimId: claimId || undefined, productId: selectedId, claimType, claimText, evidenceStrength: strength, owner, sourceIds }));
      resetDraft(); setPortfolio(await loadEvidencePortfolio()); setNotice("Evidence draft saved. Nothing was published.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Claim could not be saved."); }
    finally { setBusy(false); }
  }

  async function decide(action: "verify_claim" | "restrict_claim" | "archive_claim", id: string) {
    setBusy(true); setError("");
    try {
      setDetail(await decideProductClaim({ action, claimId: id, actor: reviewer, reason }));
      setPortfolio(await loadEvidencePortfolio()); setReason(""); setNotice("Human evidence decision recorded.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Claim decision failed."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <header><p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#547874]">Catalog · knowledge evidence governance</p><h1 className="mt-2 text-[28px] font-bold tracking-[-.04em] text-[#17231f]">Claim & Evidence Readiness</h1><p className="mt-1.5 max-w-4xl text-[10px] font-medium leading-5 text-[#74817b]">Map exact product claims to recorded sources, assign evidence strength by human review, and control customer/chatbot eligibility.</p></header>
    {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[9px] font-semibold text-rose-700">{error}</div> : null}
    {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[9px] font-semibold text-emerald-700">{notice}</div> : null}
    {!portfolio.schema_ready ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[8px] text-amber-900"><b>Controlled setup required:</b> Batch 3B evidence tables are not initialized yet. Production bootstrap is intentionally separate.</div> : null}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{[
      ["Products", portfolio.summary.products], ["Claims", portfolio.summary.claims], ["Verified", portfolio.summary.verified], ["Customer-safe", portfolio.summary.customer_facing_eligible], ["Chatbot-safe", portfolio.summary.chatbot_eligible], ["Review", portfolio.summary.review_required],
    ].map(([label,value]) => <article className="rounded-2xl border border-[#dfe6e3] bg-white p-4" key={String(label)}><p className="text-[7px] font-bold uppercase text-[#87928d]">{String(label)}</p><strong className="mt-3 block text-[22px] text-[#17231f]">{Number(value)}</strong></article>)}</section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,.9fr)]">
      <article className="overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white"><div className="border-b p-4"><input className="h-10 w-full rounded-xl border px-3 text-[9px]" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search product, SKU, brand or category"/></div><div className="divide-y">{filtered.map((item)=><button key={item.product_id} type="button" onClick={()=>{setSelectedId(item.product_id);resetDraft();}} className={`w-full p-4 text-left ${selectedId===item.product_id?"bg-[#f2f7f5]":"hover:bg-[#fafcfb]"}`}><b className="text-[9px] text-[#405049]">{item.name}</b><p className="mt-1 text-[7px] text-[#87928d]">{item.sku||"No SKU"} · {item.brand||"No brand"} · {item.evidence_summary.verified} verified · {item.evidence_summary.customer_facing_eligible} customer-safe</p></button>)}</div></article>

      <aside className="space-y-4">{detail ? <>
        <section className="rounded-2xl border border-[#dfe6e3] bg-white p-5"><h2 className="text-[17px] font-bold text-[#26362f]">{detail.product.name}</h2><p className="mt-1 text-[7px] text-[#87928d]">{detail.summary.verified} verified · {detail.summary.customer_facing_eligible} customer-safe · {detail.summary.review_required} review</p></section>
        <section className="space-y-3 rounded-2xl border border-[#dfe6e3] bg-white p-5"><b className="text-[9px] text-[#405049]">{claimId?"Edit evidence draft":"New evidence draft"}</b><div className="grid grid-cols-2 gap-2"><select className="h-10 rounded-xl border bg-white px-3 text-[8px]" value={claimType} onChange={(e)=>setClaimType(e.target.value as ClaimType)}>{["benefit","visible_result","best_for","usage","safety","ingredient","other"].map((v)=><option value={v} key={v}>{v}</option>)}</select><select className="h-10 rounded-xl border bg-white px-3 text-[8px]" value={strength} onChange={(e)=>setStrength(e.target.value as EvidenceStrength)}>{["strong","moderate","early","insufficient"].map((v)=><option value={v} key={v}>{v}</option>)}</select></div><textarea className="min-h-24 w-full rounded-xl border p-3 text-[8px]" value={claimText} onChange={(e)=>setClaimText(e.target.value)} placeholder="Exact claim to govern"/><input className="h-10 w-full rounded-xl border px-3 text-[8px]" value={owner} onChange={(e)=>setOwner(e.target.value)} placeholder="Human evidence owner"/><div className="space-y-2 rounded-xl border bg-[#fafcfb] p-3"><p className="text-[7px] font-bold uppercase text-[#66736d]">Recorded sources</p>{detail.sources.length?detail.sources.map((s)=><label key={s.id} className="flex gap-2 text-[7px] text-[#66736d]"><input type="checkbox" checked={sourceIds.includes(s.id)} onChange={(e)=>setSourceIds((cur)=>e.target.checked?[...new Set([...cur,s.id])]:cur.filter((id)=>id!==s.id))}/><span><b>{s.source_title||s.source_type}</b> · {s.verified?"verified":"not verified"}</span></label>):<p className="text-[7px] text-amber-700">Add product evidence sources in Content Enrichment first.</p>}</div><button type="button" disabled={busy||!portfolio.schema_ready||claimText.trim().length<8||!owner.trim()} onClick={()=>void save()} className="h-10 w-full rounded-xl bg-[#426d72] text-[8px] font-bold text-white disabled:opacity-40">Save evidence draft</button></section>
        <section className="space-y-3 rounded-2xl border border-[#dfe6e3] bg-white p-5"><div className="grid grid-cols-2 gap-2"><input className="h-10 rounded-xl border px-3 text-[8px]" value={reviewer} onChange={(e)=>setReviewer(e.target.value)} placeholder="Reviewer"/><input className="h-10 rounded-xl border px-3 text-[8px]" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Decision reason"/></div>{detail.claims.length?detail.claims.map((claim)=><article className="rounded-xl border p-4" key={claim.id}><div className="flex justify-between gap-3"><div><p className="text-[7px] text-[#87928d]">{claim.claim_type} · {claim.evidence_strength} · {claim.status}</p><p className="mt-2 text-[8px] font-semibold leading-4 text-[#405049]">{claim.claim_text}</p></div>{claim.status==="draft"?<button className="text-[7px] font-bold text-[#426d72]" type="button" onClick={()=>editClaim(claim)}>Edit</button>:null}</div><p className="mt-2 text-[7px] text-[#87928d]">{claim.readiness.verified_source_count}/{claim.readiness.source_count} sources verified · {claim.readiness.customer_facing_eligible?"customer-safe":claim.readiness.internal_education_only?"internal only":"not customer-safe"}</p>{claim.readiness.blockers.length?<p className="mt-2 text-[7px] text-amber-700">{claim.readiness.blockers.join(" · ")}</p>:null}<div className="mt-3 flex gap-2"><button type="button" disabled={busy||claim.status!=="draft"||!claim.readiness.verification_ready} onClick={()=>void decide("verify_claim",claim.id)} className="rounded-lg bg-[#426d72] px-3 py-2 text-[7px] font-bold text-white disabled:opacity-40">Verify</button><button type="button" disabled={busy||claim.status==="archived"||!reason.trim()} onClick={()=>void decide("restrict_claim",claim.id)} className="rounded-lg border border-amber-200 px-3 py-2 text-[7px] font-bold text-amber-700 disabled:opacity-40">Restrict</button><button type="button" disabled={busy||claim.status==="verified"||claim.status==="archived"} onClick={()=>void decide("archive_claim",claim.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-[7px] font-bold text-rose-700 disabled:opacity-40">Archive</button></div></article>):<p className="text-[8px] text-[#87928d]">No governed claims yet.</p>}</section>
      </>:<div className="rounded-2xl border border-[#dfe6e3] bg-white p-10 text-center text-[9px] text-[#87928d]">Select a product.</div>}</aside>
    </section>
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-[8px] leading-4 text-sky-900"><b>Evidence policy:</b> strength is human-assigned only. Early evidence remains internal-only. Strong/moderate claims become customer/chatbot eligible only after human verification and a linked human-verified source.</section>
  </div>;
}
