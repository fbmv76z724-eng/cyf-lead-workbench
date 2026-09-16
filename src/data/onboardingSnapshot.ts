import type { OnboardingRecord } from "../domain/onboarding";

function createRecord(
  index: number,
  onboardedAt: string,
  identity: OnboardingRecord["identity"],
  driverType: string,
): OnboardingRecord {
  return {
    id: `onboarding-test-${String(index + 1).padStart(3, "0")}`,
    driverId: 2000000000000000 + index,
    onboardedAt,
    identity,
    driverType,
  };
}

function createGroup(
  startIndex: number,
  count: number,
  onboardedAt: string,
  identity: OnboardingRecord["identity"],
  driverType: string,
): OnboardingRecord[] {
  return Array.from({ length: count }, (_, offset) =>
    createRecord(startIndex + offset, onboardedAt, identity, driverType),
  );
}

export const onboardingSnapshot: OnboardingRecord[] = [
  ...createGroup(0, 1, "2026-09-15T04:00:00.000Z", "didi", "纯新"),
  ...createGroup(1, 1, "2026-09-15T04:00:00.000Z", "xinju", "纯新"),
  ...createGroup(2, 1, "2026-09-15T04:00:00.000Z", "xinju", "新桔"),
  ...createGroup(3, 13, "2026-09-10T04:00:00.000Z", "didi", "纯新"),
  ...createGroup(16, 6, "2026-09-10T04:00:00.000Z", "xinju", "纯新"),
  ...createGroup(22, 13, "2026-09-03T04:00:00.000Z", "didi", "纯新"),
  ...createGroup(35, 2, "2026-09-03T04:00:00.000Z", "xinju", "新桔"),
];
