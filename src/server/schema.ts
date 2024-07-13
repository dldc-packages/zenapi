import * as v from "@valibot/valibot";
import { resolveRef } from "./getGraphProp.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TPrepareContext, TQueryUnknown } from "./prepare.ts";
import type { TAllStructure, TStructureKind } from "./structure.types.ts";
import type { TMiddleware } from "./types.ts";

export type TStructureGetSchema<TStruct extends TAllStructure> = (
  context: TPrepareContext,
  structure: TStruct,
) => v.BaseSchema<any, any, any>;

export type TPrepareStructure = (
  context: TPrepareContext,
  graph: TGraphBaseAny,
  query: TQueryUnknown,
) => TMiddleware | null;

type TByStructureKind = {
  [K in TStructureKind]: TStructureGetSchema<
    Extract<TAllStructure, { kind: K }>
  >;
};

const SCHEMA_BY_STRUCTURE: TByStructureKind = {
  root: () => {
    throw new Error("Root schema should not be called");
  },
  ref: (context, structure) => {
    const refStructure = resolveRef(context.rootStructure, structure);
    return getStructureSchema(context, refStructure);
  },
  object: (context, structure) => {
    const properties = structure.properties.map(
      ({ name, optional, structure }) => {
        const propSchema = getStructureSchema(context, structure);
        return [
          name,
          optional ? v.optional(propSchema) : propSchema,
        ] as const;
      },
    );
    return v.strictObject(Object.fromEntries(properties));
  },
  array: (context, structure) => {
    const itemSchema = getStructureSchema(context, structure.items);
    return v.array(itemSchema);
  },
  primitive: (_context, structure) => {
    switch (structure.type) {
      case "string":
        return v.string();
      case "number":
        return v.number();
      case "boolean":
        return v.boolean();
    }
  },
  literal: (_context, structure) => {
    if (structure.type === null) {
      return v.null_();
    }
    return v.literal(structure.type);
  },
  nullable: (context, structure) => {
    const subSchema = getStructureSchema(context, structure.type);
    return v.optional(subSchema);
  },
  union: () => {
    throw new Error("Union not implemented");
  },
  function: () => {
    throw new Error("Cannot get schema of function");
  },
  arguments: (context, structure) => {
    const argsSchema = structure.arguments.map((arg) => {
      const argSchema = getStructureSchema(context, arg.structure);
      return arg.optional ? v.optional(argSchema) : argSchema;
    });
    return v.tuple(argsSchema);
  },
};

export function getStructureSchema(
  context: TPrepareContext,
  structure: TAllStructure,
): v.BaseSchema<any, any, any> {
  return SCHEMA_BY_STRUCTURE[structure.kind](context, structure as any);
}
