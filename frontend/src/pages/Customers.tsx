import { useCallback, useEffect, useRef, useState } from 'react';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { customersApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/client';
import type { Customer } from '../api/types';

interface FormValues {
  name: string;
  phone: string;
}

export function Customers() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form] = Form.useForm<FormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await customersApi.list(
        debouncedQuery.trim() || undefined,
      );
      setData(result);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Не удалось загрузить клиентов'));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, message]);

  useEffect(() => {
    load();
  }, [load]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 350);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    form.setFieldsValue({ name: customer.name, phone: customer.phone });
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editing) {
        await customersApi.update(editing.id, values);
        message.success('Клиент обновлён');
      } else {
        await customersApi.create(values);
        message.success('Клиент создан');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return;
      }
      message.error(extractErrorMessage(err, 'Не удалось сохранить клиента'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (customer: Customer) => {
    modal.confirm({
      title: `Удалить клиента ${customer.name}?`,
      content: 'Действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await customersApi.remove(customer.id);
          message.success('Клиент удалён');
          load();
        } catch (err) {
          message.error(extractErrorMessage(err, 'Не удалось удалить'));
        }
      },
    });
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <strong>{v}</strong>,
    },
    { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Создан',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, r: Customer) => (
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
  ];

  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Клиенты
        </Typography.Title>
        <Space>
          <Input.Search
            placeholder="Поиск по имени или телефону"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            Обновить
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Добавить
          </Button>
        </Space>
      </div>

      <Table<Customer>
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editing ? 'Редактировать клиента' : 'Новый клиент'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form<FormValues> form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input placeholder="Иван Петров" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Телефон"
            rules={[
              { required: true, message: 'Введите телефон' },
              {
                pattern: /^\+?[\d\s\-()]{7,20}$/,
                message: 'Некорректный телефон',
              },
            ]}
          >
            <Input placeholder="+7 900 000-00-00" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
