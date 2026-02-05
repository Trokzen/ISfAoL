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
import { IconUser, IconUserPlus, IconBuilding, IconAt, IconLock, IconUsers } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface UserCreate {
  login: string;
  password: string;
  email?: string;
  full_name?: string;
  department?: string;
}

export default function ManagerPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateUser = async (e: React.FormEvent) => {
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

      await api.post('/auth/create-user', userData);
      setSuccess('Пользователь успешно создан');
      
      // Очищаем форму
      setLogin('');
      setPassword('');
      setEmail('');
      setFullName('');
      setDepartment('');
    } catch (err) {
      setError('Ошибка при создании пользователя. Проверьте данные и попробуйте снова.');
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
            <ThemeIcon size={60} radius="md" variant="light" color="blue">
              <IconUsers style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>
          
          <Title ta="center" mb="sm">Панель менеджера</Title>
          <Text c="dimmed" ta="center">
            Создание пользователей подразделения
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

        <form onSubmit={handleCreateUser}>
          <Stack gap="md">
            <TextInput
              leftSection={<IconUser size={16} />}
              label="Логин"
              placeholder="Введите логин пользователя"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
            
            <TextInput
              leftSection={<IconAt size={16} />}
              label="Email"
              placeholder="Введите email пользователя"
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
              placeholder="Введите полное имя пользователя"
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
                Создать пользователя
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}