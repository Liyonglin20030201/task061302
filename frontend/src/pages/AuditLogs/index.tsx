import { Table, Select, Space, Tag } from 'antd';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsService } from '../../services/audit-logs.service';

const actionColors: Record<string, string> = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red', LOGIN: 'purple' };

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditLogsService.getAll({ ...filters, limit: 50 }),
  });

  const logs = (data as any)?.data?.data || (data as any)?.data || [];

  const columns = [
    { title: '时间', dataIndex: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
    { title: '用户', render: (_: any, r: any) => r.user?.username || '-' },
    { title: '操作', dataIndex: 'action', render: (a: string) => <Tag color={actionColors[a]}>{a}</Tag> },
    { title: '资源类型', dataIndex: 'resourceType' },
    { title: '资源ID', dataIndex: 'resourceId', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ipAddress' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>操作日志</h2>
        <Space style={{ marginTop: 8 }}>
          <Select placeholder="操作类型" allowClear style={{ width: 120 }} onChange={(v) => setFilters((f: any) => ({ ...f, action: v }))}
            options={[{ value: 'CREATE', label: '创建' }, { value: 'UPDATE', label: '更新' }, { value: 'DELETE', label: '删除' }]}
          />
          <Select placeholder="资源类型" allowClear style={{ width: 120 }} onChange={(v) => setFilters((f: any) => ({ ...f, resourceType: v }))}
            options={[{ value: 'schedules', label: '排课' }, { value: 'teachers', label: '教师' }, { value: 'rooms', label: '实训室' }, { value: 'courses', label: '课程' }]}
          />
        </Space>
      </div>
      <Table dataSource={logs} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 20 }} />
    </div>
  );
}
