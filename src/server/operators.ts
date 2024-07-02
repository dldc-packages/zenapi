import * as v from "@valibot/valibot";
import { prepare, type TPrepareFromOperator } from "./prepare.ts";
import type { TMiddleware } from "./types.ts";

export const absoluteOperator: TPrepareFromOperator = (
  context,
  _structure,
  _graph,
  query,
): TMiddleware | null => {
  const [queryItem, ...rest] = query;
  if (queryItem !== "$") {
    return null;
  }
  return prepare(context, context.rootStructure, context.rootGraph, rest);
};

const CallOperatorSchema = v.strictObject({
  kind: v.literal("call"),
  label: v.string(),
});

export const callTransform: TPrepareFromOperator = (
  context,
  graph,
  structure,
  query,
): TMiddleware | null => {
  const [queryItem, ...rest] = query;
  const parsed = v.safeParse(CallOperatorSchema, queryItem);
  if (!parsed.success) {
    return null;
  }
  throw new Error("TODO: Implement call operator");
  // const { label } = parsed.output;
  // const structure = graph[STRUCTURE];
  // if (structure.kind !== "function") {
  //   throw new Error("Expected function structure");
  // }
  // const validator = getStructureValidator(
  //   context,
  //   structure.arguments,
  //   graph[GET]("parameters"),
  // );
  // const resolver = getStructureResolver(
  //   context,
  //   structure,
  //   graph[GET]("return"),
  // );
  // return compose(validator, resolver);
};

export const DEFAULT_OPERATORS = [
  absoluteOperator,
];
