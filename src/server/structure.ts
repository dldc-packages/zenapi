export interface TStructureObjectProperty {
  name: string;
  structure: TStructure;
  optional: boolean;
}

export interface TStructureObject {
  kind: "object";
  properties: TStructureObjectProperty[];
}

export interface TStructureRef {
  kind: "ref";
  ref: string;
  params?: TStructure[];
}

export interface TStructureUnion {
  kind: "union";
  types: TStructure[];
}

export interface TStructurePrimitive {
  kind: "primitive";
  type: "string" | "number" | "boolean" | "null" | "undefined";
}

export interface TStructureArray {
  kind: "array";
  items: TStructure;
}

export type TFunctionArgumentStructure =
  | TStructureObject
  | TStructureRef
  | TStructureUnion
  | TStructurePrimitive
  | TStructureArray;

export interface TStructureFunctionArgument {
  name: string;
  structure: TFunctionArgumentStructure;
  optional: boolean;
}

export interface TStructureFunction {
  kind: "function";
  arguments: TStructureFunctionArgument[];
  returns: TStructure;
}

export type TRootStructure = {
  kind: "root";
  types: Record<string, TStructure>;
};

export type TStructure =
  | TStructureObject
  | TStructureRef
  | TStructureUnion
  | TStructureFunction
  | TStructurePrimitive
  | TStructureArray;

export type TAllStructure = TStructure | TRootStructure;

export type TStructureKind = TAllStructure["kind"];
