export type IoCName = symbol

export type IoCObjects = Record<IoCName, unknown>

export type IoCObjectNames<Objects extends IoCObjects> = Extract<
keyof Objects,
IoCName
>

export type IoCObjectFactory<
  Objects extends IoCObjects,
  Name extends IoCObjectNames<Objects>
> = (container: IIoCContainer<Objects>) => Objects[Name]

export type IoCObjectCleaner<
  Objects extends IoCObjects,
  Name extends IoCObjectNames<Objects>
> = (object: Objects[Name]) => void | PromiseLike<void>

export type IoCLoader1<
  Objects extends IoCObjects,
  Name extends IoCObjectNames<Objects> = IoCObjectNames<Objects>
> = [IoCObjectFactory<Objects, Name>]

export type IoCLoader2<
  Objects extends IoCObjects,
  Name extends IoCObjectNames<Objects> = IoCObjectNames<Objects>
> = [IoCObjectFactory<Objects, Name>, IoCObjectCleaner<Objects, Name>]

export type IoCLoader<
  Objects extends IoCObjects,
  Name extends IoCObjectNames<Objects> = IoCObjectNames<Objects>
> = IoCLoader1<Objects, Name> | IoCLoader2<Objects, Name>

export type AwaitedObjects<
  Objects extends IoCObjects,
  Names extends Record<string, IoCObjectNames<Objects>>
> = { [Name in keyof Names]: Awaited<Objects[Names[Name]]> }

export interface IIoCContainer<Objects extends IoCObjects> {
  /**
   * Returns all currently instantiated objects.
   *
   * @example
   * const { [Logger.ID]: logger } = container.getInstances()
   * if (logger) {
   *   // Logger was instnt instantiated.
   * }
   */
  getInstances: () => Partial<Objects>

  /**
   * Register loader (and cleaner) for object ID.
   *
   * @example
   * container.register(Logger.ID, () => new Logger())
   * @example
   * container.register(Auth.ID, (container) => new Auth(container.get(Logger.ID)))
   */
  register: <const Name extends IoCObjectNames<Objects>>(
    name: Name,
    ...loader: IoCLoader<Objects, Name>
  ) => IIoCContainer<Objects>

  /**
   * Cleanup all or only the specified objects.
   *
   * @example
   * await container.cleanup()
   * @example
   * await container.cleanup(Logger.ID, Auth.ID)
   */
  cleanup: <const Name extends IoCObjectNames<Objects>>(
    ...names: Name[]
  ) => Promise<void>

  /**
   * Get instance for the given object name.
   *
   * @example
   * const logger = container.get(Logger.ID)
   */
  get: <const Name extends IoCObjectNames<Objects>>(name: Name) => Objects[Name]

  /**
   * Get all awaited instances for the given object names mappings.
   *
   * @example
   * const { foo, bar } = await container.awaitAll({ foo: Foo.ID, bar: Bar.ID })
   */
  awaitAll: <const Names extends Record<string, IoCObjectNames<Objects>>>(
    names: Names
  ) => Promise<AwaitedObjects<Objects, Names>>
}
