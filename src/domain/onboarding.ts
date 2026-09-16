export type DriverIdentity = "didi" | "xinju" | "unknown";

export interface OnboardingRecord {
  id: string;
  driverId?: number;
  onboardedAt: string;
  identity: DriverIdentity;
  driverType: string;
}
