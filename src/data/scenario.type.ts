/* ── 타입 정의 ── */

export interface TimelineEntry {
  time: string;
  activity: string;
}

export interface Role {
  id: string;
  name: string;
  portraitUrl?: string;
  age?: number;
  occupation?: string;
  /**
   * 공개 소개 화면(cast_intro)에서 라벨 없이 순서대로 표시되는 문단.
   * 포함 권장: 피해자와의 관계 · 외적 인상 · 말투 · 평판
   */
  profile?: string[];
  publicSuspicion?: string;
  signatureLine?: string;
  background: string;
  secret: string;       // 숨겨야 하는 것 (UI에서 강조 표시)
  winCondition: string;
  knownInfo: string[];  // 시작 시 알고 있는 사실 + 역할별 해석 맥락
  /** 나만 아는 당일 타임라인. 플레이어 본인이 그날 밤 겪은 실제 순서 */
  timeline?: TimelineEntry[];
}

export interface HintCard {
  id: number;           // 카드 번호 = 플레이어에게 보이는 번호 = 참조 키
  title?: string;
  type: "info" | "action";
  content: string;
  actionRule?: "show_all" | "keep_secret" | "ask_question" | "force_discussion";
  forceDiscussionSeconds?: number;
  unlocks?: number[];   // 해금되는 카드 id 목록
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
  /** 배경 설명 문단 배열 (라벨 없이 순서대로 표시). 사건 직전 상황, 모임 이유, 분위기, 공유 배경 등 */
  context: string[];
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
  initialCards: number[];      // 게임 시작 시 공개되는 카드 id 목록
  discussionSeconds: number;   // discussion timer per sweep
  events?: RoundEvent[];
  truth: Truth;
  /** 장소 목록 (있으면 카드 선택 시 장소별로 그룹 표시) */
  locations?: string[];
  /** 지도 이미지 없이도 약식도(네모 맵)로 핀 배치 가능 */
  mapPoints?: ScenarioMapPoint[];
  /** 조사 단계 약식도 배경 이미지 */
  mapImageUrl?: string;
  /** 전체 공개 사건 타임라인. 발견 시각·확인된 사실 등 모든 플레이어가 볼 수 있는 기록 */
  publicTimeline?: TimelineEntry[];
}
