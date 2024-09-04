export interface ParamsWithNull {
  optionalNull?: null | string;
  optionalString?: string;
  nullable: null | string;
}

export interface SimpleParams {
  foo: string;
}

export interface SimpleObj {
  name: string;
}

export interface Namespace {
  execWithParams: (params: ParamsWithNull) => string;
  execWithSimpleParams: (params: SimpleParams) => string;
  execWithNullableString: (name: string) => string;
  nullValue: null;
  nullableString: null | string;
  nullableObj: SimpleObj | null;
}

export interface Graph {
  sub: Namespace;
}
