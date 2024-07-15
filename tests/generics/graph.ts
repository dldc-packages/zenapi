export interface Paginated<T> {
  data: T[];
  total: number;
}

export interface TodoItem {
  name: string;
  done: boolean;
}

export interface Graph {
  todos: Paginated<TodoItem>;
}
