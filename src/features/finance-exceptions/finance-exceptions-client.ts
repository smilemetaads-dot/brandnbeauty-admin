import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";
import {
  fetchFinanceReconciliation,
  type FinanceReconciliationRecord,
} from "@/features/finance-reconciliation/finance-reconciliation-client";
import {
  fetchProfitability,
  type ProfitabilityOrder,
} from "@/features/profitability/profitability-client";
import {
  fetchExpenses,
  type ExpenseRecord,
} from "@/features/expenses/expenses-client";

type FinanceControlAlert = {
  severity: "critical" | "warning";
  title: string;
  count: number;
};

type FinanceObligation = {
  id: number;
  due_date: string;
  payee: string;
  category: string;
  description: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  reference?: string | null;
};

type FinanceControlState = {
  success: boolean;
  period: { from: string; to: string };
  summary: {
    settled_cod: number;
    outstanding_cod: number;
    payable_obligations: number;
    delivered_revenue: number;
    direct_costs: number;
    operating_expenses: number;
    operating_profit: number;
    operational_cash_proxy: number;
    delivered_orders: number;
  };
  alerts: FinanceControlAlert[];
  obligations: FinanceObligation[];
};

const CONTROL = bnbApiUrl("get_finance_control.php");

async function fetchFinanceControl(signal?: AbortSignal): Promise<FinanceControlState> {
  const response = await fetch(CONTROL, {
    cache: "no-store",
    headers: adminAuthHeaders(),
    signal,
  });
  const payload = (await response.json().catch(() => null)) as
    | FinanceControlState
    | null;
  if (!response.ok || !payload?.success) {
    throw new Error("Finance Control could not be loaded.");
  }
  return payload;
}

export type FinanceException =
  | {
      kind: "reconciliation";
      severity: "critical" | "warning";
      record: FinanceReconciliationRecord;
    }
  | {
      kind: "profitability";
      severity: "critical" | "warning";
      order: ProfitabilityOrder;
    }
  | {
      kind: "expense";
      severity: "warning";
      expense: ExpenseRecord;
    }
  | {
      kind: "payable";
      severity: "critical" | "warning";
      obligation: FinanceObligation;
    };

function payableSeverity(item: FinanceObligation) {
  return item.status === "overdue" ? "critical" : "warning";
}

export async function loadFinanceExceptions(signal?: AbortSignal) {
  const [reconciliation, profitability, expenses, control] = await Promise.all([
    fetchFinanceReconciliation("30D", signal),
    fetchProfitability("30D", signal),
    fetchExpenses("30D", signal),
    fetchFinanceControl(signal),
  ]);

  const exceptions: FinanceException[] = [];

  for (const record of reconciliation.records) {
    if (
      record.status === "mismatch" ||
      record.outstanding_amount > 0 ||
      record.legacy_unposted_settlement
    ) {
      exceptions.push({
        kind: "reconciliation",
        severity:
          record.status === "mismatch" || record.legacy_unposted_settlement
            ? "critical"
            : "warning",
        record,
      });
    }
  }

  for (const order of profitability.orders) {
    if (order.cost_state === "missing" || order.contribution_profit === null) {
      exceptions.push({
        kind: "profitability",
        severity: "critical",
        order,
      });
    } else if (order.contribution_profit < 0) {
      exceptions.push({
        kind: "profitability",
        severity: "warning",
        order,
      });
    }
  }

  for (const expense of expenses.records) {
    if (expense.status === "submitted" || expense.status === "approved") {
      if (expense.status === "submitted" || expense.payment_status === "unpaid") {
        exceptions.push({
          kind: "expense",
          severity: "warning",
          expense,
        });
      }
    }
  }

  for (const obligation of control.obligations) {
    if (obligation.balance > 0) {
      exceptions.push({
        kind: "payable",
        severity: payableSeverity(obligation),
        obligation,
      });
    }
  }

  const priority = { critical: 0, warning: 1 };
  exceptions.sort((a, b) => priority[a.severity] - priority[b.severity]);

  return {
    reconciliation,
    profitability,
    expenses,
    control,
    exceptions,
    summary: {
      totalExceptions: exceptions.length,
      critical: exceptions.filter((item) => item.severity === "critical").length,
      reconciliation: exceptions.filter((item) => item.kind === "reconciliation").length,
      profitability: exceptions.filter((item) => item.kind === "profitability").length,
      expenses: exceptions.filter((item) => item.kind === "expense").length,
      payables: exceptions.filter((item) => item.kind === "payable").length,
    },
  };
}
