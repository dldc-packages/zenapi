import * as v from "@valibot/valibot";
import { GET, REF, STRUCTURE } from "./constants.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TPrepareContext } from "./prepare.ts";
import type { TStructureKind } from "./structure.types.ts";

export type TStructureGetSchema = (
  context: TPrepareContext,
  graph: TGraphBaseAny,
) => v.BaseSchema<any, any, any>;

type TByStructureKind = {
  [K in TStructureKind]: TStructureGetSchema;
};

function objectLikeSchema(
  context: TPrepareContext,
  graph: TGraphBaseAny,
) {
  const structure = graph[STRUCTURE];
  if (structure.kind !== "interface" && structure.kind !== "object") {
    throw new Error("Invalid structure kind");
  }
  const properties = structure.properties.map(
    ({ name, optional }) => {
      const subGraph = graph[GET](name);
      const propSchema = getStructureSchema(context, subGraph);
      return [
        name,
        optional ? v.optional(propSchema) : propSchema,
      ] as const;
    },
  );
  return v.strictObject(Object.fromEntries(properties));
}

const SCHEMA_BY_STRUCTURE: TByStructureKind = {
  root: () => {
    throw new Error("Root schema should not be called");
  },
  alias: (context, graph) => {
    return getStructureSchema(context, graph[GET](REF));
  },
  ref: (context, graph) => {
    return getStructureSchema(context, graph[GET](REF));
  },
  interface: objectLikeSchema,
  object: objectLikeSchema,
  array: (context, graph) => {
    const itemSchema = getStructureSchema(context, graph[GET]("items"));
    return v.array(itemSchema);
  },
  primitive: (_context, graph) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "primitive") {
      throw new Error("Invalid structure kind");
    }
    switch (structure.type) {
      case "string":
        return v.string();
      case "number":
        return v.number();
      case "boolean":
        return v.boolean();
    }
  },
  literal: (_context, graph) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "literal") {
      throw new Error("Invalid structure kind");
    }
    if (structure.type === null) {
      return v.null_();
    }
    return v.literal(structure.type);
  },
  nullable: (context, graph) => {
    const subSchema = getStructureSchema(context, graph[GET](REF));
    return v.optional(subSchema);
  },
  union: (context, graph) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "union") {
      throw new Error("Invalid structure kind");
    }
    const unionSchema = structure.types.map((unionItem) => {
      const unionGraph = graph[GET](unionItem);
      return getStructureSchema(context, unionGraph);
    });
    return v.union(unionSchema);
  },
  function: () => {
    throw new Error("Cannot get schema of function");
  },
  arguments: (context, graph) => {
    const structure = graph[STRUCTURE];
    if (structure.kind !== "arguments") {
      throw new Error("Invalid structure kind");
    }
    const argsSchema = structure.arguments.map((arg) => {
      const argGraph = graph[GET](arg.name);
      const argSchema = getStructureSchema(context, argGraph);
      return arg.optional ? v.optional(argSchema) : argSchema;
    });
    return v.tuple(argsSchema);
  },
};

export function getStructureSchema(
  context: TPrepareContext,
  graph: TGraphBaseAny,
): v.BaseSchema<any, any, any> {
  const structure = graph[STRUCTURE];
  return SCHEMA_BY_STRUCTURE[structure.kind](context, graph);
}
