import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { IDEMPOTENT_KEY } from '../decorators/idempotency.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isIdempotent = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler());
    if (!isIdempotent) return next.handle();

    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-idempotency-key'];
    if (!key) return next.handle();

    // Simplified: in real impl, check DB for existing key
    return next.handle();
  }
}
