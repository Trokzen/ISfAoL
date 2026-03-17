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
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
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
  IconUserSquare,
  IconBriefcase,
  IconDatabaseImport,
  IconSun,
  IconMoon,
  IconStars,
  IconPalette,
  IconContrast,
  IconCheck,
  IconRobot,
  IconTree,
  IconWaveSine,
  IconSunset,
  IconMountain,
  IconCactus,
} from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const NavigationBar = ({ children }: { children: React.ReactNode }) => {
  const theme = useMantineTheme();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [mobileOpened, setMobileOpened] = useState(false);
  const [accentMenuOpened, setAccentMenuOpened] = useState(false);
  const [currentAccentColor, setCurrentAccentColor] = useState<string>('blue');
  const location = useLocation();
  const navigate = useNavigate();

  // Используем хук для определения размера экрана
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Загружаем сохранённые настройки при первом рендере
  useEffect(() => {
    const savedTheme = localStorage.getItem('colorScheme');
    const savedAccent = localStorage.getItem('accentColor') || 'blue';
    const savedContrast = localStorage.getItem('highContrast') || 'false';
    const savedCyberpunk = localStorage.getItem('cyberpunk') || 'false';
    const savedNaturefy = localStorage.getItem('naturefyTheme') || 'default';

    // Применяем цветовой акцент
    setCurrentAccentColor(savedAccent);
    document.documentElement.style.setProperty('--mantine-primary-color', savedAccent);

    // Применяем высокую контрастность
    if (savedContrast === 'true') {
      document.documentElement.classList.add('high-contrast');
    }

    // Применяем Cyberpunk тему
    if (savedCyberpunk === 'true') {
      document.documentElement.classList.add('cyberpunk');
      setColorScheme('dark'); // Авто: тёмная тема для Cyberpunk
    }
    // Применяем Naturefy тему
    else if (savedNaturefy !== 'default') {
      document.documentElement.classList.add(savedNaturefy);
      setColorScheme('light'); // Авто: светлая тема для Naturefy
    }
    // Восстанавливаем системную тему если нет специальных тем
    else {
      if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'auto') {
        setColorScheme(savedTheme);
      }
    }
  }, []);

  // Сохраняем тему при изменении
  useEffect(() => {
    localStorage.setItem('colorScheme', colorScheme);
  }, [colorScheme]);

  // Функция для смены цветового акцента
  const setAccentColor = (color: string) => {
    document.documentElement.style.setProperty('--mantine-primary-color', color);
    localStorage.setItem('accentColor', color);
    setCurrentAccentColor(color);
    setAccentMenuOpened(false); // Закрываем меню после выбора
  };

  // Функция для переключения высокой контрастности
  const toggleHighContrast = () => {
    const isHighContrast = document.documentElement.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', isHighContrast.toString());
  };

  // Функция для переключения Cyberpunk темы
  const toggleCyberpunk = () => {
    const isCyberpunk = document.documentElement.classList.toggle('cyberpunk');
    localStorage.setItem('cyberpunk', isCyberpunk.toString());

    // Автоматически включаем тёмную тему для Cyberpunk
    if (isCyberpunk) {
      setColorScheme('dark');
      // Удаляем Naturefy темы если есть
      document.documentElement.classList.remove('forest', 'ocean', 'sunset', 'mountain', 'desert');
      localStorage.setItem('naturefyTheme', 'default');
    }
  };

  // Функция для переключения Naturefy тем
  const setNaturefyTheme = (theme: string) => {
    // Удаляем все Naturefy темы
    document.documentElement.classList.remove('forest', 'ocean', 'sunset', 'mountain', 'desert');
    
    // Удаляем Cyberpunk тему
    document.documentElement.classList.remove('cyberpunk');
    localStorage.setItem('cyberpunk', 'false');
    
    // Устанавливаем выбранную тему
    if (theme !== 'default') {
      document.documentElement.classList.add(theme);
      // Автоматически включаем светлую тему для Naturefy
      setColorScheme('light');
    } else {
      // Возвращаем системную тему
      setColorScheme('auto');
    }
    
    localStorage.setItem('naturefyTheme', theme);
  };

  useEffect(() => {
    // Получаем информацию о пользователе из localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // В реальном приложении здесь нужно сделать запрос к /auth/me для получения информации о пользователе
      try {
        // Декодируем JWT токен, чтобы получить роль и ФИО
        const tokenPayload = token.split('.')[1];
        const decodedPayload = atob(tokenPayload);
        const payload = JSON.parse(decodedPayload);
        const role = payload.role || 'user';
        setUserRole(role);
        setUserFullName(payload.full_name || payload.sub || 'Пользователь');
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
      { link: '/my-works', label: 'Мои работы', icon: <IconBriefcase /> },
    ];

    if (userRole === 'admin') {
      links.push(
        { link: '/manage-users', label: 'Пользователи', icon: <IconUsers /> },
        { link: '/manage-user-articles', label: 'Управление статьями', icon: <IconBook /> },
        { link: '/import-csv', label: 'Импорт CSV', icon: <IconDatabaseImport /> }
      );
    } else if (userRole === 'manager') {
      links.push(
        { link: '/manager', label: 'Управление', icon: <IconUsers /> },
        { link: '/manage-user-articles', label: 'Управление статьями', icon: <IconBook /> }
      );
    } else if (userRole === 'user') {
      // Обычные пользователи могут просматривать статьи
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
            {isMobile && (
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

          <Group gap="sm">
            {/* Переключатель темы */}
            <Tooltip label={colorScheme === 'dark' ? 'Тёмная тема' : colorScheme === 'light' ? 'Светлая тема' : 'Автотема'} position="bottom">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => {
                  if (colorScheme === 'light') {
                    setColorScheme('dark');
                  } else if (colorScheme === 'dark') {
                    setColorScheme('auto');
                  } else {
                    setColorScheme('light');
                  }
                }}
                size="lg"
              >
                {colorScheme === 'light' && <IconSun size={20} />}
                {colorScheme === 'dark' && <IconMoon size={20} />}
                {colorScheme === 'auto' && <IconStars size={20} />}
              </ActionIcon>
            </Tooltip>

            {/* Меню цветовых акцентов */}
            <Menu
              opened={accentMenuOpened}
              onChange={setAccentMenuOpened}
              shadow="md"
              width={220}
            >
              <Menu.Target>
                <Tooltip label="Цветовой акцент" position="bottom">
                  <ActionIcon variant="subtle" color="gray" size="lg">
                    <IconPalette size={20} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Цветовая схема</Menu.Label>
                <Menu.Item
                  leftSection={
                    currentAccentColor === 'blue' ? (
                      <ActionIcon size="sm" color="blue" variant="filled" radius="xl">
                        <IconCheck size={12} />
                      </ActionIcon>
                    ) : null
                  }
                  onClick={() => setAccentColor('blue')}
                >
                  Синий
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    currentAccentColor === 'green' ? (
                      <ActionIcon size="sm" color="green" variant="filled" radius="xl">
                        <IconCheck size={12} />
                      </ActionIcon>
                    ) : null
                  }
                  onClick={() => setAccentColor('green')}
                >
                  Зелёный
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    currentAccentColor === 'red' ? (
                      <ActionIcon size="sm" color="red" variant="filled" radius="xl">
                        <IconCheck size={12} />
                      </ActionIcon>
                    ) : null
                  }
                  onClick={() => setAccentColor('red')}
                >
                  Красный
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    currentAccentColor === 'violet' ? (
                      <ActionIcon size="sm" color="violet" variant="filled" radius="xl">
                        <IconCheck size={12} />
                      </ActionIcon>
                    ) : null
                  }
                  onClick={() => setAccentColor('violet')}
                >
                  Фиолетовый
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    currentAccentColor === 'orange' ? (
                      <ActionIcon size="sm" color="orange" variant="filled" radius="xl">
                        <IconCheck size={12} />
                      </ActionIcon>
                    ) : null
                  }
                  onClick={() => setAccentColor('orange')}
                >
                  Оранжевый
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconContrast size={14} />}
                  onClick={toggleHighContrast}
                  rightSection={
                    localStorage.getItem('highContrast') === 'true' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Высокая контрастность
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconRobot size={14} />}
                  onClick={toggleCyberpunk}
                  rightSection={
                    localStorage.getItem('cyberpunk') === 'true' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Neon Cyberpunk 🌃
                </Menu.Item>

                <Menu.Divider />

                <Menu.Label>Naturefy Темы 🌿</Menu.Label>

                <Menu.Item
                  leftSection={<IconTree size={14} color="#2d5016" />}
                  onClick={() => setNaturefyTheme('forest')}
                  rightSection={
                    localStorage.getItem('naturefyTheme') === 'forest' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Forest 🌲
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconWaveSine size={14} color="#0077be" />}
                  onClick={() => setNaturefyTheme('ocean')}
                  rightSection={
                    localStorage.getItem('naturefyTheme') === 'ocean' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Ocean 🌊
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconSunset size={14} color="#ff6b35" />}
                  onClick={() => setNaturefyTheme('sunset')}
                  rightSection={
                    localStorage.getItem('naturefyTheme') === 'sunset' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Sunset 🌅
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconMountain size={14} color="#7f8c8d" />}
                  onClick={() => setNaturefyTheme('mountain')}
                  rightSection={
                    localStorage.getItem('naturefyTheme') === 'mountain' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Mountain 🏔️
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconCactus size={14} color="#f4a460" />}
                  onClick={() => setNaturefyTheme('desert')}
                  rightSection={
                    localStorage.getItem('naturefyTheme') === 'desert' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Desert 🏜️
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconCheck size={14} />}
                  onClick={() => setNaturefyTheme('default')}
                  rightSection={
                    localStorage.getItem('naturefyTheme') === 'default' ? (
                      <IconCheck size={14} />
                    ) : null
                  }
                >
                  Обычная тема
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

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