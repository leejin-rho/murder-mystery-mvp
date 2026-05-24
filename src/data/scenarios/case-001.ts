import type { Scenario } from "@/data/scenario.type";

/* ── 저택의 비밀 (5인용) ── */

export const CASE_001: Scenario = {
  id: "case_001",
  title: "저택의 비밀",
  subtitle: "폭풍우 속 저택, 모두가 서로를 속이고 있었다",

  description:
      "폭풍우로 고립된 외딴 저택.\n저택 주인 한도윤은 다섯 사람을 불러 모은 그날 밤, 서재 안에서 시체로 발견됩니다.\n\n깨진 와인잔.\n흐트러진 현장.\n그리고 서로를 의심하는 다섯 사람.\n\n누군가는 거짓말을 하고 있고,\n누군가는 중요한 사실을 숨기고 있으며,\n누군가는 오늘 밤의 진실이 드러나는 걸 두려워하고 있습니다.",

  duration: "50~70분",
  difficulty: "중급",
  tags: ["클래식 추리", "심리전", "관계형 추리"],
  available: true,
  playerCount: 5,

  introText:
      "폭풍우가 저택의 창문을 세차게 두드리던 밤.\n\n산 아래로 이어지는 도로는 이미 끊겼고,\n전화선도 몇 시간 전부터 먹통이었다.\n\n외딴 저택에 모인 다섯 사람은 저마다 다른 이유로 이곳에 왔다.\n\n누군가는 돈 때문에.\n누군가는 오래된 관계 때문에.\n그리고 누군가는 오늘 밤 반드시 확인해야 할 것이 있었다.\n\n저택의 주인 한도윤은 저녁 식사 자리에서 천천히 입을 열었다.\n\n'오늘은… 더 미루기 전에 정리해야 할 이야기가 있습니다.'\n\n순간 식탁 위 공기가 무겁게 가라앉았다.\n\n아무도 먼저 말을 잇지 못했다.\n\n밤 10시 30분.\n\n2층 서재 방향에서 갑작스럽게 유리 깨지는 소리가 울려 퍼졌다.",

  stageSetting: {
    era: "현대",
    place: "폭풍우로 고립된 외딴 저택",
    victim: "한도윤(58), 저택 주인",
    context: [
      "한도윤은 최근 심한 불면과 건강 이상으로 병원을 자주 드나들고 있었다.",
      "그는 건강 문제 이후, 자신의 재산과 저택 관리 체계를 조금씩 정리하려 하고 있었다.",
      "오늘 밤 저택에 모인 사람들은 모두 한도윤과 복잡한 관계를 가지고 있었다.",
      "정전이 반복되고, 벽난로 불빛만이 복도를 희미하게 비추는 밤.\n사람들 사이의 오래된 감정과 불신이 저택 안을 짓누르고 있다.",
      "폭풍우 때문에 외부와 완전히 고립된 상황.\n지금 이곳에서 벌어진 일을 알고 있는 사람은 오직 저택 안의 다섯 사람뿐이다.",
    ],
  },

  incidentScene:
      "유리잔이 깨지는 소리를 듣고 사람들이 복도로 뛰쳐나왔다. 가장 먼저 현장에 도착한 것은 집사 윤기섭이었다.\n서재 문은 반쯤 열려 있었고, 안에는 싸늘한 정적만이 남아 있었다.\n\n한도윤은 책상 옆 바닥에 쓰러져 있었고,\n깨진 와인잔 조각이 주변에 흩어져 있었다.\n\n서재 소파 주변은 누군가 급하게 움직인 듯 흐트러져 있었다.\n\n잠시 뒤,\n강민혁이 급히 무릎을 꿇고 한도윤의 상태를 확인했다.\n\n그가 천천히 고개를 들었다.\n\n'…이미 늦었습니다.'\n\n창밖에서는 여전히 폭풍우 소리만이 들려오고 있었다.",

  incidentImageUrl: "/images/expls/scenario1_expl.png",

  incidentImageFocus: {
    aspectRatio: "4 / 3",
    objectPosition: "12% 12%",
  },

  mapImageUrl: "/images/maps/scenario1_map.png",

  mapPoints: [
    { id: "study_scene", name: "사건 현장", x: 36.0, y: 49.0 },

    { id: "victim_body", name: "피해자의 시신", x: 52.0, y: 39.0 },

    { id: "desk_docs", name: "피해자의 책상", x: 49.5, y: 26.5 },

    { id: "corridor", name: "복도", x: 49.0, y: 72.0 },

    { id: "fireplace", name: "벽난로", x: 66.5, y: 44.0 },

    { id: "personal_items", name: "개인 소지품", x: 78.5, y: 72.0 },

    {
      id: "hidden_drawer",
      name: "숨겨진 서랍",
      x: 27.5,
      y: 29.0,
    },
  ],

  roles: [
    {
      id: "detective",
      name: "탐정 — 서하진",
      portraitUrl: "/images/characters/scenario1/detective.png",
      age: 34,
      occupation: "민간 탐정",

      profile:
          "침착하고 감정을 잘 드러내지 않는다.\n상대의 말보다 분위기와 시선을 먼저 읽는 타입이며,\n사람을 지나치게 빠르게 파악한다는 인상을 준다.",

      publicSuspicion:
          "이수연의 추천으로 최근 저택에 드나들던 탐정",

      signatureLine:
          "진실은 보통, 가장 조용한 사람 옆에 숨어 있습니다.",

      background:
          "서하진은 원래 기업 조사업무를 맡아 일하던 민간 탐정이었다.\n\n몇 달 전,\n이수연의 소개로 한도윤을 알게 되었고,\n최근에는 저택 안 문제를 정리해달라는 의뢰를 받고 출입하고 있었다.",

      secret:
          "서하진은 이수연과 오래전부터 알고 지낸 사이였다.\n\n그는 단순한 탐정 의뢰가 아니라,\n한도윤의 재산 관련 서류 위치를 파악하는 대가로 보수를 약속받았다.\n\n사건 당일 밤에도 그는 저택 내부 동선과 사람들의 움직임을 기록하고 있었다.",

      winCondition:
          "범인을 정확히 밝혀내면 승리.\n단, 이수연과 공모 관계였다는 사실은 들키지 않아야 한다.",

      knownInfo: [
        "이수연은 최근 한도윤의 재산 정리 문제에 민감하게 반응하고 있었다.",
        "한서준은 이수연에게 개인적인 감정을 가지고 있는 듯 보였다.",
      ],

      timeline: [
        { time: "21:00~21:30", activity: "식당과 응접실 주변에서 사람들을 관찰했다." },
        { time: "21:30~22:00", activity: "저택 내부 구조와 사람들의 동선을 확인했다." },
        { time: "22:05경", activity: "복도에서 이수연과 짧게 대화를 나눴다." },
        { time: "22:18경", activity: "한서준이 이수연의 방 앞에서 서재 방향으로 이동하는 모습을 봤다." },
        { time: "22:30경", activity: "유리 깨지는 소리를 듣고 복도로 나왔다." },
      ],
    },

    {
      id: "butler",
      name: "집사 — 윤기섭",
      portraitUrl: "/images/characters/scenario1/butler.png",
      age: 56,
      occupation: "저택 전담 집사",

      profile:
          "30년 넘게 저택을 지켜온 집사.\n예의 바르고 조용하지만,\n최근 들어, 무언가를 오래 참아온 사람처럼 보인다는 말을 듣곤 했다.",

      publicSuspicion:
          "피해자의 가장 가까운 생활 보조인이자 오랜 측근",

      signatureLine:
          "오래된 집은… 사람까지도 조용히 닳게 만듭니다.",

      background:
          "윤기섭은 30년 넘게 저택을 지켜온 집사다.\n\n한도윤의 생활 대부분은 그의 손을 거쳐 관리되었고,\n최근에는 건강과 약 복용까지 챙기고 있었다.",

      secret:
          "최근 한도윤은 저택 관리 권한과 재산 문제를 정리하려 하고 있었다.\n\n며칠 전,\n한도윤은 저택 관리 체계를 바꾸겠다고 말했다.\n\n윤기섭은 그 말이 결국 자신의 자리도 끝난다는 뜻이라는 걸 알고 있었다.\n\n사건 당일 밤,\n한서준이 서재를 뛰쳐나간 뒤,\n윤기섭은 아직 숨이 붙어 있는 한도윤을 발견했다.\n\n그리고 결국,\n소파 쿠션으로 그의 숨을 막아버렸다.",

      winCondition:
          "다른 플레이어들이 자신을 범인으로 특정하지 못하면 승리.",

      knownInfo: [
        "한도윤은 최근 밤마다 졸피뎀을 복용했다.",
        "이수연이 저택에 들어온 이후,\n한서준과 한도윤의 갈등은 더 심해졌다.",
      ],

      timeline: [
        { time: "21:00~21:20", activity: "식사를 정리하고 주방 뒷정리를 했다." },
        { time: "21:20~22:20", activity: "1층과 2층을 오가며 저택 내부를 점검했다." },
        { time: "22:20경", activity: "2층 복도에서 서재 안 언쟁 소리를 들었다." },
        { time: "22:27경", activity: "한서준이 급히 서재 밖으로 나오는 모습을 봤다." },
        {
          time: "22:28~22:30",
          activity:
              "서재 안으로 들어갔다.\n\n한도윤은 아직 살아 있었다.\n\n바닥에 쓰러진 그는 희미하게 숨을 몰아쉬고 있었다.\n\n윤기섭은 잠시 망설인 끝에,\n소파 쿠션으로 그의 숨을 막았다.",
        },
      ],
    },

    {
      id: "heir",
      name: "상속자 — 한서준",
      portraitUrl: "/images/characters/scenario1/heir.png",
      age: 29,
      occupation: "스타트업 대표",

      profile:
          "겉보기엔 자신감 넘치고 자유로운 사람처럼 보인다.\n하지만 감정 기복이 크고,\n한도윤 앞에서는 유독 예민해지는 모습을 보인다.",

      publicSuspicion:
          "재산 정리 문제로 피해자와 가장 크게 충돌한 인물",

      signatureLine:
          "가족이라고 다 같은 편은 아니잖아.",

      background:
          "한서준은 한도윤의 외아들이다.\n\n어린 시절부터 두 사람의 관계는 원만하지 못했다.\n\n한도윤은 늘 결과와 책임만을 이야기했고,\n한서준은 단 한 번도 인정받고 있다고 느끼지 못했다.\n\n최근 한도윤이 재산 정리와 저택 관리 문제를 언급하기 시작하면서,\n두 사람의 갈등은 더욱 심해졌다.\n\n특히 이수연이 저택에 머무르기 시작한 이후,\n한서준은 자신이 점점 가족 안에서 밀려나고 있다고 느끼고 있었다.",

      secret:
          "사건 당일 밤 10시 20분 무렵,\n한서준은 한도윤의 서재를 찾아갔다.\n\n두 사람은 재산 정리와 최근 달라진 저택 분위기에 대해 격하게 언쟁했다.\n\n감정이 격해진 순간,\n한서준이 한도윤을 밀쳐냈고,\n균형을 잃은 한도윤은 책상 쪽으로 크게 넘어지고 다시 일어나지 않았다.",

      winCondition:
          "진실을 밝혀내면 승리.\n단, 자신이 피해자를 밀쳤다는 사실을 숨겨야 한다.",

      knownInfo: [
        "당신은 이수연이 서하진과 지나치게 가까워 보인다고 느끼고 있었다.",
      ],

      timeline: [
        { time: "21:40~22:10", activity: "복도 근처를 서성였다." },
        { time: "22:10~22:15", activity: "이수연의 방 앞에서 짧게 대화를 나눴다." },
        { time: "22:20경", activity: "서재에 들어가 한도윤과 언쟁을 벌였다." },
        { time: "22:25경", activity: "몸싸움 끝에 한도윤이 넘어졌다." },
        { time: "22:27경", activity: "겁에 질려 서재를 뛰쳐나왔다." },
        {
          time: "22:27~22:30",
          activity:
              "복도를 지나 자신의 방 쪽으로 향했다.",
        },
      ],
    },

    {
      id: "doctor",
      name: "주치의 — 강민혁",
      portraitUrl: "/images/characters/scenario1/doctor.png",
      age: 52,
      occupation: "내과 전문의",

      profile:
          "오랜 친구이자 주치의.\n차분하고 논리적인 태도를 유지하지만,\n최근에는 한도윤과 미묘한 긴장감이 느껴진다.",

      publicSuspicion:
          "피해자의 건강 상태와 약 복용을 가장 잘 아는 인물",

      signatureLine:
          "사람은 결국 가장 약한 순간에 흔들립니다.",

      background:
          "강민혁은 한도윤의 오랜 친구였다.\n\n최근에는 투자 문제와 책임 정리를 두고 갈등을 겪고 있었다.",

      secret:
          "사건 당일 밤,\n강민혁은 한도윤의 와인에 졸피뎀을 넣었다.\n\n그는 한도윤을 잠들게 만든 뒤,\n민감한 대화를 피하려 했을 뿐이라고 주장한다.\n\n또한 사건 몇 시간 전,\n관련 계약 서류 일부를 벽난로에 태워 없앴다.",

      winCondition:
          "범인을 정확히 밝혀내면 승리.\n단, 자신이 약물을 사용했다는 사실은 숨겨야 한다.",

      knownInfo: [
        "한도윤은 최근 심한 불면증을 겪고 있었다.",
      ],

      timeline: [
        { time: "식사 중", activity: "한도윤의 와인에 졸피뎀을 넣었다." },
        {
          time: "21:40~22:00",
          activity:
              "건강 상태를 확인한다는 명목으로 서재에 들렀다.\n\n이 과정에서 일부 계약 서류를 벽난로에 태웠다.",
        },
        {
          time: "22:00~22:20",
          activity:
              "응접실에 머물며 술을 마시고 있었다.",
        },
        { time: "22:20경", activity: "2층으로 올라가던 중, 서재 안쪽에서 언쟁 소리를 들었다." },
        {
          time: "22:30경",
          activity:
              "유리 깨지는 소리를 듣고 서재로 향했다.",
        },
      ],
    },

    {
      id: "resident",
      name: "동거인 — 이수연",
      portraitUrl: "/images/characters/scenario1/resident.png",
      age: 41,
      occupation: "갤러리 디렉터",

      profile:
          "최근 한도윤과 함께 저택에 머물기 시작했다.\n쉽게 감정을 드러내지 않으며,\n사람들과 일정한 거리를 유지하려 한다.",

      publicSuspicion:
          "최근 한도윤과 가까워지며 재산 정리 이야기에 자주 언급되던 인물",

      signatureLine:
          "사람은 원래, 원하는 걸 위해 조금씩 거짓말하잖아요.",

      background:
          "처음에는 사업과 예술 후원 문제로 만났지만,\n한도윤의 건강이 악화된 이후,\n이수연은 자연스럽게 저택에 머무는 시간이 길어졌다.\n\n최근에는 외부 일정 정리와 손님 응대까지 일부 맡고 있었다.",
      secret:
          "이수연은 처음부터 한도윤의 재산 상황과 문서 정리에 관심을 가지고 접근했다.\n\n그리고 그 과정에서,\n오래전부터 알고 지내던 서하진에게 도움을 요청했다.",

      winCondition:
          "범인을 맞히면 승리.\n단, 자신이 한도윤의 재산 정리에 개입하고 있었다는 사실은 숨겨야 한다.",

      knownInfo: [
        "한서준이 자신을 불편하게 바라보고 있다는 걸 알고 있다."
      ],

      timeline: [
        { time: "22:05경", activity: "복도에서 서하진과 짧게 이야기를 나눴다." },
        { time: "22:10~22:15", activity: "방 앞에서 한서준과 대화를 나눴다." },
        { time: "22:30경", activity: "유리 깨지는 소리를 듣고 복도로 나왔다." },
      ],
    },
  ],

  hintCards: [
    {
      id: 1,
      type: "info",
      content:
          "깨진 와인잔 안쪽에서는 희미한 약품 냄새가 남아 있었다.",
      mapPointId: "victim_body",
      unlocks: [2, 8, 9],
    },

    {
      id: 2,
      type: "info",
      content:
          "피해자의 얼굴과 몸통 곳곳에는\n강하게 부딪히거나 눌린 듯한 붉은 자국이 남아 있었다.",
      mapPointId: "victim_body",
      unlocks: [3],
    },

    {
      id: 3,
      type: "info",
      content:
          "소파 주변은 누군가 급하게 움직인 듯 담요와 쿠션, 책 몇 권이 흐트러져 있었다.",
      mapPointId: "study_scene",
      unlocks: [11],
    },

    {
      id: 4,
      type: "info",
      content:
          "서재 책상 모서리에는 강하게 부딪힌 듯한 자국이 남아 있었다.",
      mapPointId: "desk_docs",
      unlocks: [13],
    },

    {
      id: 5,
      type: "info",
      content:
          "복도 카펫 위에는 여러 사람의 발자국이 뒤섞여 있었다.",
      mapPointId: "corridor",
      unlocks: [18, 29, 30],
    },

    {
      id: 6,
      type: "info",
      content:
          "한서준의 셔츠 소매는 찢어져 있었고,\n단추 하나가 떨어져 있었다.",
      mapPointId: "study_scene",
      unlocks: [19],
    },

    {
      id: 7,
      type: "info",
      content:
          "벽난로 안쪽에서는 완전히 타지 않은 종이 조각들이 발견되었다.",
      mapPointId: "fireplace",
      unlocks: [20],
    },

    {
      id: 8,
      type: "info",
      content:
          "약장 안 졸피뎀 병 하나가 거의 비어 있었다.",
      mapPointId: "personal_items",
    },

    {
      id: 9,
      type: "info",
      content:
          "강민혁의 셔츠 소매 끝에는 희미한 와인 얼룩이 남아 있었다.",
      mapPointId: "study_scene",
      unlocks: [22],
    },

    {
      id: 10,
      type: "info",
      content:
          "유리 깨지는 소리를 들었다는 시간은 모두 비슷했지만,\n그 직전에 무엇을 들었는지는 사람마다 달랐다.",
      mapPointId: "corridor",
      unlocks: [21],
    },

    {
      id: 11,
      type: "info",
      content:
          "피해자의 얼굴 주변에서는 미세한 섬유 흔적이 발견되었다.",
      mapPointId: "victim_body",
    },

    {
      id: 12,
      type: "info",
      content:
          "윤기섭의 실내용 슬리퍼 밑창에는 마르다 만 와인 자국이 남아 있었다.",
      mapPointId: "personal_items",
      unlocks: [25],
    },

    {
      id: 13,
      type: "info",
      content:
          "피해자의 손톱 밑에서는 미세한 피부 조직이 발견되었다.",
      mapPointId: "victim_body",
      unlocks: [6],
    },

    {
      id: 14,
      type: "info",
      content:
          "한도윤의 책상 위에는 끝까지 작성되지 않은 메모가 남아 있었다.",
      mapPointId: "desk_docs",
      unlocks: [24],
    },

    {
      id: 15,
      type: "info",
      content:
          "이수연 방 쓰레기통 안에서는 찢어진 메모 조각들이 발견되었다.",
      mapPointId: "personal_items",
      unlocks: [27],
    },

    {
      id: 16,
      type: "info",
      content:
          "서하진의 수첩에는 저택 구조와 사람들의 동선이 짧게 메모되어 있었다.",
      mapPointId: "hidden_drawer",
      unlocks: [28],
    },

    {
      id: 17,
      type: "info",
      content:
          "저택 관리 문서들 사이에서는,\n정리되지 않은 퇴직금 관련 서류 몇 장이 발견되었다.",
      mapPointId: "desk_docs",
    },

    {
      id: 18,
      type: "info",
      content:
          "발자국 중 일부는 서재 문 앞에서 갑자기 방향이 바뀌어 있었다.",
      mapPointId: "corridor",
      unlocks: [23],
    },

    {
      id: 19,
      title: "공개 카드",
      type: "action",
      content:
          "【전체 공개】\n\n서재 책상 아래에서 작은 금속 단추 하나가 발견되었습니다.",
      mapPointId: "desk_docs",
      actionRule: "show_all",
      unlocks: [],
    },

    {
      id: 20,
      type: "info",
      content:
          "불에 탄 종이 조각 중 일부에는 계약서 형식의 문장 구조가 남아 있었다.",
      mapPointId: "fireplace",
    },

    {
      id: 21,
      type: "info",
      content:
          "사건 직전, 2층 복도에서는 누군가 언성을 높이는 소리가 들렸다는 증언이 있었다.",
      mapPointId: "corridor",
      unlocks: [4],
    },

    {
      id: 22,
      type: "info",
      content:
          "강민혁은 사건 전 한도윤의 상태를 확인한다며 서재에 들렀다고 말했다.",
      mapPointId: "fireplace",
      unlocks: [7],
    },

    {
      id: 23,
      type: "info",
      content:
          "서재 근처 복도 바닥에서는,\n실내용 슬리퍼로 남겨진 듯한 희미한 자국이 발견되었다.",
      mapPointId: "corridor",
      unlocks: [12],
    },

    {
      id: 24,
      type: "info",
      content:
          "책상 서랍 안에서는 수정 중이던 재산 정리 문서 일부가 발견되었다.\n\n여러 이름 위에는 줄이 그어져 있었고,\n일부 문장은 새로 덧써진 흔적이 남아 있었다.",
      mapPointId: "desk_docs",
      unlocks: [17, 26]
    },

    {
      id: 25,
      type: "info",
      content:
          "와인 자국은 서재 바닥뿐 아니라,\n문 근처 카펫에도 희미하게 이어져 있었다.",
      mapPointId: "corridor",
    },

    {
      id: 26,
      type: "info",
      content:
          "메모 아래쪽에는 한서준의 이름이 거칠게 적혀 있었다.",
      mapPointId: "desk_docs",
    },

    {
      id: 27,
      type: "info",
      content:
          "찢어진 메모 조각 중 하나에는 서하진 이름의 일부가 적혀 있었다.",
      mapPointId: "personal_items",
      unlocks: [16],
    },

    {
      id: 28,
      type: "info",
      content:
          "서하진 수첩 마지막 페이지에는 '생각보다 훨씬 빨랐다.'라는 문장이 적혀 있었다.",
      mapPointId: "hidden_drawer",
    },

    {
      id: 29,
      type: "info",
      content:
          "한서준은 사건 전부터 계속 복도 주변을 서성이고 있었다는 증언이 있었다.",
      mapPointId: "corridor",
    },
    {
      id: 30,
      type: "info",
      content:
          "최근 서하진은 이수연과 단둘이 이야기를 나누는 모습이 여러 번 목격되었다.",
      mapPointId: "corridor",
    }
  ],

  initialCards: [1, 5, 10, 14, 15],

  discussionSeconds: 240,

  truth: {
    killerId: "butler",

    motive:
        "평생 저택을 위해 살아왔지만,\n결국 가장 먼저 밀려날 존재라는 사실 앞에서 윤기섭은 무너졌다.",

    method:
        "의식이 약해진 피해자를 소파 쿠션으로 질식사",

    narrativeStory:
        "식사 자리에서,\n강민혁은 한도윤의 와인에 졸피뎀을 넣었다.\n\n그는 단지 한도윤을 잠들게 만들고,\n민감한 대화를 피하려 했을 뿐이었다.\n\n하지만 그날 밤 저택 안에는,\n이미 오래 쌓인 감정들이 얽혀 있었다.\n\n한서준과 한도윤은 재산 정리와,\n최근 달라진 저택 분위기에 대해 격하게 언쟁했다.\n\n감정이 격해진 순간,\n한서준이 한도윤을 밀쳐냈고,\n균형을 잃은 한도윤은 책상 근처로 크게 넘어졌다.\n\n한서준은 자신이 사람을 죽였다고 믿은 채 서재를 뛰쳐나왔다.\n\n잠시 뒤,\n윤기섭이 서재 안으로 들어왔다.\n\n한도윤은 아직 살아 있었다. 바닥에 쓰러진 그는 희미하게 숨을 몰아쉬고 있었다.\n\n윤기섭은 오랫동안 그를 바라봤다.\n\n새로운 사람들,\n변해가는 저택,\n그리고 평생 자신의 전부였던 이곳에서,\n점점 밀려나고 있다는 감각.\n\n그 감정은 생각보다 오래 쌓여 있었다.\n\n윤기섭은 천천히 소파 쿠션을 들어 올렸다.\n\n그리고 얼마 지나지 않아,\n한도윤의 움직임이 완전히 멈췄다.\n\n윤기섭은 흔들리는 손으로 주변을 정리하기 시작했다.\n\n그 과정에서,\n책상 가장자리에 걸쳐 있던 와인잔 하나가 바닥으로 떨어져 산산조각 났다.\n\n그 소리에 사람들이 복도로 뛰쳐나오기 시작했다.",
  },
};