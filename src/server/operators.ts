import * as v from "@valibot/valibot";
import { prepare, type TPrepareFromOperator } from "./prepare.ts";
import type { TMiddleware } from "./types.ts";

const ObjOperatorSchema = v.strictObject({
  kind: v.literal("object"),
  data: v.array(
    v.strictObject({ key: v.string(), value: v.array(v.any()) }),
  ),
});

export const objOperator: TPrepareFromOperator = (
  context,
  params,
  graph,
  query,
): TMiddleware | null => {
  const [queryItem, ...rest] = query;
  const parsed = v.safeParse(ObjOperatorSchema, queryItem);
  if (!parsed.success) {
    return null;
  }
  if (rest.length > 0) {
    throw new Error("Unexpected query items after object operator.");
  }
  const { data } = parsed.output;
  const prepared = data.map(({ key, value }) => {
    return { key, middleware: prepare(context, params, graph, value) };
  });
  return async (ctx, next) => {
    const value = await Promise.all(
      prepared.map(async ({ key, middleware }) => {
        const result = await middleware(ctx, next);
        return [key, result.value] as const;
      }),
    );
    return ctx.withValue(Object.fromEntries(value));
  };
};

export const DEFAULT_OPERATORS = [
  objOperator,
];
