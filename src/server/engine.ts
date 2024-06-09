import { SCHEMA_STRUCTURE } from "./constants.ts";
import { normalizePath, type TNormalizedPath } from "./normalizePath.ts";
import type { TSchemaAny } from "./parseSchema.ts";
import type { TResolver } from "./resolver.ts";
import { unwrapSchemaRef } from "./schemaRef.ts";
import type { TMiddleware } from "./types.ts";

export interface TEngine {
  schema: TSchemaAny;
  run: (query: unknown) => unknown;
}

export interface TEngineOptions {
  schema: TSchemaAny;
  resolvers: TResolver[];
}

export function createEngine(
  { schema, resolvers }: TEngineOptions,
): TEngine {
  const resolversResolved = validateSchema(schema, resolvers);

  return {
    schema,
    run,
  };

  function run(query: unknown): unknown {
    throw new Error("Not Implemented");
  }
}

interface TResolvedResolver {
  path: TNormalizedPath;
  middlewares: TMiddleware[];
}

/**
 * For each resolver, make sure it matches the parsed schema.
 * Build a tree of resolver for a given graphRef
 */
function validateSchema(
  schema: TSchemaAny,
  resolvers: TResolver[],
): TResolvedResolver[] {
  const rootStructure = schema[SCHEMA_STRUCTURE];

  const resolversResolved = resolvers.map(({ ref, middlewares }) => {
    const { path, schema: resolverSchema } = unwrapSchemaRef(ref);
    if (resolverSchema !== schema) {
      throw new Error(
        `Resolver for ${path.join(".")} is linked to a different schema.`,
      );
    }
    const normalizedPath = normalizePath(schema, rootStructure, path);
    return { path: normalizedPath, middlewares };
  });

  return resolversResolved;
}

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
