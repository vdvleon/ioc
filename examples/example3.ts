import { container, Container } from './container'
import { Example1 } from './example1'
import { Example2 } from './example2'

export interface Example3Options {
  example1: Example1
  example2: Example2
}

export class Example3 {
  public static readonly ID: unique symbol = Symbol(Example3.name)

  public example1: Example1
  public example2: Example2

  public constructor (options: Example3Options) {
    Object.assign(this, options)
  }
}

container.register(Example3.ID, async (container: Container) => {
  return new Example3(
    await container.awaitAll({
      example1: Example1.ID,
      example2: Example2.ID
    })
  )
})
