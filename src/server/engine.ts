import * as v from "@valibot/valibot";
import type { TSchemaAny } from "./parseSchema.ts";
import { type TNormalizedPath } from "./path.ts";
import type { TResolver } from "./resolver.ts";
import { DEFAULT_TRANSFORMS } from "./transforms.ts";
import type { TMiddleware, TTRansformResolver } from "./types.ts";

export interface TEngine {
  schema: TSchemaAny;
  run: (query: unknown) => unknown;
}

export interface TEngineOptions {
  schema: TSchemaAny;
  resolvers: TResolver[];
  transforms?: Record<string, TTRansformResolver>;
}

export function createEngine(
  { schema, resolvers, transforms: userTransforms = {} }: TEngineOptions,
): TEngine {
  // const resolversResolved = validateSchema(schema, resolvers);
  const transforms: Record<string, TTRansformResolver> = {
    ...DEFAULT_TRANSFORMS,
    ...userTransforms,
  };

  return {
    schema,
    run,
  };

  function run(query: unknown): unknown {
    throw new Error("Not implemented");
    // const ctx = ApiContext.create();

    // const queryObject = v.parse(QueryObjectSchema, query);
    // const kind = queryObject.kind;
    // const transform = transforms?.[kind];
    // if (!transform) {
    //   throw new Error(`Unknown query kind: ${kind}`);
    // }
    // return transform(query);
  }
}

const QueryObjectSchema = v.looseObject({ kind: v.string() });

interface TResolvedResolver {
  path: TNormalizedPath;
  middlewares: TMiddleware[];
}

/**
 * For each resolver, make sure it matches the parsed schema.
 * Build a tree of resolver for a given graphRef
 */
// function validateSchema(
//   schema: TSchemaAny,
//   resolvers: TResolver[],
// ): TResolvedResolver[] {
//   const rootStructure = schema[SCHEMA_STRUCTURE];

//   const resolversResolved = resolvers.map(({ ref, middlewares }) => {
//     const { path, schema: resolverSchema } = unwrapSchemaRef(ref);
//     if (resolverSchema !== schema) {
//       throw new Error(
//         `Resolver for ${path.join(".")} is linked to a different schema.`,
//       );
//     }
//     const normalizedPath = normalizePath(schema, rootStructure, path);
//     return { path: normalizedPath, middlewares };
//   });

//   return resolversResolved;
// }

// type TTranverseFn<K extends TStructureKind> = (
//   structure: Extract<TAllStructure, { kind: K }>,
//   prop: string | number,
// ) => TAllStructure;

// const TRAVERSE_BY_KIND: { [K in TAllStructure["kind"]]: TTranverseFn<K> } = {
//   root: (structure, prop) => {
//     const subStructure = structure.types[prop];
//     if (!subStructure) {
//       throw new Error(`Invalid path: ${prop} not found at root`);
//     }
//     return subStructure;
//   },
//   array: (structure, prop) => {
//     throw new Error("Not Implemented");
//   },
//   object: (structure, prop) => {
//     const foundProp = structure.properties.find((p) => p.name === prop);
//     if (!foundProp) {
//       throw new Error(`Invalid path: ${prop} not found in ???`);
//     }
//     return foundProp.structure;
//   },
//   ref: (structure, prop) => {
//     const subStructure = rootStructure.types[structure.ref];
//     return traverse(subStructure, {
//       refs,
//       prop,
//       isRoot: false,
//       rootStructure,
//       schema,
//     });
//   },
//   union: (structure, prop) => {
//     throw new Error("Not Implemented");
//     return { structure, refs };
//   },
//   primitive: (structure, prop) => {
//     throw new Error("Not Implemented");
//     return { structure, refs };
//   },
//   function: (structure, prop) => {
//     throw new Error("Not Implemented");
//     return { structure, refs };
//   },
// };

// export function traverse(
//   structure: TAllStructure,
//   prop: string | number,
// ): TAllStructure {
//   return TRAVERSE_BY_KIND[structure.kind](structure as any, prop);
// }
