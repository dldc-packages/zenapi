import { PATH, ROOT } from "./constants.ts";
import { ApiContext } from "./context.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { THandler } from "./handlers.ts";
import { DEFAULT_OPERATORS } from "./operators.ts";
import type { TSchemaAny } from "./parse.ts";
import { prepare, type TPrepareFromOperator } from "./prepare.ts";
import type { TAllStructure } from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

export interface TEngine {
  schema: TSchemaAny;
  run: (query: unknown, variables: unknown) => Promise<unknown>;
}

export interface TEngineOptions {
  schema: TSchemaAny;
  handlers: THandler[];
  operators?: TPrepareFromOperator[];
  entry: string;
}

export function createEngine(
  { schema, handlers, operators: userOperators = [], entry }: TEngineOptions,
): TEngine {
  const rootStructure = schema.structure;
  const graph = schema.graph;
  const { getResolvers, getValidators } = validateHandlers(schema, handlers);
  const operators: TPrepareFromOperator[] = [
    ...userOperators,
    ...DEFAULT_OPERATORS,
  ];

  return {
    schema,
    run,
  };

  async function run(query: unknown, variables: unknown): Promise<unknown> {
    if (!Array.isArray(query)) {
      throw new Error("Query must be an array");
    }
    let variableCount = 0;
    const mid = prepare(
      {
        entry,
        rootGraph: graph,
        rootStructure,
        operators,
        getNextVariableIndex: () => variableCount++,
        getResolvers,
        getValidators,
      },
      rootStructure,
      graph,
      query,
    );
    if (!Array.isArray(variables)) {
      throw new Error("Variables must be an array");
    }
    if (variables.length !== variableCount) {
      throw new Error(
        `Expected ${variableCount} variables, but got ${variables.length}`,
      );
    }
    const ctx = ApiContext.create(graph, variables);
    const result = await mid(ctx, (ctx) => Promise.resolve(ctx));
    return result.value;
  }
}

interface THandlersTree {
  middlewares: TMiddleware[];
  children: Map<TAllStructure, THandlersTree>;
}

export type TGetMiddlewares = (graph: TGraphBaseAny) => TMiddleware[];

export interface TGetHandlers {
  getResolvers: TGetMiddlewares;
  getValidators: TGetMiddlewares;
}

function validateHandlers(
  schema: TSchemaAny,
  handlers: THandler[],
): TGetHandlers {
  const resolversTree: THandlersTree = { middlewares: [], children: new Map() };
  const validatorsTree: THandlersTree = {
    middlewares: [],
    children: new Map(),
  };

  for (const { kind, middlewares, path } of handlers) {
    // make sure path come from the schema
    if (path[ROOT] !== schema.structure) {
      throw new Error(`Invalid resolver path, not using the proper schema`);
    }
    const structPath = path[PATH].slice().reverse();
    let current = kind === "resolver" ? resolversTree : validatorsTree;
    for (const struct of structPath) {
      if (!current.children.has(struct)) {
        current.children.set(struct, { middlewares: [], children: new Map() });
      }
      current = current.children.get(struct)!;
    }
    current.middlewares.push(...middlewares);
  }

  return {
    getResolvers: (graph: TGraphBaseAny) => get(resolversTree, graph),
    getValidators: (graph: TGraphBaseAny) => get(validatorsTree, graph),
  };

  function get(tree: THandlersTree, graph: TGraphBaseAny): TMiddleware[] {
    const structPath = graph[PATH].slice().reverse();
    let current: THandlersTree | undefined = tree;
    for (const struct of structPath) {
      if (!current) {
        return [];
      }
      current = current.children.get(struct);
    }
    if (!current) {
      return [];
    }
    return current.middlewares;
  }
}
