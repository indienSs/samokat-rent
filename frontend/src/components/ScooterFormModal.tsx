import { useEffect } from 'react';
import {
  App,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Slider,
} from 'antd';
import { scootersApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/client';
import {
  SCOOTER_STATUSES,
  SCOOTER_STATUS_META,
  type Scooter,
  type ScooterStatus,
} from '../api/types';

interface FormValues {
  number: string;
  model: string;
  status: ScooterStatus;
  batteryLevel: number;
  lat: number;
  lng: number;
}

interface Props {
  open: boolean;
  scooter: Scooter | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ScooterFormModal({ open, scooter, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const isEdit = Boolean(scooter);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        number: scooter?.number ?? '',
        model: scooter?.model ?? '',
        status: scooter?.status ?? 'available',
        batteryLevel: scooter?.batteryLevel ?? 100,
        lat: scooter?.lat ?? 55.751244,
        lng: scooter?.lng ?? 37.618423,
      });
    }
  }, [open, scooter, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && scooter) {
        await scootersApi.update(scooter.id, values);
        message.success('Самокат обновлён');
      } else {
        await scootersApi.create(values);
        message.success('Самокат создан');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return;
      }
      message.error(extractErrorMessage(err, 'Не удалось сохранить самокат'));
    }
  };

  return (
    <Modal
      title={isEdit ? `Редактировать ${scooter?.number}` : 'Новый самокат'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnClose
      width={520}
    >
      <Form<FormValues> form={form} layout="vertical">
        <Form.Item
          name="number"
          label="Номер"
          rules={[{ required: true, message: 'Введите номер' }]}
        >
          <Input placeholder="SC-001" />
        </Form.Item>
        <Form.Item
          name="model"
          label="Модель"
          rules={[{ required: true, message: 'Введите модель' }]}
        >
          <Input placeholder="Xiaomi M365" />
        </Form.Item>
        <Form.Item name="status" label="Статус">
          <Select
            options={SCOOTER_STATUSES.map((s) => ({
              value: s,
              label: SCOOTER_STATUS_META[s].label,
            }))}
          />
        </Form.Item>
        <Form.Item name="batteryLevel" label="Уровень заряда, %">
          <Slider min={0} max={100} marks={{ 0: '0', 50: '50', 100: '100' }} />
        </Form.Item>
        <Form.Item label="Координаты">
          <div style={{ display: 'flex', gap: 8 }}>
            <Form.Item
              name="lat"
              noStyle
              rules={[{ required: true, message: 'Введите широту' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Широта (lat)"
                step={0.0001}
                min={-90}
                max={90}
              />
            </Form.Item>
            <Form.Item
              name="lng"
              noStyle
              rules={[{ required: true, message: 'Введите долготу' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Долгота (lng)"
                step={0.0001}
                min={-180}
                max={180}
              />
            </Form.Item>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
