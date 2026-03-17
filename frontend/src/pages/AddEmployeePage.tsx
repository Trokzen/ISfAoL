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
  rem,
  ThemeIcon,
  Alert,
  PasswordInput,
  MultiSelect,
} from '@mantine/core';
import { IconUserPlus, IconUser, IconLock, IconAt, IconBuilding, IconMail, IconCheck, IconX, IconHash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Department {
  id: number;
  name: string;
}

export default function AddEmployeePage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Поле fio больше не используется, так как оно не требуется в новой структуре
  const [idElibraryUser, setIdElibraryUser] = useState(''); // ID пользователя в elibrary
  const [email, setEmail] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Проверяем, что все обязательные поля заполнены
    if (!login || !password || !fullName) {
      setError('Пожалуйста, заполните все обязательные поля');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        login,
        password,
        full_name: fullName,
        id_elibrary_user: idElibraryUser || null, // Если id_elibrary_user не указано, отправляем null
        email: email || null,
        department_ids: selectedDepartments.map(Number) // Преобразуем в числа
      };

      await api.post('/employees/with-details', userData);
      navigate('/departments'); // Перенаправляем на список подразделений после добавления
    } catch (error: any) {
      console.error('Error adding employee:', error);
      setError(error.response?.data?.detail || 'Ошибка при добавлении сотрудника. Пожалуйста, проверьте данные и попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <Container size="md" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="indigo">
              <IconUserPlus style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Добавить нового сотрудника</Title>
          <Text c="dimmed" ta="center">
            Заполните информацию о сотруднике
          </Text>
        </Box>

        <Divider my="lg" />

        {error && (
          <Alert
            variant="light"
            color="red"
            title="Ошибка"
            mb="lg"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <TextInput
              leftSection={<IconUser size={16} />}
              label="Логин"
              placeholder="Введите логин пользователя"
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
              placeholder="Введите полное имя"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              size="md"
            />

            <MultiSelect
              leftSection={<IconBuilding size={16} />}
              label="Подразделения"
              placeholder="Выберите подразделения"
              data={departments}
              value={selectedDepartments}
              onChange={setSelectedDepartments}
              size="md"
              searchable
              nothingFoundMessage="Подразделения не найдены"
            />

            <Divider my="md" />

            <Group justify="space-between" mt="xl">
              <Button
                variant="outline"
                color="gray"
                onClick={() => navigate('/departments')}
                leftSection={<IconX size={16} />}
              >
                Отмена
              </Button>

              <Button
                type="submit"
                leftSection={<IconCheck size={16} />}
                loading={loading}
                size="md"
                px="xl"
              >
                Добавить сотрудника
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}