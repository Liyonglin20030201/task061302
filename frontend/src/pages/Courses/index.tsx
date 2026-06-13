import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesService } from '../../services/courses.service';
import { useAuthStore } from '../../store/useAuthStore';

export default function CoursesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (values: any) => editing ? coursesService.update(editing.id, values) : coursesService.create(values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setOpen(false);
    },
    onError: (err: any) => message.error(err?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesService.remove(id),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['courses'] }); },
  });

  const courses = (data as any)?.data?.data || (data as any)?.data || [];

  const columns = [
    { title: '课程名称', dataIndex: 'name' },
    { title: '课程代码', dataIndex: 'code' },
    { title: '总课时', dataIndex: 'hours' },
    { title: '课程类型', dataIndex: 'courseType' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    ...(isAdmin ? [{
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setOpen(true); }}>编辑</Button>
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
        <h2>课程管理</h2>
        {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增课程</Button>}
      </div>
      <Table dataSource={courses} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title={editing ? '编辑课程' : '新增课程'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={mutation.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item name="name" label="课程名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="课程代码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="hours" label="总课时" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="courseType" label="课程类型"><Input placeholder="如: computer, CNC, electronics" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
