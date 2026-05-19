import type { ScenarioMeta } from "@/data/scenario.type";

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
