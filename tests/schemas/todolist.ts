export interface PaginationParams {
  page?: number;
  limit?: number;
}

// export interface PaginationResponse<T> {
//   data: T[];
//   total: number;
// }

export interface User {
  userName: string;
  app: App;
}

export interface App {
  appName: string;
  todos: Todo[];
}

export interface Todo {
  todoName: string;
  done: boolean;
}

export interface CoinHeads {
  foo: string;
}

export interface CoinTails {
  bar: string;
}

export interface Config {
  env: {
    version: string;
    num: number;
    str: string;
    bool: boolean;
  };
}

export interface Graph {
  users: {
    byId: (id: string) => User;
  };
  apps: {
    all: (pagination?: PaginationParams) => App[]; // PaginationResponse<App>;
    byId: (id: string) => App;
  };
  flip: CoinHeads | CoinTails;
  config: Config;
}
