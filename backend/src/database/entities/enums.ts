export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  DISABLED = 'disabled',
}

export enum PlanStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export enum ChangeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
