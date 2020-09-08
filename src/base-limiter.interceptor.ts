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

import { CallHandler, ExecutionContext, Inject, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as RateLimit from 'express-rate-limit';
import * as SlowDown from 'express-slow-down';
import * as _ from 'lodash';
import * as RedisStore from 'rate-limit-redis';
import { Observable } from 'rxjs';
import * as uuid from 'uuid';
import { LimiterOptionsProvider } from './limiter-options.provider';

type GqlContextType = import('@nestjs/graphql').GqlContextType;
type RequestHandler = import('express').RequestHandler;

export abstract class BaseLimiterInterceptor implements NestInterceptor {
  protected logger = new Logger('limiter');

  @Inject() protected options: LimiterOptionsProvider;
  @Inject() private reflector: Reflector;

  protected abstract prefix: string;
  protected abstract metaKey: string;

  protected abstract isEnabled();

  protected abstract getLimiter(
    key: string,
    options: RateLimit.Options | SlowDown.Options,
  ): RequestHandler;

  protected createStore(key: string, expiry?: number) {
    if (!_.isEmpty(this.options.redis)) {
      if (_.isString(this.options.redis)) {
        return new RedisStore({
          expiry,
          redisURL: this.options.redis,
          prefix: `${this.prefix}:${key}:`,
        });
      } else {
        return new RedisStore({
          expiry,
          client: this.options.redis,
          prefix: `${this.prefix}:${key}:`,
        });
      }
    } else {
      this.logger.warn('no redis provided, using memory');
    }
  }

  async intercept(context: ExecutionContext, next: CallHandler) {
    if (!this.isEnabled()) {
      return next.handle();
    }

    const options = this.getOptions(context);
    if (!options) {
      return next.handle();
    }

    const req = this.getRequest(context);
    const res = this.getResponse(context);

    return new Promise<Observable<any>>((resolve, reject) => {
      this.getLimiter(this.getLimiterKey(context), options)(req, res, (err) => {
        if (err) {
          reject(err);
        }
        resolve(next.handle());
      });
    });
  }

  private getLimiterKey(context: ExecutionContext) {
    switch (context.getType<GqlContextType>()) {
      case 'http':
        const req = context.switchToHttp().getRequest();
        return `${req.path}:${req.method}`;
      case 'graphql':
        return `${context.getClass().name}:${context.getHandler().name}`;
      default:
        return uuid.v4();
    }
  }

  private getOptions(context: ExecutionContext) {
    const target = context.getClass();
    const method = context.getHandler();
    return this.reflector.getAllAndOverride(this.metaKey, [
      method,
      target,
    ]);
  }

  private getRequest(context: ExecutionContext) {
    switch (context.getType<GqlContextType>()) {
      case 'http':
        return context.switchToHttp().getRequest();
      case 'graphql':
        return require('@nestjs/graphql')
          .GqlExecutionContext.create(context)
          .getContext().req;
      default:
        return null;
    }
  }

  private getResponse(context: ExecutionContext) {
    switch (context.getType<GqlContextType>()) {
      case 'http':
        return context.switchToHttp().getResponse();
      case 'graphql':
        return require('@nestjs/graphql')
          .GqlExecutionContext.create(context)
          .getContext().req.res;
      default:
        return null;
    }
  }
}
