export interface Namespace {
  doStuff: (str: string, num: number, obj: { key: string }) => null;
}

export interface Graph {
  sub: Namespace;
}
