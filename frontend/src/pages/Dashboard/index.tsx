import { Row, Col, Card, Statistic, Table, Spin } from 'antd';
import { TeamOutlined, BankOutlined, CalendarOutlined, BookOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../../services/statistics.service';

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => statisticsService.getOverview(),
  });

  const { data: roomUtil } = useQuery({
    queryKey: ['statistics', 'room-utilization'],
    queryFn: () => statisticsService.getRoomUtilization(),
  });

  const { data: teacherLoad } = useQuery({
    queryKey: ['statistics', 'teacher-workload'],
    queryFn: () => statisticsService.getTeacherWorkload(),
  });

  const overviewData = (overview as any)?.data || {};
  const roomData = (roomUtil as any)?.data || [];
  const teacherData = (teacherLoad as any)?.data || [];

  if (loadingOverview) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card><Statistic title="实训室总数" value={overviewData.totalRooms || 0} prefix={<BankOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="教师总数" value={overviewData.totalTeachers || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="课程计划数" value={overviewData.totalPlans || 0} prefix={<BookOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已排课程数" value={overviewData.totalSchedules || 0} prefix={<CalendarOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="实训室利用率">
            <Table
              dataSource={roomData}
              rowKey="roomId"
              size="small"
              pagination={false}
              columns={[
                { title: '实训室', dataIndex: 'roomName' },
                { title: '楼栋', dataIndex: 'building' },
                { title: '已占用节次', dataIndex: 'scheduledPeriods' },
                { title: '利用率', dataIndex: 'utilizationRate', render: (v: number) => `${v}%` },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="教师工作量">
            <Table
              dataSource={teacherData}
              rowKey="teacherId"
              size="small"
              pagination={false}
              columns={[
                { title: '教师', dataIndex: 'teacherName' },
                { title: '部门', dataIndex: 'department' },
                { title: '周课时', dataIndex: 'weeklyHours' },
                { title: '课程数', dataIndex: 'courseCount' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
