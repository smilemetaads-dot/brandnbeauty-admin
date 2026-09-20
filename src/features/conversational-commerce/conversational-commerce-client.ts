import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type CommerceProduct = { id:string; name:string; sku:string; price:number; stock:number; status:string };
export type CommerceConversation = {
  id:string; conversation_key:string; channel:string; thread_reference:string; contact_reference:string; intent_summary:string;
  permitted_purpose:string; contact_consent:string; messaging_window:string; identity_status:string; customer_reference:string;
  lead_stage:string; campaign_reference:string; ad_reference:string; order_reference:string; delivery_reference:string; owner:string;
  reply_draft_count:number; order_draft_count:number; latest_draft_total:number|null; updated_at:string;
};
export type CommerceState = {
  generated_at:string; conversations:CommerceConversation[]; products:CommerceProduct[]; quality:Record<string,string|number>;
  summary:{total:number;open:number;needs_review:number;reply_drafts:number;order_drafts:number;attributed:number;delivered:number};
};

const endpoint = bnbApiUrl("manage_conversational_commerce.php");
async function call(body?:Record<string,unknown>, signal?:AbortSignal):Promise<CommerceState> {
  const response = await fetch(endpoint, body ? {body:JSON.stringify(body),headers:adminAuthHeaders({"Content-Type":"application/json"}),method:"POST",signal} : {cache:"no-store",headers:adminAuthHeaders(),signal});
  const data = await response.json().catch(()=>({})) as CommerceState & {message?:string;success?:boolean};
  if (!response.ok || data.success === false) throw new Error(data.message || "Conversational commerce is temporarily unavailable.");
  return data;
}
export const fetchCommerce = (signal?:AbortSignal) => call(undefined, signal);
export const createConversationEvidence = (input:Record<string,unknown>) => call({action:"create_conversation_evidence",confirmed:true,...input});
export const createReplyDraft = (input:Record<string,unknown>) => call({action:"create_reply_draft",confirmed:true,...input});
export const recordIdentityReview = (input:Record<string,unknown>) => call({action:"record_identity_review",confirmed:true,...input});
export const prepareOrderDraft = (input:Record<string,unknown>) => call({action:"prepare_order_draft",confirmed:true,...input});
export const updateCommerceStage = (input:Record<string,unknown>) => call({action:"update_stage",confirmed:true,...input});
