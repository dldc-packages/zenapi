export interface TStructureObjectProperty {
  kind: "property";
  key: string;
  name: string;
  structure: TStructure;
  optional: boolean;
}

export interface TStructureObject {
  kind: "object";
  key: string;
  properties: TStructureObjectProperty[];
}

export interface TStructureRef {
  kind: "ref";
  key: string;
  ref: string;
  params?: TStructure[];
}

export interface TStructureUnion {
  kind: "union";
  key: string;
  types: TStructure[];
}

export interface TStructureLiteral {
  kind: "literal";
  key: string;
  type: string | number | boolean | null;
}

export interface TStructurePrimitive {
  kind: "primitive";
  key: string;
  type: "string" | "number" | "boolean";
}

export interface TStructureArray {
  kind: "array";
  key: string;
  items: TStructure;
}

export type TFunctionArgumentStructure =
  | TStructureObject
  | TStructureRef
  | TStructureUnion
  | TStructurePrimitive
  | TStructureArray
  | TStructureLiteral;

export interface TStructureArguments {
  kind: "arguments";
  key: string;
  arguments: TStructureArgument[];
}

export interface TStructureArgument {
  kind: "argument";
  key: string;
  name: string;
  structure: TFunctionArgumentStructure;
  optional: boolean;
}

export interface TStructureFunction {
  kind: "function";
  key: string;
  arguments: TStructureArguments;
  returns: TStructure;
}

export type TRootStructure = {
  kind: "root";
  key: string;
  types: Record<string, TStructure>;
};

export type TStructure =
  | TStructureObject
  | TStructureRef
  | TStructureUnion
  | TStructureFunction
  | TStructurePrimitive
  | TStructureArray
  | TStructureLiteral;

export type TAllStructure =
  | TStructure
  | TRootStructure
  | TStructureArguments
  | TStructureArgument;

export type TStructureKind = TAllStructure["kind"];
