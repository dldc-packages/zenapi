import type { TFormiFieldTree } from '@dldc/formi';

// Type of select result
export const OUTPUT = Symbol('OUTPUT');
type OUTPUT = typeof OUTPUT;

// Type you need to pass to resolve()
export const RESOLVE = Symbol('RESOLVE');
type RESOLVE = typeof RESOLVE;

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type ZenTypeOutput<Type extends ZenTypeAny> = Simplify<Type[OUTPUT]>;
export type ZenTypeResolve<Type extends ZenTypeAny> = Simplify<Type[RESOLVE]>;

export type ZenTypeAny =
  | ZenTypeNil
  | ZenTypeString
  | ZenTypeNumber
  | ZenTypeBoolean
  | ZenTypeList<any>
  | ZenTypeEnumeration<any>
  | ZenTypeRecord<any>
  | ZenTypeUnion<any>
  | ZenTypeFunc<any, any>;

export interface ResolvedType {
  type: ZenTypeAny;
  value: any;
}

export type TypesRecord = Record<string, ZenTypeAny>;

export type TypesRecordOutput<Props extends TypesRecord> = { [Key in keyof Props]: ZenTypeOutput<Props[Key]> };
export type TypesRecordResolve<Props extends TypesRecord> = { [Key in keyof Props]?: ZenTypeResolve<Props[Key]> };

export interface ZenTypeNil {
  readonly kind: 'nil';
  readonly [OUTPUT]: null;
  readonly [RESOLVE]: null;
}

export interface ZenTypeString {
  readonly kind: 'string';
  readonly [OUTPUT]: string;
  readonly [RESOLVE]: string;
}

export interface ZenTypeNumber {
  readonly kind: 'number';
  readonly [OUTPUT]: number;
  readonly [RESOLVE]: number;
}

export interface ZenTypeBoolean {
  readonly kind: 'boolean';
  readonly [OUTPUT]: boolean;
  readonly [RESOLVE]: boolean;
}

export interface ZenTypeList<Children extends ZenTypeAny> {
  readonly kind: 'list';
  readonly [OUTPUT]: ZenTypeOutput<Children>[];
  readonly [RESOLVE]: ZenTypeResolve<Children>[];
  readonly list: Children;
}

export interface ZenTypeEnumeration<Options extends readonly string[]> {
  readonly kind: 'enumeration';
  readonly [OUTPUT]: Options[number];
  readonly [RESOLVE]: Options[number];
  readonly enum: Options;
}

export interface ZenTypeRecord<Props extends TypesRecord> {
  readonly kind: 'record';
  readonly [OUTPUT]: TypesRecordOutput<Props>;
  readonly [RESOLVE]: TypesRecordResolve<Props>;
  readonly record: Props;
}

export interface ZenTypeUnion<Types extends readonly ZenTypeAny[]> {
  readonly kind: 'union';
  readonly [OUTPUT]: ZenTypeOutput<Types[number]>;
  readonly [RESOLVE]: ZenTypeResolve<Types[number]>;
  readonly union: Types;
}

export interface ZenTypeFunc<Fields extends TFormiFieldTree, Result extends ZenTypeAny> {
  readonly kind: 'func';
  readonly [OUTPUT]: ZenTypeOutput<Result>;
  readonly [RESOLVE]: ZenTypeResolve<Result>;
  readonly fields: Fields;
  readonly result: Result;
}
