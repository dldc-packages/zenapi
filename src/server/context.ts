import type { TStackCoreValue } from "@dldc/stack";
import { createKey, createKeyWithDefault, Stack } from "@dldc/stack";
import type { TQueryReader } from "./query.ts";
import type { TGraphPath } from "./types.ts";

export * from "@dldc/stack";

// export type TResolve = (ref: TInstanceAny | null, ctx: ApiContext) => Promise<ApiContext>;

const PathKey = createKey<TGraphPath>("path");
const ValueKey = createKeyWithDefault<unknown>("value", undefined);
const QueryKey = createKey<TQueryReader>("query");
// const ResolveKey = createKey<TResolve>('resolve');

export class ApiContext extends Stack {
  static readonly PathKey = PathKey;
  static readonly ValueKey = ValueKey;
  static readonly QueryKey = QueryKey;
  // static readonly ResolveKey = ResolveKey;

  static create(path: TGraphPath, query: TQueryReader): ApiContext {
    return new ApiContext().with(
      PathKey.Provider(path),
      QueryKey.Provider(query),
    );
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    return new ApiContext(stackCore) as any;
  }

  get path(): TGraphPath {
    return this.getOrFail(PathKey.Consumer);
  }

  get value(): unknown {
    return this.get(ValueKey.Consumer);
  }

  get query(): TQueryReader {
    return this.getOrFail(QueryKey.Consumer);
  }

  withPath(path: TGraphPath): this {
    return this.with(PathKey.Provider(path));
  }

  withValue(value: unknown): this {
    return this.with(ValueKey.Provider(value));
  }

  withQuery(query: TQueryReader): this {
    return this.with(QueryKey.Provider(query));
  }
}
