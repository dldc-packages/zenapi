const QUERY_DATA = Symbol('DATA');

export type TAbstractAny = IAbstract<any>;

export interface IAbstract<QueryData> {
  readonly [QUERY_DATA]: QueryData;
  readonly name: string;
}

export function defineAbstract<QueryData>(name: string): IAbstract<QueryData> {
  return {
    [QUERY_DATA]: null as any,
    name,
  };
}
