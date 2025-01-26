import { obj, query, queryToJson, type TQueryBase } from "../../client.ts";
import { server } from "./server.ts";
import type { AllTypes } from "./types/graph.exposed.ts";

/**
 * This our query builder
 */
const q = query<AllTypes>();

/**
 * This is our client
 */
async function executeQuery<R>(query: TQueryBase<R>): Promise<R> {
  const [queryDef, variables] = queryToJson(query);
  // In real app you would send the queryDef and variables to the server
  // here we call the server function directly
  return await server(queryDef, variables);
}

// Now we can interact with the server

/**
 * Let's start by listing all the members
 * Some notes:
 * - Your query must always start from the Graph object (as defined in server.ts)
 * - The _() is a special function that allows you to select the fields you want to get back
 */
const membersIds = await executeQuery(
  q.Graph.members.list()._(
    ({ id }) => id, // Here we select the id of each member
  ),
);

/**
 * Look ! `membersIds` is correctly typed as string[] (since we selected the id field only)
 */
console.log("Member ids:\n", membersIds); // [] we don't have any members yet

/**
 * Let's add some members
 */
const homerId = await executeQuery(
  q.Graph.members.create("Homer")._((c) => c.id), // Here we select the id of the created member
);
console.log({ homerId });
const margeId = await executeQuery(
  q.Graph.members.create("Marge")._((c) => c.id),
);
console.log({ margeId });
const bartId = await executeQuery(
  q.Graph.members.create("Bart")._((c) => c.id),
);
console.log({ bartId });
const lisaId = await executeQuery(
  q.Graph.members.create("Lisa")._((c) => c.id),
);
console.log({ lisaId });
const maggieId = await executeQuery(
  q.Graph.members.create("Maggie")._((c) => c.id),
);
console.log({ maggieId });

/**
 * Let's list the members again, but this time we want to get the id and name of each member
 * If you want to select multiple fields you can do it using the obj operator:
 */
const members = await executeQuery(
  q.Graph.members.list()._(({ id, name }) => obj({ id, name })),
);

/**
 * This time `members` is correctly typed as { id: string, name: string }[]
 */
console.log("Members:\n", members);

/**
 * Let's add some events before we continue
 */
const createdIds = await executeQuery(
  q.Graph.events.createMany([
    // Monday
    { memberId: bartId, title: "School", day: "Monday" },
    { memberId: lisaId, title: "School", day: "Monday" },
    { memberId: homerId, title: "Work", day: "Monday" },
    { memberId: margeId, title: "Work", day: "Monday" },
    { memberId: lisaId, title: "Read books", day: "Monday" },
    { memberId: margeId, title: "Grocery shopping", day: "Monday" },

    // Tuesday
    { memberId: bartId, title: "School", day: "Tuesday" },
    { memberId: lisaId, title: "School", day: "Tuesday" },
    { memberId: homerId, title: "Work", day: "Tuesday" },
    { memberId: margeId, title: "Work", day: "Tuesday" },
    { memberId: homerId, title: "Eat donuts", day: "Tuesday" },

    // Wednesday
    { memberId: bartId, title: "School", day: "Wednesday" },
    { memberId: lisaId, title: "School", day: "Wednesday" },
    { memberId: homerId, title: "Work", day: "Wednesday" },
    { memberId: margeId, title: "Work", day: "Wednesday" },
    { memberId: margeId, title: "Buy more donuts", day: "Wednesday" },

    // Thursday
    { memberId: bartId, title: "School", day: "Thursday" },
    { memberId: lisaId, title: "School", day: "Thursday" },
    { memberId: homerId, title: "Work", day: "Thursday" },
    { memberId: margeId, title: "Work", day: "Thursday" },
    { memberId: bartId, title: "Skateboarding", day: "Thursday" },

    // Friday
    { memberId: bartId, title: "School", day: "Friday" },
    { memberId: lisaId, title: "School", day: "Friday" },
    { memberId: homerId, title: "Work", day: "Friday" },
    { memberId: margeId, title: "Work", day: "Friday" },
    // Movie night
    { memberId: homerId, title: "Watch a movie", day: "Friday" },
    { memberId: margeId, title: "Watch a movie", day: "Friday" },
    { memberId: bartId, title: "Watch a movie", day: "Friday" },
    { memberId: lisaId, title: "Watch a movie", day: "Friday" },
  ])._((c) => c.id),
);

console.log("Created events ids:", createdIds);

/**
 * Let's list the events !
 * The list events function uses some filters as well as pagination
 */
const events = await executeQuery(
  q.Graph.events.list()({ pageSize: 5, page: 1 })._(
    ({ data, total }) =>
      obj({
        total,
        data: data._(({ id, title, day, member }) =>
          obj({ id, title, day, memberName: member.name })
        ),
      }),
  ),
);

console.log("Events:\n", events);

/**
 * We can extract the events query to a function to make it reusable
 */

function listEvents(page: number) {
  return q.Graph.events.list()({ pageSize: 5, page })._(
    ({ data, total }) =>
      obj({
        total,
        data: data._(({ id, title, day, member }) =>
          obj({ id, title, day, memberName: member.name })
        ),
      }),
  );
}

const page1 = await executeQuery(listEvents(1));
console.log("Page 1:\n", page1);
const page2 = await executeQuery(listEvents(2));
console.log("Page 2:\n", page2);
