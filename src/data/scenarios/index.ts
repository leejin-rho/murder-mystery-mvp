import type { ScenarioMeta } from "@/data/scenario.type";
import { CASE_001 } from "@/data/scenarios/case-001";
import { CASE_002 } from "@/data/scenarios/case-002";
import { COMING_SOON } from "@/data/scenarios/coming-soon";

const PLAYABLE_SCENARIOS = [CASE_001, CASE_002] as const;

export const SCENARIO_REGISTRY = Object.fromEntries(
  PLAYABLE_SCENARIOS.map((s) => [s.id, s])
);

export const ALL_SCENARIOS: ScenarioMeta[] = [...PLAYABLE_SCENARIOS, ...COMING_SOON];

export { CASE_001, CASE_002, COMING_SOON };
