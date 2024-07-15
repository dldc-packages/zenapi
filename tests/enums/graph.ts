export type UserRole = "admin" | "user" | "guest";

export interface Graph {
  role: UserRole;
}
