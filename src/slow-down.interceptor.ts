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
import * as SlowDown from 'express-slow-down';
import * as _ from 'lodash';
import { BaseLimiterInterceptor } from './base-limiter.interceptor';
import { LIMITER_SD_OPTIONS } from './constants';

type RequestHandler = import('express').RequestHandler;

@Injectable()
export class SlowDownInterceptor extends BaseLimiterInterceptor implements NestInterceptor {
  protected prefix = 'SD';
  protected metaKey = LIMITER_SD_OPTIONS;
  private holder: Map<string, RequestHandler> = new Map();

  protected isEnabled() {
    return this.options.isSlowDownEnabled;
  }

  protected getLimiter(key: string, options: SlowDown.Options): RequestHandler {
    if (!this.holder.has(key)) {
      options = _.defaults({}, options, this.options.slowDownOptions);
      this.holder.set(
        key,
        SlowDown({
          store: this.createStore(key, options.windowMs / 1000),
          ...options,
        }),
      );
    }
    return this.holder.get(key);
  }
}
