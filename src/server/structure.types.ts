export interface TStructureObjectProperty {
  name: string;
  structure: TStructure;
  optional: boolean;
}

export interface TStructureInterface {
  kind: "interface";
  key: string;
  name: string;
  properties: TStructureObjectProperty[];
  parameters: string[];
}

export interface TStructureAlias {
  kind: "alias";
  key: string;
  name: string;
  parameters: string[];
  type: TStructure;
}

export type TTopLevelStructure = TStructureInterface | TStructureAlias;

export interface TStructureObject {
  kind: "object";
  key: string;
  properties: TStructureObjectProperty[];
}

export interface TStructureRef {
  kind: "ref";
  key: string;
  ref: string;
  params: TStructure[];
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

export interface TStructureNullable {
  kind: "nullable";
  key: string;
  type: TStructure;
}

export type TFunctionArgumentStructure =
  | TStructureObject
  | TStructureRef
  | TStructureUnion
  | TStructurePrimitive
  | TStructureArray
  | TStructureLiteral
  | TStructureNullable;

export interface TStructureArguments {
  kind: "arguments";
  key: string;
  arguments: TStructureArgumentItem[];
}

export interface TStructureArgumentItem {
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
  types: TTopLevelStructure[];
};

export type TStructure =
  | TStructureObject
  | TStructureRef
  | TStructureUnion
  | TStructureFunction
  | TStructurePrimitive
  | TStructureArray
  | TStructureLiteral
  | TStructureNullable
  | TStructureInterface
  | TStructureAlias;

export type TAllStructure =
  | TStructure
  | TRootStructure
  | TStructureArguments;

export type TStructureKind = TAllStructure["kind"];
