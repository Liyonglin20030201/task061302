import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap((responseData) => {
          const pathParts = request.path.replace('/api/v1/', '').split('/');
          this.auditService.create({
            userId: request.user?.id,
            action: this.mapMethod(method),
            resourceType: pathParts[0] || 'unknown',
            resourceId: request.params?.id || responseData?.id,
            detailsJson: { body: request.body, params: request.params },
            ipAddress: request.ip,
          }).catch(() => {});
        }),
      );
    }
    return next.handle();
  }

  private mapMethod(method: string): string {
    const map: Record<string, string> = { POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE' };
    return map[method] || method;
  }
}
