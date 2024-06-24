export type Role = "admin" | "user";

export interface User {
  name: string;
  age: number | null;
  group: Group;
}

export interface Group {
  name: string;
  users: User[];
}

export interface Graph {
  group: Group;
  user: User;
}
