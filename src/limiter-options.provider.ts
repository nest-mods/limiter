import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { LimiterModuleOptions, RateLimitOptions, SlowDownOptions } from './interfaces';

@Injectable()
export class LimiterOptionsProvider {
  constructor(private options: LimiterModuleOptions) {
    const windowMs = this.options.windowMs ?? 60000;
    this.options.rateLimitOptions = _.defaults(this.options.rateLimitOptions, { windowMs, statusCode: 429 });
    this.options.slowDownOptions = _.defaults(this.options.slowDownOptions, { windowMs });
  }

  get rateLimitOptions(): RateLimitOptions {
    return this.options.rateLimitOptions;
  }

  get slowDownOptions(): SlowDownOptions {
    return this.options.slowDownOptions;
  }

  get redis() {
    return this.options.redis;
  }

  get isRateLimitEnabled() {
    return this.options.isRateLimitEnabled ?? false;
  }

  get isSlowDownEnabled() {
    return this.options.isSlowDownEnabled ?? false;
  }
}
