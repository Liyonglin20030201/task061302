import { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, InputNumber, message, Popconfirm } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleChangesService } from '../../services/schedule-changes.service';
import { schedulesService } from '../../services/schedules.service';
import { useAuthStore } from '../../store/useAuthStore';

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审批' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
};

export default function ScheduleChangesPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['schedule-changes'],
    queryFn: () => scheduleChangesService.getAll(),
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules-list'],
    queryFn: () => schedulesService.getAll({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => scheduleChangesService.create(values),
    onSuccess: () => {
      message.success('调课申请已提交');
      queryClient.invalidateQueries({ queryKey: ['schedule-changes'] });
      setOpen(false);
    },
    onError: (err: any) => message.error(err?.message || '提交失败'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => scheduleChangesService.approve(id),
    onSuccess: () => {
      message.success('已批准');
      queryClient.invalidateQueries({ queryKey: ['schedule-changes'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => scheduleChangesService.reject(id),
    onSuccess: () => {
      message.success('已拒绝');
      queryClient.invalidateQueries({ queryKey: ['schedule-changes'] });
    },
  });

  const changes = (data as any)?.data?.data || (data as any)?.data || [];
  const schedules = (schedulesData as any)?.data?.data || (schedulesData as any)?.data || [];

  const columns = [
    { title: '课程', render: (_: any, r: any) => r.schedule?.coursePlan?.course?.name || '-' },
    { title: '申请人', render: (_: any, r: any) => r.requester?.username || '-' },
    { title: '原时间', render: (_: any, r: any) => `周${r.originalDayOfWeek} 第${r.originalPeriod}节` },
    { title: '新时间', render: (_: any, r: any) => `周${r.newDayOfWeek} 第${r.newPeriod}节` },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          {isAdmin && record.status === 'pending' && (
            <>
              <Button size="small" type="primary" onClick={() => approveMutation.mutate(record.id)}>批准</Button>
              <Popconfirm title="确认拒绝?" onConfirm={() => rejectMutation.mutate(record.id)}>
                <Button size="small" danger>拒绝</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>调课管理</h2>
        <Button type="primary" onClick={() => { form.resetFields(); setOpen(true); }}>申请调课</Button>
      </div>
      <Table dataSource={changes} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title="申请调课" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={createMutation.isPending} width={600}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="scheduleId" label="选择课程" rules={[{ required: true }]}>
            <Select placeholder="选择要调整的排课" options={schedules.map((s: any) => ({ value: s.id, label: `${s.coursePlan?.course?.name || '课程'} - 周${s.dayOfWeek} 第${s.period}节` }))} />
          </Form.Item>
          <Form.Item name="newDayOfWeek" label="新的星期" rules={[{ required: true }]}>
            <Select options={[1,2,3,4,5].map(d => ({ value: d, label: `周${['一','二','三','四','五'][d-1]}` }))} />
          </Form.Item>
          <Form.Item name="newPeriod" label="新的节次" rules={[{ required: true }]}>
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="调课原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
