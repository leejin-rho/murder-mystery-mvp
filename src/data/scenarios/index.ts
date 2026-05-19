import type { Scenario, ScenarioMeta } from "@/data/scenario.type";
import { CASE_001 } from "@/data/scenarios/case-001";
import { CASE_002 } from "@/data/scenarios/case-002";
import { COMING_SOON } from "@/data/scenarios/coming-soon";

export const SCENARIO_REGISTRY: Record<string, Scenario> = {
  case_001: CASE_001,
  case_002: CASE_002,
};

export const ALL_SCENARIOS: ScenarioMeta[] = [CASE_001, CASE_002, ...COMING_SOON];

export { CASE_001, CASE_002, COMING_SOON };
