type ThrottleOptions = {
  rps: number;
};

type QueuedPromise<R> = {
  resolve: (value?: R) => void;
  reject: (reason: any) => void;
  fn: (...args: any) => Promise<R>;
  args: any[];
};

/**
 * Throttle class to control the throttling of wrapped functions.
 */
export default class Throttle {
  private options: ThrottleOptions;
  private queue: QueuedPromise<any>[];
  private lastExecution: number;

  public constructor(options: ThrottleOptions) {
    this.options = options;
    this.queue = [];
    this.lastExecution = 0;
  }

  /**
   * Wrap a passed in function in order to keep execution monitored
   * via this throttle class.
   * @param fn function to throttle.
   * @returns throttle controlled function.
   */
  public wrap<A extends any[], R>(fn: (...args: A) => Promise<R>) {
    return (...args: A) =>
      new Promise<R>((resolve, reject) => {
        this.queue.push({
          fn,
          args,
          resolve,
          reject,
        });
        this.dequeue();
      });
  }

  /**
   * Dequeue the latest queued promise and execute
   * according to the throttle options.
   */
  private dequeue(): void {
    if (this.isQueueEmpty()) {
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastExecution;
    const boundary = 1000 / this.options.rps;

    const delta = boundary - elapsed;

    if (delta < 0) {
      this.execute();
      return;
    }

    return this.dequeueIn(delta);
  }

  /**
   * Delay a dequeue operation for a certain time
   * @param ms delay in ms
   */
  private dequeueIn(ms: number): void {
    const callback = () => {
      this.dequeue();
    };
    setTimeout(callback, ms);
  }

  /**
   * Execute latest promise from queue.
   */
  private async execute(): Promise<void> {
    this.lastExecution = Date.now();
    const queueItem = this.queue.shift();

    if (!queueItem) {
      throw new Error('tried to execute item from empty queue.');
    }

    const { fn, args, resolve, reject } = queueItem;

    try {
      const out = await fn(...args);
      resolve(out);
    } catch (err) {
      reject(err);
    }
  }

  /**
   * Check weather queue is empty.
   */
  private isQueueEmpty(): boolean {
    return this.queue.length === 0;
  }
}
