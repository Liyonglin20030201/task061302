import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsService } from '../../services/rooms.service';
import { useAuthStore } from '../../store/useAuthStore';

const statusMap: Record<string, { color: string; text: string }> = {
  available: { color: 'green', text: '可用' },
  maintenance: { color: 'orange', text: '维护中' },
  disabled: { color: 'red', text: '停用' },
};

export default function RoomsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const { data, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsService.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (values: any) => editing ? roomsService.update(editing.id, values) : roomsService.create(values),
    onSuccess: () => {
      message.success(editing ? '更新成功' : '创建成功');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setOpen(false);
    },
    onError: (err: any) => message.error(err?.message || '操作失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsService.remove(id),
    onSuccess: () => { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['rooms'] }); },
  });

  const rooms = (data as any)?.data?.data || (data as any)?.data || [];

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '楼栋', dataIndex: 'building' },
    { title: '楼层', dataIndex: 'floor' },
    { title: '容量', dataIndex: 'capacity' },
    { title: '设备类型', dataIndex: 'equipmentType' },
    { title: '设备数量', dataIndex: 'equipmentCount' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
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
        <h2>实训室管理</h2>
        {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增实训室</Button>}
      </div>
      <Table dataSource={rooms} columns={columns} rowKey="id" loading={isLoading} />
      <Modal title={editing ? '编辑实训室' : '新增实训室'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={mutation.isPending} width={600}>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="building" label="楼栋" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="floor" label="楼层"><Input /></Form.Item>
          <Form.Item name="capacity" label="容量" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="equipmentType" label="设备类型"><Input placeholder="如: computer, CNC, electronics" /></Form.Item>
          <Form.Item name="equipmentCount" label="设备数量"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="available">
            <Select options={[{ value: 'available', label: '可用' }, { value: 'maintenance', label: '维护中' }, { value: 'disabled', label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
