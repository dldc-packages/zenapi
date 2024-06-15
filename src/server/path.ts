import type { TAllStructure } from "./structure.ts";
import type { TGraphRefBase } from "./types.ts";

export type TNormalizedPath = symbol[];

export type TPathCache = WeakMap<
  symbol,
  { ref: TGraphRefBase; structure: TAllStructure }
>;

// export function normalizePath(
//   cache: TPathCache,
//   schema: TSchemaAny,
//   rootStructure: TRootStructure,
//   path: TGraphPath,
// ): TNormalizedPath {
//   const normalized: TNormalizedPath = [];
//   const rootRef = schema.ref as TGraphRefBase;
//   let current: TGraphRefBase = rootRef;
//   let structure: TAllStructure = rootStructure;
//   while (path.length > 0) {
//     const item = path.shift()!;
//     const isRoot = current[GRAPH_KEY] === rootRef[GRAPH_KEY];
//     if (item === ROOT) {
//       if (isRoot) {
//         // Root while already at root, should we just skip?
//         throw new Error(`Invalid path`);
//       }
//       normalized.push(current[GRAPH_KEY]);
//       current = rootRef;
//       structure = rootStructure;
//       continue;
//     }
//     if (structure.kind === "root") {
//       if (!isRoot) {
//         throw new Error(`Invalid path`);
//       }
//       const subStructure: TStructure = structure.types[item];
//       if (!subStructure) {
//         throw new Error(`Invalid path: ${item} not found at root`);
//       }
//       structure = subStructure;
//       current = current[GET](item);
//       continue;
//     }
//     if (isRoot) {
//       throw new Error(`Invalid path`);
//     }
//     if (structure.kind === "object") {
//       const foundProp: TStructureObjectProperty | undefined = structure
//         .properties.find((p) => p.name === item);
//       if (!foundProp) {
//         throw new Error(`Invalid path: ${item} not found in ???`);
//       }
//       structure = foundProp.structure;
//       current = current[GET](item);
//       continue;
//     }
//     if (structure.kind === "ref") {
//       path.unshift(ROOT, structure.ref, item);
//       structure = rootStructure;
//       continue;
//     }
//     throw new Error(`Not implemented ${structure.kind}`);
//   }

//   if (current[GRAPH_KEY] !== rootRef[GRAPH_KEY]) {
//     normalized.push(current[GRAPH_KEY]);
//   }

//   return normalized;
// }
