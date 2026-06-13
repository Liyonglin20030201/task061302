import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesService } from '../../services/classes.service';
import { useAuthStore } from '../../store/useAuthStore';

export default function ClassesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (values: any) => editing ? classesService.update(editing.id, values) : classesService.create(values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setOpen(false);
    },
    onError: (err: any) => message.error(err?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesService.remove(id),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['classes'] }); },
  });

  const classes = (data as any)?.data?.data || (data as any)?.data || [];

  const columns = [
    { title: '班级名称', dataIndex: 'name' },
    { title: '年级', dataIndex: 'grade' },
    { title: '专业', dataIndex: 'major' },
    { title: '人数', dataIndex: 'studentCount' },
    { title: '系部', dataIndex: 'department' },
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
        <h2>班级管理</h2>
        {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增班级</Button>}
      </div>
      <Table dataSource={classes} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title={editing ? '编辑班级' : '新增班级'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={mutation.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item name="name" label="班级名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="grade" label="年级" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="major" label="专业" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="studentCount" label="学生人数" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="department" label="系部" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
