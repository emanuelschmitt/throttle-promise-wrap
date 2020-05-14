# throttle-promise-wrap

Control the throttling of functions via a shared throttle instance. Simply wrap a function and control it's execution timing.

# Installation

```
npm install throttle-promise-wrap
```

## Usage

```ts
import Throttle from 'throttle-promise-wrap';

const throttle = new Throttle({ rps: 1 });

const getUsers () => Api.get('/users');
const throttledGetUsers = throttle.wrap(getUsers);

const postUser () => Api.post('/user');
const throttledPostUser = throttle.wrap(getUsers);

// Execution of functions are not throttled.
throttledGetUsers()
throttledPostUser()
```
