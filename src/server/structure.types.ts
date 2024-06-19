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

export interface TStructurePrimitive {
  kind: "primitive";
  key: string;
  type: "string" | "number" | "boolean" | "null" | "undefined";
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
  | TStructureArray;

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
  | TStructureArray;

export type TAllStructure =
  | TStructure
  | TRootStructure
  | TStructureArguments
  | TStructureArgument;

export type TStructureKind = TAllStructure["kind"];
