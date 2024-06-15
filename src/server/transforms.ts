import * as v from "@valibot/valibot";
import type { TTRansformResolver } from "./types.ts";

const AbsoluteQuerySchema = v.strictObject({
  kind: v.literal("absolute"),
  path: v.array(v.string()),
});

export const absoluteTransform: TTRansformResolver = (ctx, query) => {
  const { path } = v.parse(AbsoluteQuerySchema, query);
  throw new Error("Not implemented");
};

export const DEFAULT_TRANSFORMS = {
  absolute: absoluteTransform,
};
