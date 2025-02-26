import { IoCContainer } from './IoCContainer'
import { IoCError } from './IoCError'

describe('IoCContainer', () => {
  describe('register', () => {
    it('registers a loader', () => {
      expect.assertions(2)

      const symbol = Symbol('unique symbol')

      const container = new IoCContainer<{ [symbol]: string }>()

      try {
        container.get(symbol)
      } catch (error) {
        expect(error).toBeInstanceOf(IoCError)
      }

      container.register(symbol, () => 'foobar')

      expect(container.get(symbol)).toStrictEqual('foobar')
    })
  })

  describe('get', () => {
    it('returns a new instance', () => {
      expect.assertions(1)

      const symbol = Symbol('unique symbol')

      const container = new IoCContainer<{ [symbol]: string }>().register(symbol, () => 'foobar')

      expect(container.get(symbol)).toStrictEqual('foobar')
    })

    it('returns an existing instance', () => {
      expect.assertions(3)

      const symbol = Symbol('unique symbol')

      interface Instance { id: symbol }

      const instanceLoader = jest.fn(() => ({ id: Symbol('another unique symbol') }))

      const container = new IoCContainer<{ [symbol]: Instance }>().register(symbol, instanceLoader)

      container.get(symbol)

      expect(instanceLoader).toHaveBeenCalledTimes(1)

      expect(container.get(symbol)).toBe(instanceLoader.mock.results[0].value)

      expect(instanceLoader).toHaveBeenCalledTimes(1)
    })

    it('throws when an infinite loop is detected', () => {
      expect.assertions(2)

      const symbol = Symbol('unique symbol')

      const container = new IoCContainer<{ [symbol]: string }>().register(symbol, (container) => {
        return `x${container.get(symbol)}`
      })

      try {
        container.get(symbol)
      } catch (error) {
        expect(error).toBeInstanceOf(IoCError)
        expect((error as IoCError).message).toMatchInlineSnapshot('"Infinite loop detected for Symbol(unique symbol)."')
      }
    })
  })

  describe('awaitAll', () => {
    it('returns promise that resolves to multiple awaited instances', async () => {
      expect.assertions(1)

      const symbol1 = Symbol('unique symbol 1')
      const symbol2 = Symbol('unique symbol 2')

      const container = new IoCContainer<{ [symbol1]: Promise<string>, [symbol2]: number }>()
        .register(symbol1, async () => 'foobar')
        .register(symbol2, () => 1337)

      expect(await container.awaitAll({ foobar: symbol1, number: symbol2 }))
        .toStrictEqual({ foobar: 'foobar', number: 1337 })
    })
  })

  describe('getInstances', () => {
    it('returns all currently registered instances', () => {
      expect.assertions(3)

      const symbol1 = Symbol('unique symbol 1')
      const symbol2 = Symbol('unique symbol 2')

      const container = new IoCContainer<{ [symbol1]: string, [symbol2]: number }>()
        .register(symbol1, () => 'foobar')
        .register(symbol2, () => 1337)

      expect(container.getInstances()).toStrictEqual({})

      container.get(symbol1)

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar' })

      container.get(symbol2)

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar', [symbol2]: 1337 })
    })
  })

  describe('cleanup', () => {
    it('cleans up all instances', async () => {
      expect.assertions(2)

      const symbol1 = Symbol('unique symbol 1')
      const symbol2 = Symbol('unique symbol 2')

      const container = new IoCContainer<{ [symbol1]: string, [symbol2]: number }>()
        .set(symbol1, 'foobar')
        .set(symbol2, 1337)

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar', [symbol2]: 1337 })

      await container.cleanup()

      expect(container.getInstances()).toStrictEqual({})
    })

    it('cleans up a specific instance', async () => {
      expect.assertions(2)

      const symbol1 = Symbol('unique symbol 1')
      const symbol2 = Symbol('unique symbol 2')

      const container = new IoCContainer<{ [symbol1]: string, [symbol2]: number }>()
        .set(symbol1, 'foobar')
        .set(symbol2, 1337)

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar', [symbol2]: 1337 })

      await container.cleanup(symbol2)

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar' })
    })

    it('does nothing when a specific instance does not exist', async () => {
      expect.assertions(2)

      const symbol1 = Symbol('unique symbol 1')
      const symbol2 = Symbol('unique symbol 2')

      const container = new IoCContainer<{ [symbol1]: string, [symbol2]: number }>()
        .set(symbol1, 'foobar')

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar' })

      await container.cleanup(symbol2)

      expect(container.getInstances()).toStrictEqual({ [symbol1]: 'foobar' })
    })

    it('throws when an cleanup is detected while loading an instance', async () => {
      expect.assertions(2)

      const symbol = Symbol('unique symbol')

      const container = new IoCContainer<{ [symbol]: Promise<string> }>().register(symbol, async (container) => {
        await container.cleanup(symbol)
        return 'foobar'
      })

      try {
        await container.get(symbol)
      } catch (error) {
        expect(error).toBeInstanceOf(IoCError)
        expect((error as IoCError).message).toMatchInlineSnapshot('"Cannot cleanup Symbol(unique symbol) while creating an instance."')
      }
    })

    it('runs registered cleanup logic for an instance', async () => {
      expect.assertions(2)

      const symbol = Symbol('unique symbol')

      const cleanup = jest.fn()

      const container = new IoCContainer<{ [symbol]: string }>().register(symbol, () => 'foobar', cleanup)

      container.get(symbol)

      await container.cleanup()

      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(cleanup).toHaveBeenNthCalledWith(1, 'foobar')
    })
  })
})
