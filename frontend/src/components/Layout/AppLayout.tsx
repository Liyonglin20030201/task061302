import { Layout, Menu, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  SwapOutlined,
  BellOutlined,
  AuditOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import AppHeader from './AppHeader';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/teachers', icon: <UserOutlined />, label: '教师管理' },
  { key: '/classes', icon: <TeamOutlined />, label: '班级管理' },
  { key: '/rooms', icon: <BankOutlined />, label: '实训室管理' },
  { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
  { key: '/course-plans', icon: <FileTextOutlined />, label: '课程计划' },
  { key: '/schedules', icon: <CalendarOutlined />, label: '排课管理' },
  { key: '/schedule-changes', icon: <SwapOutlined />, label: '调课管理' },
  { key: '/notifications', icon: <BellOutlined />, label: '消息通知' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: '操作日志', roles: ['admin'] },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { token: { colorBgContainer } } = theme.useToken();

  const filteredItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || ''),
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: colorBgContainer }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>
          排课管理系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredItems.map(({ roles, ...item }) => item)}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <AppHeader />
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
