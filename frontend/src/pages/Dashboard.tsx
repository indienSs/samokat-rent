import { useCallback, useEffect, useState } from 'react';
import {
  ThunderboltOutlined,
  ApartmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  Progress,
  Row,
  Spin,
  Statistic,
  Typography,
  theme,
} from 'antd';
import { analyticsApi } from '../api/endpoints';
import type { AnalyticsOverview, ScooterStatus } from '../api/types';
import { SCOOTER_STATUS_META } from '../api/types';
import { useEvents } from '../hooks/useEvents';

const STATUS_ICON_COLOR: Record<ScooterStatus, string> = {
  available: '#52c41a',
  in_use: '#1677ff',
  maintenance: '#fa8c16',
  offline: '#bfbfbf',
};

export function Dashboard() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { token: themeToken } = theme.useToken();

  const load = useCallback(async () => {
    try {
      const overview = await analyticsApi.overview();
      setData(overview);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEvents({ 'analytics:changed': load });

  if (loading && !data) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  const o = data;
  if (!o) {
    return null;
  }

  return (
    <div className="page-container">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Аналитика
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Всего самокатов"
              value={o.totalScooters}
              prefix={<ThunderboltOutlined style={{ color: themeToken.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Активные аренды"
              value={o.activeRentals}
              prefix={<ApartmentOutlined style={{ color: themeToken.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Клиентов"
              value={o.totalCustomers}
              prefix={<TeamOutlined style={{ color: themeToken.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Средний заряд"
              value={o.averageBattery}
              suffix="%"
              prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Typography.Title level={4} style={{ marginTop: 32 }}>
        Самокаты по статусам
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {(Object.keys(SCOOTER_STATUS_META) as ScooterStatus[]).map((status) => {
          const count = o.byStatus[status] ?? 0;
          const percent = o.totalScooters
            ? Math.round((count / o.totalScooters) * 100)
            : 0;
          const meta = SCOOTER_STATUS_META[status];
          return (
            <Col xs={24} sm={12} md={6} key={status}>
              <Card>
                <Statistic
                  title={meta.label}
                  value={count}
                  valueStyle={{ color: STATUS_ICON_COLOR[status] }}
                />
                <Progress
                  percent={percent}
                  showInfo={false}
                  strokeColor={STATUS_ICON_COLOR[status]}
                  style={{ marginTop: 8, marginBottom: 0 }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Typography.Text type="secondary">
          Завершённых аренд за всё время: <strong>{o.completedRentals}</strong>
        </Typography.Text>
      </Card>
    </div>
  );
}
