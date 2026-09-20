import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type ExpensePeriod = "Today" | "7D" | "30D" | "90D";
export type ExpenseStatus = "draft" | "submitted" | "approved" | "paid" | "rejected";

export type ExpenseRecord = {
  amount: number;
  approval_note: string | null;
  approved_at: string | null;
  category: string;
  cost_center: string | null;
  created_at: string | null;
  description: string;
  expense_date: string;
  id: string;
  note: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: "paid" | "unpaid";
  reference: string | null;
  status: ExpenseStatus;
  updated_at: string | null;
  vendor: string | null;
};

export type ExpenseState = {
  categories: string[];
  category_totals: Record<string, number>;
  generated_at: string;
  period: { from: string; key: ExpensePeriod; to: string };
  records: ExpenseRecord[];
  summary: { approved_cost: number; approved_unpaid: number; awaiting_approval: number; drafts: number; paid: number; records: number; rejected: number };
};

type ExpenseResponse = Partial<ExpenseState> & { message?: string; success?: boolean };
const ENDPOINT = bnbApiUrl("manage_expenses.php");

const emptyState = (period: ExpensePeriod): ExpenseState => ({
  categories: [], category_totals: {}, generated_at: new Date(0).toISOString(), period: { from: "", key: period, to: "" }, records: [],
  summary: { approved_cost: 0, approved_unpaid: 0, awaiting_approval: 0, drafts: 0, paid: 0, records: 0, rejected: 0 },
});

function normalize(payload: ExpenseResponse, period: ExpensePeriod): ExpenseState {
  const fallback = emptyState(period);
  return { categories: Array.isArray(payload.categories) ? payload.categories : [], category_totals: payload.category_totals ?? {}, generated_at: String(payload.generated_at ?? fallback.generated_at), period: payload.period ?? fallback.period, records: Array.isArray(payload.records) ? payload.records : [], summary: payload.summary ?? fallback.summary };
}

export async function fetchExpenses(period: ExpensePeriod, signal?: AbortSignal) {
  const response = await fetch(`${ENDPOINT}?period=${encodeURIComponent(period)}`, { cache: "no-store", headers: adminAuthHeaders(), signal });
  const payload = (await response.json().catch(() => null)) as ExpenseResponse | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message ?? "Expenses could not be loaded.");
  return normalize(payload, period);
}

async function postExpense(payload: Record<string, unknown>, period: ExpensePeriod) {
  const response = await fetch(`${ENDPOINT}?period=${encodeURIComponent(period)}`, { body: JSON.stringify({ ...payload, period }), headers: adminAuthHeaders({ "Content-Type": "application/json" }), method: "POST" });
  const result = (await response.json().catch(() => null)) as ExpenseResponse | null;
  if (!response.ok || !result?.success) throw new Error(result?.message ?? "The expense action could not be completed.");
  return { message: result.message ?? "Expense updated.", state: normalize(result, period) };
}

export function createExpenseDraft(input: { amount: number; category: string; confirmed: boolean; costCenter: string; description: string; expenseDate: string; note: string; paymentMethod: string; period: ExpensePeriod; reference: string; vendor: string }) {
  return postExpense({ action: "create_draft", amount: input.amount, category: input.category, confirmed: input.confirmed, cost_center: input.costCenter, description: input.description, expense_date: input.expenseDate, note: input.note, payment_method: input.paymentMethod, reference: input.reference, vendor: input.vendor }, input.period);
}

export function transitionExpense(input: { action: "approve_expense" | "record_paid_evidence" | "reject_expense" | "submit_for_approval"; confirmed: boolean; expenseId: string; paymentReference: string; period: ExpensePeriod; reason: string }) {
  return postExpense({ action: input.action, confirmed: input.confirmed, expense_id: input.expenseId, payment_reference: input.paymentReference, reason: input.reason }, input.period);
}
