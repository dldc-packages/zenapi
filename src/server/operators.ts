import * as v from "@valibot/valibot";
import { buildFromPath, type TBuildFromOperator } from "./build.ts";
import type { TMiddleware } from "./types.ts";

const AbsoluteOperatorSchema = v.strictObject({
  kind: v.literal("absolute"),
  path: v.array(v.string()),
  _: v.optional(v.any()),
});

export const absoluteTransform: TBuildFromOperator = (
  context,
  graph,
  query,
): TMiddleware => {
  const { path, _: children } = v.parse(AbsoluteOperatorSchema, query);
  if (path.length === 0) {
    throw new Error("Path cannot be empty");
  }
  if (children) {
    throw new Error("TODO: Implement children for absolute operator");
  }
  return buildFromPath(context, graph, path);
};

export const DEFAULT_OPERATORS = {
  absolute: absoluteTransform,
};
