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
  Select,
  MultiSelect,
} from '@mantine/core';
import { IconUserPlus, IconUser, IconBuilding, IconMail, IconPhone, IconCheck, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Department {
  id: number;
  name: string;
}

export default function AddEmployeePage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([]);
  const navigate = useNavigate();

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
    if (!firstName || !lastName || selectedDepartments.length === 0) {
      setError('Пожалуйста, заполните все обязательные поля');
      setLoading(false);
      return;
    }

    try {
      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        department_ids: selectedDepartments.map(Number), // Преобразуем в числа
        position,
        email,
        phone
      };

      await api.post('/employees/with-details', employeeData);
      navigate('/departments'); // Перенаправляем на список департаментов после добавления
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
            <Group grow>
              <TextInput
                leftSection={<IconUser size={16} />}
                label="Фамилия"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                size="md"
              />

              <TextInput
                leftSection={<IconUser size={16} />}
                label="Имя"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                size="md"
              />
            </Group>

            <TextInput
              leftSection={<IconUser size={16} />}
              label="Отчество"
              placeholder="Отчество"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              size="md"
            />

            <MultiSelect
              leftSection={<IconBuilding size={16} />}
              label="Подразделения"
              placeholder="Выберите подразделения"
              data={departments}
              value={selectedDepartments}
              onChange={setSelectedDepartments}
              required
              size="md"
              searchable
              nothingFoundMessage="Подразделения не найдены"
            />

            <TextInput
              leftSection={<IconUser size={16} />}
              label="Должность"
              placeholder="Название должности"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              size="md"
            />

            <Group grow>
              <TextInput
                leftSection={<IconMail size={16} />}
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                size="md"
              />

              <TextInput
                leftSection={<IconPhone size={16} />}
                label="Телефон"
                placeholder="+7 (XXX) XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                size="md"
              />
            </Group>

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