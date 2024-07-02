import type {
  App,
  CoinHeads,
  CoinTails,
  Config,
  Graph,
  User,
} from "./todolist.ts";

export interface TodoListTypes {
  Graph: Graph;
  App: App;
  Config: Config;
  User: User;
  CoinHeads: CoinHeads;
  CoinTails: CoinTails;
}
