import type {
  FunctionTypeNode,
  InterfaceDeclaration,
  LiteralTypeNode,
  TypeAliasDeclaration,
  TypeLiteralNode,
  TypeReferenceNode,
  UnionTypeNode,
} from "ts_morph";
import {
  Node,
  NullLiteral,
  Project,
  ResolutionHosts,
  StringLiteral,
  SyntaxKind,
} from "ts_morph";
import type { TTypesBase } from "../utils/types.ts";
import { graph } from "./graph.ts";
import type {
  TFunctionArgumentStructure,
  TRootStructure,
  TStructure,
  TStructureArguments,
  TStructureObject,
  TStructureObjectProperty,
} from "./structure.types.ts";
import type { TGraphOf } from "./types.ts";

export interface TSchema<Types extends TTypesBase> {
  graph: TGraphOf<Types, never>;
  structure: TRootStructure;
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

  const rootStructure: TRootStructure = {
    kind: "root",
    key: "",
    types: {},
  };

  // find all statements in the file
  const statements = file.getStatements();

  for (const statement of statements) {
    if (Node.isInterfaceDeclaration(statement)) {
      const name = statement.getName();
      rootStructure.types[name] = parseNode(statement, name);
      continue;
    }
    if (Node.isTypeAliasDeclaration(statement)) {
      const name = statement.getName();
      rootStructure.types[name] = parseNode(statement, name);
      continue;
    }
    throw new Error(
      `Unsupported statement: ${statement.getKindName()} at line ${statement.getStartLineNumber()}`,
    );
  }

  return {
    graph: graph(rootStructure),
    structure: rootStructure,
  };
}

function parseNode(node: Node, parentKey: string): TStructure {
  if (Node.isStringKeyword(node)) {
    return { kind: "primitive", key: parentKey, type: "string" };
  }
  if (Node.isNumberKeyword(node)) {
    return { kind: "primitive", key: parentKey, type: "number" };
  }
  if (Node.isBooleanKeyword(node)) {
    return { kind: "primitive", key: parentKey, type: "boolean" };
  }
  if (Node.isInterfaceDeclaration(node)) {
    return parseInterfaceDeclaration(node, parentKey);
  }
  if (Node.isTypeAliasDeclaration(node)) {
    return parseTypeAliasDeclaration(node, parentKey);
  }
  if (Node.isTypeLiteral(node)) {
    return parseTypeLiteral(node, parentKey);
  }
  if (Node.isFunctionTypeNode(node)) {
    return parseFunctionTypeNode(node, parentKey);
  }
  if (Node.isUnionTypeNode(node)) {
    return parseUnionTypeNode(node, parentKey);
  }
  if (Node.isTypeReference(node)) {
    return parseTypeReferenceNode(node, parentKey);
  }
  if (Node.isArrayTypeNode(node)) {
    return parseArrayNode(node, parentKey);
  }
  if (Node.isLiteralTypeNode(node)) {
    return parseLiteralTypeNode(node, parentKey);
  }
  if (node.getKind() === SyntaxKind.VoidKeyword) {
    throw new Error("Void expressions are not supported, use null instead");
  }
  console.info(node.print(), `at line ${node.getStartLineNumber()}`);
  throw new Error(
    `Unknown node: ${node.print()} (${node.getKindName()}) at line ${node.getStartLineNumber()}`,
  );
}

function parseArrayNode(node: any, key: string): TStructure {
  const elementType = node.getElementTypeNode();
  if (!elementType) {
    throw new Error("Array node must have an element type");
  }
  return {
    kind: "array",
    key,
    items: parseNode(elementType, `${key}.items`),
  };
}

function parseLiteralTypeNode(
  node: LiteralTypeNode,
  key: string,
): TStructure {
  const literal = node.getLiteral();
  if (literal instanceof NullLiteral) {
    return { kind: "literal", key, type: null };
  }
  if (literal instanceof StringLiteral) {
    return { kind: "literal", key, type: JSON.parse(literal.getText()) };
  }
  if (literal.getKind() === SyntaxKind.TrueKeyword) {
    return { kind: "literal", key, type: true };
  }
  if (literal.getKind() === SyntaxKind.FalseKeyword) {
    return { kind: "literal", key, type: false };
  }
  throw new Error(`Unsupported literal type: ${literal.getText()}`);
}

function parseTypeLiteral(
  node: TypeLiteralNode,
  parentKey: string,
): TStructure {
  const properties: TStructureObjectProperty[] = [];
  for (const property of node.getProperties()) {
    // get the declaration of the property
    const colonNode = property.getFirstChildByKindOrThrow(
      SyntaxKind.ColonToken,
    );
    const valueNode = colonNode.getNextSiblingOrThrow();
    const propName = property.getName();
    const propKey = `${parentKey}.${propName}`;
    properties.push({
      name: propName,
      structure: parseNode(valueNode, propKey),
      optional: property.hasQuestionToken(),
    });
  }
  return { kind: "object", key: parentKey, properties };
}

function parseFunctionTypeNode(
  node: FunctionTypeNode,
  key: string,
): TStructure {
  const argsKey = `${key}.arguments`;
  const argumentsStruct: TStructureArguments = {
    kind: "arguments",
    key: argsKey,
    arguments: [],
  };
  const params = node.getParameters();
  for (const param of params) {
    const colonNode = param.getFirstChildByKindOrThrow(SyntaxKind.ColonToken);
    const valueNode = colonNode.getNextSiblingOrThrow();
    const optional = param.hasQuestionToken();
    const argName = param.getName();
    const argKey = `${argsKey}.${argName}`;
    argumentsStruct.arguments.push({
      name: argName,
      structure: parseNode(valueNode, argKey) as TFunctionArgumentStructure,
      optional,
    });
  }
  const res = node.getReturnTypeNodeOrThrow();
  return {
    kind: "function",
    key,
    arguments: argumentsStruct,
    returns: parseNode(res, `${key}.returns`),
  };
}

function parseUnionTypeNode(
  node: UnionTypeNode,
  key: string,
): TStructure {
  const types: TStructure[] = [];
  node.getTypeNodes().forEach((typeNode) => {
    types.push(parseNode(typeNode, `${key}.union`));
  });
  return { kind: "union", key: key, types };
}

function parseTypeReferenceNode(
  node: TypeReferenceNode,
  key: string,
): TStructure {
  const name = node.getTypeName();
  if (!Node.isIdentifier(name)) {
    throw new Error(
      `Only identifiers are supported for now, received: ${name.getKindName()}`,
    );
  }
  // get type params if generic
  const typeParams = node.getTypeArguments();
  const params = typeParams.map((param) => parseNode(param, key));
  return {
    kind: "ref",
    key,
    ref: name.getText(),
    params: params.length > 0 ? params : undefined,
  };
}

function parseTypeAliasDeclaration(
  node: TypeAliasDeclaration,
  key: string,
): TStructure {
  const valueNode = node.getTypeNode();
  if (!valueNode) {
    throw new Error("Type alias must have a type");
  }
  return parseNode(valueNode, key);
}

function parseInterfaceDeclaration(
  node: InterfaceDeclaration,
  key: string,
): TStructureObject {
  const properties: TStructureObjectProperty[] = [];
  for (const property of node.getProperties()) {
    // get the declaration of the property
    const colonNode = property.getFirstChildByKindOrThrow(
      SyntaxKind.ColonToken,
    );
    const valueNode = colonNode.getNextSiblingOrThrow();
    const propName = property.getName();
    const propKey = `${key}.${propName}`;
    properties.push({
      name: propName,
      structure: parseNode(valueNode, propKey),
      optional: property.hasQuestionToken(),
    });
  }
  const methods = node.getMethods();
  if (methods.length > 0) {
    throw new Error(
      "Methods are not supported yet, pleaseuse property: () => void; instead.",
    );
  }
  return { kind: "object", key: key, properties };
}
