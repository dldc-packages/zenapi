export interface Namespace {
  now: Date;
  doStuff: (date: Date) => string;
}

export interface Graph {
  sub: Namespace;
}
