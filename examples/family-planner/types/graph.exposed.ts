/**
 * This file expose a types with all the types that can be used in the graph
 * This is used to get the types for the client and the server
 */
import type {
  CreateMenyEventsParams,
  Event,
  EventNamespace,
  EventsNamespace,
  Graph,
  ListEventsParams,
  Member,
  MemberNamespace,
  MembersNamespace,
  PageConfig,
  Paginated,
  PaginatedResult,
  Weekday,
} from "./graph.ts";

export interface AllTypes {
  Event: Event;
  EventNamespace: EventNamespace;
  EventsNamespace: EventsNamespace;
  Graph: Graph;
  ListEventsParams: ListEventsParams;
  Member: Member;
  MemberNamespace: MemberNamespace;
  MembersNamespace: MembersNamespace;
  PageConfig: PageConfig;
  Paginated: Paginated<any>;
  PaginatedResult: PaginatedResult<any>;
  CreateMenyEventsParams: CreateMenyEventsParams;
  Weekday: Weekday;
}
