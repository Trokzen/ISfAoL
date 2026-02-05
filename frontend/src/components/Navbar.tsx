import { useState, useEffect } from 'react';
import {
  AppShell,
  Text,
  Burger,
  useMantineTheme,
  Group,
  Button,
  Menu,
  Divider,
  Stack,
  NavLink,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconHome,
  IconUser,
  IconUserPlus,
  IconBook,
  IconBuilding,
  IconLogout,
  IconShield,
  IconUsers,
  IconLogin,
  IconUserCircle,
  IconUserSquare
} from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NavigationBar = ({ children }: { children: React.ReactNode }) => {
  const theme = useMantineTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [mobileOpened, setMobileOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Используем хук для определения размера экрана
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // Получаем информацию о пользователе из localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // В реальном приложении здесь нужно сделать запрос к /auth/me для получения информации о пользователе
      try {
        // Декодируем JWT токен, чтобы получить роль
        const tokenPayload = token.split('.')[1];
        const decodedPayload = atob(tokenPayload);
        const payload = JSON.parse(decodedPayload);
        setUserRole(payload.role || 'user');
        setUserFullName(payload.sub || 'Пользователь');
      } catch (e) {
        console.error('Error decoding token:', e);
        // Если не можем декодировать токен, делаем запрос к API
        fetchUserInfo();
      }
    } else {
      setUserRole(null);
    }
  }, [location.pathname]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');

      setUserRole(response.data.role);
      setUserFullName(response.data.full_name || response.data.login);
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
      setUserRole(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserRole(null);
    navigate('/login');
  };

  const renderNavLinks = () => {
    const links = [
      { link: '/', label: 'Главная', icon: <IconHome /> },
      { link: '/departments', label: 'Подразделения', icon: <IconBuilding /> },
    ];

    if (userRole === 'admin') {
      links.push(
        { link: '/admin', label: 'Администрирование', icon: <IconShield /> },
        { link: '/add-article', label: 'Добавить статью', icon: <IconBook /> },
        { link: '/add-employee', label: 'Добавить сотрудника', icon: <IconUserPlus /> }
      );
    } else if (userRole === 'manager') {
      links.push(
        { link: '/manager', label: 'Управление', icon: <IconUsers /> },
        { link: '/add-article', label: 'Добавить статью', icon: <IconBook /> }
      );
    } else if (userRole === 'user') {
      // Обычные пользователи не могут добавлять статьи
      // links.push(
      //   { link: '/add-article', label: 'Добавить статью', icon: <IconBook /> }
      // );
    }

    return links.map((item) => (
      <NavLink
        key={item.label}
        component={Link}
        to={item.link}
        active={location.pathname === item.link}
        label={item.label}
        leftSection={item.icon}
      />
    ));
  };

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened }
      }}
      padding="md"
    >
      <AppShell.Header height={{ base: 50, md: 70 }} px="md">
        <Group h="100%" px={20} justify="space-between">
          <Group>
            {!isMobile && (
              <Burger
                opened={mobileOpened}
                onClick={() => setMobileOpened((o) => !o)}
                size="sm"
                mr="xl"
              />
            )}

            <Text size="xl" fw={700}>
              Система учета научных трудов
            </Text>
          </Group>

          <Group>
            {userRole ? (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="subtle" rightSection={<IconUserSquare size={16} />}>
                    {userFullName || 'Пользователь'}
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Роль: {userRole}</Menu.Label>
                  <Menu.Item onClick={handleLogout} leftSection={<IconLogout size={14} />}>
                    Выйти
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group>
                <Button component={Link} to="/login" variant="outline" leftSection={<IconLogin size={16} />}>
                  Вход
                </Button>
                <Button component={Link} to="/register" leftSection={<IconUser size={16} />}>
                  Регистрация
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow mt="md">
          <Stack gap="sm">
            {renderNavLinks()}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider />
          <Text size="xs" c="dimmed" ta="center" mt="xs">
            {userRole ? `Роль: ${userRole}` : 'Гость'}
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
};

export default NavigationBar;