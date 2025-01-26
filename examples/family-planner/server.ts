import type { TQueryDef, TVariables } from "../../client.ts";
import { createEngine } from "../../server.ts";
import { graph } from "./graph.ts";
import { resolvers } from "./resolvers.ts";

export const graphEngine = createEngine({
  graph,
  entry: "Graph",
  resolvers,
});

export async function server(
  queryDef: TQueryDef,
  variables: TVariables,
): Promise<any> {
  return await graphEngine.run(queryDef, variables);
}
