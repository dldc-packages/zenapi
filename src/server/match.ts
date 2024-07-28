import { GET, REF, STRUCTURE } from "./constants.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TAllStructure, TStructureKind } from "./structure.types.ts";

/** */
export function matchUnionType(
  unionGraph: TGraphBaseAny,
  value: unknown,
  withType: TGraphBaseAny | null,
): TGraphBaseAny {
  if (withType) {
    try {
      const subGraph = unionGraph._(withType);
      return subGraph;
    } catch (_error) {
      throw new Error(
        `Invalid withType for union ${unionGraph[STRUCTURE].key}`,
      );
    }
  }
  const structure = unionGraph[STRUCTURE];
  if (structure.kind !== "union") {
    throw new Error("Invalid structure kind");
  }
  // try to match value
  const matchTypes = structure.types.filter((type) =>
    matchValue(unionGraph[GET](type), value)
  );
  if (matchTypes.length > 1) {
    throw new Error(
      `Ambiguous match for union ${structure.key}, use ctx.withValueType to specify the type`,
    );
  }
  if (matchTypes.length === 0) {
    throw new Error(
      `No match for union ${structure.key}, use ctx.withValueType to specify the type`,
    );
  }
  return unionGraph[GET](matchTypes[0]);
}

function matchValue(
  graph: TGraphBaseAny,
  value: unknown,
): boolean {
  const structure = graph[STRUCTURE];
  return MATCH_VALUE_BY_STRUCTURE[structure.kind](
    graph,
    structure as any,
    value,
  );
}

export type TStructureGetSchema<S extends TAllStructure> = (
  graph: TGraphBaseAny,
  stucture: S,
  value: unknown,
) => boolean;

type TMatchValueByStructureKind = {
  [K in TStructureKind]: TStructureGetSchema<
    Extract<TAllStructure, { kind: K }>
  >;
};

const MATCH_VALUE_BY_STRUCTURE: TMatchValueByStructureKind = {
  literal: (_graph, structure, value) => {
    return structure.type === value;
  },
  primitive: (_graph, structure, value) => {
    // deno-lint-ignore valid-typeof
    return typeof value === structure.type;
  },
  nullable: (graph, _structure, value) => {
    const subGraph = graph[GET](REF);
    return value === null || matchValue(subGraph, value);
  },
  array: (graph, _structure, value) => {
    if (!Array.isArray(value)) {
      return false;
    }
    const subGraph = graph[GET](REF);
    return value.every((item) => matchValue(subGraph, item));
  },
  function: (_structure, _value) => {
    throw new Error("Cannot match value of function");
  },
  object: (graph, structure, value) => {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const keys = Object.keys(value);
    return structure.properties.every((prop) => {
      if (!keys.includes(prop.name)) {
        // only check properties that are present in the value
        return true;
      }
      const subGraph = graph[GET](prop.name);
      return matchValue(subGraph, (value as any)[prop.name]);
    });
  },
  union: (graph, structure, value) => {
    return structure.types.some((type) => matchValue(graph[GET](type), value));
  },
  alias: (graph, _structure, value) => {
    const subGraph = graph[GET](REF);
    return matchValue(subGraph, value);
  },
  arguments: (_structure, _value) => {
    throw new Error("Cannot match value of arguments");
  },
  ref: (graph, _structure, value) => {
    return matchValue(graph[GET](REF), value);
  },
  interface: (graph, structure, value) => {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const keys = Object.keys(value);
    return structure.properties.every((prop) => {
      if (!keys.includes(prop.name)) {
        // only check properties that are present in the value
        return true;
      }
      const subGraph = graph[GET](prop.name);
      return matchValue(subGraph, (value as any)[prop.name]);
    });
  },
  root: (_graph, _structure, _value) => {
    throw new Error("Cannot match value of root");
  },
  builtin: (graph, structure, value) => {
    return structure.match(graph, structure, value);
  },
};
