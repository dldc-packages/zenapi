import { type ApiContext, createKey, type TKeyProvider } from "../../server.ts";

export type TApiContextMapper = (ctx: ApiContext) => ApiContext;

export interface TGraphCache<T, Params extends any[]> {
  provideLoader(...args: Params): TApiContextMapper;
  provideValue(value: T): TKeyProvider<any>;
  getOrFail(ctx: ApiContext): T;
}

export function createCache<T, Params extends any[]>(
  name: string,
  get: (...args: Params) => T,
): TGraphCache<T, Params> {
  const Key = createKey<{ value: { current: T } | null; args: Params | null }>(
    `Cache(${name})`,
  );
  return {
    provideLoader(...args: Params): TApiContextMapper {
      return (ctx: ApiContext) => {
        const parent = ctx.get(Key.Consumer);
        if (parent) {
          return ctx;
        }
        return ctx.with(
          Key.Provider({ value: null, args }),
        );
      };
    },
    provideValue(value: T): TKeyProvider<any> {
      return Key.Provider({ value: { current: value }, args: null });
    },
    getOrFail(ctx: ApiContext): T {
      const cache = ctx.getOrFail(Key.Consumer);
      if (cache.value) {
        return cache.value.current;
      }
      if (!cache.args) {
        throw new Error(`Trying to get cache on on withValue context ?`);
      }
      cache.value = { current: get(...cache.args) };
      return cache.value.current;
    },
  };
}
