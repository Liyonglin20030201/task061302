import { useState } from 'react';
import { Card, Button, Select, Space, Table, Tag, Modal, Form, Input, message, Alert } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesService } from '../../services/schedules.service';
import { useAuthStore } from '../../store/useAuthStore';

const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const periodNames = Array.from({ length: 12 }, (_, i) => `第${i + 1}节`);

export default function SchedulesPage() {
  const [semester, setSemester] = useState('2025-2026-1');
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoForm] = Form.useForm();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', semester],
    queryFn: () => schedulesService.getAll({ semester, limit: 200 }),
  });

  const autoMutation = useMutation({
    mutationFn: (values: any) => schedulesService.autoGenerate({ semester: values.semester }),
    onSuccess: (res: any) => {
      const result = res?.data;
      message.success(`自动排课完成! 成功排课 ${result?.scheduled || 0} 门`);
      if (result?.failed?.length > 0) {
        message.warning(`${result.failed.length} 门课程排课失败`);
      }
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setAutoOpen(false);
    },
    onError: (err: any) => message.error(err?.message || '自动排课失败'),
  });

  const schedules = (data as any)?.data?.data || (data as any)?.data || [];

  // Build timetable grid
  const grid: Record<string, any[]> = {};
  for (const s of schedules) {
    const key = `${s.dayOfWeek}-${s.period}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(s);
  }

  const columns = [
    { title: '节次', dataIndex: 'period', width: 80, render: (p: number) => periodNames[p - 1] },
    ...Array.from({ length: 5 }, (_, i) => ({
      title: dayNames[i + 1],
      dataIndex: `day${i + 1}`,
      render: (_: any, record: any) => {
        const items = grid[`${i + 1}-${record.period}`] || [];
        return items.map((item: any, idx: number) => (
          <Tag key={idx} color="blue" style={{ marginBottom: 2, whiteSpace: 'normal' }}>
            {item.coursePlan?.course?.name || '课程'}<br />
            <small>{item.coursePlan?.teacher?.name} | {item.room?.name}</small>
          </Tag>
        ));
      },
    })),
  ];

  const tableData = Array.from({ length: 10 }, (_, i) => ({ key: i + 1, period: i + 1 }));

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <h2>排课管理</h2>
          <Select value={semester} onChange={setSemester} style={{ width: 160 }}
            options={[
              { value: '2025-2026-1', label: '2025-2026 第一学期' },
              { value: '2025-2026-2', label: '2025-2026 第二学期' },
            ]}
          />
        </Space>
        {isAdmin && (
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => { autoForm.setFieldsValue({ semester }); setAutoOpen(true); }}>
            自动排课
          </Button>
        )}
      </div>

      <Card>
        <Table dataSource={tableData} columns={columns} pagination={false} bordered size="small" loading={isLoading} />
      </Card>

      <Modal title="自动排课" open={autoOpen} onCancel={() => setAutoOpen(false)} onOk={() => autoForm.submit()} confirmLoading={autoMutation.isPending}>
        <Alert message="自动排课将为所有已审批的课程计划生成排课方案，已有排课不受影响。" type="info" style={{ marginBottom: 16 }} />
        <Form form={autoForm} layout="vertical" onFinish={(v) => autoMutation.mutate(v)}>
          <Form.Item name="semester" label="学期" rules={[{ required: true }]}>
            <Input placeholder="如: 2025-2026-1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
