import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { LoginDto } from './dto/login.dto';
import { UserStatus, UserRole } from '../../database/entities/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let teacherId: string | undefined;
    if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherRepo.findOne({ where: { user_id: user.id } });
      teacherId = teacher?.id;
    }

    const payload = { sub: user.id, username: user.username, role: user.role, teacherId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teacherId,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid token');
      }

      let teacherId: string | undefined;
      if (user.role === UserRole.TEACHER) {
        const teacher = await this.teacherRepo.findOne({ where: { user_id: user.id } });
        teacherId = teacher?.id;
      }

      const newPayload = { sub: user.id, username: user.username, role: user.role, teacherId };
      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    let teacherId: string | undefined;
    if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherRepo.findOne({ where: { user_id: user.id } });
      teacherId = teacher?.id;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      teacherId,
      createdAt: user.created_at,
    };
  }

  async validateUser(payload: { sub: string; username: string; role: string; teacherId?: string }) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE) return null;
    return { id: user.id, username: user.username, role: user.role, teacherId: payload.teacherId };
  }
}
