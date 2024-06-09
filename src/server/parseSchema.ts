import type {
  FunctionTypeNode,
  InterfaceDeclaration,
  TypeLiteralNode,
  TypeReferenceNode,
  UnionTypeNode,
} from "ts_morph";
import { Node, Project, ResolutionHosts, SyntaxKind } from "ts_morph";
import type { TTypesBase } from "../utils/types.ts";
import { SCHEMA_STRUCTURE } from "./constants.ts";
import { schemaRef } from "./schemaRef.ts";
import type {
  TFunctionArgumentStructure,
  TRootStructure,
  TStructure,
  TStructureFunctionArgument,
  TStructureObject,
  TStructureObjectProperty,
} from "./structure.ts";
import type { TGraphRefOf } from "./types.ts";

export interface TSchema<Types extends TTypesBase> {
  ref: TGraphRefOf<Types>;
  [SCHEMA_STRUCTURE]: TRootStructure;
}

export type TSchemaAny = TSchema<any>;

/**
 * Pass the path to the schema file as well as the the types to be used in the schema.
 */
export function parseSchema<Types extends TTypesBase>(
  schemaPath: string,
): TSchema<Types> {
  const project = new Project({
    resolutionHost: ResolutionHosts.deno,
  });

  project.addSourceFilesAtPaths(schemaPath);

  const file = project.getSourceFileOrThrow(schemaPath);

  const rootDeclarations: TRootStructure = {
    kind: "root",
    types: {},
  };

  // find all statements in the file
  const statements = file.getStatements();

  for (const statement of statements) {
    if (Node.isInterfaceDeclaration(statement)) {
      const name = statement.getName();
      rootDeclarations.types[name] = parseNode(statement);
      continue;
    }
    throw new Error(
      `Unsupported statement: ${statement.getKindName()} at line ${statement.getStartLineNumber()}`,
    );
  }

  const schema: TSchema<Types> = {
    ref: {} as any,
    [SCHEMA_STRUCTURE]: rootDeclarations,
  };
  Object.assign(schema, { ref: schemaRef(schema) });

  return schema;
}

function parseNode(
  node: Node,
): TStructure {
  if (Node.isStringKeyword(node)) {
    return { kind: "primitive", type: "string" };
  }
  if (Node.isNumberKeyword(node)) {
    return { kind: "primitive", type: "number" };
  }
  if (Node.isBooleanKeyword(node)) {
    return { kind: "primitive", type: "boolean" };
  }
  if (Node.isInterfaceDeclaration(node)) {
    return parseInterfaceDeclaration(node);
  }
  // if (Node.isTypeAliasDeclaration(node)) {
  //   return parseTypeAliasDeclaration(node);
  // }
  if (Node.isTypeLiteral(node)) {
    return parseTypeLiteral(node);
  }
  if (Node.isFunctionTypeNode(node)) {
    return parseFunctionTypeNode(node);
  }
  if (Node.isUnionTypeNode(node)) {
    return parseUnionTypeNode(node);
  }
  if (Node.isTypeReference(node)) {
    return parseTypeReferenceNode(node);
  }
  if (Node.isArrayTypeNode(node)) {
    return parseArrayNode(node);
  }
  console.log(node.print(), `at line ${node.getStartLineNumber()}`);
  throw new Error(
    `Unknown node: ${node.print()} (${node.getKindName()}) at line ${node.getStartLineNumber()}`,
  );
}

function parseArrayNode(
  node: any,
): TStructure {
  const elementType = node.getElementTypeNode();
  if (!elementType) {
    throw new Error("Array node must have an element type");
  }
  return {
    kind: "array",
    items: parseNode(elementType),
  };
}

function parseTypeLiteral(
  node: TypeLiteralNode,
): TStructure {
  const properties: TStructureObjectProperty[] = [];
  for (const property of node.getProperties()) {
    // get the declaration of the property
    const colonNode = property.getFirstChildByKindOrThrow(
      SyntaxKind.ColonToken,
    );
    const valueNode = colonNode.getNextSiblingOrThrow();
    properties.push({
      name: property.getName(),
      structure: parseNode(valueNode),
      optional: property.hasQuestionToken(),
    });
  }
  return { kind: "object", properties };
}

function parseFunctionTypeNode(
  node: FunctionTypeNode,
): TStructure {
  const argumentsList: TStructureFunctionArgument[] = [];
  const params = node.getParameters();
  for (const param of params) {
    const colonNode = param.getFirstChildByKindOrThrow(SyntaxKind.ColonToken);
    const valueNode = colonNode.getNextSiblingOrThrow();
    const optional = param.hasQuestionToken();
    argumentsList.push({
      name: param.getName(),
      structure: parseNode(valueNode) as TFunctionArgumentStructure,
      optional,
    });
  }
  const res = node.getReturnTypeNodeOrThrow();
  return {
    kind: "function",
    arguments: argumentsList,
    returns: parseNode(res),
  };
}

function parseUnionTypeNode(
  node: UnionTypeNode,
): TStructure {
  const types: TStructure[] = [];
  node.getTypeNodes().forEach((typeNode) => {
    types.push(parseNode(typeNode));
  });
  return { kind: "union", types };
}

function parseTypeReferenceNode(
  node: TypeReferenceNode,
): TStructure {
  const name = node.getTypeName();
  if (!Node.isIdentifier(name)) {
    throw new Error(
      `Only identifiers are supported for now, received: ${name.getKindName()}`,
    );
  }
  // get type params if generic
  const typeParams = node.getTypeArguments();
  const params = typeParams.map((param) => parseNode(param));
  return {
    kind: "ref",
    ref: name.getText(),
    params: params.length > 0 ? params : undefined,
  };
}

// function parseTypeAliasDeclaration(
//   node: TypeAliasDeclaration,
// ): TStructure {
//   throw new Error("Not implemented");
// }

function parseInterfaceDeclaration(
  node: InterfaceDeclaration,
): TStructureObject {
  const properties: TStructureObjectProperty[] = [];
  for (const property of node.getProperties()) {
    // get the declaration of the property
    const colonNode = property.getFirstChildByKindOrThrow(
      SyntaxKind.ColonToken,
    );
    const valueNode = colonNode.getNextSiblingOrThrow();
    properties.push({
      name: property.getName(),
      structure: parseNode(valueNode),
      optional: property.hasQuestionToken(),
    });
  }
  return { kind: "object", properties };
}
