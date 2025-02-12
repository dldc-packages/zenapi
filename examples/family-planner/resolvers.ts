import {
  ApiContext,
  createKey,
  defaultResolver,
  resolver,
} from "../../server.ts";
import * as db from "./database.ts";
import { graph } from "./graph.ts";

/**
 * Note: This file only implements the resolvers needed for the example to work.
 */

const membersListResolver = resolver(
  graph.MembersNamespace.list.return,
  (ctx) => {
    const members = db.listMembers();
    return ctx.withValue(members);
  },
);

const createMemberResolver = resolver(
  graph.MembersNamespace.create.return,
  (ctx) => {
    const [name] = ctx.getInputOrFail(graph.MembersNamespace.create);
    const member = db.createMember(name);
    return ctx.withValue(member);
  },
);

/**
 * This is a way to pass data between resolvers.
 * (if you know React Context API, this is similar)
 * Here we use it to know what is the current event and the related member
 * Which is used when we want to get the member data from the event
 */
const EventKey = createKey<{ id: string; memberId: string }>("Event");

const listEventsResolver = resolver(
  graph.EventsNamespace.list.return.return,
  (ctx, next) => {
    const [params = {}] = ctx.getInputOrFail(graph.EventsNamespace.list);
    const [{ page = 1, pageSize = 5 } = {}] = ctx.getInputOrFail(
      graph.Paginated,
    );
    const events = db.listEvents(params);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return next(ctx.withValue({
      total: events.length,
      data: events.slice(startIndex, endIndex).map((event) =>
        ApiContext.empty().with(EventKey.Provider(event)).withValue(event)
      ),
    }));
  },
);

const createManyEventsResolver = resolver(
  graph.EventsNamespace.createMany.return,
  (ctx) => {
    const [events] = ctx.getInputOrFail(graph.EventsNamespace.createMany);
    const createdEvents = events.map(({ title, day, memberId }) =>
      db.createEvent(title, day, memberId)
    );
    return ctx.withValue(createdEvents.map((event) => (
      ApiContext.empty().with(EventKey.Provider(event)).withValue(event)
    )));
  },
);

/**
 * Find the member data from the event
 */
const eventMemberResolver = resolver(
  graph.Event.member,
  (ctx) => {
    const { memberId } = ctx.getOrFail(EventKey.Consumer);
    const memberData = db.getMember(memberId);
    return ctx.withValue(memberData);
  },
);

export const resolvers = [
  ...defaultResolver(
    graph.Graph,
    graph.EventsNamespace,
    graph.EventNamespace,
    graph.MembersNamespace,
    graph.MemberNamespace,
  ),
  membersListResolver,
  createMemberResolver,
  listEventsResolver,
  createManyEventsResolver,
  eventMemberResolver,
];
