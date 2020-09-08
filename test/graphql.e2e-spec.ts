import { INestApplication } from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import gql from 'graphql-tag';
import { LimiterModule, UseRateLimit, UseSlowDown } from '../src';
import { createTestGraphqlClient, GQLClient } from './util/create-test-graphql-client';
import { repeat } from './util/repeat';
import { sleep } from './util/sleep';

@Resolver()
class TestRateLimitResolver {

  @UseRateLimit()
  @Query(() => String)
  async test1() {
    return 'ok';
  }

  @UseRateLimit({
    max: 2,
    windowMs: 5_000,
  })
  @Query(() => String)
  async test2() {
    return 'ok';
  }
}

@Resolver()
class TestSlowDownResolver {
  @UseSlowDown()
  @Query(() => String)
  async test3() {
    return 'ok';
  }

  @UseSlowDown({
    windowMs: 5_000,
    delayMs: 1_000,
    delayAfter: 2,
  })
  @Query(() => String)
  async test4() {
    return 'ok';
  }
}

describe('Limiter GraphQL Tests', () => {

  let app: INestApplication;
  let client: GQLClient;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        LimiterModule.forRootAsync({
          useFactory: () => ({
            isRateLimitEnabled: true,
            isSlowDownEnabled: true,
          }),
        }),
        GraphQLModule.forRoot({
          autoSchemaFile: './test/schema.graphql',
        }),
      ],
      providers: [TestRateLimitResolver, TestSlowDownResolver],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    client = createTestGraphqlClient(app);
  });

  afterAll(() => app.close());

  describe('Rate Limit Tests', () => {

    it('default config, max 5 requests in 1 minute', async () => {
      await repeat(() => client(gql`query {test1}`).expect(200), 5);
      await sleep(59_000);
      await client(gql`query {test1}`).expect(429);
    }, 70_000);

    it('max 2 requests in 5 seconds', async () => {
      await repeat(() => client(gql`query {test2}`).expect(200), 2);
      await client(gql`query {test2}`).expect(429);
      await sleep(5_000);
      await client(gql`query {test2}`).expect(200);
    }, 10_000);
  });

  describe('Slow Down Tests', () => {

    it('default config, delay 1 more second after 1 request', async () => {
      const start = Date.now();
      await client(gql`query {test3}`).expect(200);
      const requestTime = Date.now() - start;
      await client(gql`query {test3}`).expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(1000);
      await client(gql`query {test3}`).expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(2000);
      await client(gql`query {test3}`).expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(4000);
    }, 10_000);

    it('In 5 seconds, delay 1 more second after 2 requests', async () => {
      const start = Date.now();
      await client(gql`query {test4}`).expect(200);
      const requestTime = Date.now() - start;
      await client(gql`query {test4}`).expect(200);

      await client(gql`query {test4}`).expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(1000);
      await client(gql`query {test4}`).expect(200);
      expect(Date.now() - start - requestTime).toBeGreaterThanOrEqual(2000);

      await sleep(2000);
      const start2 = Date.now();
      await repeat(() => client(gql`query {test4}`).expect(200), 2);
      expect(Date.now() - start2 - requestTime * 2).toBeLessThanOrEqual(1000);
    }, 20_000);
  });
});
