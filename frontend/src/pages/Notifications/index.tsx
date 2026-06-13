import { List, Button, Badge, Typography, Empty, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../../services/notifications.service';

const { Text, Paragraph } = Typography;

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = (data as any)?.data?.data || (data as any)?.data || [];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>消息通知</h2>
        <Button icon={<CheckOutlined />} onClick={() => markAllMutation.mutate()}>全部已读</Button>
      </div>
      {notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <List
          loading={isLoading}
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item
              actions={!item.isRead ? [<Button size="small" onClick={() => markReadMutation.mutate(item.id)}>标记已读</Button>] : []}
              style={{ background: item.isRead ? 'transparent' : '#f6ffed', padding: '12px 16px', marginBottom: 8, borderRadius: 6 }}
            >
              <List.Item.Meta
                title={<Space><Badge status={item.isRead ? 'default' : 'processing'} /><Text strong={!item.isRead}>{item.title}</Text></Space>}
                description={<><Paragraph type="secondary" style={{ margin: 0 }}>{item.content}</Paragraph><Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</Text></>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
