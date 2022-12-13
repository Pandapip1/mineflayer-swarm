import { createThreadPool } from 'thread-puddle';

// Workaround since ReturnType doesn't work well with generics
class Wrapper<T> {
  wrapped () { // eslint-disable-line @typescript-eslint/promise-function-async, @typescript-eslint/explicit-function-return-type
    return createThreadPool<T>('asdf', {});
  }
}

export type Puddle<T> = Awaited<ReturnType<Wrapper<T>['wrapped']>>;
