import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
  Button,
  Card,
  Input,
  Row,
  Col,
  Segmented,
  Select,
  Space,
  Slider,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ReloadOutlined,
  TableOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { scootersApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/client';
import {
  SCOOTER_STATUSES,
  SCOOTER_STATUS_META,
  type Scooter,
  type ScooterStatus,
} from '../api/types';
import { useEvents } from '../hooks/useEvents';
import { ScooterFormModal } from '../components/ScooterFormModal';
import { ScootersMap } from '../components/ScootersMap';

const STATUS_COLOR: Record<ScooterStatus, string> = {
  available: 'green',
  in_use: 'blue',
  maintenance: 'orange',
  offline: 'default',
};

function batteryColor(level: number): string {
  if (level <= 20) return '#ff4d4f';
  if (level <= 50) return '#fa8c16';
  return '#52c41a';
}

export function Scooters() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'map'>('table');

  const [statusFilter, setStatusFilter] = useState<ScooterStatus | undefined>();
  const [query, setQuery] = useState('');
  const [batteryRange, setBatteryRange] = useState<[number, number]>([0, 100]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Scooter | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await scootersApi.list({
        status: statusFilter,
        q: debouncedQuery.trim() || undefined,
        minBattery: batteryRange[0],
        maxBattery: batteryRange[1],
      });
      setData(result);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Не удалось загрузить самокаты'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedQuery, batteryRange, message]);

  useEffect(() => {
    load();
  }, [load]);

  useEvents({ 'scooter:changed': load });

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 350);
  };

  const handleDelete = (scooter: Scooter) => {
    modal.confirm({
      title: `Удалить самокат ${scooter.number}?`,
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await scootersApi.remove(scooter.id);
          message.success('Самокат удалён');
          load();
        } catch (err) {
          message.error(extractErrorMessage(err, 'Не удалось удалить'));
        }
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (scooter: Scooter) => {
    setEditing(scooter);
    setModalOpen(true);
  };

  const columns = useMemo<ColumnsType<Scooter>>(
    () => [
      {
        title: 'Номер',
        dataIndex: 'number',
        key: 'number',
        render: (v: string) => <strong>{v}</strong>,
      },
      { title: 'Модель', dataIndex: 'model', key: 'model' },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        render: (s: ScooterStatus) => (
          <Tag color={STATUS_COLOR[s]}>{SCOOTER_STATUS_META[s].label}</Tag>
        ),
        filters: SCOOTER_STATUSES.map((s) => ({
          text: SCOOTER_STATUS_META[s].label,
          value: s,
        })),
        filterMultiple: false,
      },
      {
        title: 'Заряд',
        dataIndex: 'batteryLevel',
        key: 'batteryLevel',
        width: 110,
        sorter: (a, b) => a.batteryLevel - b.batteryLevel,
        render: (v: number) => (
          <span style={{ color: batteryColor(v), fontWeight: 600 }}>{v}%</span>
        ),
      },
      {
        title: 'Координаты',
        key: 'coords',
        render: (_: unknown, r: Scooter) => (
          <Tooltip title={`${r.lat}, ${r.lng}`}>
            <Space size={4}>
              <EnvironmentOutlined />
              <span style={{ fontSize: 12 }}>
                {Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}
              </span>
            </Space>
          </Tooltip>
        ),
      },
      {
        title: 'Обновлён',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
        sorter: (a, b) => dayjs(a.updatedAt).valueOf() - dayjs(b.updatedAt).valueOf(),
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_: unknown, r: Scooter) => (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(r)}
            />
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="page-container">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Самокаты
          </Typography.Title>
        </Col>
        <Col>
          <Space>
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'table' | 'map')}
              options={[
                { label: 'Таблица', value: 'table', icon: <TableOutlined /> },
                { label: 'Карта', value: 'map', icon: <EnvironmentOutlined /> },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={load}>
              Обновить
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить
            </Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input.Search
              placeholder="Поиск по номеру или модели"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select<ScooterStatus | undefined>
              style={{ width: '100%' }}
              placeholder="Статус"
              allowClear
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as ScooterStatus | undefined)}
              options={[
                { value: undefined, label: 'Все статусы' },
                ...SCOOTER_STATUSES.map((s) => ({
                  value: s,
                  label: SCOOTER_STATUS_META[s].label,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={10}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Заряд: {batteryRange[0]}% – {batteryRange[1]}%
            </Typography.Text>
            <Slider
              range
              min={0}
              max={100}
              value={batteryRange}
              onChange={(v) => setBatteryRange(v as [number, number])}
            />
          </Col>
        </Row>
      </Card>

      {view === 'table' ? (
        <Table<Scooter>
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      ) : (
        <ScootersMap scooters={data} onSelect={(s) => openEdit(s)} />
      )}

      <ScooterFormModal
        open={modalOpen}
        scooter={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
