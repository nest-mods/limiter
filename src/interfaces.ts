/*
 * Created by Diluka on 2020-06-11.
 *
 *
 * ----------- 神 兽 佑 我 -----------
 *        ┏┓      ┏┓+ +
 *       ┏┛┻━━━━━━┛┻┓ + +
 *       ┃          ┃
 *       ┣     ━    ┃ ++ + + +
 *      ████━████   ┃+
 *       ┃          ┃ +
 *       ┃  ┴       ┃
 *       ┃          ┃ + +
 *       ┗━┓      ┏━┛  Code is far away from bug
 *         ┃      ┃       with the animal protecting
 *         ┃      ┃ + + + +
 *         ┃      ┃
 *         ┃      ┃ +
 *         ┃      ┃      +  +
 *         ┃      ┃    +
 *         ┃      ┗━━━┓ + +
 *         ┃          ┣┓
 *         ┃          ┏┛
 *         ┗┓┓┏━━━━┳┓┏┛ + + + +
 *          ┃┫┫    ┃┫┫
 *          ┗┻┛    ┗┻┛+ + + +
 * ----------- 永 无 BUG ------------
 */

import { ModuleMetadata } from '@nestjs/common/interfaces';
import * as RateLimit from 'express-rate-limit';
import * as SlowDown from 'express-slow-down';
import * as RedisStore from 'rate-limit-redis';

export type GetMessageFn = (limiterKey: string, statusCode: number) => string;

export interface RateLimitOptions extends Omit<RateLimit.Options, 'store' | 'message'> {
  message?: RateLimit.Options['message'] | GetMessageFn;
}

export interface SlowDownOptions extends Omit<SlowDown.Options, 'store'> {
}

export interface LimiterModuleOptions {
  isRateLimitEnabled?: boolean;
  isSlowDownEnabled?: boolean;
  windowMs?: number;
  redis?: RedisStore.Options['client'] | RedisStore.Options['redisURL']
  rateLimitOptions?: RateLimitOptions;
  slowDownOptions?: SlowDownOptions;
}

export interface LimiterModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<LimiterModuleOptions> | LimiterModuleOptions;
  inject?: any[];
}
