import * as v from "@valibot/valibot";
import { resolveRef } from "./getGraphProp.ts";
import type { TGraphBaseAny } from "./graph.ts";
import type { TPrepareContext, TQueryUnknown } from "./prepare.ts";
import type {
  TAllStructure,
  TStructureInterface,
  TStructureKind,
  TStructureObject,
} from "./structure.types.ts";
import type { TMiddleware, TParamsContext } from "./types.ts";

export type TStructureGetSchema<TStruct extends TAllStructure> = (
  context: TPrepareContext,
  params: TParamsContext,
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

function objectLikeSchema(
  context: TPrepareContext,
  params: TParamsContext,
  structure: TStructureInterface | TStructureObject,
) {
  const properties = structure.properties.map(
    ({ name, optional, structure }) => {
      const propSchema = getStructureSchema(context, params, structure);
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
  alias: (context, params, structure) => {
    return getStructureSchema(context, params, structure.type);
  },
  ref: (context, params, structure) => {
    const { structure: refStructure, localTypes } = resolveRef(
      context.rootStructure,
      params.localTypes,
      structure,
    );
    const nextParams: TParamsContext = { ...params, localTypes };
    return getStructureSchema(context, nextParams, refStructure);
  },
  interface: objectLikeSchema,
  object: objectLikeSchema,
  array: (context, params, structure) => {
    const itemSchema = getStructureSchema(context, params, structure.items);
    return v.array(itemSchema);
  },
  primitive: (_context, _params, structure) => {
    switch (structure.type) {
      case "string":
        return v.string();
      case "number":
        return v.number();
      case "boolean":
        return v.boolean();
    }
  },
  literal: (_context, _localTypes, structure) => {
    if (structure.type === null) {
      return v.null_();
    }
    return v.literal(structure.type);
  },
  nullable: (context, localTypes, structure) => {
    const subSchema = getStructureSchema(context, localTypes, structure.type);
    return v.optional(subSchema);
  },
  union: () => {
    throw new Error("Union not implemented");
  },
  function: () => {
    throw new Error("Cannot get schema of function");
  },
  arguments: (context, localTypes, structure) => {
    const argsSchema = structure.arguments.map((arg) => {
      const argSchema = getStructureSchema(context, localTypes, arg.structure);
      return arg.optional ? v.optional(argSchema) : argSchema;
    });
    return v.tuple(argsSchema);
  },
};

export function getStructureSchema(
  context: TPrepareContext,
  params: TParamsContext,
  structure: TAllStructure,
): v.BaseSchema<any, any, any> {
  return SCHEMA_BY_STRUCTURE[structure.kind](context, params, structure as any);
}
