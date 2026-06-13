import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyKey } from '../../database/entities/idempotency-key.entity';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let mockRepo: any;
  let mockReflector: any;

  const createMockContext = (headers: Record<string, string> = {}, user: any = { id: 'user-1' }) => {
    const request = { headers, user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (response: any = { success: true }) => ({
    handle: () => of(response),
  } as CallHandler);

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockResolvedValue({}),
    };

    mockReflector = {
      get: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyInterceptor,
        { provide: Reflector, useValue: mockReflector },
        { provide: getRepositoryToken(IdempotencyKey), useValue: mockRepo },
      ],
    }).compile();

    interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);
  });

  it('should pass through when decorator is not present', async () => {
    mockReflector.get.mockReturnValue(false);
    const ctx = createMockContext({ 'x-idempotency-key': 'key-1' });
    const handler = createMockCallHandler({ data: 'new' });

    const result$ = await interceptor.intercept(ctx, handler);
    const result = await result$.toPromise();
    expect(result).toEqual({ data: 'new' });
  });

  it('should pass through when no idempotency key header', async () => {
    const ctx = createMockContext({});
    const handler = createMockCallHandler({ data: 'new' });

    const result$ = await interceptor.intercept(ctx, handler);
    const result = await result$.toPromise();
    expect(result).toEqual({ data: 'new' });
  });

  it('should return cached response for duplicate request', async () => {
    const cachedResponse = { id: 'existing', status: 'created' };
    mockRepo.findOne.mockResolvedValue({
      key: 'key-1',
      user_id: 'user-1',
      response_json: cachedResponse,
      expires_at: new Date(Date.now() + 86400000),
    });

    const ctx = createMockContext({ 'x-idempotency-key': 'key-1' });
    const handler = createMockCallHandler({ data: 'should-not-reach' });

    const result$ = await interceptor.intercept(ctx, handler);
    const result = await result$.toPromise();
    expect(result).toEqual(cachedResponse);
    expect(handler.handle).not.toHaveBeenCalled;
  });

  it('should save response for new idempotency key', async () => {
    const ctx = createMockContext({ 'x-idempotency-key': 'new-key' });
    const newResponse = { id: 'new-entity', status: 'created' };
    const handler = createMockCallHandler(newResponse);

    const result$ = await interceptor.intercept(ctx, handler);
    await result$.toPromise();

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'new-key',
        user_id: 'user-1',
        response_json: newResponse,
      }),
    );
  });

  it('should handle duplicate key constraint gracefully', async () => {
    mockRepo.save.mockRejectedValue({ code: '23505' });
    const ctx = createMockContext({ 'x-idempotency-key': 'race-key' });
    const handler = createMockCallHandler({ success: true });

    const result$ = await interceptor.intercept(ctx, handler);
    const result = await result$.toPromise();
    expect(result).toEqual({ success: true });
  });
});
