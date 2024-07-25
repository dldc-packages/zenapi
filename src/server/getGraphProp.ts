import type { TTopLevelStructure } from "../../server.ts";
import { pushTail, replaceTail } from "../utils/tail.ts";
import { GET, REF, STRUCTURE } from "./constants.ts";
import { graphInternal, type TGraphBaseAny, type TGraphGet } from "./graph.ts";
import type {
  TAllStructure,
  TRootStructure,
  TStructure,
  TStructureKind,
  TStructureObjectProperty,
  TStructureRef,
} from "./structure.types.ts";
import type { TLocalTypes } from "./types.ts";

export interface TStructureGetPropParams<TStruct extends TAllStructure> {
  rootStructure: TRootStructure;
  get: TGraphGet;
  localTypes: TLocalTypes;
  path: TAllStructure[];
  structure: TStruct;
  prop: string | number | symbol | TAllStructure;
}

// Receive the last structure of the path, return the next tail
export type TStructureGetProp<TStruct extends TAllStructure> = (
  params: TStructureGetPropParams<TStruct>,
) => TGraphBaseAny;

type TGetPropByStructureKind = {
  [K in TStructureKind]: TStructureGetProp<Extract<TAllStructure, { kind: K }>>;
};

const GET_STRUCTURE_PROP: TGetPropByStructureKind = {
  root: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const item = structure.types.find((t) => t.name === prop);
    if (!item) {
      throw new Error(`Invalid path: "${prop}" not found at root`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [item]),
    });
  },
  ref: ({ rootStructure, get, localTypes, structure, prop, path }) => {
    const resolved = resolveRef(
      rootStructure,
      path,
      localTypes,
      structure,
    );
    const resolvedStructure = resolved[STRUCTURE];
    if (resolvedStructure === structure) {
      throw new Error("Ref resolution failed");
    }
    if (prop === REF) {
      return resolved;
    }
    if (typeof prop === "object") {
      if (prop !== resolvedStructure) {
        throw new Error(
          `Invalid path: expected ${structure.key} but got ${resolvedStructure.key}`,
        );
      }
      return resolved;
    }
    // otherwise, get prop from resolved
    const sub = get(REF);
    return sub[GET](prop);
  },
  interface: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [foundProp.structure]),
    });
  },
  alias: ({ rootStructure, localTypes, path, structure, prop, get }) => {
    if (prop === REF) {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.type]),
      });
    }
    return get(REF)[GET](prop);
  },
  object: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp: TStructureObjectProperty | undefined = structure
      .properties.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [foundProp.structure]),
    });
  },
  array: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (prop === REF || prop === "items") {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.items]),
      });
    }
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    throw new Error(`Invalid path: ${prop} not found in array`);
  },
  primitive: () => {
    throw new Error("Primitive has no properties");
  },
  literal: () => {
    throw new Error("Literal has no properties");
  },
  nullable: ({ rootStructure, get, localTypes, path, structure, prop }) => {
    if (prop === REF) {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.type]),
      });
    }
    if (typeof prop !== "string") {
      throw new Error(
        `Invalid path: expected string received ${String(prop)}`,
      );
    }
    const sub = get(REF);
    return sub[GET](prop);
  },
  union: ({ rootStructure, localTypes, structure, prop, path }) => {
    if (typeof prop !== "object") {
      throw new Error("Invalid path: expected object");
    }
    // Prop is expected to be one of the union item or a resolved ref
    for (const unionItem of structure.types) {
      if (unionItem === prop) {
        return graphInternal({
          rootStructure,
          localTypes,
          path: pushTail(path, unionItem),
        });
      }
      if (unionItem.kind === "ref") {
        const resolved = resolveRef(rootStructure, path, localTypes, unionItem);
        if (resolved[STRUCTURE] === prop) {
          return resolved;
        }
      }
    }
    throw new Error(`Invalid path: ${prop.kind} is not a valid union type`);
  },
  function: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    if (prop === "return") {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.returns]),
      });
    }
    if (prop === "arguments") {
      return graphInternal({
        rootStructure,
        localTypes,
        path: replaceTail(path, [structure.arguments]),
      });
    }
    throw new Error(`Invalid path: ${prop} not found in function`);
  },
  arguments: ({ rootStructure, localTypes, path, structure, prop }) => {
    if (typeof prop !== "string") {
      throw new Error("Invalid path: expected string");
    }
    const foundProp = structure.arguments.find((p) => p.name === prop);
    if (!foundProp) {
      throw new Error(`Invalid path: ${prop} not found in ${structure.key}`);
    }
    return graphInternal({
      rootStructure,
      localTypes,
      path: replaceTail(path, [foundProp.structure]),
    });
  },
};

export function getStructureProp(
  params: TStructureGetPropParams<TAllStructure>,
): TGraphBaseAny {
  return GET_STRUCTURE_PROP[params.structure.kind](params as any);
}

export interface TResolvedRef {
  structure: TAllStructure;
  localTypes: TLocalTypes;
}

function resolveRef(
  rootStructure: TRootStructure,
  path: TAllStructure[],
  localTypes: TLocalTypes,
  structure: TStructureRef,
): TGraphBaseAny {
  const resolvedStructure = resolveRefStructure(
    rootStructure,
    localTypes,
    structure,
  );
  if (resolvedStructure.kind === "root") {
    // If the ref point to a top level structure, it's an alias or a type
    // We need to map type parameters
    const nextLocalTypes: TLocalTypes = {};
    resolvedStructure.structure.parameters.forEach((name, index) => {
      const param = structure.params[index];
      if (param.kind !== "ref") {
        nextLocalTypes[name] = param;
        return;
      }
      // resolve ref
      const resolvedParams = resolveRefStructure(
        rootStructure,
        localTypes,
        param,
      );
      nextLocalTypes[name] = resolvedParams.kind === "root"
        ? resolvedParams.structure
        : resolvedParams.structure;
    });
    return graphInternal({
      rootStructure,
      localTypes: nextLocalTypes,
      path: pushTail(path, resolvedStructure.structure),
    });
  }
  // Otherwise, it's a local type, we simply push the resolved type
  return graphInternal({
    rootStructure,
    localTypes,
    path: pushTail(path, resolvedStructure.structure),
  });
  // if (
  //   resolvedStructure.kind !== "alias" && resolvedStructure.kind !== "interface"
  // ) {
  //   return graphInternal({
  //     rootStructure,
  //     localTypes: {},
  //     path: pushTail(path, resolvedStructure),
  //   });
  // }

  // // Resolve local types
  // if (structure.params.length !== resolvedStructure.parameters.length) {
  //   throw new Error(
  //     `Invalid number of parameters: expected ${resolvedStructure.parameters.length} but got ${structure.params.length}`,
  //   );
  // }

  // return graphInternal({
  //   rootStructure,
  //   localTypes: nextLocalTypes,
  //   path: pushTail(path, resolvedStructure),
  // });
}

export type TResolvedRefStructure =
  | { kind: "local"; structure: TStructure }
  | { kind: "root"; structure: TTopLevelStructure };

function resolveRefStructure(
  rootStructure: TRootStructure,
  localTypes: TLocalTypes,
  structure: TStructureRef,
): TResolvedRefStructure {
  const localStructure = localTypes[structure.ref];
  if (localStructure) {
    return { kind: "local", structure: localStructure };
  }
  const refStructure = rootStructure.types.find((t) =>
    t.name === structure.ref
  );
  if (!refStructure) {
    throw new Error(`Invalid ref "${structure.ref}"`);
  }
  return { kind: "root", structure: refStructure };
}
