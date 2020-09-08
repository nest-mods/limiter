import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';
import { LimiterModule, UseRateLimit, UseSlowDown } from '../src';
import { repeat } from './util/repeat';
import { sleep } from './util/sleep';

@Controller('rate-limit')
class TestRateLimitController {

  @UseRateLimit()
  @Get('test1')
  async test1() {
    return 'ok';
  }

  @UseRateLimit({
    max: 2,
    windowMs: 5_000,
  })
  @Get('test2')
  async test2() {
    return 'ok';
  }
}

@Controller('slow-down')
class TestSlowDownController {

  @UseSlowDown()
  @Get('test1')
  async test1() {
    return 'ok';
  }

  @UseSlowDown({
    windowMs: 5_000,
    delayMs: 1_000,
    delayAfter: 2,
  })
  @Get('test2')
  async test2() {
    return 'ok';
  }
}

describe('Limiter HTTP tests', () => {

  let app: INestApplication;
  let $: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LimiterModule.forRootAsync({
        useFactory: () => ({
          isRateLimitEnabled: true,
          isSlowDownEnabled: true,
          rateLimitOptions: {
            message: (limiterKey, statusCode) => JSON.stringify({
              message: '请求超限,请稍后再试',
              statusCode,
              error: 'TooManyRequests',
              limiterKey,
            }),
          },
        }),
      })],
      controllers: [TestRateLimitController, TestSlowDownController],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    $ = supertest(app.getHttpServer());
  });

  afterAll(() => app.close());

  describe('Rate Limit Tests', () => {

    it('default config, max 5 requests in 1 minute', async () => {
      await repeat(() => $.get('/rate-limit/test1').expect(200), 5);
      await sleep(59_000);
      await $.get('/rate-limit/test1').expect(429);
    }, 70_000);

    it('max 2 requests in 5 seconds', async () => {
      await repeat(() => $.get('/rate-limit/test2').expect(200), 2);
      await $.get('/rate-limit/test2').expect(429);
      await sleep(5_000);
      await $.get('/rate-limit/test2').expect(200);
    }, 10_000);
  });

  describe('Slow Down Tests', () => {

    it('default config, delay 1 more second after 1 request', async () => {
      const start = Date.now();
      await $.get('/slow-down/test1').expect(200);
      const requestTime = Date.now() - start;
      await $.get('/slow-down/test1').expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(1000);
      await $.get('/slow-down/test1').expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(2000);
      await $.get('/slow-down/test1').expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(4000);
    }, 10_000);

    it('In 5 seconds, delay 1 more second after 2 requests', async () => {
      const start = Date.now();
      await $.get('/slow-down/test2').expect(200);
      const requestTime = Date.now() - start;
      await $.get('/slow-down/test2').expect(200);

      await $.get('/slow-down/test2').expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(1000);
      await $.get('/slow-down/test2').expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(2000);

      await sleep(2000);
      const start2 = Date.now();
      await repeat(() => $.get('/slow-down/test2').expect(200), 2);
      expect(Date.now() - start2 - requestTime * 2).toBeLessThanOrEqual(1000);
    }, 20_000);
  });
});
