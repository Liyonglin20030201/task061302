# 校园实训排课管理系统

## 项目概述

基于 React + NestJS + PostgreSQL 的校园实训排课管理系统，支持自动排课、冲突检测、调课审批、消息通知和数据统计。

## 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 前端 | React + Vite + Ant Design + React Query + Zustand | React 18 / AntD 5 |
| 后端 | NestJS + TypeORM + Passport JWT | NestJS 10 / TypeORM 0.3 |
| 数据库 | PostgreSQL | 16-alpine (Docker) |
| 包管理 | npm workspaces | monorepo |

## 本地开发环境启动

```bash
# 1. 启动 PostgreSQL (需要 Docker)
docker compose up -d

# 2. 安装依赖
npm install

# 3. 初始化种子数据
cd backend && npm run seed && cd ..

# 4. 启动前后端开发服务器
npm run dev
```

- 后端 API: http://localhost:3000/api/v1
- Swagger 文档: http://localhost:3000/api/docs
- 前端界面: http://localhost:5173

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher1 / teacher2 / teacher3 | teacher123 |

## 数据库表结构

### ER 关系

```
User (1:1) → Teacher (1:N) → TeacherAvailability
User (1:N) → Notification
User (1:N) → AuditLog
Teacher (1:N) → CoursePlan ← Course
Class (1:N) → CoursePlan
CoursePlan (1:N) → Schedule ← TrainingRoom
Schedule (1:N) → ScheduleHistory
Schedule (1:N) → ScheduleChange
User (1:N) → IdempotencyKey
```

### 实体详细定义

#### users - 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| username | varchar(100) UNIQUE | 用户名 |
| password_hash | varchar(255) | bcrypt哈希密码 |
| role | enum(admin/teacher/student) | 角色 |
| status | enum(active/inactive) | 状态 |
| created_at / updated_at | timestamp | 时间戳 |

#### teachers - 教师表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| user_id | UUID FK → users | 关联用户 |
| name | varchar(50) | 姓名 |
| employee_no | varchar(20) UNIQUE | 工号 |
| title | varchar(50) | 职称 |
| department | varchar(100) | 系部 |
| phone | varchar(20) | 电话 |
| email | varchar(100) | 邮箱 |
| qualifications | jsonb | 资质证书 |

#### teacher_availability - 教师可用时间
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| teacher_id | UUID FK → teachers | 教师ID |
| day_of_week | smallint (1-7) | 星期几 |
| period | smallint (1-12) | 第几节课 |
| is_available | boolean | 是否可用 |
| **UNIQUE** | (teacher_id, day_of_week, period) | 联合唯一约束 |

#### classes - 班级表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| name | varchar(100) | 班级名称 |
| grade | varchar(10) | 年级 |
| major | varchar(100) | 专业 |
| student_count | int | 学生人数 |
| department | varchar(100) | 系部 |

#### training_rooms - 实训室表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| name | varchar(100) | 实训室名称 |
| building | varchar(100) | 楼栋 |
| floor | varchar(10) | 楼层 |
| capacity | int | 容纳人数 |
| equipment_type | varchar(50) | 设备类型 |
| equipment_count | int | 设备数量 |
| status | enum(available/maintenance/disabled) | 状态 |

#### courses - 课程表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| name | varchar(100) | 课程名称 |
| code | varchar(20) UNIQUE | 课程代码 |
| hours | int | 总课时 |
| course_type | varchar(50) | 课程类型(对应设备类型) |
| description | text | 描述 |

#### course_plans - 教学计划表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| semester | varchar(20) | 学期 (如 2024-2025-1) |
| course_id | UUID FK → courses | 课程 |
| teacher_id | UUID FK → teachers | 教师 |
| class_id | UUID FK → classes | 班级 |
| planned_hours | int | 计划课时 |
| status | enum(draft/approved/scheduled) | 状态 |

#### schedules - 排课表 (核心)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| course_plan_id | UUID FK → course_plans | 教学计划 |
| room_id | UUID FK → training_rooms | 实训室 |
| day_of_week | smallint (1-7) | 星期几 |
| period | smallint (1-12) | 第几节课 |
| week_start | smallint | 开始周次 |
| week_end | smallint | 结束周次 |
| version | int | 乐观锁版本号 (@VersionColumn) |
| status | enum(active/cancelled) | 状态 |
| **INDEX** | (room_id, day_of_week, period) | 冲突检测索引 |

#### schedule_changes - 调课申请表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| schedule_id | UUID FK → schedules | 原排课 |
| requester_id | UUID FK → users | 申请人 |
| original_room_id / new_room_id | UUID | 原/新实训室 |
| original_day_of_week / new_day_of_week | smallint | 原/新星期 |
| original_period / new_period | smallint | 原/新节次 |
| original_week_start / new_week_start | smallint | 原/新起始周 |
| original_week_end / new_week_end | smallint | 原/新结束周 |
| reason | text | 调课原因 |
| status | enum(pending/approved/rejected) | 审批状态 |
| approver_id | UUID FK → users | 审批人 |
| approved_at | timestamp | 审批时间 |

#### schedule_history - 排课变更历史
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| schedule_id | UUID FK → schedules | 排课ID |
| action | varchar(50) | 操作: created/updated/cancelled/change_approved |
| changed_by | UUID | 操作人 |
| changed_at | timestamp | 操作时间 |
| snapshot_json | jsonb | 快照(完整状态) |

#### notifications - 消息通知表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| user_id | UUID FK → users | 接收者 |
| title | varchar(200) | 标题 |
| content | text | 内容 |
| type | varchar(50) | 类型 |
| is_read | boolean | 是否已读 |
| **INDEX** | (user_id, is_read) | 未读查询索引 |

#### audit_logs - 操作日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| user_id | UUID FK → users | 操作人 |
| action | varchar(20) | 操作类型: CREATE/UPDATE/DELETE/LOGIN |
| resource_type | varchar(50) | 资源类型 |
| resource_id | UUID | 资源ID |
| details_json | jsonb | 详细信息 |
| ip_address | varchar(45) | IP地址 |
| **INDEX** | (user_id, created_at), (resource_type, resource_id) | 查询索引 |

#### idempotency_keys - 幂等键表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 主键 |
| key | varchar(255) UNIQUE | 幂等键 |
| user_id | UUID FK → users | 用户ID |
| response_json | jsonb | 缓存响应 |
| expires_at | timestamp | 过期时间(24h) |

## 后端接口定义

所有接口前缀: `/api/v1`

### 认证模块 /auth
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /auth/login | 登录(返回 access_token + refresh_token) | 公开 |
| POST | /auth/refresh | 刷新令牌 | 公开 |
| GET | /auth/profile | 获取当前用户信息 | 登录 |

### 用户管理 /users
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /users | 用户列表(分页) | admin |
| POST | /users | 创建用户 | admin |
| GET | /users/:id | 用户详情 | admin |
| PATCH | /users/:id | 更新用户 | admin |
| DELETE | /users/:id | 删除用户 | admin |

### 教师管理 /teachers
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /teachers | 教师列表 | 登录 |
| POST | /teachers | 创建教师 | admin |
| GET | /teachers/:id | 教师详情 | 登录 |
| PATCH | /teachers/:id | 更新教师 | admin |
| DELETE | /teachers/:id | 删除教师 | admin |
| GET | /teachers/:id/availability | 获取可用时间 | 登录 |
| PUT | /teachers/:id/availability | 设置可用时间 | admin/teacher |

### 班级管理 /classes
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /classes | 班级列表 | 登录 |
| POST | /classes | 创建班级 | admin |
| GET | /classes/:id | 班级详情 | 登录 |
| PATCH | /classes/:id | 更新班级 | admin |
| DELETE | /classes/:id | 删除班级 | admin |

### 实训室管理 /rooms
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /rooms | 实训室列表 | 登录 |
| POST | /rooms | 创建实训室 | admin |
| GET | /rooms/available | 查询可用实训室 | 登录 |
| GET | /rooms/:id | 实训室详情 | 登录 |
| PATCH | /rooms/:id | 更新实训室 | admin |
| DELETE | /rooms/:id | 删除实训室 | admin |

### 课程管理 /courses
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /courses | 课程列表 | 登录 |
| POST | /courses | 创建课程 | admin |
| GET | /courses/:id | 课程详情 | 登录 |
| PATCH | /courses/:id | 更新课程 | admin |
| DELETE | /courses/:id | 删除课程 | admin |

### 教学计划 /course-plans
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /course-plans | 计划列表 | 登录 |
| POST | /course-plans | 创建计划 | admin |
| POST | /course-plans/batch | 批量创建 | admin |
| GET | /course-plans/:id | 计划详情 | 登录 |
| PATCH | /course-plans/:id | 更新计划 | admin |
| DELETE | /course-plans/:id | 删除计划 | admin |

### 排课管理 /schedules
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /schedules | 排课列表(支持按学期/教师/班级/教室过滤) | 登录 |
| POST | /schedules | 手动排课 | admin |
| POST | /schedules/auto-generate | 自动排课 | admin |
| POST | /schedules/check-conflicts | 冲突检测 | 登录 |
| GET | /schedules/:id | 排课详情 | 登录 |
| PATCH | /schedules/:id | 更新排课(需要version字段) | admin |
| DELETE | /schedules/:id | 取消排课 | admin |

### 调课管理 /schedule-changes
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /schedule-changes | 调课申请列表 | 登录 |
| POST | /schedule-changes | 提交调课申请 | 登录 |
| PATCH | /schedule-changes/:id/approve | 审批通过 | admin |
| PATCH | /schedule-changes/:id/reject | 审批拒绝 | admin |

### 消息通知 /notifications
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /notifications | 我的通知列表 | 登录 |
| GET | /notifications/unread-count | 未读数量 | 登录 |
| PATCH | /notifications/:id/read | 标记已读 | 登录 |
| PATCH | /notifications/read-all | 全部已读 | 登录 |

### 数据统计 /statistics
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /statistics/overview | 概览(总数统计) | 登录 |
| GET | /statistics/room-utilization | 实训室利用率 | 登录 |
| GET | /statistics/teacher-workload | 教师工作量 | 登录 |
| GET | /statistics/class-hours | 班级课时统计 | 登录 |

### 操作日志 /audit-logs
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /audit-logs | 日志列表(支持过滤) | admin |

## 核心业务处理流程

### 1. 自动排课算法

```
1. 加载指定学期已审批的教学计划
2. 加载可用实训室列表 (status=available)
3. 加载相关教师可用时间
4. 按约束密度排序 (教师可用时间少 + 班级人数多 = 约束更强, 优先安排)
5. 预加载已有排课到占用表 (room/teacher/class occupancy maps)
6. 对每个教学计划:
   a. 计算每周需要几节课 = planned_hours / (2 × 18周)
   b. 对每次课, 查找候选时段:
      - 筛选容量 ≥ 班级人数的实训室
      - 筛选设备类型匹配的实训室
      - 检查教师在该时段是否可用
      - 检查周次范围内无占用冲突 (教室/教师/班级)
   c. 对候选时段评分:
      - 上午 (+10), 周中 (+5), 晚间 (-10)
      - 教师当天已有课越多分越低 (-3/节)
   d. 选最高分时段, 创建排课记录
   e. 更新占用表, 记录历史
7. 更新计划状态为 scheduled
8. 返回排课结果 (成功数 + 失败原因)
```

### 2. 冲突检测流程

```
输入: roomId, teacherId, classId, dayOfWeek, period, weekStart, weekEnd
1. 查询 schedules 表中 status=active 且:
   - 同 day_of_week + 同 period
   - week_start ≤ 输入weekEnd AND week_end ≥ 输入weekStart (周次重叠)
2. 遍历重叠排课, 检查:
   - room.id == 输入roomId → 教室冲突
   - teacher.id == 输入teacherId → 教师冲突
   - class.id == 输入classId → 班级冲突
3. 返回冲突列表 [{type, scheduleId, description}]
```

### 3. 调课审批流程

```
教师提交 → 系统保存原始快照 + 新值 → 状态: pending
管理员审批通过:
  1. 更新 schedules 表 (新时间/教室)
  2. 写入 schedule_history (含 original + new 快照)
  3. 更新 schedule_changes.status = approved
  4. 发送通知给申请人
管理员拒绝:
  1. 更新 schedule_changes.status = rejected
  2. 发送通知给申请人 (附拒绝原因)
  3. 不修改 schedules 表
```

### 4. 并发冲突控制 (乐观锁)

```
前端获取排课: 得到 version=N
前端提交修改: body 中携带 version=N
后端执行: UPDATE schedules SET ... WHERE id=:id AND version=N
  - affected=1 → 成功, version自动+1
  - affected=0 → 抛出 409 Conflict, 提示用户刷新重试
```

### 5. 幂等性防重复提交

```
前端请求: 携带 x-idempotency-key 头 (UUID)
后端拦截器:
  1. 查询 idempotency_keys 表 (key + user_id, 未过期)
  2. 已存在 → 直接返回缓存的 response_json
  3. 不存在 → 执行业务逻辑, 保存响应到表 (24h过期)
  4. 并发重复 key (唯一约束冲突) → 静默忽略
```

### 6. 权限控制

```
全局 JWT Guard → 所有接口需登录 (除 @Public 标记的)
角色装饰器: @Roles('admin') → RolesGuard 校验 user.role
教师操作过滤: 教师角色仅能看到自己相关的排课/调课
```

### 7. 历史记录保留

```
任何排课变更 (创建/更新/取消/调课审批) 都写入 schedule_history:
  - action: 操作类型
  - changed_by: 操作人
  - snapshot_json: 变更前后完整状态快照
调课申请自身保留 original_* 和 new_* 双份数据, 确保历史不被覆盖
```

## 测试检查点

### 单元测试 (33个)

运行: `cd backend && npm test`

| 模块 | 测试文件 | 覆盖点 |
|------|----------|--------|
| 冲突检测 | conflict-detection.service.spec.ts | 教室/教师/班级冲突、多重冲突、周次重叠、排除自身 |
| 排课服务 | schedules.service.spec.ts | 乐观锁冲突409、成功更新、历史记录、软删除 |
| 调课审批 | schedule-changes.service.spec.ts | 快照保存、审批更新、历史写入、通知发送、拒绝不改排课 |
| 幂等拦截器 | idempotency.interceptor.spec.ts | 缓存返回、新请求保存、无key跳过、无装饰器跳过、并发容错 |
| 统计服务 | statistics.service.spec.ts | 利用率计算、工作量统计、学期过滤 |

### 关键业务测试检查点

1. **重复提交防护**
   - 同一 idempotency-key 只执行一次业务逻辑
   - 第二次请求返回第一次的响应
   - 并发竞争时唯一约束不报错

2. **权限边界**
   - 教师不能创建/删除排课
   - 教师不能审批调课申请
   - 未登录用户被401拒绝
   - 教师只能看到自己的调课记录

3. **历史记录不被覆盖**
   - 调课审批写入包含 original 和 new 的完整快照
   - 每次排课变更都独立写入 schedule_history
   - 即使多次调课, 每次都有独立历史

4. **并发冲突**
   - 版本号不匹配返回 409 Conflict
   - 提示用户"数据已被修改, 请刷新重试"
   - 不会静默覆盖他人修改

5. **统计数据准确性**
   - 统计仅计算 status=active 的排课
   - 利用率 = 已排节次 / (5天 × 10节) × 100%
   - 支持按学期隔离统计

6. **排课冲突检测**
   - 同教室 + 同时段 + 周次重叠 → 教室冲突
   - 同教师 + 同时段 + 周次重叠 → 教师冲突
   - 同班级 + 同时段 + 周次重叠 → 班级冲突
   - 设备数量限制: 实训室 capacity 和 equipment_count

## 项目结构

```
task061302/
├── docker-compose.yml          # PostgreSQL 16
├── package.json                # npm workspaces
├── backend/
│   ├── .env                    # 环境变量
│   ├── package.json
│   ├── src/
│   │   ├── main.ts             # 入口 (Swagger/CORS/Helmet/Validation/ExceptionFilter)
│   │   ├── app.module.ts       # 根模块 (全局Guard/Interceptor)
│   │   ├── database/
│   │   │   ├── entities/       # 15个TypeORM实体
│   │   │   ├── data-source.ts  # TypeORM数据源配置
│   │   │   └── seeds/run-seed.ts
│   │   ├── common/
│   │   │   ├── decorators/     # @Roles, @CurrentUser, @Idempotent, @Public
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   ├── interceptors/   # AuditInterceptor, IdempotencyInterceptor
│   │   │   ├── filters/        # AllExceptionsFilter
│   │   │   └── dto/            # PaginationDto, ApiResponseDto
│   │   └── modules/
│   │       ├── auth/           # JWT登录/刷新
│   │       ├── users/          # 用户CRUD
│   │       ├── teachers/       # 教师+可用时间
│   │       ├── classes/        # 班级CRUD
│   │       ├── rooms/          # 实训室CRUD+可用查询
│   │       ├── courses/        # 课程CRUD
│   │       ├── course-plans/   # 教学计划+批量
│   │       ├── schedules/      # 排课+自动排课+冲突检测
│   │       ├── schedule-changes/ # 调课申请+审批
│   │       ├── notifications/  # 消息通知
│   │       ├── statistics/     # 数据统计看板
│   │       └── audit-logs/     # 操作日志
│   └── test/                   # e2e测试
└── frontend/
    ├── package.json
    ├── vite.config.ts          # 代理 /api → localhost:3000
    └── src/
        ├── main.tsx
        ├── App.tsx             # 路由配置
        ├── store/              # Zustand (auth)
        ├── services/           # Axios API层
        ├── components/Layout/  # 布局组件
        └── pages/              # 11个页面
            ├── Login/
            ├── Dashboard/      # 统计看板
            ├── Teachers/
            ├── Classes/
            ├── Rooms/
            ├── Courses/
            ├── CoursePlans/
            ├── Schedules/      # 课表网格视图
            ├── ScheduleChanges/
            ├── Notifications/
            └── AuditLogs/
```

## 安全机制

| 机制 | 实现方式 |
|------|----------|
| 认证 | JWT (1h access + 7d refresh), bcrypt 12轮 |
| 授权 | 全局 JwtAuthGuard + RolesGuard |
| 限流 | ThrottlerGuard 30次/60秒 |
| 输入验证 | ValidationPipe (whitelist + forbidNonWhitelisted) |
| HTTP安全头 | helmet |
| CORS | 仅允许 localhost:5173 |
| 统一异常处理 | AllExceptionsFilter |
| 操作审计 | AuditInterceptor (自动记录POST/PATCH/PUT/DELETE) |
| 幂等防重 | IdempotencyInterceptor + x-idempotency-key |
| 并发控制 | @VersionColumn 乐观锁 |

## 常用命令

```bash
# 启动开发环境
npm run dev

# 仅启动后端
cd backend && npm run dev

# 仅启动前端
cd frontend && npm run dev

# 运行测试
cd backend && npm test

# 构建生产版本
npm run build

# 数据库种子
cd backend && npm run seed

# 查看API文档
open http://localhost:3000/api/docs
```
