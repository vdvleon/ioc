# Inversion of Control (IoC)

This is a library that provides a container (registry) for singletons.

## Example

```ts
// container.ts
import type { Logger, ILogger } from "./logger";

export const container = new IoCContainer<{
  [Logger.ID]: Promise<ILogger>;
}>();

// logger.ts
import { container } from "./container";

export interface ILogger {
  log(message: string): void;
}

export class Logger implements ILogger {
  /*
   * Make sure the ID symbol is defined in the same file as the
   * container.register call. This enforces that the loaders
   * are only registered when the desired object is needed,
   * which allows for better tree shaking when compiling code.
   */
  public static readonly ID: unique symbol = Symbol(Logger.name);

  log(message: string): void {
    console.log(message);
  }
}

container.register(Logger.ID, () => new Logger());

// usage.ts
import { container } from "./container";
import { Logger } from "./loggers";

const logger = container.get(Logger.ID);
logger.log("Hello world!");
```

More examples can be found in [examples](./examples).
