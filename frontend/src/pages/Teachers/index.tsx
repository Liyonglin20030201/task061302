import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersService } from '../../services/teachers.service';
import { useAuthStore } from '../../store/useAuthStore';

export default function TeachersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => editing ? teachersService.update(editing.id, values) : teachersService.create(values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setOpen(false);
      form.resetFields();
      setEditing(null);
    },
    onError: (err: any) => message.error(err?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teachersService.remove(id),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const teachers = (data as any)?.data?.data || (data as any)?.data || [];

  const columns = [
    { title: '姓名', dataIndex: 'name' },
    { title: '工号', dataIndex: 'employeeNo' },
    { title: '职称', dataIndex: 'title' },
    { title: '部门', dataIndex: 'department' },
    { title: '电话', dataIndex: 'phone' },
    { title: '邮箱', dataIndex: 'email' },
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
        <h2>教师管理</h2>
        {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增教师</Button>}
      </div>
      <Table dataSource={teachers} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title={editing ? '编辑教师' : '新增教师'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={createMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="employeeNo" label="工号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="title" label="职称"><Input /></Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input type="email" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
