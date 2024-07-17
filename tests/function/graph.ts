export interface StuffResult {
  data: string;
  num: number;
}

export interface Namespace {
  doStuff: (str: string, num: number, obj: { key: string }) => StuffResult;
}

export interface Graph {
  sub: Namespace;
}
