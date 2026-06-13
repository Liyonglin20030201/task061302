import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ClassesModule } from './modules/classes/classes.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CoursePlansModule } from './modules/course-plans/course-plans.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ScheduleChangesModule } from './modules/schedule-changes/schedule-changes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { IdempotencyKey } from './database/entities/idempotency-key.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'campus_admin'),
        password: config.get('DB_PASSWORD', 'dev_password'),
        database: config.get('DB_NAME', 'campus_scheduling'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([IdempotencyKey]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    AuthModule,
    UsersModule,
    TeachersModule,
    ClassesModule,
    RoomsModule,
    CoursesModule,
    CoursePlansModule,
    SchedulesModule,
    ScheduleChangesModule,
    NotificationsModule,
    StatisticsModule,
    AuditLogsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
