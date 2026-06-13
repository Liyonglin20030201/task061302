import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'campus_admin',
  password: process.env.DB_PASSWORD || 'dev_password',
  database: process.env.DB_NAME || 'campus_scheduling',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected, seeding...');

  const passwordHash = await bcrypt.hash('admin123', 12);
  const teacherHash = await bcrypt.hash('teacher123', 12);

  // Create admin user
  await AppDataSource.query(`
    INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'admin', $1, 'admin', 'active', NOW(), NOW())
    ON CONFLICT (username) DO NOTHING
  `, [passwordHash]);

  // Create teacher users
  const teacherUsers = [
    { username: 'teacher1', name: '张三', empNo: 'T001', dept: '计算机系' },
    { username: 'teacher2', name: '李四', empNo: 'T002', dept: '机械系' },
    { username: 'teacher3', name: '王五', empNo: 'T003', dept: '电子系' },
  ];

  for (const t of teacherUsers) {
    await AppDataSource.query(`
      INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'teacher', 'active', NOW(), NOW())
      ON CONFLICT (username) DO NOTHING
    `, [t.username, teacherHash]);

    const userResult = await AppDataSource.query(
      `SELECT id FROM users WHERE username = $1`, [t.username]
    );
    if (userResult.length > 0) {
      await AppDataSource.query(`
        INSERT INTO teachers (id, user_id, name, employee_no, title, department, phone, email, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, '讲师', $4, '13800000000', $5, NOW(), NOW())
        ON CONFLICT (employee_no) DO NOTHING
      `, [userResult[0].id, t.name, t.empNo, t.dept, `${t.username}@campus.edu`]);

      // Set teacher availability (Mon-Fri, periods 1-10)
      const teacherResult = await AppDataSource.query(
        `SELECT id FROM teachers WHERE employee_no = $1`, [t.empNo]
      );
      if (teacherResult.length > 0) {
        for (let day = 1; day <= 5; day++) {
          for (let period = 1; period <= 10; period++) {
            await AppDataSource.query(`
              INSERT INTO teacher_availability (id, teacher_id, day_of_week, period, is_available, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
              ON CONFLICT ON CONSTRAINT uq_teacher_day_period DO NOTHING
            `, [teacherResult[0].id, day, period]);
          }
        }
      }
    }
  }

  // Create classes
  const classes = [
    { name: '计算机2024-1班', grade: '2024', major: '计算机科学与技术', count: 40, dept: '计算机系' },
    { name: '计算机2024-2班', grade: '2024', major: '计算机科学与技术', count: 38, dept: '计算机系' },
    { name: '机械2024-1班', grade: '2024', major: '机械工程', count: 35, dept: '机械系' },
    { name: '电子2024-1班', grade: '2024', major: '电子信息工程', count: 42, dept: '电子系' },
  ];

  for (const c of classes) {
    await AppDataSource.query(`
      INSERT INTO classes (id, name, grade, major, student_count, department, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [c.name, c.grade, c.major, c.count, c.dept]);
  }

  // Create training rooms
  const rooms = [
    { name: '计算机实训室A', building: '实训楼', floor: '3F', capacity: 50, eqType: 'computer', eqCount: 50 },
    { name: '计算机实训室B', building: '实训楼', floor: '3F', capacity: 45, eqType: 'computer', eqCount: 45 },
    { name: '数控实训室', building: '实训楼', floor: '1F', capacity: 30, eqType: 'CNC', eqCount: 15 },
    { name: '电子实训室', building: '实训楼', floor: '2F', capacity: 40, eqType: 'electronics', eqCount: 40 },
    { name: '焊接实训室', building: '实训楼', floor: '1F', capacity: 25, eqType: 'welding', eqCount: 12 },
  ];

  for (const r of rooms) {
    await AppDataSource.query(`
      INSERT INTO training_rooms (id, name, building, floor, capacity, equipment_type, equipment_count, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'available', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [r.name, r.building, r.floor, r.capacity, r.eqType, r.eqCount]);
  }

  // Create courses
  const courses = [
    { name: 'Python程序设计实训', code: 'CS101', hours: 64, type: 'computer' },
    { name: '数据库应用实训', code: 'CS102', hours: 48, type: 'computer' },
    { name: '数控加工实训', code: 'ME101', hours: 80, type: 'CNC' },
    { name: '电子电路实训', code: 'EE101', hours: 56, type: 'electronics' },
    { name: 'Web前端开发实训', code: 'CS103', hours: 64, type: 'computer' },
  ];

  for (const c of courses) {
    await AppDataSource.query(`
      INSERT INTO courses (id, name, code, hours, course_type, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
    `, [c.name, c.code, c.hours, c.type]);
  }

  console.log('Seed completed successfully!');
  console.log('Default accounts:');
  console.log('  Admin: admin / admin123');
  console.log('  Teacher: teacher1 / teacher123');
  await AppDataSource.destroy();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
