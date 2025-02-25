import { container } from './container'
import { Example2 } from './example2'
import { Example3 } from './example3';

(async () => {
  console.log('initial instances:', container.getInstances())

  const example3 = await container.get(Example3.ID)

  console.log(
    'example3.example2.example1.value:',
    example3.example2.example1.value
  )
  console.log('instances after accessing example3:', container.getInstances())

  await container.cleanup(Example2.ID)

  console.log('instances after cleanup Example2.ID:', container.getInstances())

  await container.cleanup()

  console.log('instances after cleanup:', container.getInstances())
})().then(undefined, console.error)
