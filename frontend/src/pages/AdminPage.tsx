import { useState } from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  Text,
  Paper,
  Group,
  Divider,
  Box,
  Stack,
  Alert,
  rem,
  ThemeIcon,
} from '@mantine/core';
import { IconShield, IconUserPlus, IconBuilding, IconAt, IconLock, IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface UserCreate {
  login: string;
  password: string;
  email?: string;
  full_name?: string;
  department?: string;
}

export default function AdminPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userData: UserCreate = {
        login,
        password,
        email: email || undefined,
        full_name: fullName || undefined,
        department: department || undefined,
      };

      await api.post('/auth/create-manager', userData);
      setSuccess('Менеджер подразделения успешно создан');

      // Очищаем форму
      setLogin('');
      setPassword('');
      setEmail('');
      setFullName('');
      setDepartment('');
    } catch (err) {
      setError('Ошибка при создании менеджера. Проверьте данные и попробуйте снова.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="red">
              <IconShield style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Панель администратора</Title>
          <Text c="dimmed" ta="center">
            Создание менеджеров подразделений
          </Text>
        </Box>

        <Divider my="lg" />

        {error && (
          <Alert
            variant="light"
            color="red"
            title="Ошибка"
            mb="md"
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="light"
            color="green"
            title="Успех"
            mb="md"
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleCreateManager}>
          <Stack gap="md">
            <TextInput
              leftSection={<IconUser size={16} />}
              label="Логин"
              placeholder="Введите логин менеджера"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />

            <TextInput
              leftSection={<IconAt size={16} />}
              label="Email"
              placeholder="Введите email менеджера"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextInput
              leftSection={<IconLock size={16} />}
              label="Пароль"
              placeholder="Введите пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <TextInput
              leftSection={<IconUser size={16} />}
              label="ФИО"
              placeholder="Введите полное имя менеджера"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <TextInput
              leftSection={<IconBuilding size={16} />}
              label="Подразделение"
              placeholder="Введите название подразделения"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <Group justify="space-between" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => navigate('/')}
              >
                Назад
              </Button>

              <Button
                type="submit"
                leftSection={<IconUserPlus />}
                loading={loading}
              >
                Создать менеджера
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}