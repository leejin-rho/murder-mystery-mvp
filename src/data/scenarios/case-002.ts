import type { Scenario } from "@/data/scenario.type";

/* ── 검은 저택의 마지막 초대 (5인용, 장소별 카드) ── */

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
    {
      id: "lawyer", name: "변호사 — 한지훈", background: "피해자의 법률 대리인. 차분하고 논리적 성격.",
      secret: "피해자의 유언장을 조작했다.",
      winCondition: "범인을 맞히고 유언장 위조가 들키지 않으면 승리.",
      knownInfo: [
        "피해자는 최근 유언장 변경을 검토 중이었고, 당신에게 초안 작성을 의뢰했습니다.",
        "서재 금고 비밀번호는 피해자 생일인 0419입니다.",
        "유언장 초안에서 동생의 이름이 제외되어 있다는 것을 알고 있습니다.",
      ],
    },
    {
      id: "secretary", name: "비서 — 윤세라", background: "피해자 개인 비서. 항상 침착.",
      secret: "피해자와 불륜 관계였다.",
      winCondition: "범인을 맞히고 불륜 관계가 들키지 않으면 승리.",
      knownInfo: [
        "만찬 당일 오후, 피해자는 주치의와 단둘이 30분간 면담했습니다.",
        "피해자가 최근 '의사를 바꾸고 싶다'고 말한 적이 있습니다.",
        "피해자 침실에 함께 찍은 사진이 남아 있다는 것을 알고 있습니다.",
      ],
    },
    {
      id: "brother", name: "동생 — 강민우", background: "피해자의 동생. 사업 실패 경험 있음.",
      secret: "형에게 큰 빚이 있다.",
      winCondition: "범인을 맞히고 파산 사실이 들키지 않으면 승리.",
      knownInfo: [
        "형은 최근 심장이 좋지 않아 약 복용량을 늘렸다고 했습니다.",
        "유언장에서 자신의 이름이 빠졌다는 소문을 들었습니다.",
        "만찬 전 정원을 산책하다 코트 단추 하나를 잃어버렸습니다.",
      ],
    },
    {
      id: "doctor", name: "의사 — 최도현", background: "피해자의 주치의.",
      secret: "당신이 범인입니다. 피해자는 건강 이상을 눈치채고 병원을 바꾸려 했고, 의료 기록 조작이 들킬 것을 우려해 와인잔에 독극물을 투입했습니다.",
      winCondition: "다른 플레이어들이 당신을 범인으로 추리해내지 못하면 승리.",
      knownInfo: [
        "피해자의 심장약과 반응하면 독성이 생기는 물질을 와인잔에 탔습니다.",
        "독극물을 준비할 때 주방 도마와 물컵을 사용했습니다.",
        "범행 후 욕실에서 손을 씻었습니다.",
        "와인 저장고에서 특정 병을 꺼내 와인에 물질을 탔습니다.",
      ],
    },
    {
      id: "journalist", name: "기자 — 이수진", background: "기자. 이 만찬에 초대받지 않았지만 잠입했다.",
      secret: "피해자의 비리를 취재 중이었다.",
      winCondition: "범인을 맞히고 기자 신분이 들키지 않으면 승리.",
      knownInfo: [
        "피해자 강도윤이 과거 의료 사고를 은폐한 정황을 취재 중이었습니다.",
        "오늘 만찬 참석자 명단을 사전에 입수했고, 주치의가 포함된 것을 확인했습니다.",
        "서재에서 피해자 목소리가 담긴 녹음기를 발견했습니다. '의사가 뭔가 숨기고 있어.'",
        "차고에서 타이어 자국을 사진으로 기록해 두었습니다.",
      ],
    },
  ],
  hintCards: [
    // 식당 (1~5)
    { id: "card_01", number: 1, type: "info", content: "깨진 와인잔 조각이 피해자 자리 바닥에 흩어져 있다. 잔 내부에서는 와인 냄새 외에 다른 향은 느껴지지 않는다.", location: "식당", unlocks: [2, 3, 4, 5] },
    { id: "card_02", number: 2, type: "info", content: "냅킨에 희미하게 적힌 글자: \"약… 줄여…\" 누군가 급하게 적다 만 듯하다.", location: "식당" },
    { id: "card_03", number: 3, type: "info", content: "피해자 접시에는 음식이 거의 남아 있다. 반면 와인은 절반 이상 비워져 있다.", location: "식당" },
    { id: "card_04", number: 4, type: "info", content: "의사 자리 물컵 안쪽에 하얀 가루 흔적이 묻어 있다.", location: "식당" },
    { id: "card_05", number: 5, type: "info", content: "비서의 립스틱 자국이 피해자 와인잔 가장자리에서 발견된다.", location: "식당" },
    // 서재 (6~10)
    { id: "card_06", number: 6, type: "info", content: "찢어진 종이 조각을 맞춰보면 문장 일부가 완성된다. \"…유산 전액 수정 예정\"", location: "서재", unlocks: [7, 8, 9, 10] },
    { id: "card_07", number: 7, type: "info", content: "금고 메모에 숫자 0419가 적혀 있다.", location: "서재" },
    { id: "card_08", number: 8, type: "info", content: "녹음기 파일에 피해자 목소리가 녹음돼 있다. \"의사가 뭔가 숨기고 있어.\"", location: "서재" },
    { id: "card_09", number: 9, type: "info", content: "유언장 초안에는 동생 이름이 제외되어 있다.", location: "서재" },
    { id: "card_10", number: 10, type: "info", content: "동생 명의 채무 문서 발견. 금액: 8억.", location: "서재" },
    // 침실 (11~15)
    { id: "card_11", number: 11, type: "info", content: "약 봉투에는 심장약 이름이 적혀 있다. 복용량이 최근 두 배로 늘어난 기록이 있다.", location: "침실", unlocks: [12, 13, 14, 15] },
    { id: "card_12", number: 12, type: "info", content: "금고 안에는 현금 대신 의료 기록 파일이 들어 있다.", location: "침실" },
    { id: "card_13", number: 13, type: "info", content: "창문 아래 낯선 신발 자국이 있다.", location: "침실" },
    { id: "card_14", number: 14, type: "info", content: "숨겨진 사진: 피해자와 비서가 함께 찍은 사진.", location: "침실" },
    { id: "card_15", number: 15, type: "info", content: "베개 밑에서 비서 머리카락 발견.", location: "침실" },
    // 정원 (16~20)
    { id: "card_16", number: 16, type: "info", content: "담배꽁초가 떨어져 있다. 피해자는 비흡연자였다.", location: "정원", unlocks: [17, 18, 19, 20] },
    { id: "card_17", number: 17, type: "info", content: "신발 자국 방향이 저택 안쪽이 아니라 바깥쪽을 향하고 있다.", location: "정원" },
    { id: "card_18", number: 18, type: "info", content: "담장 일부에 긁힌 흔적이 있다.", location: "정원" },
    { id: "card_19", number: 19, type: "info", content: "정원 의자 아래 단추 하나가 떨어져 있다.", location: "정원" },
    { id: "card_20", number: 20, type: "info", content: "단추가 고급 맞춤 코트에서 쓰이는 재질임이 확인되었다. 이 자리에 그런 코트를 입은 사람이 있다.", location: "정원" },
    // 주방 (21~25)
    { id: "card_21", number: 21, type: "info", content: "세제통 뒤에서 작은 유리병 발견. 라벨 없음.", location: "주방", unlocks: [22, 23, 24, 25] },
    { id: "card_22", number: 22, type: "info", content: "병 안 잔여물에서 특수 화합물이 검출되었다. 의약품 관련 성분으로 추정되며, 전문 지식 없이는 구하기 어렵다.", location: "주방" },
    { id: "card_23", number: 23, type: "info", content: "쓰레기통에서 약 봉지 발견. 이름 부분이 찢겨 있다.", location: "주방" },
    { id: "card_24", number: 24, type: "info", content: "도마에 미세한 긁힘. 약병을 긁은 흔적으로 보인다.", location: "주방" },
    { id: "card_25", number: 25, type: "info", content: "싱크대 아래 장갑 한 짝 발견.", location: "주방" },
    // 차고 (26~30)
    { id: "card_26", number: 26, type: "info", content: "차 열쇠가 바닥에 떨어져 있다.", location: "차고", unlocks: [27, 28, 29, 30] },
    { id: "card_27", number: 27, type: "info", content: "트렁크 안쪽에 흙이 묻어 있다.", location: "차고" },
    { id: "card_28", number: 28, type: "info", content: "기름 냄새가 진하게 난다.", location: "차고" },
    { id: "card_29", number: 29, type: "info", content: "차 주변 발자국이 하나만 있다.", location: "차고" },
    { id: "card_30", number: 30, type: "info", content: "타이어 자국 사진을 찍어둔 기록이 있다. 누군가 미리 촬영해 보관한 것으로 보인다.", location: "차고" },
    // 와인 저장고 (31~35)
    { id: "card_31", number: 31, type: "info", content: "특정 와인 한 병만 선반에서 빠져 있다.", location: "와인 저장고", unlocks: [32, 33, 34, 35] },
    { id: "card_32", number: 32, type: "info", content: "코르크 조각 안쪽이 긁혀 있다.", location: "와인 저장고" },
    { id: "card_33", number: 33, type: "info", content: "와인병에 지문이 두 명 분 있다.", location: "와인 저장고" },
    { id: "card_34", number: 34, type: "info", content: "병따개가 바닥에 떨어져 있다.", location: "와인 저장고" },
    { id: "card_35", number: 35, type: "info", content: "와인 라벨에 미세한 흰 가루가 묻어 있다.", location: "와인 저장고" },
    // 욕실 (36~40)
    { id: "card_36", number: 36, type: "info", content: "세면대 주변 물 튄 흔적.", location: "욕실", unlocks: [37, 38, 39, 40] },
    { id: "card_37", number: 37, type: "info", content: "손 씻은 흔적이 있지만 비누는 사용되지 않았다.", location: "욕실" },
    { id: "card_38", number: 38, type: "info", content: "배수구 잔여물 검사 결과 약물 성분이 검출되었다.", location: "욕실" },
    { id: "card_39", number: 39, type: "info", content: "거울에 손자국이 있다.", location: "욕실" },
    { id: "card_40", number: 40, type: "info", content: "종이타월 쓰레기통이 비어 있다.", location: "욕실" },
  ],
  initialCards: [1, 6, 11, 16, 21, 26, 31, 36],
  discussionSeconds: 180,
  events: [
    {
      afterRound: 2,
      title: "부검 결과 발표",
      text: "임시 검시 결과가 나왔습니다. '피해자 혈중에서 심장약과 반응하는 미확인 화학물질이 검출되었습니다. 독살로 판정됩니다. 물질의 정체를 파악 중입니다.'",
    },
    {
      afterRound: 5,
      title: "경찰 도착 임박",
      text: "폭설이 걷히기 시작했습니다. 경찰이 1시간 내로 도착할 예정입니다. 이 자리에 있는 모든 사람은 곧 공식 조사를 받게 됩니다.",
    },
  ],
  truth: {
    killerId: "doctor",
    motive: "피해자는 건강 이상을 눈치채고 병원을 바꾸려 했고, 의료 기록 조작이 들킬 것을 우려해 독살했다.",
    method: "와인잔에 독극물 투입",
    narrativeStory:
      "의사 최도현은 피해자 강도윤의 주치의로, 그의 건강 기록을 조작해왔다. 강도윤이 최근 이상 징후를 느끼고 다른 병원으로 옮기려 하자, 기록 조작이 들킬 위기에 처했다.\n\n만찬 당일, 최도현은 특정 심장약과 반응하면 독성이 나는 물질을 피해자의 와인잔에 타 넣었다. 피해자는 와인을 마신 뒤 쓰러졌고, 냅킨에 \"약… 줄여…\"라고 적다 의식을 잃었다.\n\n의료인만이 알 수 있는 약물 상호작용을 이용한, 계획된 독살이었다.",
  },
};
