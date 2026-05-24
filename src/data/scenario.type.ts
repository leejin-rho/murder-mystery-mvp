/* ── 타입 정의 ── */

export interface Role {
  id: string;
  name: string;
  portraitUrl?: string;
  age?: number;
  occupation?: string;
  relationshipToVictim?: string;
  publicPersona?: string;
  speakingStyle?: string;
  reputation?: string;
  publicSuspicion?: string;
  signatureLine?: string;
  background: string;
  secret: string;       // 숨겨야 하는 것 (UI에서 강조 표시)
  winCondition: string;
  knownInfo: string[];  // 시작 시 알고 있는 사실 + 역할별 해석 맥락
}

export interface HintCard {
  id: string;
  number: number;
  title?: string;
  type: "info" | "action";
  content: string;
  actionRule?: "show_all" | "keep_secret" | "ask_question" | "force_discussion";
  forceDiscussionSeconds?: number;
  unlocks?: number[];
  /** 장소별 카드 표시용 (case_002 등) */
  location?: string;
  /** 지도 포인트 매핑용 ID */
  mapPointId?: string;
}

export interface ScenarioMapPoint {
  id: string;
  name: string;
  x: number; // 0~100 (%)
  y: number; // 0~100 (%)
}

export interface StageSetting {
  era: string;
  place: string;
  victim: string;
  preIncident: string;
  gatheringReason: string;
  mood: string;
  sharedBackground: string;
}

export interface InvestigationTarget {
  name: string;
  description: string;
  location?: string;
}

export interface RoundEvent {
  afterRound: number;
  title: string;
  text: string;
}

export interface Truth {
  killerId: string;
  motive: string;
  method: string;
  narrativeStory?: string;
}

export interface ScenarioMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  playerCount: number;
  duration: string;
  difficulty: "초급" | "중급" | "고급";
  tags: string[];
  available: boolean;
}

export interface Scenario extends ScenarioMeta {
  version: number;
  introText: string;
  stageSetting?: StageSetting;
  openingScript?: string[];
  incidentScene?: string;
  incidentImageUrl?: string;
  incidentImageFocus?: {
    /** e.g. "4 / 3", "16 / 10" */
    aspectRatio?: string;
    /** e.g. "left top", "12% 18%" */
    objectPosition?: string;
  };
  investigationTargets?: InvestigationTarget[];
  roles: Role[];
  hintCards: HintCard[];
  initialCards: number[];      // card numbers available at game start
  discussionSeconds: number;   // discussion timer per sweep
  events?: RoundEvent[];
  truth: Truth;
  /** 장소 목록 (있으면 카드 선택 시 장소별로 그룹 표시) */
  locations?: string[];
  /** 지도 이미지 없이도 약식도(네모 맵)로 핀 배치 가능 */
  mapPoints?: ScenarioMapPoint[];
  /** 조사 단계 약식도 배경 이미지 */
  mapImageUrl?: string;
}
