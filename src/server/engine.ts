import { PATH, ROOT } from "./constants.ts";
import { ApiContext } from "./context.ts";
import type { TGraphBaseAny } from "./graph.ts";
import { DEFAULT_OPERATORS } from "./operators.ts";
import { prepare, type TPrepareFromOperator } from "./prepare.ts";
import type { TResolver } from "./resolver.ts";
import type { TAllStructure, TRootStructure } from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

export type TExtendsContext = (
  ctx: ApiContext,
) => ApiContext | Promise<ApiContext>;

export interface TEngine {
  graph: TGraphBaseAny;
  run: (
    query: unknown,
    variables: unknown,
    extendsCtx?: TExtendsContext,
  ) => Promise<unknown>;
}

export interface TEngineOptions {
  graph: TGraphBaseAny;
  resolvers: TResolver[];
  operators?: TPrepareFromOperator[];
  entry: string;
}

export function createEngine(
  {
    graph,
    resolvers,
    operators: userOperators = [],
    entry,
  }: TEngineOptions,
): TEngine {
  const rootStructure = graph[ROOT];
  const { getResolvers } = validateResolvers(rootStructure, resolvers);
  const operators: TPrepareFromOperator[] = [
    ...userOperators,
    ...DEFAULT_OPERATORS,
  ];

  return {
    graph,
    run,
  };

  async function run(
    query: unknown,
    variables: unknown,
    extendsCtx?: TExtendsContext,
  ): Promise<unknown> {
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
      },
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
    const extendedCtx = extendsCtx ? await extendsCtx(ctx) : ctx;
    const result = await mid(extendedCtx, (ctx) => Promise.resolve(ctx));
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
}

function validateResolvers(
  rootStructure: TRootStructure,
  resolvers: TResolver[],
): TGetHandlers {
  const resolversTree: THandlersTree = { middlewares: [], children: new Map() };

  for (const { middlewares, path: graph } of resolvers) {
    // make sure path come from the schema
    if (graph[ROOT] !== rootStructure) {
      throw new Error(`Invalid resolver path, not using the proper schema`);
    }
    const structPath = graph[PATH].slice().reverse();
    let current = resolversTree;
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
  };

  function get(tree: THandlersTree, graph: TGraphBaseAny): TMiddleware[] {
    const structPath = graph[PATH].slice().reverse();
    const middlewares: TMiddleware[] = [];
    let current: THandlersTree | undefined = tree;
    for (const struct of structPath) {
      if (!current) {
        return middlewares;
      }
      middlewares.push(...current.middlewares);
      current = current.children.get(struct);
    }
    if (current) {
      middlewares.push(...current.middlewares);
    }
    return middlewares;
  }
}

// function debugHandlerTree(tree: THandlersTree, level = 0) {
//   console.info("  ".repeat(level), `middlewares: ${tree.middlewares.length}`);
//   for (const [struct, child] of tree.children) {
//     console.info("  ".repeat(level), struct.key);
//     debugHandlerTree(child, level + 1);
//   }
// }
