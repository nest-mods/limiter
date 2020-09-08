/*
 * Created by Diluka on 2020/1/21.
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

import { Injectable, NestInterceptor } from '@nestjs/common';
import * as RateLimit from 'express-rate-limit';
import * as _ from 'lodash';
import { BaseLimiterInterceptor } from './base-limiter.interceptor';
import { LIMITER_RL_OPTIONS } from './constants';

type RequestHandler = import('express').RequestHandler;

@Injectable()
export class RateLimitInterceptor extends BaseLimiterInterceptor implements NestInterceptor {
  protected prefix = 'RL';
  protected metaKey = LIMITER_RL_OPTIONS;
  private holder: Map<string, RequestHandler> = new Map();

  protected isEnabled() {
    return this.options.isRateLimitEnabled;
  }

  protected getLimiter(
    key: string,
    options: RateLimit.Options,
  ): RequestHandler {
    if (!this.holder.has(key)) {
      options = _.defaults({}, options, this.options.rateLimitOptions);
      const { message: messageOrFn, ...others } = options;
      let message;
      if (_.isFunction(messageOrFn)) {
        message = messageOrFn(key, options.statusCode);
      } else {
        message = messageOrFn;
      }
      this.holder.set(
        key,
        RateLimit({
          store: this.createStore(key, options.windowMs / 1000),
          message,
          ...others,
        }),
      );
    }
    return this.holder.get(key);
  }
}
