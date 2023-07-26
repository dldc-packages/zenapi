import type { TFormiFieldTree } from '@dldc/formi';
import type {
  ResolvedType,
  TypesRecord,
  ZenType,
  ZenTypeAny,
  ZenTypeEnumeration,
  ZenTypeFunc,
  ZenTypeKind,
  ZenTypeList,
  ZenTypeRecord,
  ZenTypeUnion,
} from './ZenType.types';
import { OUTPUT, RESOLVE } from './ZenType.types';

export function nil(): ZenType<'nil', null, null> {
  return createType('nil');
}

export function string(): ZenType<'string', string, string> {
  return createType('string');
}

export function number(): ZenType<'number', number, number> {
  return createType('number');
}

export function boolean(): ZenType<'boolean', boolean, boolean> {
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

export function func<Fields extends TFormiFieldTree, Result extends ZenTypeAny>(
  fields: Fields,
  result: Result,
): ZenTypeFunc<Fields, Result> {
  return { ...createType('func'), fields, result };
}

function createType<Kind extends ZenTypeKind, Output, Resolve>(kind: Kind): ZenType<Kind, Output, Resolve> {
  const type: ZenType<Kind, Output, Resolve> = { kind, [OUTPUT]: null as any, [RESOLVE]: null as any, resolve };
  return type;

  function resolve(value: Resolve): ResolvedType {
    return { type, value };
  }
}
