import type { TFormiFieldTree } from '@dldc/formi';

export type ZenTypeKind =
  | 'nil'
  | 'string'
  | 'number'
  | 'boolean'
  | 'list'
  | 'record'
  | 'union'
  | 'func'
  | 'enumeration';

export const OUTPUT = Symbol('OUTPUT');
type OUTPUT = typeof OUTPUT;

export const RESOLVE = Symbol('RESOLVE');
type RESOLVE = typeof RESOLVE;

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type ZenTypeOutput<Type extends ZenTypeAny> = Simplify<Type[OUTPUT]>;
export type ZenTypeResolve<Type extends ZenTypeAny> = Simplify<Type[RESOLVE]>;

export type ZenTypeAny = ZenType<ZenTypeKind, any, any>;

export interface ResolvedType {
  type: ZenTypeAny;
  value: any;
}

export interface ZenType<Kind extends ZenTypeKind, Output, Resolve> {
  readonly kind: Kind;
  readonly [OUTPUT]: Output;
  readonly [RESOLVE]: Resolve;

  resolve(value: Resolve): ResolvedType;
}

export interface ZenTypeList<Children extends ZenTypeAny>
  extends ZenType<'list', ZenTypeOutput<Children>[], ZenTypeResolve<Children>[]> {
  readonly list: Children;
}

export interface ZenTypeEnumeration<Options extends readonly string[]>
  extends ZenType<'enumeration', Options[number], Options[number]> {
  readonly enum: Options;
}

export type TypesRecord = Record<string, ZenTypeAny>;

export type TypesRecordOutput<Fields extends TypesRecord> = { [Key in keyof Fields]: ZenTypeOutput<Fields[Key]> };
export type TypesRecordResolve<Fields extends TypesRecord> = { [Key in keyof Fields]?: ZenTypeResolve<Fields[Key]> };

export interface ZenTypeRecord<Fields extends TypesRecord>
  extends ZenType<'record', TypesRecordOutput<Fields>, TypesRecordResolve<Fields>> {
  readonly record: Fields;
}

export interface ZenTypeUnion<Types extends readonly ZenTypeAny[]>
  extends ZenType<'union', ZenTypeOutput<Types[number]>, ZenTypeResolve<Types[number]>> {
  readonly union: Types;
}

export interface ZenTypeFunc<Fields extends TFormiFieldTree, Result extends ZenTypeAny>
  extends ZenType<'func', ZenTypeOutput<Result>, ZenTypeResolve<Result>> {
  readonly fields: Fields;
  readonly result: Result;
}
