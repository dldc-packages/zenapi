export interface Paginated<T> {
  data: T[];
  total: number;
}

export interface TodoItem {
  name: string;
  done: boolean;
}

export type BaseFn<Result> = (num: number) => Result;

export interface Graph {
  todos: Paginated<TodoItem>;
  nested: BaseFn<TodoItem>;
}
