import * as v from "@valibot/valibot";
import { compose } from "./compose.ts";
import { GET, STRUCTURE } from "./constants.ts";
import { ApiContext } from "./context.ts";
import type { TGraphBase } from "./graph.ts";
import { getStructureMiddleware, getStructureValue } from "./structure.ts";
import type { TRootStructure } from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

export type TBuildFromOperator = (
  context: TBuildResolverContext,
  graph: TGraphBase,
  query: unknown,
) => TMiddleware;

interface TBuildResolverContext {
  rootGraph: TGraphBase;
  rootStructure: TRootStructure;
  operators: Record<string, TBuildFromOperator>;
}

const QueryObjectSchema = v.looseObject({ kind: v.string() });

export function build(
  context: TBuildResolverContext,
  graph: TGraphBase,
  query: unknown,
): TMiddleware {
  return buildFromOperator(context, graph, query);
}

export function buildFromOperator(
  context: TBuildResolverContext,
  graph: TGraphBase,
  query: unknown,
): TMiddleware {
  const queryObject = v.parse(QueryObjectSchema, query);
  const kind = queryObject.kind;
  const builder = context.operators[kind];
  if (!builder) {
    throw new Error(`Unknown operator kind: ${kind}`);
  }
  return builder(context, graph, query);
}

export function buildFromPath(
  context: TBuildResolverContext,
  graph: TGraphBase,
  path: (string | number)[],
): TMiddleware {
  const [prop, ...rest] = path;
  console.log("buildFromPath", prop, rest);
  if (!prop) {
    throw new Error("Path cannot be empty");
  }
  const subGraph = graph[GET](prop);
  const structure = subGraph[STRUCTURE];
  console.log(structure.kind, structure.key);
  const baseMid = getStructureMiddleware(context.rootStructure, structure);
  // TODO, use user middleware
  const mid = compose(baseMid);
  if (rest.length === 0) {
    return mid;
  }
  const subMid = buildFromPath(context, subGraph, rest);
  return async (ctx, next) => {
    const parentRes = await mid(ctx, (ctx) => Promise.resolve(ctx));
    console.log("parentRes", parentRes.value);
    const subValue = getStructureValue(structure, parentRes.value, prop);
    return subMid(
      parentRes.withValue(subValue).with(
        ApiContext.GraphKey.Provider(subGraph),
      ),
      next,
    );
  };
}
