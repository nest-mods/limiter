# limiter
[![npm version](https://badge.fury.io/js/%40nest-mods%2Flimiter.svg)](https://badge.fury.io/js/%40nest-mods%2Flimiter)

Easy to use Limiter for nest.js (express)

## Install

`npm i @nest-mods/limiter`

## Usage

```ts
  @UseRateLimit()
  @Get('test1')
  async test1() {
    return 'ok';
  }

  @UseSlowDown()
  @Query(() => String)
  async test3() {
    return 'ok';
  }
```
