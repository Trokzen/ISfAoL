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
  PasswordInput,
} from '@mantine/core';
import { IconUserPlus, IconUser, IconLock, IconAt, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        login: username,
        email,
        password,
        full_name: username  // Используем имя пользователя как ФИО по умолчанию
      });
      alert('Регистрация прошла успешно! Теперь вы можете войти в систему.');
      navigate('/login');
    } catch (error) {
      setLoading(false);
      alert('Ошибка регистрации. Возможно, такой пользователь уже существует.');
    }
  };

  return (
    <Container size="xs" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="green">
              <IconUserPlus style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Создание аккаунта</Title>
          <Text c="dimmed" ta="center">
            Зарегистрируйтесь, чтобы получить доступ к системе учета научных трудов
          </Text>
        </Box>

        <Divider my="lg" />

        <form onSubmit={handleRegister}>
          <Stack gap="md">
            <TextInput
              leftSection={<IconUser size={16} />}
              label="Имя пользователя"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <TextInput
              leftSection={<IconAt size={16} />}
              label="Email"
              placeholder="Введите ваш email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <PasswordInput
              leftSection={<IconLock size={16} />}
              label="Пароль"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <PasswordInput
              leftSection={<IconLock size={16} />}
              label="Подтверждение пароля"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              leftSection={<IconCheck />}
              loading={loading}
              size="md"
              mt="md"
            >
              Зарегистрироваться
            </Button>
          </Stack>
        </form>

        <Divider my="lg" />

        <Group justify="center">
          <Text size="sm">
            Уже есть аккаунт?{' '}
            <Anchor href="/login" fw={500}>
              Войти
            </Anchor>
          </Text>
        </Group>
      </Paper>
    </Container>
  );
}