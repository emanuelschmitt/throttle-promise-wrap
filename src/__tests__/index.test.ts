import Throttle from '../';

describe('Throttle', () => {
  test('should execute promise and resolve value', async () => {
    const throttle = new Throttle({ rps: 1 });
    const fn = (arg: string) => Promise.resolve(arg);
    const argument = 'string';

    const wrapped = throttle.wrap(fn);
    const result = await wrapped(argument);

    expect(typeof result).toBe('string');
    expect(result).toBe(argument);
  });

  test('should execute promise and reject', async () => {
    const throttle = new Throttle({ rps: 60 });
    const fn = async () => {
      throw new Error('bomb');
    };

    const wrapped = throttle.wrap(fn);
    try {
      await wrapped();
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err);
    }
  });

  test('should throttle requests', async done => {
    const rps = 50;
    const throttle = new Throttle({ rps });
    const requests: any[] = [];
    const requestAmount = 100;

    for (let i = 0; i < requestAmount; i++) {
      const fn = async () => {
        const start = Date.now();
        return Promise.resolve({ id: i, start });
      };
      requests.push({
        fn: throttle.wrap(fn),
        id: i,
      });
    }

    function executePromises() {
      const processedRequests: any[] = [];

      return new Promise<any[]>(resolve => {
        const interval = setInterval(async () => {
          if (requests.length === 0) {
            clearInterval(interval);
            return;
          }

          const request = requests.pop()!;

          const { id, start } = await request?.fn();
          processedRequests.push({ id, start });

          if (processedRequests.length === requestAmount) {
            resolve(processedRequests);
          }
        }, 10);
      });
    }

    const processed = await executePromises();
    expect(processed).toHaveLength(requestAmount);

    for (let j = 0; j < processed.length - 1; j++) {
      const startTime: number = processed[j].start;
      const startTimeNext: number = processed[j + 1].start;

      const isLowerThanRps = 1000 / rps <= startTimeNext - startTime;
      expect(isLowerThanRps).toBeTruthy();
    }

    done();
  });
});
