import type { QUERY_RESULT, TO_JSON } from "./constants.ts";

export interface TQuery<Result> {
  [QUERY_RESULT]: Result;
  [TO_JSON]: unknown;
}
