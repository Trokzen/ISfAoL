import { useState, useEffect } from 'react';
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
  Select,
  PasswordInput,
} from '@mantine/core';
import { IconShield, IconUserPlus, IconBuilding, IconAt, IconLock, IconUser, IconX, IconCheck, IconHash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Department {
  id: number;
  name: string;
}

export default function AdminPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [idElibraryUser, setIdElibraryUser] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([]);
  const navigate = useNavigate();

  // Загрузка списка подразделений
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/');
      const deptOptions = response.data.map((dept: Department) => ({
        value: dept.id.toString(),
        label: dept.name
      }));
      setDepartments(deptOptions);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Ошибка при загрузке подразделений');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = {
        login,
        password,
        email: email || null,
        full_name: fullName,
        id_elibrary_user: idElibraryUser || null,
        department_id: selectedDepartment ? parseInt(selectedDepartment) : null,
      };

      await api.post('/auth/create-manager', userData);
      setSuccess('Менеджер подразделения успешно создан');

      // Очищаем форму
      setLogin('');
      setPassword('');
      setEmail('');
      setFullName('');
      setIdElibraryUser('');
      setSelectedDepartment('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании менеджера. Проверьте данные и попробуйте снова.');
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
            onClose={() => setError(null)}
            withCloseButton
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
            onClose={() => setSuccess(null)}
            withCloseButton
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleCreateManager}>
          <Stack gap="lg">
            <TextInput
              leftSection={<IconUser size={16} />}
              label="Логин"
              placeholder="Введите логин менеджера"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              size="md"
            />

            <PasswordInput
              leftSection={<IconLock size={16} />}
              label="Пароль"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="md"
            />

            <TextInput
              leftSection={<IconUser size={16} />}
              label="ФИО"
              placeholder="Введите полное имя менеджера"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              size="md"
            />

            <TextInput
              leftSection={<IconHash size={16} />}
              label="ID пользователя в elibrary (опционально)"
              placeholder="Введите ID пользователя в системе elibrary"
              value={idElibraryUser}
              onChange={(e) => setIdElibraryUser(e.target.value)}
              size="md"
            />

            <TextInput
              leftSection={<IconAt size={16} />}
              label="Email (опционально)"
              placeholder="email@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="md"
            />

            <Select
              leftSection={<IconBuilding size={16} />}
              label="Подразделение"
              placeholder="Выберите подразделение"
              data={departments}
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              size="md"
              searchable
              nothingFoundMessage="Подразделения не найдены"
            />

            <Divider my="md" />

            <Group justify="space-between" mt="xl">
              <Button
                variant="outline"
                color="gray"
                onClick={() => navigate('/')}
                leftSection={<IconX size={16} />}
              >
                Назад
              </Button>

              <Button
                type="submit"
                leftSection={<IconUserPlus />}
                loading={loading}
                size="md"
                px="xl"
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