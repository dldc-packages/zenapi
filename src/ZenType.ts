import type { TFormiFieldTree } from '@dldc/formi';
import type {
  TypesRecord,
  ZenTypeAny,
  ZenTypeBoolean,
  ZenTypeEnumeration,
  ZenTypeFunc,
  ZenTypeList,
  ZenTypeNil,
  ZenTypeNumber,
  ZenTypeRecord,
  ZenTypeString,
  ZenTypeUnion,
} from './ZenType.types';
import { OUTPUT, RESOLVE } from './ZenType.types';

export function nil(): ZenTypeNil {
  return createType('nil');
}

export function string(): ZenTypeString {
  return createType('string');
}

export function number(): ZenTypeNumber {
  return createType('number');
}

export function boolean(): ZenTypeBoolean {
  return createType('boolean');
}

export function enumeration<Options extends readonly string[]>(options: Options): ZenTypeEnumeration<Options> {
  return { ...createType('enumeration'), enum: options };
}

export function list<Children extends ZenTypeAny>(children: Children): ZenTypeList<Children> {
  return { ...createType('list'), list: children };
}

export function record<Fields extends TypesRecord>(record: Fields): ZenTypeRecord<Fields> {
  return { ...createType('record'), record };
}

export function union<Types extends readonly ZenTypeAny[]>(union: Types): ZenTypeUnion<Types> {
  return { ...createType('union'), union };
}

export function optional<Type extends ZenTypeAny>(type: Type): ZenTypeUnion<[Type, ZenTypeNil]> {
  return union([type, nil()]);
}

export function func<Fields extends TFormiFieldTree, Result extends ZenTypeAny>(
  fields: Fields,
  result: Result,
): ZenTypeFunc<Fields, Result> {
  return { ...createType('func'), fields, result };
}

function createType<Kind extends string, Output, Resolve>(
  kind: Kind,
): { kind: Kind; [OUTPUT]: Output; [RESOLVE]: Resolve } {
  return { kind, [OUTPUT]: null as any, [RESOLVE]: null as any };
}
