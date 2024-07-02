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
  getNextVariableIndex: () => number;
  rootGraph: TGraphBaseAny;
  rootStructure: TRootStructure;
  operators: TPrepareFromOperator[];
  getResolvers: TGetMiddlewares;
  getValidators: TGetMiddlewares;
}

export function prepare(
  context: TPrepareContext,
  structure: TAllStructure,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
): TMiddleware {
  // try each operator first
  for (const operator of context.operators) {
    const mid = operator(context, structure, graph, query);
    if (mid) {
      return mid;
    }
  }
  // if no operator matches, prepare structure
  return prepareStructure(context, structure, graph, query);
}
