// REFERENCE ONLY.
// Original Canvas Add/Edit Product design source.
// Do not import this file into production src.
// Use only as visual skeleton reference for rebuilding src/features/products/RealAddEditProductPage.tsx.
/* eslint-disable */
// @ts-nocheck
/*
Full-context page file generated from the uploaded final admin source.
Page: Add/Edit Product
Source component: ProductMasterPage
Use this as reference for live injection. Do not import from _reference into production src.
*/

import React, { useState } from "react";

function Badge({ children, tone = "default" }) {
  const cls = {
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
  }[tone] || "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

function StatCard({ item, index = 0, active = false }) {
  const icons = ["▥", "☷", "৳", "▸"];
  const trendText = String(item[2]).toLowerCase();
  const trendTone = trendText.includes("risk") || trendText.includes("need") || trendText.includes("blocked") || trendText.includes("missing") ? "text-amber-600 bg-amber-50" : "text-emerald-700 bg-emerald-50";
  return (
    <button type="button" className={`group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15" : "border-slate-200"}`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500">{item[0]}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{item[1]}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xl font-bold text-[#5E7F85]">{icons[index % icons.length]}</div>
      </div>
      <div className={`relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trendTone}`}>{item[2]}</div>
    </button>
  );
}

function TableHead({ children, className = "" }) {
  return <thead className={`sticky top-0 z-10 bg-stone-50 text-slate-500 ${className}`}>{children}</thead>;
}

export default function ProductMasterPagePreviewWrapper() {
  const [trackStock, setTrackStock] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [websiteVisible, setWebsiteVisible] = useState(true);
  const [messengerOrder, setMessengerOrder] = useState(true);
  const [productType, setProductType] = useState("Single Product");
  const [stockRule, setStockRule] = useState("Sellable");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState("Show with Notify Me");
  const [status, setStatus] = useState("Draft");
  const [productName, setProductName] = useState("");
  const [brandList, setBrandList] = useState(["BrandnBeauty", "The Derma Plus", "COSRX", "Some By Mi", "Beauty of Joseon", "Simple"]);
  const [brand, setBrand] = useState("BrandnBeauty");
  const [category, setCategory] = useState("Skincare");
  const [subcategory, setSubcategory] = useState("Face Wash");
  const [concern, setConcern] = useState("Acne");
  const [skuCounter, setSkuCounter] = useState(1001);
  const [costPrice, setCostPrice] = useState("420");
  const [regularPrice, setRegularPrice] = useState("1290");
  const [salePrice, setSalePrice] = useState("990");
  const [stockQty, setStockQty] = useState("24");
  const [lowStockAlert, setLowStockAlert] = useState("6");
  const [weight, setWeight] = useState("100");
  const [courierCost, setCourierCost] = useState("80");
  const [duplicateCheck, setDuplicateCheck] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [ignoredDuplicates, setIgnoredDuplicates] = useState(false);
  const [actionToast, setActionToast] = useState("");
  const [variants, setVariants] = useState([
    { id: 1, option: "30ml", sku: "1001-1", cost: "390", regular: "890", sale: "750", stock: "24", lowStock: "5", status: "Active" },
    { id: 2, option: "50ml", sku: "1001-2", cost: "520", regular: "1290", sale: "990", stock: "12", lowStock: "4", status: "Active" },
  ]);
  const [variantDraft, setVariantDraft] = useState({ option: "", cost: "", regular: "", sale: "", stock: "", lowStock: "", status: "Active" });
  const [mainImageReady, setMainImageReady] = useState(false);
  const [galleryImages, setGalleryImages] = useState(["Angle 1", "Texture", "Box", "Routine"]);
  const [productLabel, setProductLabel] = useState("Bestseller");
  const [productBadge, setProductBadge] = useState("Authentic Product");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [visibleResultTitle, setVisibleResultTitle] = useState("Visible Results");
  const [visibleResultBullets, setVisibleResultBullets] = useState(`Skin feels less oily within first few uses\nHelps reduce clogged pores\nSupports a cleaner daily routine`);
  const [trustBadges, setTrustBadges] = useState(["100% Authentic", "Verified Seller", "COD Available", "Fast Delivery"]);
  const [skinType, setSkinType] = useState("Oily / Acne Prone");
  const [routineStep, setRoutineStep] = useState("Cleanser");
  const [routineTime, setRoutineTime] = useState("AM + PM");
  const [routineFrequency, setRoutineFrequency] = useState("Daily");
  const [productFaqs, setProductFaqs] = useState([
    { id: 1, question: "Is this product suitable for daily use?", answer: "Yes, follow the usage direction and patch test before first use." },
    { id: 2, question: "Can sensitive skin use this product?", answer: "Sensitive skin users should patch test first and start slowly." },
  ]);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Unsaved changes");
  const [aiContentMode, setAiContentMode] = useState("Conversion + SEO");
  const [aiContentLanguage, setAiContentLanguage] = useState("English + Bangla Friendly");
  const [aiTargetCustomer, setAiTargetCustomer] = useState("Bangladesh skincare buyer");

  const categoryTree = {
    Skincare: ["Face Wash", "Serum", "Moisturizer", "Sunscreen", "Toner"],
    "Hair Care": ["Shampoo", "Hair Mask", "Hair Serum", "Scalp Care"],
    Makeup: ["Lip", "Face", "Eye", "Brushes"],
    "Body Care": ["Body Wash", "Lotion", "Scrub"],
  };
  const concernList = ["Acne", "Dark Spots", "Brightening", "Oily Skin", "Dry Skin", "Sensitive Skin", "Hairfall", "Dull Skin"];
  const catalogProducts = [
    { name: "Acne Balance Facewash", brand: "Some By Mi", price: 890, stock: 44 },
    { name: "Barrier Calm Serum", brand: "BrandnBeauty", price: 990, stock: 18 },
    { name: "Daily Sun Gel", brand: "Beauty of Joseon", price: 1250, stock: 0 },
    { name: "Hydra Gel Moisturizer", brand: "Simple", price: 850, stock: 72 },
    { name: "Routine Bundle", brand: "BrandnBeauty", price: 2020, stock: 12 },
  ];

  const autoSku = String(skuCounter);
  const autoSlug = productName ? productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "auto-generated-slug";
  const isVariantProduct = productType === "Variant Product";
  const selectedVariant = variants[0];
  const previewSalePrice = isVariantProduct ? selectedVariant.sale : salePrice;
  const previewRegularPrice = isVariantProduct ? selectedVariant.regular : regularPrice;
  const previewCostPrice = isVariantProduct ? selectedVariant.cost : costPrice;
  const previewStockQty = isVariantProduct ? String(variants.reduce((sum, item) => sum + Number(item.stock || 0), 0)) : stockQty;
  const netProfit = Math.max((Number(previewSalePrice) || 0) - (Number(previewCostPrice) || 0) - (Number(courierCost) || 0), 0);
  const margin = Number(previewSalePrice) > 0 ? Math.round((netProfit / Number(previewSalePrice)) * 100) : 0;
  const discount = Number(previewRegularPrice) > 0 ? Math.max(Math.round(((Number(previewRegularPrice) - Number(previewSalePrice)) / Number(previewRegularPrice)) * 100), 0) : 0;
  const seoTitleText = seoTitle || `${productName || "Product Name Preview"} | BrandnBeauty`;
  const metaDescriptionText = metaDescription || `Buy authentic ${brand} ${productName || "product"} in Bangladesh. Best price, COD and fast delivery available.`;
  const duplicateProducts = productName.length > 2 && duplicateCheck && !ignoredDuplicates ? ["Acne Control Facewash", "Acne Balance Facewash"] : [];
  const contentItems = [productName, mainImageReady, galleryImages.length >= 3, shortDescription, fullDescription, howToUse, ingredients, seoTitle, productDetails, skinType, routineStep, productFaqs.length > 0];
  const contentScore = Math.round((contentItems.filter(Boolean).length / contentItems.length) * 100);
  const publishChecks = [
    { label: "Product name", ok: Boolean(productName) },
    { label: "Sale price", ok: Number(previewSalePrice) > 0 },
    { label: "Stock or variant stock", ok: Number(previewStockQty) > 0 || stockRule !== "Sellable" },
    { label: "Main image", ok: mainImageReady },
    { label: "Short description", ok: Boolean(shortDescription) },
    { label: "SEO title", ok: Boolean(seoTitle) },
  ];
  const publishBlocked = publishChecks.some((item) => !item.ok);

  const showActionToast = (message) => {
    setActionToast(message);
    setTimeout(() => setActionToast(""), 2200);
  };

  const saveDraft = () => {
    setSaveStatus("Saving...");
    setTimeout(() => {
      setSaveStatus("Saved just now");
      showActionToast("Draft saved successfully");
    }, 500);
  };

  const generateAutomationContent = () => {
    const cleanName = productName || `${brand} ${subcategory}`;
    setShortDescription(`${cleanName} is a ${routineStep.toLowerCase()} step product for ${concern.toLowerCase()} focused daily skincare routines.`);
    setFullDescription(`${cleanName} helps customers build a simple, consistent routine for ${concern.toLowerCase()} concern. It is positioned for ${aiTargetCustomer.toLowerCase()} with clear usage guidance, trust-focused product information and conversion-friendly PDP content.`);
    setProductDetails(`Best for: ${skinType}. Routine step: ${routineStep}. Use time: ${routineTime}. Frequency: ${routineFrequency}. Designed to support a clean, practical and easy-to-follow skincare routine.`);
    setHowToUse(`Use as the ${routineStep.toLowerCase()} step in your routine. Apply as directed, then follow with the next routine step. Use ${routineTime.toLowerCase()} • ${routineFrequency.toLowerCase()}. Patch test before first use.`);
    setIngredients(ingredients || "Add INCI ingredient list here. Keep ingredient names clean, comma-separated and packaging-safe.");
    setVisibleResultBullets(`Skin feels cleaner and more comfortable\nSupports ${concern.toLowerCase()} focused routine\nHelps maintain a more consistent skincare habit`);
    setProductFaqs([
      { id: 1, question: `How do I use ${cleanName}?`, answer: `Use it as the ${routineStep.toLowerCase()} step. Follow the usage direction and patch test before first use.` },
      { id: 2, question: `Is ${cleanName} suitable for ${skinType.toLowerCase()}?`, answer: `It is positioned for ${skinType.toLowerCase()} users, but sensitive skin users should patch test first.` },
      { id: 3, question: "When should I use it?", answer: `Recommended use time: ${routineTime}. Frequency: ${routineFrequency}.` },
    ]);
    setSeoTitle(`${cleanName} Price in Bangladesh | BrandnBeauty`);
    setMetaDescription(`Buy authentic ${cleanName} in Bangladesh from BrandnBeauty. Suitable for ${concern.toLowerCase()} focused skincare routines with COD and fast delivery.`);
    setFocusKeyword(`${cleanName.toLowerCase()} ${category.toLowerCase()} bangladesh`);
    setSaveStatus("Unsaved changes");
    showActionToast("AI-ready product content generated for review");
  };

  const addVariant = () => {
    const option = variantDraft.option.trim();
    if (!option) {
      showActionToast("Variant option name is required");
      return;
    }
    const nextVariant = {
      id: Date.now(),
      option,
      sku: `${autoSku}-${variants.length + 1}`,
      cost: variantDraft.cost || costPrice,
      regular: variantDraft.regular || regularPrice,
      sale: variantDraft.sale || salePrice,
      stock: variantDraft.stock || "0",
      lowStock: variantDraft.lowStock || lowStockAlert,
      status: variantDraft.status || "Active",
    };
    setVariants((current) => [...current, nextVariant]);
    setVariantDraft({ option: "", cost: "", regular: "", sale: "", stock: "", lowStock: "", status: "Active" });
    showActionToast("Variant row added");
  };

  return (
    <div className="space-y-6">
      {actionToast && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">✅ {actionToast}</div>}

      <div className="sticky top-3 z-20 rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#5E7F85]">Product Editor</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{productName || "New Product Draft"} • {isVariantProduct ? `${variants.length} variants` : autoSku}</div>
            <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${saveStatus.includes("Saved") || saveStatus.includes("Published") ? "bg-emerald-50 text-emerald-700" : saveStatus.includes("Saving") ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-slate-600"}`}>{saveStatus}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveDraft} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Save Draft</button>
            <button onClick={() => showActionToast("Preview opened")} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Preview</button>
            <button onClick={() => setPublishModalOpen(true)} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">Publish</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["SEO Score", "82/100", "Need meta polish"], ["Net Profit", `৳${netProfit}`, "After cost + courier"], ["Images", `${galleryImages.length} Ready`, "Gallery prepared"], ["Margin", `${margin}%`, isVariantProduct ? "Based on default variant" : "Live calculation"]].map((item, index) => <StatCard key={item[0]} item={item} index={index} active={item[0] === "Margin"} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold tracking-tight">Product Master Form</h2><Badge tone="brand">Ultra Build</Badge></div>
            {duplicateProducts.length > 0 && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><b>Similar products found:</b> {duplicateProducts.join(" • ")}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => showActionToast("Similar products preview opened")} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-800 shadow-sm">View Similar</button><button type="button" onClick={() => { setIgnoredDuplicates(true); showActionToast("Duplicate warning ignored for this draft"); }} className="rounded-xl border border-amber-200 bg-amber-100/60 px-3 py-2 text-xs font-bold text-amber-800">Ignore</button></div></div></div>}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Product Name</div><input value={productName} onChange={(event) => setProductName(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="Product Name" /></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Slug (auto)</div><input value={autoSlug} readOnly className="w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none" /></label>
              <label className="space-y-2"><div className="flex items-center justify-between gap-2"><div className="text-sm font-medium text-slate-600">Parent SKU</div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">AUTO GENERATED</span></div><div className="relative"><input value={autoSku} readOnly className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 pr-28 text-sm font-bold text-emerald-800 outline-none" /><button type="button" onClick={() => setSkuCounter((current) => current + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#5E7F85] shadow-sm">Regenerate</button></div></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Barcode (optional)</div><input className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder="Barcode (optional)" /></label>
              <label className="space-y-2"><div className="flex items-center justify-between gap-2"><div className="text-sm font-medium text-slate-600">Brand</div><button type="button" onClick={() => setBrandList((current) => current.includes("New Brand") ? current : [...current, "New Brand"])} className="text-xs font-bold text-[#5E7F85]">+ Add Brand</button></div><select value={brand} onChange={(event) => setBrand(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">{brandList.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Category</div><select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory(categoryTree[event.target.value]?.[0] || ""); }} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">{Object.keys(categoryTree).map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Subcategory</div><select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">{(categoryTree[category] || []).map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-2"><div className="text-sm font-medium text-slate-600">Concern</div><select value={concern} onChange={(event) => setConcern(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">{concernList.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight">Pricing & Inventory</h2></div><div className="rounded-2xl border border-slate-200 bg-stone-50 p-1">{["Single Product", "Variant Product"].map((item) => <button key={item} onClick={() => setProductType(item)} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${productType === item ? "bg-[#5E7F85] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>{item}</button>)}</div></div>
            {!isVariantProduct ? <div className="mt-5 grid gap-4 md:grid-cols-2">{[["Cost Price", costPrice, setCostPrice], ["Regular Price", regularPrice, setRegularPrice], ["Sale Price", salePrice, setSalePrice], ["Stock Qty", stockQty, setStockQty], ["Low Stock Alert", lowStockAlert, setLowStockAlert], ["Weight (gm/ml)", weight, setWeight], ["Avg Courier Cost", courierCost, setCourierCost]].map(([label, value, setter]) => <label key={label} className="space-y-2"><div className="text-sm font-medium text-slate-600">{label}</div><input value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder={label} /></label>)}</div> : <div className="mt-5 space-y-5"><div className="rounded-2xl border border-[#5E7F85]/15 bg-[#5E7F85]/5 p-4 text-sm font-semibold leading-6 text-slate-700">Variant mode active: parent product will be used for title, SEO, content and PDP blocks. Real sellable inventory will come from variant rows.</div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["option", "cost", "regular", "sale", "stock", "lowStock"].map((key) => <label key={key} className="space-y-2"><div className="text-sm font-medium capitalize text-slate-600">{key === "lowStock" ? "Low Stock" : key}</div><input value={variantDraft[key]} onChange={(event) => setVariantDraft((current) => ({ ...current, [key]: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" placeholder={key === "option" ? "30ml / Red / Combo" : key} /></label>)}<label className="space-y-2"><div className="text-sm font-medium text-slate-600">Status</div><select value={variantDraft.status} onChange={(event) => setVariantDraft((current) => ({ ...current, status: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"><option>Active</option><option>Draft</option><option>Disabled</option></select></label></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">SKU short numeric format e auto generate হবে। Parent SKU: 1001, variant SKU: 1001-1, 1001-2.</div><button type="button" onClick={addVariant} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">+ Add Variant Row</button><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full text-left text-sm"><TableHead><tr>{["Variant", "SKU", "Cost", "Regular", "Sale", "Stock", "Low", "Status"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></TableHead><tbody>{variants.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-stone-50"><td className="px-4 py-3">{row.option}</td><td className="px-4 py-3 font-bold text-emerald-800">{row.sku}</td><td className="px-4 py-3">{row.cost}</td><td className="px-4 py-3">{row.regular}</td><td className="px-4 py-3 font-bold">{row.sale}</td><td className="px-4 py-3">{row.stock}</td><td className="px-4 py-3">{row.lowStock}</td><td className="px-4 py-3"><Badge tone="good">{row.status}</Badge></td></tr>)}</tbody></table></div></div>}
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{[[isVariantProduct ? "Variant Stock" : "Stock", previewStockQty || "0"], ["Default Sale", `৳${previewSalePrice || 0}`], ["Stock Value", `৳${((Number(previewSalePrice) || 0) * (Number(previewStockQty) || 0)).toLocaleString()}`], ["Net Profit", `৳${netProfit}`], ["Discount", `${discount}%`]].map(([label, value]) => <div key={label} className="rounded-2xl bg-stone-50 p-4"><div className="text-xs font-semibold text-slate-500">{label}</div><div className="mt-1 text-lg font-bold text-slate-900">{value}</div></div>)}</div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold tracking-tight">Content & Media</h2></div><div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3"><div className="h-2.5 w-28 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#5E7F85]" style={{ width: `${contentScore}%` }} /></div><b className="text-sm text-[#5E7F85]">{contentScore}%</b></div></div>
            <div className="mt-5 rounded-[1.7rem] border border-[#5E7F85]/15 bg-gradient-to-br from-[#5E7F85]/10 via-white to-stone-50 p-5 shadow-sm"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-slate-900">AI Content Studio</h3><Badge tone="brand">Automation Ready</Badge></div><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Generate product content, SEO, FAQ, routine copy and visible result text from the product master data. Human review required before publish.</p></div><button type="button" onClick={generateAutomationContent} className="rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm">Generate All Content</button></div><div className="mt-5 grid gap-3 md:grid-cols-3"><label className="space-y-2"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Generation Mode</div><select value={aiContentMode} onChange={(event) => setAiContentMode(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"><option>Conversion + SEO</option><option>SEO Only</option><option>PDP Content Only</option><option>FAQ + Routine Only</option></select></label><label className="space-y-2"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Language Style</div><select value={aiContentLanguage} onChange={(event) => setAiContentLanguage(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"><option>English + Bangla Friendly</option><option>English Only</option><option>Bangla + English Mix</option></select></label><label className="space-y-2"><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Target Customer</div><input value={aiTargetCustomer} onChange={(event) => setAiTargetCustomer(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none" /></label></div></div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]"><div className="space-y-5"><div className={`overflow-hidden rounded-[1.7rem] border bg-white shadow-sm ${mainImageReady ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"}`}><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><div className="text-sm font-bold text-slate-900">Main Image</div><div className="mt-1 text-xs text-slate-500">Large square product preview for storefront and PDP hero.</div></div><Badge tone={mainImageReady ? "good" : "warn"}>{mainImageReady ? "Ready" : "Missing"}</Badge></div><div className="p-5"><div className={`group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed text-center transition ${mainImageReady ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-stone-50 hover:border-[#5E7F85]/40 hover:bg-[#5E7F85]/5"}`}><div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">1:1 Preview</div><div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-white text-3xl text-[#5E7F85] shadow-sm">▧</div><div className="mt-5 text-base font-bold text-slate-900">{mainImageReady ? "Main image selected" : "Drop main product image here"}</div><div className="mt-2 max-w-xs text-xs leading-5 text-slate-500">Use a clean square image with visible product label. Recommended 1200 × 1200 px.</div><button type="button" onClick={() => { setMainImageReady(!mainImageReady); showActionToast(mainImageReady ? "Main image removed" : "Main image uploaded"); }} className="mt-5 rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white">{mainImageReady ? "Remove" : "Upload"}</button></div></div></div><div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-bold text-slate-900">Gallery Images</div><div className="mt-1 text-xs text-slate-500">Equal square cards with drag, replace and remove controls.</div></div><button type="button" onClick={() => setGalleryImages((current) => [...current, `Gallery ${current.length + 1}`])} className="rounded-2xl bg-[#5E7F85]/10 px-4 py-2.5 text-xs font-bold text-[#5E7F85]">+ Add Gallery Image</button></div><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{galleryImages.map((item, index) => <div key={`${item}-${index}`} className="rounded-[1.25rem] border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex aspect-square items-center justify-center rounded-2xl bg-stone-50 text-xs font-bold text-slate-400">{item}</div><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Image {index + 1}</span><button onClick={() => setGalleryImages((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Remove</button></div></div>)}</div></div></div><div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-bold text-slate-900">Live PDP Preview</div><div className="mt-4 rounded-3xl bg-stone-50 p-4"><div className="flex h-44 items-center justify-center rounded-3xl bg-white text-xs font-bold text-slate-400">Product Image</div><div className="mt-4 text-lg font-black text-slate-900">{productName || "Product Name Preview"}</div><div className="mt-1 text-xs font-semibold text-[#5E7F85]">{brand}</div><div className="mt-3 flex items-center gap-2"><span className="text-xl font-black text-slate-900">৳{previewSalePrice}</span><span className="text-sm text-slate-400 line-through">৳{previewRegularPrice}</span><Badge tone="warn">{discount}% OFF</Badge></div><div className="mt-3 flex flex-wrap gap-2">{trustBadges.map((badge) => <Badge key={badge} tone="brand">{badge}</Badge>)}</div></div></div></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Short Description</div><textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">How to Use</div><textarea value={howToUse} onChange={(e) => setHowToUse(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Full Description</div><textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} className="h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Ingredients</div><textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label></div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">SEO & PDP Controls</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">SEO Title</div><input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder={seoTitleText} /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Focus Keyword</div><input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Meta Description</div><textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" placeholder={metaDescriptionText} /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Visible Result Title</div><input value={visibleResultTitle} onChange={(e) => setVisibleResultTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Routine Step</div><select value={routineStep} onChange={(e) => setRoutineStep(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option>Cleanser</option><option>Serum</option><option>Moisturizer</option><option>Sunscreen</option></select></label><label className="space-y-2 md:col-span-2"><div className="text-sm font-medium text-slate-600">Visible Result Bullets</div><textarea value={visibleResultBullets} onChange={(e) => setVisibleResultBullets(e.target.value)} className="h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none" /></label></div></div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-tight">Smart Checks</h2><Badge tone={publishBlocked ? "warn" : "good"}>{publishBlocked ? "Needs work" : "Ready"}</Badge></div><div className="mt-5 space-y-3">{publishChecks.map((check) => <div key={check.label} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ok ? "✅" : "⚠"} {check.label}</div>)}</div></div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">Storefront Controls</h2><div className="mt-5 space-y-3">{[["Track Stock", trackStock, setTrackStock], ["Featured", featured, setFeatured], ["Free Delivery", freeDelivery, setFreeDelivery], ["Website Visible", websiteVisible, setWebsiteVisible], ["Messenger Order", messengerOrder, setMessengerOrder]].map(([label, value, setter]) => <button key={label} onClick={() => setter(!value)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${value ? "bg-[#5E7F85]/10 text-[#5E7F85]" : "bg-stone-50 text-slate-600"}`}><span>{label}</span><span>{value ? "ON" : "OFF"}</span></button>)}</div><div className="mt-5 grid gap-3"><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Status</div><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option>Draft</option><option>Published</option><option>Private</option></select></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Stock Rule</div><select value={stockRule} onChange={(e) => setStockRule(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option>Sellable</option><option>Notify Me</option><option>Disabled</option></select></label><label className="space-y-2"><div className="text-sm font-medium text-slate-600">Out of Stock Behavior</div><select value={outOfStockBehavior} onChange={(e) => setOutOfStockBehavior(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"><option>Show with Notify Me</option><option>Hide Product</option><option>Show Messenger Order</option></select></label></div></div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold tracking-tight">Product FAQs</h2><div className="mt-5 space-y-3">{productFaqs.map((faq) => <div key={faq.id} className="rounded-2xl bg-stone-50 p-4"><div className="font-bold text-slate-900">{faq.question}</div><div className="mt-1 text-sm text-slate-600">{faq.answer}</div></div>)}</div></div>
        </div>
      </div>

      {publishModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">Publish Check</div><h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ready to Publish?</h3></div><button onClick={() => setPublishModalOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">✕</button></div><div className="mt-6 grid gap-3">{publishChecks.map((check) => <div key={check.label} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ok ? "✅" : "⚠"} {check.label}</div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setPublishModalOpen(false)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Cancel</button><button onClick={() => { if (publishBlocked) { showActionToast("Fix publish checklist before publishing"); setPublishModalOpen(false); } else { setStatus("Published"); setSaveStatus("Published just now"); setPublishModalOpen(false); showActionToast("Product published successfully"); } }} className="rounded-2xl bg-[#5E7F85] px-4 py-3 text-sm font-semibold text-white">Publish</button></div></div></div>}
    </div>
  );
}
