import { useEffect, useMemo, useState } from 'react';
import { App, Form, Modal, Select } from 'antd';
import { customersApi, rentalsApi, scootersApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/client';
import type { Customer, Scooter } from '../api/types';

interface FormValues {
  scooterId: string;
  customerId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function RentalFormModal({ open, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      Promise.all([
        scootersApi.list({ status: 'available' }),
        customersApi.list(),
      ])
        .then(([s, c]) => {
          setScooters(s);
          setCustomers(c);
        })
        .catch((err) =>
          message.error(
            extractErrorMessage(err, 'Не удалось загрузить данные'),
          ),
        );
      form.resetFields();
    }
  }, [open, form, message]);

  const scooterOptions = useMemo(
    () =>
      scooters.map((s) => ({
        value: s.id,
        label: `${s.number} — ${s.model} (заряд ${s.batteryLevel}%)`,
      })),
    [scooters],
  );

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.phone})`,
      })),
    [customers],
  );

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await rentalsApi.create(values);
      message.success('Аренда создана');
      onSaved();
      onClose();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return;
      }
      message.error(extractErrorMessage(err, 'Не удалось создать аренду'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Новая аренда"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Создать"
      cancelText="Отмена"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form<FormValues> form={form} layout="vertical">
        <Form.Item
          name="scooterId"
          label="Самокат"
          rules={[{ required: true, message: 'Выберите самокат' }]}
        >
          <Select
            placeholder="Только доступные самокаты"
            options={scooterOptions}
            notFoundContent="Нет доступных самокатов"
          />
        </Form.Item>
        <Form.Item
          name="customerId"
          label="Клиент"
          rules={[{ required: true, message: 'Выберите клиента' }]}
        >
          <Select
            placeholder="Выберите клиента"
            options={customerOptions}
            notFoundContent="Нет клиентов — создайте на вкладке «Клиенты»"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
