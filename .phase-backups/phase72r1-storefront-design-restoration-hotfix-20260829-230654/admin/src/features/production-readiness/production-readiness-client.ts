import { adminAuthHeaders } from "@/lib/admin-auth";
import { bnbApiUrl } from "@/lib/bnb-api";

export const MANAGE_PRODUCTION_READINESS_ENDPOINT = "manage_production_readiness.php";

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const flag = (value: unknown) => value === true || value === 1 || value === "1";
const nullableText = (value: unknown) => text(value) || null;
const rows = (value: unknown) => Array.isArray(value) ? value as Raw[] : [];

export type ReadinessOutcome = "passed" | "review" | "failed";
export type ReadinessCheck = { checkKey:string; domain:string; evidence:string; id:number; outcome:ReadinessOutcome; remediation:string; severity:string; title:string };
export type ReadinessEnvironment = { baseLabel:string; environmentKey:string; id:number; isActive:boolean; label:string; status:string; updatedAt:string|null };
export type ReadinessRun = { createdAt:string|null; failedChecks:number; id:number; passedChecks:number; reason:string; reviewChecks:number; runKey:string; score:number; status:string; totalChecks:number };
export type ReleaseGate = { checkKey:string; label:string; outcome:ReadinessOutcome; required:boolean };
export type ProductionReadinessState = {
  checks:ReadinessCheck[]; environments:ReadinessEnvironment[]; generatedAt:string|null; releaseGates:ReleaseGate[]; runs:ReadinessRun[];
  safety:{ automaticDeployment:boolean; automaticDnsChange:boolean; automaticProductionSwitch:boolean; secretValuesReturned:boolean; businessDataMutation:boolean };
  summary:{ failedChecks:number; latestScore:number; passedChecks:number; releaseStatus:string; reviewChecks:number; totalChecks:number; totalRuns:number };
};

function normalize(payload:Raw):ProductionReadinessState {
  const summary=(payload.summary??{}) as Raw;
  const safety=(payload.safety??{}) as Raw;
  return {
    checks:rows(payload.checks).map((item)=>({checkKey:text(item.check_key),domain:text(item.domain_name),evidence:text(item.evidence),id:number(item.id),outcome:text(item.outcome) as ReadinessOutcome,remediation:text(item.remediation),severity:text(item.severity),title:text(item.title)})),
    environments:rows(payload.environments).map((item)=>({baseLabel:text(item.base_label),environmentKey:text(item.environment_key),id:number(item.id),isActive:flag(item.is_active),label:text(item.label),status:text(item.status),updatedAt:nullableText(item.updated_at)})),
    generatedAt:nullableText(payload.generated_at),
    releaseGates:rows(payload.release_gates).map((item)=>({checkKey:text(item.check_key),label:text(item.label),outcome:text(item.outcome) as ReadinessOutcome,required:flag(item.required)})),
    runs:rows(payload.runs).map((item)=>({createdAt:nullableText(item.created_at),failedChecks:number(item.failed_checks),id:number(item.id),passedChecks:number(item.passed_checks),reason:text(item.reason),reviewChecks:number(item.review_checks),runKey:text(item.run_key),score:number(item.score),status:text(item.status),totalChecks:number(item.total_checks)})),
    safety:{automaticDeployment:flag(safety.automatic_deployment),automaticDnsChange:flag(safety.automatic_dns_change),automaticProductionSwitch:flag(safety.automatic_production_switch),secretValuesReturned:flag(safety.secret_values_returned),businessDataMutation:flag(safety.business_data_mutation)},
    summary:{failedChecks:number(summary.failed_checks),latestScore:number(summary.latest_score),passedChecks:number(summary.passed_checks),releaseStatus:text(summary.release_status),reviewChecks:number(summary.review_checks),totalChecks:number(summary.total_checks),totalRuns:number(summary.total_runs)},
  };
}

async function request(options?:RequestInit) {
  const response=await fetch(bnbApiUrl(MANAGE_PRODUCTION_READINESS_ENDPOINT),{cache:"no-store",...options,headers:adminAuthHeaders({"Content-Type":"application/json",...(options?.headers as Record<string,string>|undefined)})});
  const payload=await response.json().catch(()=>({})) as Raw&{message?:string;state?:Raw;success?:boolean};
  if(!response.ok||payload.success===false) throw new Error(payload.message||"Production readiness evidence could not be loaded.");
  return {message:payload.message??"",state:normalize(payload.state&&typeof payload.state==="object"?payload.state:payload)};
}

export const loadProductionReadiness=()=>request().then((result)=>result.state);
export const runProductionReadinessScan=(reason:string)=>request({method:"POST",body:JSON.stringify({action:"run_scan",reason})});
