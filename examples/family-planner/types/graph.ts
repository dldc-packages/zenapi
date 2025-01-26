/**
 * This Typescript file is used as the definition of the graph
 * Here we are defining the Graph for an application called Family Planner
 * We have a list of members and events, each event is linked to a member (a member can have multiple events)
 */

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface Member {
  id: string;
  name: string;
  events: Event[];
}

export interface MemberNamespace {
  member: Member;
  remove: () => null;
  rename: (name: string) => Member;
}

export interface MembersNamespace {
  list: () => Member[];
  create: (name: string) => Member;
  byId: (id: string) => MemberNamespace;
}

export interface Event {
  id: string;
  title: string;
  day: Weekday;
  member: Member;
}

export interface ListEventsParams {
  search?: string; // Search by title
  memberIds?: string[]; // Filter by member ids
  weekdays?: Weekday[]; // Filter by weekdays
}

export interface EventNamespace {
  event: Event;
  remove: () => null;
  rename: (title: string) => Event;
  transfer: (memberId: string) => Event;
}

export interface CreateMenyEventsParams {
  title: string;
  day: Weekday;
  memberId: string;
}

export interface EventsNamespace {
  list: (params?: ListEventsParams) => Paginated<Event>;
  create: (title: string, memberId: string) => Event;
  createMany: (events: CreateMenyEventsParams[]) => Event[];
  byId: (id: string) => EventNamespace;
}

export interface Graph {
  members: MembersNamespace;
  events: EventsNamespace;
}

/**
 * Paginated utils
 * ZenAPI supports generic types so we can reuse the same logic for different types
 */

export interface PageConfig {
  page?: number;
  pageSize?: number;
}

export type Paginated<T> = (page?: PageConfig) => PaginatedResult<T>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}
