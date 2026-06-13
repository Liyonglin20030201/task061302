# 校园实训排课管理系统

Campus Training Scheduling Management System

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design 5 + React Query + Zustand
- **后端**: NestJS 10 + TypeORM + PostgreSQL 16
- **认证**: JWT (access token + refresh token)
- **API文档**: Swagger (自动生成)

## 功能模块

| 模块 | 功能 |
|------|------|
| 账号登录 | JWT认证、角色权限(管理员/教师/学生) |
| 教师管理 | 教师档案CRUD、可用时间设置 |
| 班级管理 | 班级信息CRUD |
| 实训室管理 | 实训室CRUD、设备类型、容量管理 |
| 课程管理 | 课程信息CRUD |
| 课程计划 | 学期计划制定、批量创建 |
| 排课管理 | 课表视图、手动排课、自动排课 |
| 冲突检测 | 教室/教师/班级冲突实时检测 |
| 调课管理 | 调课申请、审批流程、历史记录 |
| 消息通知 | 系统通知推送、已读标记 |
| 数据看板 | 实训室利用率、教师工作量、班级课时统计 |
| 操作日志 | 全局操作审计日志 |

## 核心技术方案

| 问题 | 解决方案 |
|------|---------|
| 表单重复提交 | 幂等性键(X-Idempotency-Key请求头) + 前端防抖 |
| 权限越界 | JWT + RBAC守卫 + 资源所有权校验 |
| 调课历史覆盖 | 不可变历史表(schedule_history)快照记录 |
| 并发修改冲突 | 乐观锁(@VersionColumn + WHERE version = N) |
| 统计数据不准确 | 专用聚合查询 + 正确的JOIN和GROUP BY |

## 自动排课算法

采用约束满足 + 贪心分配策略:

1. 加载学期所有已审批的课程计划
2. 按约束密度排序(可用时间少、班级人数多的优先)
3. 对每个计划，搜索有效时间槽(无教师冲突、无班级冲突、无教室冲突、设备匹配、容量满足)
4. 对有效时间槽评分(偏好上午、均匀分布、避免间隙)
5. 选择最优时间槽分配
6. 更新占用矩阵，处理下一个计划

## 本地开发环境启动

### 前置要求

- Node.js 20+
- Docker + Docker Compose
- npm 9+

### 启动步骤

```bash
# 1. 安装依赖
npm install

# 2. 启动 PostgreSQL 数据库
docker compose up -d

# 3. 配置环境变量
cp backend/.env.example backend/.env

# 4. 启动开发服务器 (前后端同时启动)
npm run dev
```

首次启动后，后端会通过 TypeORM synchronize 自动创建表结构。

### 初始化数据

```bash
# 运行种子脚本创建默认账号和演示数据
cd backend
npx ts-node src/database/seeds/run-seed.ts
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端API | http://localhost:3000/api/v1 |
| Swagger文档 | http://localhost:3000/api/docs |

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher1 | teacher123 |

## 项目结构

```
├── backend/
│   ├── src/
│   │   ├── common/           # 守卫、装饰器、拦截器、过滤器
│   │   ├── database/
│   │   │   ├── entities/     # TypeORM实体定义
│   │   │   └── seeds/        # 数据种子
│   │   ├── modules/
│   │   │   ├── auth/         # 认证模块
│   │   │   ├── users/        # 用户管理
│   │   │   ├── teachers/     # 教师管理
│   │   │   ├── classes/      # 班级管理
│   │   │   ├── rooms/        # 实训室管理
│   │   │   ├── courses/      # 课程管理
│   │   │   ├── course-plans/ # 课程计划
│   │   │   ├── schedules/    # 排课(含自动排课算法)
│   │   │   ├── schedule-changes/ # 调课审批
│   │   │   ├── notifications/    # 消息通知
│   │   │   ├── statistics/       # 数据统计
│   │   │   └── audit-logs/       # 操作日志
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── test/                 # 测试文件
├── frontend/
│   ├── src/
│   │   ├── components/       # 通用组件(布局等)
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API服务层
│   │   ├── store/            # 状态管理(Zustand)
│   │   └── App.tsx           # 路由配置
│   └── index.html
├── docker-compose.yml        # PostgreSQL容器
└── package.json              # 工作区根配置
```

## API 接口概览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | /api/v1/auth/login | 登录 |
| 认证 | POST | /api/v1/auth/refresh | 刷新令牌 |
| 认证 | GET | /api/v1/auth/profile | 获取当前用户 |
| 教师 | GET/POST/PATCH/DELETE | /api/v1/teachers | CRUD |
| 教师 | GET/PUT | /api/v1/teachers/:id/availability | 可用时间 |
| 班级 | GET/POST/PATCH/DELETE | /api/v1/classes | CRUD |
| 实训室 | GET/POST/PATCH/DELETE | /api/v1/rooms | CRUD |
| 实训室 | GET | /api/v1/rooms/available | 查询可用实训室 |
| 课程 | GET/POST/PATCH/DELETE | /api/v1/courses | CRUD |
| 课程计划 | GET/POST/PATCH/DELETE | /api/v1/course-plans | CRUD |
| 课程计划 | POST | /api/v1/course-plans/batch | 批量创建 |
| 排课 | GET/POST/PATCH/DELETE | /api/v1/schedules | CRUD |
| 排课 | POST | /api/v1/schedules/auto-generate | 自动排课 |
| 排课 | POST | /api/v1/schedules/check-conflicts | 冲突检测 |
| 调课 | POST | /api/v1/schedule-changes | 提交调课申请 |
| 调课 | PATCH | /api/v1/schedule-changes/:id/approve | 审批通过 |
| 调课 | PATCH | /api/v1/schedule-changes/:id/reject | 审批拒绝 |
| 通知 | GET | /api/v1/notifications | 通知列表 |
| 通知 | GET | /api/v1/notifications/unread-count | 未读数 |
| 通知 | PATCH | /api/v1/notifications/:id/read | 标记已读 |
| 通知 | PATCH | /api/v1/notifications/read-all | 全部已读 |
| 统计 | GET | /api/v1/statistics/overview | 总览 |
| 统计 | GET | /api/v1/statistics/room-utilization | 实训室利用率 |
| 统计 | GET | /api/v1/statistics/teacher-workload | 教师工作量 |
| 统计 | GET | /api/v1/statistics/class-hours | 班级课时 |
| 日志 | GET | /api/v1/audit-logs | 审计日志 |

## 数据库表结构

共13张核心表:

- **users** - 用户账号(角色: admin/teacher/student)
- **teachers** - 教师档案
- **teacher_availability** - 教师可用时间
- **classes** - 班级信息
- **training_rooms** - 实训室资源
- **courses** - 课程定义
- **course_plans** - 课程计划(学期+课程+教师+班级)
- **schedules** - 排课结果(含版本号用于乐观锁)
- **schedule_changes** - 调课申请记录
- **schedule_history** - 排课变更历史(不可变快照)
- **notifications** - 系统通知
- **audit_logs** - 操作审计日志
- **idempotency_keys** - 幂等性键(防重复提交)

## 测试

```bash
# 后端单元测试
cd backend
npm test

# 后端端到端测试
npm run test:e2e
```

### 测试检查点

1. **认证流程**: 登录成功/失败、Token刷新、角色权限拦截
2. **排课冲突**: 教室冲突、教师冲突、班级冲突检测准确性
3. **自动排课**: 生成结果无冲突、约束全部满足
4. **乐观锁**: 并发更新返回409冲突
5. **幂等性**: 相同幂等键的重复请求返回缓存结果
6. **调课审批**: 状态流转正确、历史记录保留完整
7. **统计数据**: 利用率/工作量计算正确
