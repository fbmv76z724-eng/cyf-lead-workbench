import type { Lead, LinkStatus } from "../domain/lead";

function isoAt(date: string): string {
  return `${date}T04:00:00.000Z`;
}

function createLead(
  index: number,
  inCompanyTime: string,
  latestFollowAt: string,
  latestLinkStatus: LinkStatus,
): Lead {
  const suffix = String(index + 1).padStart(3, "0");
  const phoneSuffix = String(index + 1).padStart(4, "0");
  const driverId = 2000000000000000 + index;

  return {
    id: `lead-${suffix}`,
    source: "cyf",
    cyfLeadId: 9000000 + index,
    cyfDriverId: driverId,
    city: "凉山彝族自治州",
    company: "测试司服公司（西昌）",
    name: "",
    phoneMasked: `191****${phoneSuffix}`,
    phoneFull: `1910000${phoneSuffix}`,
    flowState: "进行中",
    leadStage: index % 5 === 0 ? "公海主动回流" : "首次流入",
    channelType: "线上",
    intentionArea: index % 2 === 0 ? "西昌市" : "会东县",
    inCompanyTime,
    fallPublicDays: 6,
    possibleJoin: (index % 3) as 0 | 1 | 2,
    latestLinkStatus,
    latestFollowAt,
    latestFollowUser: "测试跟进员",
    followCount: 1,
    syncState: "synced",
    createdAt: inCompanyTime,
    updatedAt: latestFollowAt,
  };
}

const today = Array.from({ length: 5 }, (_, index) =>
  createLead(
    index,
    isoAt(`2026-09-16`),
    `2026-09-16T0${index + 4}:30:00.000Z`,
    1,
  ),
);

const September15 = Array.from({ length: 8 }, (_, offset) =>
  createLead(
    offset + 5,
    isoAt("2026-09-15"),
    `2026-09-15T0${(offset % 8) + 2}:15:00.000Z`,
    (offset % 3) as LinkStatus,
  ),
);

const September14 = Array.from({ length: 9 }, (_, offset) =>
  createLead(
    offset + 13,
    isoAt("2026-09-14"),
    `2026-09-14T0${(offset % 8) + 2}:15:00.000Z`,
    (offset % 3) as LinkStatus,
  ),
);

const lastWeek = Array.from({ length: 46 }, (_, offset) => {
  const day = 13 - Math.floor(offset / 8);
  const index = offset + 22;
  return createLead(
    index,
    isoAt(`2026-09-${String(day).padStart(2, "0")}`),
    offset === 0
      ? "2026-09-14T06:20:00.000Z"
      : offset < 44
        ? `2026-09-${String(day).padStart(2, "0")}T06:20:00.000Z`
        : "2026-09-01T06:20:00.000Z",
    (offset % 3) as LinkStatus,
  );
});

const earlierThisMonth = [
  createLead(
    68,
    isoAt("2026-09-03"),
    "2026-09-02T06:20:00.000Z",
    1,
  ),
];

const outsideMonth = Array.from({ length: 4 }, (_, offset) =>
  createLead(
    offset + 69,
    isoAt(`2026-08-${String(28 - offset).padStart(2, "0")}`),
    isoAt(`2026-08-${String(28 - offset).padStart(2, "0")}`),
    (offset % 3) as LinkStatus,
  ),
);

export const cyfSnapshot: Lead[] = [
  ...today,
  ...September15,
  ...September14,
  ...lastWeek,
  ...earlierThisMonth,
  ...outsideMonth,
];
