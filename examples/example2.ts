import { container } from './container'
import { Example1 } from './example1'

export class Example2 {
  public static readonly ID: unique symbol = Symbol(Example2.name)

  public example1: Example1

  public constructor (example1: Example1) {
    this.example1 = example1
  }
}

container.register(
  Example2.ID,
  async (container) => new Example2(await container.get(Example1.ID))
)
