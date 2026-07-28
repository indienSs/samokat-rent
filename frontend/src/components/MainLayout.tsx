import {
  ApartmentOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Avatar, Dropdown, Space, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Header, Sider, Content } = Layout;

const items = [
  { key: '/', icon: <DashboardOutlined />, label: 'Аналитика' },
  { key: '/scooters', icon: <ThunderboltOutlined />, label: 'Самокаты' },
  { key: '/rentals', icon: <ApartmentOutlined />, label: 'Аренды' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Клиенты' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token: themeToken } = theme.useToken();

  const selectedKey =
    items.find((i) => location.pathname.startsWith(i.key) && i.key !== '/')?.key ??
    '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsible style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <div
          style={{
            color: '#fff',
            textAlign: 'center',
            padding: '16px 8px',
            fontWeight: 700,
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <ThunderboltOutlined />
          Samokat CRM
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: themeToken.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Выйти',
                  onClick: () => {
                    logout();
                    navigate('/login', { replace: true });
                  },
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: themeToken.colorPrimary }}>
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </Avatar>
              <Typography.Text>{user?.name}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
