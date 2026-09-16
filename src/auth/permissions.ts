export type UserRole = "admin" | "sales";

export interface UserProfile {
  id: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}

export function isAdmin(profile?: UserProfile | null): boolean {
  return profile?.role === "admin" && profile.active;
}

export function canManageUsers(profile?: UserProfile | null): boolean {
  return isAdmin(profile);
}

export function canExport(profile?: UserProfile | null): boolean {
  return isAdmin(profile);
}

export function canAssignLeads(profile?: UserProfile | null): boolean {
  return isAdmin(profile);
}

export function canTriggerSync(profile?: UserProfile | null): boolean {
  return isAdmin(profile);
}
