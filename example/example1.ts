import { container } from "./container";

export class Example1 {
  public static readonly ID: unique symbol = Symbol(Example1.name);

  public value = "foobar";
}

container.register(Example1.ID, async () => new Example1());
