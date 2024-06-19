import { composeAdvanced } from "@dldc/compose";
import type { TMiddleware } from "../../server.ts";
import type { ApiContext } from "./context.ts";

export function compose(...middlewares: TMiddleware[]): TMiddleware {
  return composeAdvanced<
    ApiContext,
    Promise<ApiContext> | ApiContext,
    Promise<ApiContext>
  >(async (v) => await v, middlewares);
}

export function withContext(
  mid: TMiddleware,
  update: (ctx: ApiContext) => ApiContext,
): TMiddleware {
  return async (ctx, next) => await mid(update(ctx), next);
}
