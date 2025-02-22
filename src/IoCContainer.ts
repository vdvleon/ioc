import assert from "node:assert/strict";

import {
  AwaitedObjects,
  IIoCContainer,
  IoCLoader,
  IoCLoader2,
  IoCObjectNames,
  IoCObjects,
} from "./types";
import { IoCError } from "./IoCError";

const placeholderSymbol: unique symbol = Symbol("placeholder");

export class IoCContainer<Objects extends IoCObjects>
  implements IIoCContainer<Objects>
{
  protected loaders: Map<IoCObjectNames<Objects>, IoCLoader2<Objects>> =
    new Map();
  protected instances: Map<IoCObjectNames<Objects>, unknown> = new Map();

  public getInstances(): Partial<Objects> {
    return Object.fromEntries(this.instances.entries()) as Partial<Objects>;
  }

  async cleanup<const Name extends IoCObjectNames<Objects>>(
    ...names: Name[]
  ): Promise<void> {
    const _names =
      names.length === 0 ? Array.from(this.instances.keys()) : names;

    for (const name of _names) {
      if (this.instances.has(name)) {
        const instance = this.instances.get(name);

        // Prevent cleanup of instance that is being loaded.
        if (instance === placeholderSymbol) {
          throw new IoCError(
            `Cannot cleanup ${String(name)} while creating an instance.`
          );
        }

        // Run cleanup code if found.
        const loader = this.loaders.get(name);
        if (loader) {
          const [_, _cleanup] = loader;
          const cleanup = _cleanup as (instance: unknown) => Promise<void>;
          await cleanup(instance);
        }
      }

      this.instances.delete(name);
    }
  }

  public register<const Name extends IoCObjectNames<Objects>>(
    name: Name,
    ...loader: IoCLoader<Objects, Name>
  ): this {
    this.loaders.set(name, normalizeLoader(loader));
    return this;
  }

  public get<const Name extends IoCObjectNames<Objects>>(
    name: Name
  ): Objects[Name] {
    if (this.instances.has(name)) {
      const instance = this.instances.get(name);

      // Detect infinute loop.
      if (instance === placeholderSymbol) {
        throw new IoCError(`Infinite loop detected for ${String(name)}.`);
      }

      return instance as Objects[Name];
    }

    const loader = this.loaders.get(name);
    assert(
      loader,
      `Cannot create instance of ${String(
        name
      )} because no loader is registered.`
    );

    // Allow infinute loop detection.
    this.instances.set(name, placeholderSymbol);

    const instance = loader[0](this) as Objects[Name];
    this.instances.set(name, instance);

    return instance;
  }

  public async awaitAll<
    const Names extends Record<string, IoCObjectNames<Objects>>
  >(names: Names): Promise<AwaitedObjects<Objects, Names>> {
    const entries = await Promise.all(
      Object.entries(names).map(async ([name, id]) => [
        name,
        await this.get(id),
      ])
    );

    return Object.fromEntries(entries) as AwaitedObjects<Objects, Names>;
  }
}

const normalizeLoader = <Objects extends IoCObjects>(
  loader: IoCLoader<Objects>
): IoCLoader2<Objects> =>
  loader.length === 2 ? loader : [loader[0], () => {}];
