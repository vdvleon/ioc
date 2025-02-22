# Inversion of Control (IoC)

This is a library that provides a container (registry) for singletons.

## Example

**container.ts**

```ts
import type { Logger } from "./logger";
import type { AsyncExample } from "./asyncExample";

export const container = new IoCContainer<{
  // It is possible to register sync loaders.
  [Logger.ID]: ILogger;

  // But it is also possible to register async loaders.
  [AsyncExample.ID]: Promise<AsyncExample>;
}>();
```

**logger.ts**

```ts
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

// Register a sync loader.
container.register(Logger.ID, () => new Logger());
```

**asyncExample.ts**

```ts
import { container } from "./container";
import { Logger, ILogger } from "./logger";

export class AsyncExample {
  public static readonly ID: unique symbol = Symbol(AsyncExample.name);

  public logger: ILogger;
  public token: string | undefined;

  public constructor(logger: ILogger, token: string | string) {
    this.logger = logger;
    this.token = token;

    if (!this.token) {
      this.logger.log("Initialized without token.");
    }
  }
}

// Register an async loader.
contaner.register(AsyncExample.ID, async (container) => {
  const logger = container.get(Logger.ID);

  const response = fetch("http://example.com/get-token");
  const { token } = (await response.json()) as { token?: string };

  return new AsyncExample(logger, token);
});
```

**index.ts**

```ts
import { container } from "./container";
import { Logger } from "./logger";
import { AsyncExample } from "./asyncExample";

// Use the objects from the container.
const logger = container.get(Logger.ID);
logger.log("Hello world!");

// Get async objects and use it.
container
  .get(AsyncExample.ID)
  .then((example) => logger.log(`Token: ${example.token}.`));
```

More examples can be found in [examples](./examples).
