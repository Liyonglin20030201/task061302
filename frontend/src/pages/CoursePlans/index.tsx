import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursePlansService } from '../../services/course-plans.service';
import { coursesService } from '../../services/courses.service';
import { teachersService } from '../../services/teachers.service';
import { classesService } from '../../services/classes.service';
import { useAuthStore } from '../../store/useAuthStore';

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  approved: { color: 'blue', text: '已审批' },
  scheduled: { color: 'green', text: '已排课' },
};

export default function CoursePlansPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const { data, isLoading } = useQuery({ queryKey: ['course-plans'], queryFn: () => coursePlansService.getAll() });
  const { data: coursesData } = useQuery({ queryKey: ['courses'], queryFn: () => coursesService.getAll() });
  const { data: teachersData } = useQuery({ queryKey: ['teachers'], queryFn: () => teachersService.getAll() });
  const { data: classesData } = useQuery({ queryKey: ['classes'], queryFn: () => classesService.getAll() });

  const mutation = useMutation({
    mutationFn: (values: any) => editing ? coursePlansService.update(editing.id, values) : coursePlansService.create(values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      queryClient.invalidateQueries({ queryKey: ['course-plans'] });
      setOpen(false);
    },
    onError: (err: any) => message.error(err?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursePlansService.remove(id),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['course-plans'] }); },
  });

  const plans = (data as any)?.data?.data || (data as any)?.data || [];
  const courses = (coursesData as any)?.data?.data || (coursesData as any)?.data || [];
  const teachers = (teachersData as any)?.data?.data || (teachersData as any)?.data || [];
  const classes = (classesData as any)?.data?.data || (classesData as any)?.data || [];

  const columns = [
    { title: '学期', dataIndex: 'semester' },
    { title: '课程', dataIndex: ['course', 'name'] },
    { title: '教师', dataIndex: ['teacher', 'name'] },
    { title: '班级', dataIndex: ['classEntity', 'name'], render: (v: any, r: any) => v || r.class?.name },
    { title: '计划课时', dataIndex: 'plannedHours' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    ...(isAdmin ? [{
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue({ ...record, courseId: record.course?.id, teacherId: record.teacher?.id, classId: record.classEntity?.id || record.class?.id }); setOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>课程计划</h2>
        {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增计划</Button>}
      </div>
      <Table dataSource={plans} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title={editing ? '编辑计划' : '新增计划'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={mutation.isPending} width={600}>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item name="semester" label="学期" rules={[{ required: true }]}><Input placeholder="如: 2025-2026-1" /></Form.Item>
          <Form.Item name="courseId" label="课程" rules={[{ required: true }]}>
            <Select placeholder="选择课程" options={courses.map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="teacherId" label="教师" rules={[{ required: true }]}>
            <Select placeholder="选择教师" options={teachers.map((t: any) => ({ value: t.id, label: `${t.name} (${t.employeeNo})` }))} />
          </Form.Item>
          <Form.Item name="classId" label="班级" rules={[{ required: true }]}>
            <Select placeholder="选择班级" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="plannedHours" label="计划课时" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
