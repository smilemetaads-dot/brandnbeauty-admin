"use client";

export function PrintPageButton() {
  return (
    <button
      className="rounded-xl bg-[#527B86] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#466b74] print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      Print
    </button>
  );
}
