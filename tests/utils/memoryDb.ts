export type TMemoryDbData<Schema extends Record<string, any>> = {
  [K in keyof Schema]: Record<string, Schema[K]>;
};

export interface TMemoDb<Schema extends Record<string, any>> {
  get<K extends (keyof Schema) & string>(key: K, id: string): Schema[K];
  list<K extends (keyof Schema) & string>(key: K): Schema[K][];
  ops(): string[];
  clearOps(): void;
}

export function createMemoryDb<Schema extends Record<string, any>>(
  data: TMemoryDbData<Schema>,
): TMemoDb<Schema> {
  let ops: string[] = [];

  return {
    get(
      key,
      id,
    ) {
      ops.push(`get ${key} ${id}`);
      const item = data[key][id];
      if (!item) {
        throw new Error(`Item ${key} ${id} not found`);
      }
      return item;
    },
    list(key) {
      ops.push(`list ${key}`);
      return Object.values(data[key]);
    },
    ops() {
      return ops;
    },
    clearOps() {
      ops = [];
    },
  };
}
