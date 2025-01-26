import type { ListEventsParams, Weekday } from "./types/graph.ts";

interface DbMember {
  id: string;
  name: string;
}

interface DbEvent {
  id: string;
  title: string;
  day: Weekday;
  memberId: string;
}

const members = new Map<string, DbMember>();
const events = new Map<string, DbEvent>();

export function createMember(name: string): DbMember {
  const member = { id: crypto.randomUUID(), name };
  members.set(member.id, member);
  return member;
}

export function createEvent(
  title: string,
  day: Weekday,
  memberId: string,
): DbEvent {
  // Check if member exists
  if (!members.has(memberId)) {
    throw new Error(`Member with id ${memberId} does not exist`);
  }
  const event = { id: crypto.randomUUID(), title, day, memberId };
  events.set(event.id, event);
  return event;
}

export function listMembers(): DbMember[] {
  return Array.from(members.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function listEvents(
  { memberIds, search, weekdays }: ListEventsParams,
): DbEvent[] {
  return Array.from(events.values())
    .filter((event) => {
      if (search !== undefined && !event.title.includes(search)) {
        return false;
      }
      if (memberIds && !memberIds.includes(event.memberId)) {
        return false;
      }
      if (weekdays && !weekdays.includes(event.day)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getMember(id: string): DbMember | undefined {
  return members.get(id);
}

export function getEvent(id: string): DbEvent | undefined {
  return events.get(id);
}

export function getEventsByMemberId(memberId: string): DbEvent[] {
  return listEvents({ memberIds: [memberId] });
}

export function removeMember(id: string): void {
  members.delete(id);
}

export function removeEvent(id: string): void {
  events.delete(id);
}
