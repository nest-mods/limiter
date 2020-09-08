import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LimiterModuleAsyncOptions } from './interfaces';
import { LimiterOptionsProvider } from './limiter-options.provider';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { SlowDownInterceptor } from './slow-down.interceptor';

@Global()
@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RateLimitInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SlowDownInterceptor },
  ],
})
export class LimiterModule {
  static forRootAsync(options: LimiterModuleAsyncOptions): DynamicModule {
    return {
      module: LimiterModule,
      imports: options.imports,
      providers: [{
        provide: LimiterOptionsProvider,
        useFactory: async (...args) => new LimiterOptionsProvider(await options.useFactory(...args)),
        inject: options.inject,
      }],
    };
  }
}
