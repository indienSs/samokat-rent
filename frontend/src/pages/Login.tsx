import { LockOutlined, MailOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/client';

interface LoginFormValues {
  email: string;
  password: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      message.success('Вход выполнен');
      navigate('/', { replace: true });
    } catch (err) {
      message.error(extractErrorMessage(err, 'Не удалось войти'));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 380 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 36, color: '#1677ff' }} />
          <Typography.Title level={3} style={{ margin: '12px 0 0' }}>
            Samokat CRM
          </Typography.Title>
          <Typography.Text type="secondary">
            Войдите в систему управления арендой
          </Typography.Text>
        </div>
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            email: 'admin@example.com',
            password: 'admin123',
          }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Войти
          </Button>
        </Form>
        <Typography.Paragraph
          type="secondary"
          style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}
        >
          Демо-доступ: admin@example.com / admin123
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
