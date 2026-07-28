import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { CheckOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { rentalsApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/client';
import {
  RENTAL_STATUS_META,
  type Rental,
  type RentalStatus,
} from '../api/types';
import { useEvents } from '../hooks/useEvents';
import { RentalFormModal } from '../components/RentalFormModal';

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

export function Rentals() {
  const { message, modal } = App.useApp();
  const [active, setActive] = useState<Rental[]>([]);
  const [completed, setCompleted] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<RentalStatus>('active');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        rentalsApi.list({ status: 'active', pageSize: 200 }),
        rentalsApi.list({ status: 'completed', pageSize: 200 }),
      ]);
      setActive(a.items);
      setCompleted(c.items);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Не удалось загрузить аренды'));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  useEvents({ 'rental:changed': load });

  const handleComplete = (rental: Rental) => {
    modal.confirm({
      title: 'Завершить аренду?',
      content: `Самокат ${rental.scooter?.number ?? ''} вернётся в статус «доступен».`,
      okText: 'Завершить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await rentalsApi.complete(rental.id);
          message.success('Аренда завершена');
          load();
        } catch (err) {
          message.error(extractErrorMessage(err, 'Не удалось завершить'));
        }
      },
    });
  };

  const columns = (status: RentalStatus): ColumnsType<Rental> => [
    {
      title: 'Самокат',
      key: 'scooter',
      render: (_: unknown, r: Rental) =>
        r.scooter ? (
          <span>
            <strong>{r.scooter.number}</strong>{' '}
            <Typography.Text type="secondary">{r.scooter.model}</Typography.Text>
          </span>
        ) : (
          r.scooterId
        ),
    },
    {
      title: 'Клиент',
      key: 'customer',
      render: (_: unknown, r: Rental) =>
        r.customer ? (
          <span>
            {r.customer.name}
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {r.customer.phone}
            </Typography.Text>
          </span>
        ) : (
          r.customerId
        ),
    },
    {
      title: 'Начало',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: status === 'completed' ? 'Окончание' : 'Длительность',
      key: 'duration',
      render: (_: unknown, r: Rental) =>
        status === 'completed' ? (
          r.endedAt ? (
            dayjs(r.endedAt).format('DD.MM.YYYY HH:mm')
          ) : (
            '—'
          )
        ) : (
          <Tooltip title="обновляется в реальном времени">
            <Tag color={RENTAL_STATUS_META.active.color}>
              {formatDuration(r.durationMinutes)}
            </Tag>
          </Tooltip>
        ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (s: RentalStatus) => (
        <Tag color={RENTAL_STATUS_META[s].color}>{RENTAL_STATUS_META[s].label}</Tag>
      ),
    },
    ...(status === 'active'
      ? [
          {
            title: 'Действия',
            key: 'actions',
            width: 120,
            render: (_: unknown, r: Rental) => (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleComplete(r)}
              >
                Завершить
              </Button>
            ),
          } as ColumnsType<Rental>[number],
        ]
      : []),
  ];

  return (
    <div className="page-container">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Аренды
          </Typography.Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load}>
              Обновить
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              Новая аренда
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as RentalStatus)}
          items={[
            {
              key: 'active',
              label: `Активные (${active.length})`,
              children: (
                <Table<Rental>
                  rowKey="id"
                  loading={loading}
                  dataSource={active}
                  columns={columns('active')}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'completed',
              label: `Завершённые (${completed.length})`,
              children: (
                <Table<Rental>
                  rowKey="id"
                  loading={loading}
                  dataSource={completed}
                  columns={columns('completed')}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <RentalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
