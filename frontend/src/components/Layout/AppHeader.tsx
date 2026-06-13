import { Layout, Space, Badge, Dropdown, Avatar, Typography } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../../services/notifications.service';

const { Header } = Layout;
const { Text } = Typography;

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = (unreadData as any)?.data?.count || 0;

  const dropdownItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
      <Space size={24}>
        <Badge count={unreadCount} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/notifications')} />
        </Badge>
        <Dropdown menu={{ items: dropdownItems, onClick: handleMenuClick }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{user?.username}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
