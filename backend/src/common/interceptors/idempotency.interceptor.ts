import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { IDEMPOTENT_KEY } from '../decorators/idempotency.decorator';
import { IdempotencyKey } from '../../database/entities/idempotency-key.entity';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isIdempotent = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler());
    if (!isIdempotent) return next.handle();

    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-idempotency-key'];
    if (!key) return next.handle();

    const userId = request.user?.id;
    const existing = await this.idempotencyRepo.findOne({
      where: { key, user_id: userId, expires_at: MoreThan(new Date()) },
    });

    if (existing) {
      return of(existing.response_json);
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await this.idempotencyRepo.save(
            this.idempotencyRepo.create({
              key,
              user_id: userId,
              response_json: responseData,
              expires_at: expiresAt,
            }),
          );
        } catch (err) {
          if (err?.code === '23505') return;
          throw err;
        }
      }),
    );
  }
}
