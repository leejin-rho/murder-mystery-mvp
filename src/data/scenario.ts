/* ── 타입 정의 ── */

export interface Role {
  id: string;
  name: string;
  background: string;
  secret: string;
  objective: string;
  winCondition: string;
  isMurderer: boolean;
  knownInfo: string[];
}

export interface HintCard {
  id: string;
  number: number;
  type: "info" | "action" | "secret";
  content: string;
  visibleTo?: string;
  actionRule?: "show_left" | "show_all" | "keep_secret" | "ask_question";
  unlocks?: number[];
  /** 장소별 카드 표시용 (case_002 등) */
  location?: string;
}

export interface RoundEvent {
  trigger: "after_round";
  title: string;
  text: string;
  newCards?: string[];
}

export interface Round {
  id: number;
  cardsPerPlayer: number;
  discussionSeconds: number;
  event?: RoundEvent;
}

export interface Truth {
  killerId: string;
  motive: string;
  method: string;
  motiveOptions: string[];
  methodOptions: string[];
  /** 진상 공개 시 보여줄 스토리 (어떤 일이 정확히 있었는지 서술) */
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
  roles: Role[];
  hintCards: HintCard[];
  initialCards: number[];
  rounds: Round[];
  truth: Truth;
  /** 장소 목록 (있으면 카드 선택 시 장소별로 그룹 표시) */
  locations?: string[];
}

/* ── 저택의 비밀 (4인용, 3라운드) ── */

export const CASE_001: Scenario = {
  id: "case_001",
  title: "저택의 비밀",
  subtitle: "폭풍우 치는 밤, 저택 주인의 의문사",
  description:
    "외딴 저택에서 주인이 서재에서 숨진 채 발견됩니다. 잠긴 문, 깨진 와인잔, 수면제 성분 — 네 명의 용의자 중 진범을 찾아내세요.",
  duration: "30~45분",
  difficulty: "초급",
  tags: ["클래식 추리", "밀실"],
  available: true,
  playerCount: 4,
  version: 3,

  introText:
    "폭풍우가 몰아치는 밤, 외딴 저택의 주인 한도윤(58)이 서재에서 숨진 채 발견되었습니다.\n\n서재 문은 안쪽에서 잠겨 있었고, 집사가 여분의 열쇠로 문을 열었습니다. 책상 위에는 와인잔 두 개가 놓여 있었고, 하나는 깨져 있었습니다. 깨진 잔 근처에서 이상한 냄새가 났습니다.\n\n저택에 있는 네 명 모두 용의자입니다. 각자 숨기고 싶은 비밀이 있고, 달성하고 싶은 목표가 있습니다.\n\n진실을 밝혀내세요.",

  roles: [
    {
      id: "detective",
      name: "탐정 — 서하진",
      background:
        "사건 해결을 위해 초대받은 유명 탐정. 저택 주인과는 과거 한 사건에서 인연이 있다.",
      secret:
        "사실 당신은 한도윤의 의뢰로 저택 내 누군가를 감시하기 위해 왔습니다. 한도윤은 누군가가 자신을 해치려 한다고 의심하고 있었습니다.",
      objective:
        "범인을 정확히 지목하고, 자신이 한도윤의 의뢰로 왔다는 사실을 끝까지 숨기세요.",
      winCondition:
        "최종 투표에서 범인을 정확히 지목하면 승리. 단, 다른 플레이어가 당신의 비밀(의뢰 사실)을 알아내면 부분 패배.",
      isMurderer: false,
      knownInfo: [
        "한도윤은 사망 일주일 전 당신에게 '누군가 나를 죽이려 한다'는 편지를 보냈습니다.",
        "편지에는 구체적인 인물 이름이 적혀 있지 않았습니다.",
      ],
    },
    {
      id: "butler",
      name: "집사 — 윤기섭",
      background:
        "30년간 이 저택을 지켜온 충성스러운 집사. 주인의 모든 일정과 비밀을 알고 있다.",
      secret:
        "당신은 최근 주인 몰래 저택의 골동품 일부를 팔아 개인 빚을 갚았습니다. 이 사실이 밝혀지면 30년간의 신뢰가 무너집니다.",
      objective:
        "범인을 찾되, 골동품 횡령 사실은 절대 들키지 않도록 하세요.",
      winCondition:
        "최종 투표에서 범인을 정확히 지목하면 승리. 단, 골동품 횡령 비밀이 폭로되면 부분 패배.",
      isMurderer: false,
      knownInfo: [
        "사건 당일 밤 10시 10분경, 2층 복도에서 서재로 향하는 사람의 뒷모습을 보았습니다. 흰색 소매가 보였습니다.",
        "주인님의 서재 여분 열쇠는 당신만 갖고 있습니다.",
      ],
    },
    {
      id: "heir",
      name: "상속자 — 한서준",
      background:
        "저택 주인의 조카이자 유일한 상속자. 최근 사업 실패로 재정적 어려움을 겪고 있다.",
      secret:
        "당신은 사건 당일 밤 10시에 삼촌의 서재를 찾아갔습니다. 유언장 변경을 막기 위해서였지만, 노크에 대답이 없어 돌아왔습니다. 이 사실을 숨기고 있습니다.",
      objective:
        "범인을 찾되, 사건 당일 밤 서재 방문 사실이 밝혀지지 않도록 하세요.",
      winCondition:
        "최종 투표에서 범인을 정확히 지목하면 승리. 단, 서재 방문 비밀이 폭로되면 부분 패배.",
      isMurderer: false,
      knownInfo: [
        "삼촌이 유언장을 바꿔 전 재산을 자선단체에 기부하려 한다는 소문을 들었습니다.",
        "사업 빚이 3억 원에 달합니다.",
      ],
    },
    {
      id: "doctor",
      name: "주치의 — 강민혁",
      background:
        "저택 주인의 오랜 친구이자 주치의. 20년 넘게 주인의 건강을 관리해왔다.",
      secret:
        "당신이 범인입니다. 10년 전 한도윤에게 빌려준 5억 원을 끝내 돌려받지 못한 원한으로, 수면제를 와인에 타 의식을 잃게 한 후 질식사시켰습니다.",
      objective:
        "다른 사람에게 의심이 가도록 유도하세요. 특히 상속자에게 죄를 뒤집어씌우는 것이 최선입니다.",
      winCondition:
        "최종 투표에서 다른 플레이어의 과반이 당신을 지목하지 않으면 승리.",
      isMurderer: true,
      knownInfo: [
        "수면제(졸피뎀)를 와인에 타는 방식으로 범행했습니다. 와인잔에 당신의 지문이 남아 있을 수 있습니다.",
        "범행 시각은 밤 10시~10시 20분입니다. 10시 30분경 와인잔이 깨지는 소리가 났을 수 있습니다.",
        "서재에서 나올 때 흰색 셔츠 소매에 와인이 묻었습니다.",
      ],
    },
  ],

  hintCards: [
    // ── 라운드 1 초기 카드 (1~8번) ──
    {
      id: "card_01", number: 1, type: "info",
      content: "【감식 보고서】 깨진 와인잔에서 강력한 수면제 성분(졸피뎀)이 검출되었습니다.",
      unlocks: [15, 16],
    },
    {
      id: "card_02", number: 2, type: "info",
      content: "【지문 분석】 깨진 와인잔에서 주인의 지문과 또 다른 사람의 지문이 발견되었습니다. 멀쩡한 잔에서는 주인의 지문만 검출.",
      unlocks: [17],
    },
    {
      id: "card_03", number: 3, type: "info",
      content: "【부검 소견】 시신의 입 주변에서 약물 잔여물이 거의 발견되지 않았습니다. 주인이 직접 수면제를 마신 것이 아닐 가능성.",
    },
    {
      id: "card_04", number: 4, type: "info",
      content: "【서랍 문서】 일주일 전 작성된 유언장 초안 발견. 전 재산을 자선단체에 기부한다는 내용. 아직 공증 받지 않은 상태.",
      unlocks: [18],
    },
    {
      id: "card_05", number: 5, type: "info",
      content: "【차용증 발견】 서랍에서 10년 전 날짜의 차용증 발견. 한도윤이 '강민혁'에게 5억 원을 빌린 것으로 기재. 미상환.",
      unlocks: [19],
    },
    {
      id: "card_06", number: 6, type: "info",
      content: "【현장 사진】 서재 문은 안쪽에서 잠겨 있었고, 창문은 모두 닫혀 있었습니다. 밀실 상태.",
      unlocks: [20],
    },
    {
      id: "card_07", number: 7, type: "action",
      content: "【지령】 모든 사람에게 공개하세요: '서재 벽난로에서 태운 흔적이 있는 장갑 조각 발견.'",
      actionRule: "show_all",
    },
    {
      id: "card_08", number: 8, type: "action",
      content: "【지령】 모든 사람에게 공개하세요: '복도 카펫에서 두 사람 분의 발자국이 서재 방향으로 향하고 있습니다.'",
      actionRule: "show_all", unlocks: [21],
    },
    // ── 라운드 2 초기 카드 (9~14번) ──
    {
      id: "card_09", number: 9, type: "info",
      content: "【처방전 기록】 주치의 강민혁이 최근 주인에게 수면 장애 치료를 위해 졸피뎀을 처방한 기록이 남아 있습니다.",
      unlocks: [22, 23],
    },
    {
      id: "card_10", number: 10, type: "info",
      content: "【시간대 분석】 사망 추정 시각은 밤 10시~11시. 10시 30분경 유리 깨지는 소리가 1층에서 들렸다는 증언 있음.",
      unlocks: [24],
    },
    {
      id: "card_11", number: 11, type: "info",
      content: "【CCTV 기록】 저택 현관 CCTV는 폭풍우로 밤 9시 이후 작동하지 않았습니다. 외부 침입 여부 확인 불가.",
    },
    {
      id: "card_12", number: 12, type: "info",
      content: "【금융 기록】 상속자 한서준의 계좌에서 최근 3개월간 대규모 출금 기록. 사업 실패로 인한 빚 상환으로 추정.",
    },
    {
      id: "card_13", number: 13, type: "action",
      content: "【지령】 이 정보는 절대 공개하면 안 됩니다: '주인의 침대 밑에서 주치의에게 보내는 미발송 편지 발견. 빚 상환을 약속하는 내용.'",
      actionRule: "keep_secret",
    },
    {
      id: "card_14", number: 14, type: "action",
      content: "【지령】 지금 즉시 아무에게나 질문을 하나 하세요. 상대는 반드시 예/아니오로 대답해야 합니다.",
      actionRule: "ask_question",
    },
    // ── 해금 카드 (15~28번) — 초기에는 숨겨져 있음 ──
    {
      id: "card_15", number: 15, type: "info",
      content: "【추가 감식】 졸피뎀의 농도가 치사량에 가까운 수준이었습니다. 단순 수면 유도가 아닌 의도적 과다 투여로 보입니다.",
      unlocks: [25],
    },
    {
      id: "card_16", number: 16, type: "info",
      content: "【약장 확인】 주인의 약장에서 졸피뎀 한 통이 비어 있었습니다. 처방량보다 훨씬 많은 양이 사라졌습니다.",
    },
    {
      id: "card_17", number: 17, type: "info",
      content: "【지문 대조】 와인잔의 미확인 지문을 용의자들과 대조 중입니다. 결과가 나오려면 시간이 더 필요합니다.",
    },
    {
      id: "card_18", number: 18, type: "info",
      content: "【전화 기록】 사건 당일 오후 8시, 한도윤이 변호사에게 전화를 걸어 유언장 변경을 상담했습니다.",
      unlocks: [26],
    },
    {
      id: "card_19", number: 19, type: "secret",
      content: "【비밀 단서】 당신이 '주치의'라면 — 당신은 돈을 돌려받지 못하면 모든 것을 잃을 상황이었습니다. 유언장이 변경되면 회수가 영영 불가능해집니다.",
      visibleTo: "doctor",
    },
    {
      id: "card_20", number: 20, type: "info",
      content: "【열쇠 상태】 서재 여분 열쇠는 집사만 소유. 그러나 마스터키는 주인의 침실에도 있었으며, 누구든 접근 가능했음.",
    },
    {
      id: "card_21", number: 21, type: "info",
      content: "【발자국 분석】 복도 발자국 중 하나는 구두, 하나는 슬리퍼. 슬리퍼는 주인의 것으로 추정됩니다.",
    },
    {
      id: "card_22", number: 22, type: "info",
      content: "【와인 자국】 주치의 강민혁의 흰색 셔츠 소매에 희미한 와인 자국이 발견되었습니다.",
      unlocks: [27],
    },
    {
      id: "card_23", number: 23, type: "secret",
      content: "【비밀 단서】 당신이 '탐정'이라면 — 한도윤의 편지에 '오래된 친구를 조심하라'는 문구가 있었습니다.",
      visibleTo: "detective",
    },
    {
      id: "card_24", number: 24, type: "secret",
      content: "【비밀 단서】 당신이 '상속자'라면 — 당신은 10시에 서재를 노크했지만 대답이 없었습니다. 안에서 낮은 신음 소리가 들렸습니다.",
      visibleTo: "heir",
    },
    {
      id: "card_25", number: 25, type: "info",
      content: "【의학 소견】 질식사의 경우 얼굴에 점상출혈이 나타나지만, 수면 상태에서 질식당하면 흔적이 매우 희미할 수 있습니다.",
    },
    {
      id: "card_26", number: 26, type: "info",
      content: "【변호사 증언】 한도윤은 전화에서 '오늘 밤 사람들이 올 예정인데, 그 전에 유언장을 정리하고 싶다'고 말했습니다.",
    },
    {
      id: "card_27", number: 27, type: "secret",
      content: "【비밀 단서】 당신이 '집사'라면 — 사라진 골동품 3점은 당신이 팔았습니다. 서재 금고 안에 매매 기록이 있었을 수 있습니다.",
      visibleTo: "butler",
    },
    {
      id: "card_28", number: 28, type: "action",
      content: "【지령】 모든 사람에게 공개하세요: '서재 책장 뒤 숨겨진 금고가 발견되었습니다. 금고는 열려 있었고, 안은 비어 있었습니다.'",
      actionRule: "show_all",
    },
    // ── 라운드 3 카드 (29~32번) ──
    {
      id: "card_29", number: 29, type: "info",
      content: "【목격 증언】 집사의 증언에 따르면, 10시 10분에 서재로 향하던 인물의 체형은 '마른 편'이었다고 합니다.",
    },
    {
      id: "card_30", number: 30, type: "info",
      content: "【골동품 목록】 저택의 골동품 관리 대장과 실제 소장품을 대조한 결과, 최근 3점이 사라진 것으로 확인.",
    },
    {
      id: "card_31", number: 31, type: "secret",
      content: "【비밀 단서】 당신이 '주치의'라면 — 범행 후 장갑을 벽난로에 태웠지만 완전히 타지 않았을 수 있습니다.",
      visibleTo: "doctor",
    },
    {
      id: "card_32", number: 32, type: "info",
      content: "【최종 지문 결과】 와인잔의 미확인 지문은 주치의 강민혁의 것으로 확인되었습니다.",
    },
  ],

  initialCards: [1, 2, 3, 4, 5, 6, 7, 8],

  rounds: [
    {
      id: 1,
      cardsPerPlayer: 2,
      discussionSeconds: 180,
      event: {
        trigger: "after_round",
        title: "긴급 발견",
        text: "수사관이 서재를 추가 조사하던 중, 벽난로 안에서 태운 흔적이 있는 라텍스 장갑 조각을 발견했습니다. DNA 분석을 의뢰한 상태입니다.",
      },
    },
    {
      id: 2,
      cardsPerPlayer: 2,
      discussionSeconds: 180,
      event: {
        trigger: "after_round",
        title: "집사의 추가 증언",
        text: "집사가 새로운 기억을 떠올렸습니다. '서재에서 나오는 사람의 손에 뭔가 쥐어져 있었습니다. 작은 병 같은 것이었습니다.' 이 증언은 수면제 투여 가능성을 강화합니다.",
      },
    },
    {
      id: 3,
      cardsPerPlayer: 1,
      discussionSeconds: 120,
    },
  ],

  truth: {
    killerId: "doctor",
    motive: "10년간 미상환된 5억 원의 빚에 대한 원한",
    method: "졸피뎀(수면제)을 와인에 타서 의식을 잃게 한 후 질식사",
    motiveOptions: [
      "10년간 미상환된 5억 원의 빚에 대한 원한",
      "유언장 변경으로 인한 상속 위기",
      "골동품 횡령 발각에 대한 두려움",
      "과거 불법 거래 비밀 유지",
    ],
    methodOptions: [
      "졸피뎀(수면제)을 와인에 타서 의식을 잃게 한 후 질식사",
      "독극물을 와인에 투여하여 독살",
      "둔기로 후두부를 가격한 후 위장",
      "심장 약물을 과다 투여하여 심장마비 유발",
    ],
    narrativeStory:
      "그날 밤 10시, 주치의 강민혁은 한도윤을 만나 빚 상환을 요구했으나 거절당했습니다. 유언장이 바뀌면 5억 원을 돌려받을 희망이 사라진다는 걸 알았기 때문입니다.\n\n그는 미리 가져온 졸피뎀을 주인의 와인에 타 넣었고, 한도윤이 의식을 잃은 뒤 베개로 질식시켜 살해했습니다. 서재를 나오며 와인잔이 깨지는 바람에 소매에 와인이 묻었고, 장갑은 벽난로에 태웠습니다.\n\n10년간 미상환된 빚에 대한 원한이, 오랜 친구를 살인자로 만든 비극이었습니다.",
  },
};

/* ── 검은 저택의 마지막 초대 (5인용, 5라운드, 장소별 카드) ── */

const CASE_002_LOCATIONS = ["식당", "서재", "침실", "정원", "주방", "차고", "와인 저장고", "욕실"] as const;

export const CASE_002: Scenario = {
  id: "case_002",
  title: "검은 저택의 마지막 초대",
  subtitle: "폭설에 고립된 만찬, 그날 밤 누가 독을 탔나",
  description: "부유한 사업가 강도윤이 저택에서 열린 비공개 만찬 도중 사망했다. 경찰은 아직 도착하지 않았고, 폭설로 외부와 고립된 상태. 이 자리에 있던 5명 중 한 명이 범인이다.",
  duration: "60~90분",
  difficulty: "중급",
  tags: ["고전 추리", "심리전", "장소 조사"],
  available: true,
  playerCount: 5,
  version: 1,
  introText:
    "부유한 사업가 강도윤이 자신의 저택에서 열린 비공개 만찬 도중 사망했습니다.\n\n경찰은 아직 도착하지 않았고, 폭설로 외부와 고립된 상태입니다.\n\n이 자리에 있던 5명 중 한 명이 범인입니다.",
  locations: [...CASE_002_LOCATIONS],
  roles: [
    { id: "lawyer", name: "변호사 — 한지훈", background: "피해자의 법률 대리인. 차분하고 논리적 성격.", secret: "피해자의 유언장을 조작했다.", objective: "유언장 위조 사실 숨기기", winCondition: "범인을 맞히고 유언장 위조가 들키지 않으면 승리.", isMurderer: false, knownInfo: [] },
    { id: "secretary", name: "비서 — 윤세라", background: "피해자 개인 비서. 항상 침착.", secret: "피해자와 불륜 관계였다.", objective: "관계 들키지 않기", winCondition: "범인을 맞히고 불륜이 들키지 않으면 승리.", isMurderer: false, knownInfo: [] },
    { id: "brother", name: "동생 — 강민우", background: "피해자의 동생. 사업 실패 경험 있음.", secret: "형에게 큰 빚이 있다.", objective: "파산 사실 숨기기", winCondition: "범인을 맞히고 파산 사실이 들키지 않으면 승리.", isMurderer: false, knownInfo: [] },
    { id: "doctor", name: "의사 — 최도현", background: "피해자의 주치의.", secret: "당신이 범인이다. 피해자는 건강 이상을 눈치채고 병원을 바꾸려 했고, 의료 기록 조작이 들킬 것을 우려해 와인잔에 독극물을 투입했다.", objective: "다른 이에게 의심이 가도록 유도하세요.", winCondition: "과반이 당신을 범인으로 지목하지 않으면 승리.", isMurderer: true, knownInfo: [] },
    { id: "journalist", name: "기자 — 이수진", background: "초대받지 않았지만 잠입했다.", secret: "피해자의 비리 취재 중이었다.", objective: "신분 숨기기", winCondition: "범인을 맞히고 신분이 들키지 않으면 승리.", isMurderer: false, knownInfo: [] },
  ],
  hintCards: [
    { id: "card_01", number: 1, type: "info", content: "깨진 와인잔 조각이 피해자 자리 바닥에 흩어져 있다. 잔 내부에서는 와인 냄새 외에 다른 향은 느껴지지 않는다.", location: "식당" },
    { id: "card_02", number: 2, type: "secret", content: "냅킨에 희미하게 적힌 글자: \"약… 줄여…\" 누군가 급하게 적다 만 듯하다.", location: "식당" },
    { id: "card_03", number: 3, type: "info", content: "피해자 접시에는 음식이 거의 남아 있다. 반면 와인은 절반 이상 비워져 있다.", location: "식당" },
    { id: "card_04", number: 4, type: "secret", content: "의사 자리 물컵 안쪽에 하얀 가루 흔적이 묻어 있다.", visibleTo: "doctor", location: "식당" },
    { id: "card_05", number: 5, type: "info", content: "비서의 립스틱 자국이 피해자 와인잔 가장자리에서 발견된다.", location: "식당" },
    { id: "card_06", number: 6, type: "secret", content: "찢어진 종이 조각을 맞춰보면 문장 일부가 완성된다. \"…유산 전액 수정 예정\"", location: "서재" },
    { id: "card_07", number: 7, type: "info", content: "금고 메모에 숫자 0419가 적혀 있다.", location: "서재" },
    { id: "card_08", number: 8, type: "secret", content: "녹음기 파일에 피해자 목소리가 녹음돼 있다. \"의사가 뭔가 숨기고 있어.\"", visibleTo: "journalist", location: "서재" },
    { id: "card_09", number: 9, type: "info", content: "유언장 초안에는 동생 이름이 제외되어 있다.", location: "서재" },
    { id: "card_10", number: 10, type: "info", content: "동생 명의 채무 문서 발견. 금액: 8억.", location: "서재" },
    { id: "card_11", number: 11, type: "info", content: "약 봉투에는 심장약 이름이 적혀 있다. 복용량이 최근 두 배로 늘어난 기록이 있다.", location: "침실" },
    { id: "card_12", number: 12, type: "secret", content: "금고 안에는 현금 대신 의료 기록 파일이 들어 있다.", location: "침실" },
    { id: "card_13", number: 13, type: "info", content: "창문 아래 낯선 신발 자국이 있다.", location: "침실" },
    { id: "card_14", number: 14, type: "secret", content: "숨겨진 사진: 피해자와 비서가 함께 찍은 사진.", visibleTo: "secretary", location: "침실" },
    { id: "card_15", number: 15, type: "info", content: "베개 밑에서 비서 머리카락 발견.", location: "침실" },
    { id: "card_16", number: 16, type: "info", content: "담배꽁초가 떨어져 있다. 피해자는 비흡연자였다.", location: "정원" },
    { id: "card_17", number: 17, type: "secret", content: "신발 자국 방향이 저택 안쪽이 아니라 바깥쪽을 향하고 있다.", location: "정원" },
    { id: "card_18", number: 18, type: "info", content: "담장 일부에 긁힌 흔적이 있다.", location: "정원" },
    { id: "card_19", number: 19, type: "info", content: "정원 의자 아래 단추 하나가 떨어져 있다.", location: "정원" },
    { id: "card_20", number: 20, type: "secret", content: "단추는 동생 코트와 같은 재질이다.", visibleTo: "brother", location: "정원" },
    { id: "card_21", number: 21, type: "info", content: "세제통 뒤에서 작은 유리병 발견. 라벨 없음.", location: "주방" },
    { id: "card_22", number: 22, type: "secret", content: "병 안 잔여물 성분 = 특정 심장약과 섞이면 독성 생성.", visibleTo: "doctor", location: "주방" },
    { id: "card_23", number: 23, type: "info", content: "쓰레기통에서 약 봉지 발견. 이름 부분이 찢겨 있다.", location: "주방" },
    { id: "card_24", number: 24, type: "secret", content: "도마에 미세한 긁힘. 약병을 긁은 흔적으로 보인다.", location: "주방" },
    { id: "card_25", number: 25, type: "info", content: "싱크대 아래 장갑 한 짝 발견.", location: "주방" },
    { id: "card_26", number: 26, type: "info", content: "차 열쇠가 바닥에 떨어져 있다.", location: "차고" },
    { id: "card_27", number: 27, type: "secret", content: "트렁크 안쪽에 흙이 묻어 있다.", location: "차고" },
    { id: "card_28", number: 28, type: "info", content: "기름 냄새가 진하게 난다.", location: "차고" },
    { id: "card_29", number: 29, type: "info", content: "차 주변 발자국이 하나만 있다.", location: "차고" },
    { id: "card_30", number: 30, type: "secret", content: "타이어 자국 사진을 찍어둔 기록이 있다.", visibleTo: "journalist", location: "차고" },
    { id: "card_31", number: 31, type: "info", content: "특정 와인 한 병만 선반에서 빠져 있다.", location: "와인 저장고" },
    { id: "card_32", number: 32, type: "secret", content: "코르크 조각 안쪽이 긁혀 있다.", location: "와인 저장고" },
    { id: "card_33", number: 33, type: "info", content: "와인병에 지문이 두 명 분 있다.", location: "와인 저장고" },
    { id: "card_34", number: 34, type: "info", content: "병따개가 바닥에 떨어져 있다.", location: "와인 저장고" },
    { id: "card_35", number: 35, type: "secret", content: "와인 라벨에 미세한 흰 가루가 묻어 있다.", visibleTo: "doctor", location: "와인 저장고" },
    { id: "card_36", number: 36, type: "info", content: "세면대 주변 물 튄 흔적.", location: "욕실" },
    { id: "card_37", number: 37, type: "secret", content: "손 씻은 흔적이 있지만 비누는 사용되지 않았다.", location: "욕실" },
    { id: "card_38", number: 38, type: "secret", content: "배수구 잔여물 검사 결과 약물 성분 검출.", visibleTo: "doctor", location: "욕실" },
    { id: "card_39", number: 39, type: "info", content: "거울에 손자국이 있다.", location: "욕실" },
    { id: "card_40", number: 40, type: "info", content: "종이타월 쓰레기통이 비어 있다.", location: "욕실" },
  ],
  initialCards: Array.from({ length: 40 }, (_, i) => i + 1),
  rounds: [
    { id: 1, cardsPerPlayer: 1, discussionSeconds: 180 },
    { id: 2, cardsPerPlayer: 1, discussionSeconds: 180 },
    { id: 3, cardsPerPlayer: 1, discussionSeconds: 180 },
    { id: 4, cardsPerPlayer: 1, discussionSeconds: 180 },
    { id: 5, cardsPerPlayer: 1, discussionSeconds: 180 },
  ],
  truth: {
    killerId: "doctor",
    motive: "피해자는 건강 이상을 눈치채고 병원을 바꾸려 했고, 의료 기록 조작이 들킬 것을 우려해 독살했다.",
    method: "와인잔에 독극물 투입",
    motiveOptions: [
      "피해자는 건강 이상을 눈치채고 병원을 바꾸려 했고, 의료 기록 조작이 들킬 것을 우려해 독살했다.",
      "유언장 위조 발각 우려",
      "불륜 관계 폭로 우려",
      "빚과 파산 사실 발각 우려",
      "비리 취재 방해",
    ],
    methodOptions: [
      "와인잔에 독극물 투입",
      "독극물을 음식에 투입",
      "질식",
      "둔기로 가격",
    ],
    narrativeStory:
      "의사 최도현은 피해자 강도윤의 주치의로, 그의 건강 기록을 조작해왔다. 강도윤이 최근 이상 징후를 느끼고 다른 병원으로 옮기려 하자, 기록 조작이 들킬 위기에 처했다.\n\n만찬 당일, 최도현은 특정 심장약과 반응하면 독성이 나는 물질을 피해자의 와인잔에 타 넣었다. 피해자는 와인을 마신 뒤 쓰러졌고, 냅킨에 \"약… 줄여…\"라고 적다 의식을 잃었다.\n\n의료인만이 알 수 있는 약물 상호작용을 이용한, 계획된 독살이었다.",
  },
};

/* ── 예고 시나리오 (카드용 메타데이터만) ── */

export const COMING_SOON: ScenarioMeta[] = [
  {
    id: "case_003",
    title: "마지막 항해",
    subtitle: "대서양 한가운데, 도망칠 곳은 없다",
    description:
      "호화 유람선 위에서 선장이 살해됩니다. 망망대해 위, 범인은 반드시 승객 중에 있습니다.",
    playerCount: 4,
    duration: "40~50분",
    difficulty: "중급",
    tags: ["해양", "폐쇄 공간"],
    available: false,
  },
  {
    id: "case_004",
    title: "붉은 커튼콜",
    subtitle: "무대 위의 비극, 막이 내린 뒤의 진실",
    description:
      "유명 뮤지컬 배우가 공연 도중 실제로 사망합니다. 소품 단검이 진짜로 바뀐 건 누구의 소행일까요?",
    playerCount: 4,
    duration: "35~45분",
    difficulty: "중급",
    tags: ["극장", "예술"],
    available: false,
  },
];

export const SCENARIO_REGISTRY: Record<string, Scenario> = {
  case_001: CASE_001,
  case_002: CASE_002,
};

export const ALL_SCENARIOS: ScenarioMeta[] = [CASE_001, CASE_002, ...COMING_SOON];
