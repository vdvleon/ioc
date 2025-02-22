import { IoCContainer } from "../src";
import { type Example1 } from "./example1";
import { type Example2 } from "./example2";
import { type Example3 } from "./example3";

export const container = new IoCContainer<{
  [Example1.ID]: Promise<Example1>;
  [Example2.ID]: Promise<Example2>;
  [Example3.ID]: Promise<Example3>;
}>();

export type Container = typeof container;
