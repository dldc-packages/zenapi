import { build, type TBuildFromOperator } from "./build.ts";
import { ROOT } from "./constants.ts";
import { ApiContext } from "./context.ts";
import { DEFAULT_OPERATORS } from "./operators.ts";
import type { TSchemaAny } from "./parse.ts";
import type { TResolver } from "./resolver.ts";

export interface TEngine {
  schema: TSchemaAny;
  run: (query: unknown) => unknown;
}

export interface TEngineOptions {
  schema: TSchemaAny;
  resolvers: TResolver[];
  operators?: Record<string, TBuildFromOperator>;
  entry: string;
}

export function createEngine(
  { schema, resolvers, operators: userOperators = {}, entry }: TEngineOptions,
): TEngine {
  const rootStructure = schema.structure;
  const graph = schema.graph;
  const resolversResolved = validateResolvers(schema, resolvers);
  const operators: Record<string, TBuildFromOperator> = {
    ...DEFAULT_OPERATORS,
    ...userOperators,
  };

  return {
    schema,
    run,
  };

  async function run(query: unknown): Promise<unknown> {
    const mid = build(
      { rootGraph: graph, rootStructure, operators },
      graph,
      query,
    );
    const ctx = ApiContext.create(graph);
    console.log("====================");
    const result = await mid(ctx, (ctx) => Promise.resolve(ctx));

    return result.value;

    // const qr = queryReader(query);
    // const ctx = ApiContext.create(rootGraph, qr);

    // const queryObject = v.parse(QueryObjectSchema, query);
    // const kind = queryObject.kind;
    // const transform = transforms?.[kind];
    // if (!transform) {
    //   throw new Error(`Unknown query kind: ${kind}`);
    // }
    // return transform(ctx, qr);
  }

  // function validate(
  //   structure: TAllStructure,
  //   query: unknown,
  // ): TResolveQuery {
  //   const queryObject = v.parse(QueryObjectSchema, query);
  //   const kind = queryObject.kind;
  //   const operatorValidator = operators[kind];
  //   if (!operatorValidator) {
  //     throw new Error(`Unknown operator kind: ${kind}`);
  //   }
  //   return operatorValidator(structure, query, validate);
  // }
}

function validateResolvers(
  schema: TSchemaAny,
  resolvers: TResolver[],
): unknown {
  for (const { path } of resolvers) {
    // make sure path come from the schema
    if (path[ROOT] !== schema.structure) {
      throw new Error(`Invalid resolver path, not using the proper schema`);
    }
  }
  return {} as any;
}
