import { useState } from 'react';
import {
  TextInput,
  Button,
  Text,
  Anchor,
  Group,
  Title,
  Container,
  Paper,
  Box,
  Divider,
  rem,
  ThemeIcon,
  Stack,
} from '@mantine/core';
import { IconLogin, IconLock, IconAt, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Для эндпоинта /auth/token FastAPI ожидает application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('username', login);
      params.append('password', password);

      const res = await api.post('/auth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      localStorage.setItem('token', res.data.access_token);
      navigate('/');
    } catch (error) {
      setLoading(false);
      alert('Ошибка входа. Проверьте логин и пароль.');
    }
  };

  return (
    <Container size="xs" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="blue">
              <IconLogin style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Вход в систему</Title>
          <Text c="dimmed" ta="center">
            Введите свои данные для доступа к системе учета научных трудов
          </Text>
        </Box>

        <Divider my="lg" />

        <form onSubmit={handleLogin}>
          <Stack gap="md">
            <TextInput
              leftSection={<IconAt size={16} />}
              label="Логин"
              placeholder="Введите ваш логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />

            <TextInput
              leftSection={<IconLock size={16} />}
              label="Пароль"
              placeholder="Введите ваш пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              leftSection={<IconArrowRight />}
              loading={loading}
              size="md"
              mt="md"
            >
              Войти в систему
            </Button>
          </Stack>
        </form>

        <Divider my="lg" />

        <Group justify="center">
          <Text size="sm">
            Нет аккаунта?{' '}
            <Anchor href="/register" fw={500}>
              Зарегистрироваться
            </Anchor>
          </Text>
        </Group>
      </Paper>
    </Container>
  );
}