import type { TGetMiddlewares } from "./engine.ts";
import type { TGraphBaseAny } from "./graph.ts";
import { prepareStructure } from "./structure.ts";
import type { TAllStructure, TRootStructure } from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

export type TQueryUnknown = unknown[];

// Return null if query is not valid
export type TPrepareFromOperator = (
  context: TPrepareContext,
  structure: TAllStructure,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) => TMiddleware | null;

export interface TPrepareContext {
  entry: string;
  rootGraph: TGraphBaseAny;
  rootStructure: TRootStructure;
  operators: TPrepareFromOperator[];
  getNextVariableIndex: () => number;
  getResolvers: TGetMiddlewares;
  getValidators: TGetMiddlewares;
}

export function prepare(
  context: TPrepareContext,
  structure: TAllStructure,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
): TMiddleware {
  const prepared = prepareStructure(context, structure, graph, query);
  if (prepared) {
    return prepared;
  }
  // try each operator first
  for (const operator of context.operators) {
    const mid = operator(context, structure, graph, query);
    if (mid) {
      return mid;
    }
  }
  throw new Error(`Unsupported query: ${JSON.stringify(query)}`);
}
