import type { TStaackCoreValue } from '@dldc/stack';
import { Key, Staack } from '@dldc/stack';
import type { TPath } from './entity';
import type { IQueryReader } from './query';
import type { TResolveNext } from './types';

export {
  Key,
  type IKey,
  type IKeyConsumer,
  type IKeyProvider,
  type TKeyProviderFn,
  type TMaybeParam,
} from '@dldc/stack';

const PathKey = Key.create<TPath>('path');
const ValueKey = Key.createWithDefault<unknown>('value', undefined);
const QueryKey = Key.create<IQueryReader>('query');
const ResolveKey = Key.create<TResolveNext>('resolve');

export class ApiContext extends Staack {
  static readonly PathKey = PathKey;
  static readonly ValueKey = ValueKey;
  static readonly QueryKey = QueryKey;
  static readonly ResolveKey = ResolveKey;

  static create(path: TPath, query: IQueryReader, resolve: TResolveNext): ApiContext {
    return new ApiContext().with(PathKey.Provider(path), QueryKey.Provider(query), ResolveKey.Provider(resolve));
  }

  protected instantiate(staackCore: TStaackCoreValue): this {
    return new ApiContext(staackCore) as any;
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

  get resolve(): TResolveNext {
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
