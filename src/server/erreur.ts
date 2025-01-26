import { createErreurStore } from "@dldc/erreur";
import type * as v from "@valibot/valibot";
import { STRUCTURE } from "./constants.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TQueryUnknown } from "./prepare.ts";
import type { TStructureKind } from "./structure.types.ts";

/**
 * Those error are likely caused by the query and can be send back to the client.
 */
export type TGraphClientErreurData = {
  kind: "ArgsValidationFailed";
  graph: TGraphBaseAny;
  issues: v.BaseIssue<any>[];
} | {
  kind: "InvalidQuery";
  graph: TGraphBaseAny;
  query: TQueryUnknown;
  expected?: string;
} | {
  kind: "InvalidEntry";
  graph: TGraphBaseAny;
  entry: string;
  requested: string;
} | {
  kind: "InvalidUnionTypeQuery";
  graph: TGraphBaseAny;
  query: TQueryUnknown;
};

const GraphClientErreurPrivate = createErreurStore<TGraphClientErreurData>();
export const GraphClientErreur = GraphClientErreurPrivate.asReadonly;

export function createArgsValidationFailed(
  graph: TGraphBaseAny,
  issues: v.BaseIssue<any>[],
) {
  return GraphClientErreurPrivate.setAndReturn(
    new Error(`Invalid arguments passed to ${graph[STRUCTURE].key}`),
    { graph, kind: "ArgsValidationFailed", issues },
  );
}

export function createInvalidQuery(
  graph: TGraphBaseAny,
  query: TQueryUnknown,
  expected?: string,
) {
  const structure = graph[STRUCTURE];
  return GraphClientErreurPrivate.setAndReturn(
    new Error(
      `Invalid query for ${structure.key}(${structure.kind}), received: ${
        printValue(query)
      }${expected ? `, expected: ${printValue(expected)}` : ""}`,
    ),
    { graph, kind: "InvalidQuery", query, expected },
  );
}

export function createInvalidEntry(
  graph: TGraphBaseAny,
  entry: string,
  requested: string,
) {
  return GraphClientErreurPrivate.setAndReturn(
    new Error(
      `Invalid entry, all queries should start from ${
        printValue(entry)
      } (requested: ${printValue(requested)})`,
    ),
    { graph, kind: "InvalidEntry", entry, requested },
  );
}

export function createInvalidUnionTypeQuery(
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) {
  return GraphClientErreurPrivate.setAndReturn(
    new Error(`Invalid query for Union type at ${graph[STRUCTURE].key}`),
    { graph, kind: "InvalidUnionTypeQuery", query },
  );
}

/**
 * Those error are likely caused by the server implementation.
 * The should not be send back to the client but should be logged.
 */
export type TGraphServerErreurData = {
  kind: "InvalidResolvedValue";
  graph: TGraphBaseAny;
  resolved: any;
  expected: string;
};

const GraphServerErreurPrivate = createErreurStore<TGraphServerErreurData>();
export const GraphServerErreur = GraphServerErreurPrivate.asReadonly;

export function createInvalidResolvedValue(
  graph: TGraphBaseAny,
  resolved: any,
  expected: string,
) {
  return GraphServerErreurPrivate.setAndReturn(
    new Error(
      `Invalid resolved value for ${
        graph[STRUCTURE].key
      } (expected: ${expected}, received: ${printValue(resolved)})`,
    ),
    { graph, kind: "InvalidResolvedValue", resolved, expected },
  );
}

/**
 * Those error are not expected to happen and should be reported as bugs.
 */
export type TGraphInternalErreurData =
  | {
    kind: "InvalidStructure";
    graph: TGraphBaseAny;
    expected: TStructureKind;
    received: TStructureKind;
  }
  | { kind: "CannotPrepareArguments"; graph: TGraphBaseAny }
  | {
    kind: "UnkonwnStructureKind";
    graph: TGraphBaseAny;
    strucrureKind: string;
  };

const GraphInternalErreurPrivate = createErreurStore<
  TGraphInternalErreurData
>();
export const GraphInternalErreur = GraphInternalErreurPrivate.asReadonly;

export function createCannotPrepareArguments(graph: TGraphBaseAny) {
  return GraphInternalErreurPrivate.setAndReturn(
    new Error(`Cannot prepare arguments for ${graph[STRUCTURE].key}`),
    { graph, kind: "CannotPrepareArguments" },
  );
}

export function createInvalidStructure(
  graph: TGraphBaseAny,
  expected: TStructureKind,
  received: TStructureKind,
) {
  return GraphInternalErreurPrivate.setAndReturn(
    new Error(`Invalid structure for ${graph[STRUCTURE].key}`),
    { graph, kind: "InvalidStructure", expected, received },
  );
}

export function createUnknownStructureKind(
  graph: TGraphBaseAny,
  structureKind: string,
) {
  return GraphInternalErreurPrivate.setAndReturn(
    new Error(`Unknown structure kind for ${graph[STRUCTURE].key}`),
    { graph, kind: "UnkonwnStructureKind", strucrureKind: structureKind },
  );
}

function printValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}
