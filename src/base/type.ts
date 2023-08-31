import type { TEntityAny } from '../entity';
import type { TQuery } from '../query';
import { defineAbstract, defineType } from '../types';

const stringType = defineType<null, undefined>('string');
const dateType = defineType<null, undefined>('date');
const numberType = defineType<null, undefined>('number');
const booleanType = defineType<null, undefined>('boolean');
const jsonType = defineType<null, undefined>('json');
const nilType = defineType<null, undefined>('nil');
const enumType = defineType<readonly string[], undefined>('enum');

export type TNullableDef = { nullable: TQuery | false };

const nullableType = defineType<TEntityAny, TNullableDef>('nullable');

export type TEntityRecord = Record<string, TEntityAny>;

const objectType = defineType<TEntityRecord, string>('object');

export type TListDef =
  | { type: 'all'; select: TQuery }
  | { type: 'first'; select: TQuery }
  | {
      type: 'paginate';
      page: number | { page: number; pageSize: number };
      select: TQuery;
    };

const listType = defineType<TEntityAny, TListDef>('list');

export interface IInputDef {
  input: any;
  select: TQuery;
}

const inputType = defineType<TEntityAny, IInputDef>('input');

export const types = {
  string: stringType,
  date: dateType,
  number: numberType,
  boolean: booleanType,
  json: jsonType,
  nil: nilType,
  enum: enumType,
  nullable: nullableType,
  object: objectType,
  list: listType,
  input: inputType,
};

export type TAbstractObjectDef = Record<string, TQuery>;

const objectAbstract = defineAbstract<TAbstractObjectDef>('object');

const errorBoundaryAbstract = defineAbstract<TQuery>('errorBoundary');

export const abstracts = {
  object: objectAbstract,
  errorBoundary: errorBoundaryAbstract,
};
