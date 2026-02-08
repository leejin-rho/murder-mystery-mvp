export interface Role {
  id: string;
  name: string;
  privateIntro: string;
}

export interface Choice {
  id: string;
  label: string;
  next: string;
}

export interface Scene {
  id: string;
  type: "narration" | "choice";
  public: {
    text: string;
  };
  privateByRole?: Record<string, { text: string }>;
  choices?: Choice[];
  gate?: {
    type: "all_players_picked";
  };
  next?: string;
}

export interface Scenario {
  id: string;
  title: string;
  version: number;
  playerCount: {
    min: number;
    max: number;
  };
  roles: Role[];
  startSceneId: string;
  scenes: Scene[];
}

export const CASE_001: Scenario = {
  id: "case_001",
  title: "저택의 비밀",
  version: 1,
  playerCount: {
    min: 4,
    max: 6,
  },
  roles: [
    {
      id: "detective",
      name: "탐정",
      privateIntro:
        "당신은 사건을 해결하기 위해 초대받은 유명 탐정입니다. 당신은 저택 주인이 과거에 불법 거래에 연루되었다는 정보를 알고 있습니다.",
    },
    {
      id: "butler",
      name: "집사",
      privateIntro:
        "당신은 30년간 이 저택을 지켜온 충성스러운 집사입니다. 당신은 주인의 서재 열쇠를 가지고 있으며, 사건 당일 밤 이상한 소리를 들었습니다.",
    },
    {
      id: "heir",
      name: "상속자",
      privateIntro:
        "당신은 저택 주인의 조카이자 유일한 상속자입니다. 당신은 최근 재정적 어려움을 겪고 있으며, 빠른 상속을 바라고 있었습니다.",
    },
    {
      id: "maid",
      name: "가정부",
      privateIntro:
        "당신은 이 저택에서 5년째 일하고 있는 가정부입니다. 당신은 사건 당일 주인의 방에서 큰 소리가 나는 것을 들었지만 무서워서 확인하지 못했습니다.",
    },
    {
      id: "doctor",
      name: "주치의",
      privateIntro:
        "당신이 바로 범인입니다. 저택 주인의 오랜 친구이자 주치의였던 당신은, 주인과의 금전 분쟁 끝에 그를 살해했습니다. 심장 질환 치료를 위해 처방한 수면제를 이용해 완전범죄를 꾸몄지만, 이제 추리가 시작됩니다. 당신의 목표는 자신이 범인이라는 사실을 숨기는 것입니다.",
    },
    {
      id: "guest",
      name: "손님",
      privateIntro:
        "당신은 사업 관계로 저택에 초대받은 손님입니다. 당신은 주인과 최근 큰 금액의 거래를 논의 중이었으며, 계약서에 서명하기 직전이었습니다.",
    },
  ],
  startSceneId: "scene_001",
  scenes: [
    {
      id: "scene_001",
      type: "narration",
      public: {
        text: "폭풍우가 몰아치는 밤, 외딴 저택에서 주인이 서재에서 숨진 채 발견되었습니다. 문은 안쪽에서 잠겨 있었고, 창문은 모두 닫혀 있었습니다. 책상 위에는 깨진 와인잔과 이상한 냄새가 나는 액체가 있었습니다.",
      },
      privateByRole: {
        detective: {
          text: "당신은 현장을 주의 깊게 살펴봅니다. 와인잔의 지문과 액체의 성분 분석이 필요해 보입니다.",
        },
        butler: {
          text: "당신은 어젯밤 10시경 서재 근처에서 낮은 목소리로 다투는 소리를 들었던 것이 기억납니다.",
        },
        heir: {
          text: "당신은 삼촌이 최근 유언장을 변경하려 했다는 소문을 들었습니다.",
        },
        maid: {
          text: "당신은 오늘 오후 서재를 청소하면서 책상 서랍이 열려 있던 것을 보았습니다.",
        },
        doctor: {
          text: "당신은 사체의 상태를 보고 이것이 단순한 독살이 아닐 수도 있다고 생각합니다.",
        },
        guest: {
          text: "당신은 어젯밤 주인이 누군가와 전화 통화를 하며 화를 내는 것을 목격했습니다.",
        },
      },
      next: "scene_002",
    },
    {
      id: "scene_002",
      type: "choice",
      public: {
        text: "첫 번째 조사를 시작합니다. 어디부터 조사하시겠습니까?",
      },
      privateByRole: {
        detective: {
          text: "당신의 전문성을 발휘할 때입니다. 어떤 단서가 가장 중요할까요?",
        },
        butler: {
          text: "당신은 이 저택의 모든 구석구석을 알고 있습니다. 숨겨진 공간이 있을지도 모릅니다.",
        },
      },
      choices: [
        { id: "choice_wineglass", label: "와인잔과 액체를 자세히 조사한다", next: "scene_003" },
        { id: "choice_documents", label: "서재의 문서들을 조사한다", next: "scene_004" },
        { id: "choice_alibis", label: "모든 사람의 알리바이를 확인한다", next: "scene_005" },
      ],
      gate: { type: "all_players_picked" },
    },
    {
      id: "scene_003",
      type: "narration",
      public: {
        text: "와인잔을 자세히 조사한 결과, 잔에서 두 사람의 지문이 발견되었습니다. 액체에서는 강력한 수면제 성분이 검출되었습니다. 하지만 이상하게도 주인의 입 주변에서는 약물 흔적이 발견되지 않았습니다.",
      },
      privateByRole: {
        doctor: {
          text: "당신은 이 수면제가 당신이 처방한 것과 같은 종류라는 것을 알아차립니다.",
        },
        butler: {
          text: "당신은 그 와인잔이 주인이 가장 아끼던 골동품이라는 것을 기억합니다. 절대 다른 사람에게 사용하게 하지 않았습니다.",
        },
      },
      next: "scene_006",
    },
    {
      id: "scene_004",
      type: "narration",
      public: {
        text: "서재의 문서들을 조사하던 중, 최근 작성된 유언장 초안을 발견했습니다. 놀랍게도 주인은 전 재산을 자선단체에 기부하려 했던 것으로 보입니다. 또한 의심스러운 금융 거래 기록도 발견되었습니다.",
      },
      privateByRole: {
        heir: {
          text: "당신은 이 유언장이 실제로 서명되지 않았다는 것에 안도합니다. 하지만 다른 사람들이 당신을 의심할까 걱정됩니다.",
        },
        guest: {
          text: "당신은 그 금융 거래 기록에 당신의 회사 이름이 있다는 것을 알아차립니다.",
        },
      },
      next: "scene_006",
    },
    {
      id: "scene_005",
      type: "narration",
      public: {
        text: "모두의 알리바이를 확인한 결과, 사건 시간인 밤 10시에서 11시 사이에 명확한 알리바이가 있는 사람은 없었습니다. 대부분 자신의 방에 있었다고 주장하지만, 목격자가 없습니다.",
      },
      privateByRole: {
        maid: {
          text: "당신은 10시 30분경 복도에서 누군가가 서재로 들어가는 것을 보았지만, 어두워서 누구인지 확실하지 않습니다.",
        },
        detective: {
          text: "당신은 알리바이가 없다는 것 자체가 이상하다고 생각합니다. 누군가 거짓말을 하고 있을 가능성이 높습니다.",
        },
      },
      next: "scene_006",
    },
    {
      id: "scene_006",
      type: "choice",
      public: {
        text: "조사를 통해 여러 단서를 발견했습니다. 이제 중요한 질문을 해야 할 시간입니다. 누구에게 집중적으로 질문하시겠습니까?",
      },
      choices: [
        { id: "choice_question_heir", label: "상속자에게 재정 상황을 묻는다", next: "scene_007" },
        { id: "choice_question_doctor", label: "주치의에게 약물에 대해 묻는다", next: "scene_008" },
        { id: "choice_question_all", label: "모두를 한 자리에 모아 대질한다", next: "scene_009" },
      ],
      gate: { type: "all_players_picked" },
    },
    {
      id: "scene_007",
      type: "narration",
      public: {
        text: "상속자를 추궁하자, 그는 재정적 어려움을 인정했습니다. 하지만 삼촌을 해칠 이유는 없다고 주장합니다. 오히려 삼촌에게 도움을 요청하려던 참이었다고 합니다.",
      },
      next: "scene_010",
    },
    {
      id: "scene_008",
      type: "narration",
      public: {
        text: "주치의는 최근 주인의 수면 장애 치료를 위해 수면제를 처방했다고 인정했습니다. 하지만 치사량에는 훨씬 못 미치는 양이었다고 주장합니다. 그는 누군가 자신의 처방전을 악용했을 가능성을 제기합니다.",
      },
      next: "scene_010",
    },
    {
      id: "scene_009",
      type: "narration",
      public: {
        text: "모두를 한 자리에 모으자, 긴장감이 감돕니다. 집사가 갑자기 고백을 시작합니다. 그는 주인이 돌아가시던 밤, 서재 앞을 지나가다 문틈으로 주인이 쓰러지는 것을 보았다고 합니다. 하지만 안으로 들어가지 못했고, 그것이 지금까지 마음에 걸렸다고 말합니다.",
      },
      next: "scene_010",
    },
    {
      id: "scene_010",
      type: "choice",
      public: {
        text: "모든 증거와 증언을 종합할 시간입니다. 진실은 무엇일까요?",
      },
      choices: [
        { id: "choice_conclusion_murder", label: "이것은 계획된 살인이다", next: "scene_011" },
        { id: "choice_conclusion_accident", label: "사고사 또는 자살일 가능성이 높다", next: "scene_012" },
        { id: "choice_conclusion_complex", label: "여러 사람이 연루된 복잡한 사건이다", next: "scene_013" },
      ],
      gate: { type: "all_players_picked" },
    },
    {
      id: "scene_011",
      type: "narration",
      public: {
        text: "추가 조사 끝에 놀라운 진실이 밝혀졌습니다. 주인은 실제로 살해당한 것이 맞았습니다. 범인은... 주치의였습니다. 그는 주인과의 오래된 금전 분쟁으로 인해 범행을 저질렀고, 자신의 의학 지식을 이용해 완전범죄를 꾸몄습니다. 하지만 당신들의 철저한 조사로 진실이 밝혀졌습니다.",
      },
      privateByRole: {
        doctor: {
          text: "당신의 비밀이 밝혀졌습니다. 하지만 당신에게는 나름의 이유가 있었습니다...",
        },
        detective: {
          text: "당신의 추리가 정확했습니다. 또 하나의 사건을 해결했습니다.",
        },
      },
      next: "scene_end",
    },
    {
      id: "scene_012",
      type: "narration",
      public: {
        text: "조사 결과, 이것은 불행한 사고였던 것으로 결론이 났습니다. 주인은 자신의 수면제를 과다 복용했고, 와인과 함께 복용하면서 치명적인 결과를 초래했습니다. 모두가 의심받았지만, 결국 이것은 비극적인 사고였습니다.",
      },
      next: "scene_end",
    },
    {
      id: "scene_013",
      type: "narration",
      public: {
        text: "진실은 예상보다 복잡했습니다. 여러 사람이 주인에게 원한을 가지고 있었고, 각자의 방식으로 그를 해치려 했습니다. 하지만 정작 주인의 죽음은 그들 중 누구의 직접적인 행동 때문이 아니라, 우연이 겹쳐 일어난 비극이었습니다. 진실은 때로 우리가 상상하는 것보다 더 복잡합니다.",
      },
      next: "scene_end",
    },
    {
      id: "scene_end",
      type: "narration",
      public: {
        text: "사건이 종결되었습니다. 저택의 비밀이 밝혀졌고, 각자는 이 사건을 통해 무언가를 배웠습니다. 게임이 종료되었습니다. 함께 플레이해주셔서 감사합니다!",
      },
      privateByRole: {
        detective: { text: "또 하나의 사건을 마무리했습니다. 다음 사건을 기다립니다." },
        butler: { text: "이제 저택은 다시 평화를 찾을 것입니다." },
        heir: { text: "앞으로는 더 나은 선택을 하겠다고 다짐합니다." },
        maid: { text: "이 경험을 잊지 못할 것 같습니다." },
        doctor: { text: "모든 것이 끝났습니다." },
        guest: { text: "이 저택을 떠날 시간입니다." },
      },
      next: "scene_end",
    },
  ],
};
