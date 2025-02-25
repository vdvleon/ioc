export class IoCError extends Error {
  constructor (message: string) {
    super(message)

    this.name = 'IoCError'
  }
}
