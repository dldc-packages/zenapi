import type { Graph, Paginated, TodoItem } from "./generic.ts";

export interface GenericTypes {
  Graph: Graph;
  Paginated: Paginated<any>;
  TodoItem: TodoItem;
}
