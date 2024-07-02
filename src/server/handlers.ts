import type { TGraphBaseAny } from "./graph.ts";
import type { TMiddleware } from "./types.ts";

export interface TResolver {
  kind: "resolver";
  path: TGraphBaseAny;
  middlewares: TMiddleware[];
}

export function resolver(
  path: TGraphBaseAny,
  ...resolvers: TMiddleware[]
): TResolver {
  return { kind: "resolver", path, middlewares: resolvers };
}

export interface TValidator {
  kind: "validator";
  path: TGraphBaseAny;
  middlewares: TMiddleware[];
}

export function validator(
  path: TGraphBaseAny,
  ...validators: TMiddleware[]
): TValidator {
  return { kind: "validator", path, middlewares: validators };
}

export type THandler = TResolver | TValidator;
