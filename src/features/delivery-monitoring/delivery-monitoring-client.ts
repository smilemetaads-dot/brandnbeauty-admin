import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export type DeliveryShipment = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  order_status: string;
  total_amount: number;
  courier_status: string;
  shipment_id: string;
  provider: string;
  consignment_id: string | null;
  tracking_code: string | null;
  delivery_fee: number;
  cod_amount: number;
  last_movement_at: string | null;
  latest_external_status: string | null;
  latest_failure_reason: string | null;
  latest_note: string | null;
  exception: {
    id: string;
    type: string;
    severity: string;
    reason_code: string | null;
    message: string;
    first_detected_at: string | null;
    last_detected_at: string | null;
  } | null;
  return_receipt_status: string | null;
  return_received_at: string | null;
  return_inspected_at: string | null;
};

export type DeliveryMonitoringData = {
  summary: {
    active: number;
    in_transit: number;
    out_for_delivery: number;
    exceptions: number;
    returning: number;
    delivered: number;
    returned_waiting_receiving: number;
  };
  thresholds: {
    stale_in_transit_hours: number;
    stale_out_for_delivery_hours: number;
    stale_returning_hours: number;
  };
  shipments: DeliveryShipment[];
  failure_reasons: string[];
};

const ENDPOINT=bnbApiUrl("manage_delivery_monitoring.php");

async function request(
  method:"GET"|"POST",
  body?:Record<string,unknown>,
  signal?:AbortSignal,
){
  const response=await fetch(ENDPOINT,{
    method,
    cache:"no-store",
    headers:adminAuthHeaders({"Content-Type":"application/json"}),
    body:method==="POST"?JSON.stringify(body??{}):undefined,
    signal,
  });

  const payload=await response.json().catch(()=>({})) as {
    success?:boolean;
    message?:string;
    [key:string]:unknown;
  };

  if(!response.ok||payload.success===false){
    throw new Error(payload.message||"Delivery Monitoring request failed.");
  }

  return payload;
}

export async function loadDeliveryMonitoring(
  signal?:AbortSignal,
):Promise<DeliveryMonitoringData>{
  return await request("GET",undefined,signal) as unknown as DeliveryMonitoringData;
}

export async function recordDeliveryStatus(input:{
  orderId:string;
  status:string;
  failureReasonCode?:string;
  note?:string;
}){
  return request("POST",{
    action:"record_status",
    order_id:input.orderId,
    status:input.status,
    failure_reason_code:input.failureReasonCode||"",
    note:input.note||"",
  });
}
