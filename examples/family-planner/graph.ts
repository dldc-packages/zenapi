import { resolve } from "@std/path";
import { parse } from "../../server.ts";
import type { AllTypes } from "./types/graph.exposed.ts";

const SCHEMA_PATH = resolve("./examples/family-planner/types/graph.ts");

export const graph = parse<AllTypes>(SCHEMA_PATH);
