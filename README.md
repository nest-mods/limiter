# limiter

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
