import type { TStackCoreValue } from '@dldc/stack';
import { Key, Stack } from '@dldc/stack';
import type { TInstanceAny, TPath } from './entity';
import type { IQueryReader } from './query';

export { Key, type IKey, type IKeyConsumer, type IKeyProvider, type TKeyProviderFn } from '@dldc/stack';

export type TResolve = (instance: TInstanceAny | null, ctx: ApiContext) => Promise<any>;

const PathKey = Key.create<TPath>('path');
const ValueKey = Key.createWithDefault<unknown>('value', undefined);
const QueryKey = Key.create<IQueryReader>('query');
const ResolveKey = Key.create<TResolve>('resolve');

export class ApiContext extends Stack {
  static readonly PathKey = PathKey;
  static readonly ValueKey = ValueKey;
  static readonly QueryKey = QueryKey;
  static readonly ResolveKey = ResolveKey;

  static create(path: TPath, query: IQueryReader, resolve: TResolve): ApiContext {
    return new ApiContext().with(PathKey.Provider(path), QueryKey.Provider(query), ResolveKey.Provider(resolve));
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    return new ApiContext(stackCore) as any;
  }

  get path(): TPath {
    return this.getOrFail(PathKey.Consumer);
  }

  get value(): unknown {
    return this.get(ValueKey.Consumer);
  }

  get query(): IQueryReader {
    return this.getOrFail(QueryKey.Consumer);
  }

  get resolve(): TResolve {
    return this.getOrFail(ResolveKey.Consumer);
  }

  withPath(path: TPath): this {
    return this.with(PathKey.Provider(path));
  }

  withValue(value: unknown): this {
    return this.with(ValueKey.Provider(value));
  }

  withQuery(query: IQueryReader): this {
    return this.with(QueryKey.Provider(query));
  }
}
