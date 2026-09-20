import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_SUPPORT_CENTER_ENDPOINT = "manage_support_center.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const flag = (value: unknown) => value === true || value === 1 || value === "1";
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type SupportPriority = "urgent" | "high" | "normal" | "low";
export type SupportStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type SupportTicket = {
  assignedTo: string | null; category: string; channel: string; createdAt: string | null; createdBy: string;
  firstRespondedAt: string | null; firstResponseDueAt: string | null; handoffCount: number; id: number;
  messageCount: number; minutesRemaining: number; mode: "test" | "live"; priority: SupportPriority;
  resolutionDueAt: string | null; resolvedAt: string | null; slaBreached: boolean; status: SupportStatus;
  subjectKind: string; subjectLine: string; subjectMask: string; summary: string; ticketKey: string; updatedAt: string | null;
};
export type SupportMessage = { authorName: string; body: string; createdAt: string | null; deliveryState: string; id: number; ticketId: number; visibility: "customer" | "internal" };
export type SupportHandoff = { contextNote: string; createdAt: string | null; createdBy: string; domainName: "Returns" | "Delivery" | "Finance" | "Risk"; id: number; status: string; ticketId: number };
export type SupportEvent = { actorName: string; createdAt: string | null; eventType: string; id: number; note: string; subjectLabel: string; ticketId: number | null };
export type SupportSlaPolicy = { firstResponseMinutes: number; id: number; priority: SupportPriority; resolutionMinutes: number; status: string; updatedAt: string | null; updatedBy: string; version: number };
export type SupportCenterState = {
  coverage: { privacyExportSupport: boolean; protectedBackupSupport: boolean; ticketSubjectsMasked: boolean; customerInternalVisibility: boolean };
  events: SupportEvent[]; generatedAt: string | null; handoffs: SupportHandoff[]; messages: SupportMessage[];
  safety: { automaticRefund: boolean; automaticRestock: boolean; automaticCustomerBlock: boolean; automaticDeliveryStatusChange: boolean; customerMessageAutoSend: boolean; testChangesCustomerOutcome: boolean };
  slaPolicies: SupportSlaPolicy[];
  summary: { breachedTickets: number; liveTickets: number; openTickets: number; preparedHandoffs: number; testTickets: number; totalTickets: number; urgentTickets: number; waitingCustomer: number };
  tickets: SupportTicket[];
};

const normalize = (payload: Raw): SupportCenterState => {
  const summary = (payload.summary ?? {}) as Raw;
  const coverage = (payload.coverage ?? {}) as Raw;
  const safety = (payload.safety ?? {}) as Raw;
  return {
    coverage: { privacyExportSupport: flag(coverage.privacy_export_support), protectedBackupSupport: flag(coverage.protected_backup_support), ticketSubjectsMasked: flag(coverage.ticket_subjects_masked), customerInternalVisibility: flag(coverage.customer_internal_visibility) },
    events: rows(payload.events).map((item) => ({ actorName: text(item.actor_name), createdAt: nullableText(item.created_at), eventType: text(item.event_type), id: number(item.id), note: text(item.note), subjectLabel: text(item.subject_label), ticketId: item.ticket_id == null ? null : number(item.ticket_id) })),
    generatedAt: nullableText(payload.generated_at),
    handoffs: rows(payload.handoffs).map((item) => ({ contextNote: text(item.context_note), createdAt: nullableText(item.created_at), createdBy: text(item.created_by), domainName: text(item.domain_name) as SupportHandoff["domainName"], id: number(item.id), status: text(item.status), ticketId: number(item.ticket_id) })),
    messages: rows(payload.messages).map((item) => ({ authorName: text(item.author_name), body: text(item.body), createdAt: nullableText(item.created_at), deliveryState: text(item.delivery_state), id: number(item.id), ticketId: number(item.ticket_id), visibility: text(item.visibility) as SupportMessage["visibility"] })),
    safety: { automaticRefund: flag(safety.automatic_refund), automaticRestock: flag(safety.automatic_restock), automaticCustomerBlock: flag(safety.automatic_customer_block), automaticDeliveryStatusChange: flag(safety.automatic_delivery_status_change), customerMessageAutoSend: flag(safety.customer_message_auto_send), testChangesCustomerOutcome: flag(safety.test_changes_customer_outcome) },
    slaPolicies: rows(payload.sla_policies).map((item) => ({ firstResponseMinutes: number(item.first_response_minutes), id: number(item.id), priority: text(item.priority) as SupportPriority, resolutionMinutes: number(item.resolution_minutes), status: text(item.status), updatedAt: nullableText(item.updated_at), updatedBy: text(item.updated_by), version: number(item.version) })),
    summary: { breachedTickets: number(summary.breached_tickets), liveTickets: number(summary.live_tickets), openTickets: number(summary.open_tickets), preparedHandoffs: number(summary.prepared_handoffs), testTickets: number(summary.test_tickets), totalTickets: number(summary.total_tickets), urgentTickets: number(summary.urgent_tickets), waitingCustomer: number(summary.waiting_customer) },
    tickets: rows(payload.tickets).map((item) => ({ assignedTo: nullableText(item.assigned_to), category: text(item.category), channel: text(item.channel), createdAt: nullableText(item.created_at), createdBy: text(item.created_by), firstRespondedAt: nullableText(item.first_responded_at), firstResponseDueAt: nullableText(item.first_response_due_at), handoffCount: number(item.handoff_count), id: number(item.id), messageCount: number(item.message_count), minutesRemaining: number(item.minutes_remaining), mode: text(item.mode) as "test" | "live", priority: text(item.priority) as SupportPriority, resolutionDueAt: nullableText(item.resolution_due_at), resolvedAt: nullableText(item.resolved_at), slaBreached: flag(item.sla_breached), status: text(item.status) as SupportStatus, subjectKind: text(item.subject_kind), subjectLine: text(item.subject_line), subjectMask: text(item.subject_mask), summary: text(item.summary), ticketKey: text(item.ticket_key), updatedAt: nullableText(item.updated_at) })),
  };
};

async function request(options?: RequestInit) {
  const response = await fetch(bnbApiUrl(MANAGE_SUPPORT_CENTER_ENDPOINT), { cache: "no-store", ...options, headers: adminAuthHeaders({ "Content-Type": "application/json", ...(options?.headers as Record<string, string> | undefined) }) });
  const payload = await response.json().catch(() => ({})) as Raw & { message?: string; state?: Raw; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Support Center could not be loaded.");
  return { message: payload.message ?? "", state: normalize(payload.state && typeof payload.state === "object" ? payload.state : payload) };
}

export const loadSupportCenter = () => request().then((result) => result.state);
export const createSupportTicket = (data: Raw) => request({ method: "POST", body: JSON.stringify({ action: "create_ticket", ...data }) });
export const assignSupportTicket = (ticketId: number, assignee: string) => request({ method: "POST", body: JSON.stringify({ action: "assign_ticket", ticket_id: ticketId, assignee }) });
export const addSupportMessage = (ticketId: number, visibility: string, body: string) => request({ method: "POST", body: JSON.stringify({ action: "add_message", ticket_id: ticketId, visibility, body }) });
export const updateSupportTicketStatus = (ticketId: number, status: string, note: string) => request({ method: "POST", body: JSON.stringify({ action: "update_status", ticket_id: ticketId, status, note }) });
export const createSupportHandoff = (ticketId: number, domain: string, context: string) => request({ method: "POST", body: JSON.stringify({ action: "create_handoff", ticket_id: ticketId, domain, context }) });
