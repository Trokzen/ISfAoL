import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Divider,
  Box,
  Stack,
  Button,
  LoadingOverlay,
  Alert,
  Card,
  Badge,
  rem,
  ThemeIcon,
  SimpleGrid,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Tooltip,
  Menu,
} from '@mantine/core';
import {
  IconBuilding,
  IconPlus,
  IconUsers,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconUserPlus
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Employee {
  id: number;
  fio: string;
}

interface User {
  id: number;
  login: string;
  full_name?: string;
  email?: string;
}

interface Department {
  id: number;
  name: string;
  manager_id: number | null;
  employees: Employee[];
}

export default function DepartmentsListPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<{value: string, label: string}[]>([]);
  const navigate = useNavigate();

  const fetchDepartments = async () => {
    try {
      setError(null);
      const response = await api.get('/departments/');
      setDepartments(response.data);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError('Ошибка при загрузке данных подразделений. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      const users = response.data.map((user: User) => ({
        value: user.id.toString(),
        label: `${user.login} (${user.full_name || user.email || 'Без ФИО'})`
      }));
      setAllUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Если эндпоинт не существует, используем пустой массив
      setAllUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDept) {
        // Обновление подразделения
        await api.put(`/departments/${editingDept.id}`, {
          name: deptName,
          manager_id: managerId ? parseInt(managerId) : null
        });
      } else {
        // Создание нового подразделения
        await api.post('/departments/', {
          name: deptName,
          manager_id: managerId ? parseInt(managerId) : null
        });
      }
      
      setModalOpen(false);
      setEditingDept(null);
      setDeptName('');
      setManagerId('');
      fetchDepartments(); // Обновляем список
    } catch (err: any) {
      console.error('Error saving department:', err);
      setError(err.response?.data?.detail || 'Ошибка при сохранении подразделения');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить это подразделение?')) {
      return;
    }
    
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments(); // Обновляем список
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.detail || 'Ошибка при удалении подразделения');
    }
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setManagerId(dept.manager_id?.toString() || '');
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setDeptName('');
    setManagerId('');
    setModalOpen(true);
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  return (
    <Container size="xl" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Group justify="space-between" align="center" mb="xl">
          <Box>
            <Group align="center" gap="sm">
              <ThemeIcon size={60} radius="md" variant="light" color="indigo">
                <IconBuilding style={{ width: rem(32), height: rem(32) }} />
              </ThemeIcon>
              <div>
                <Title order={1}>Список подразделений</Title>
                <Text c="dimmed">Управление структурой организации и сотрудниками</Text>
              </div>
            </Group>
          </Box>

          <Group>
            <Button
              leftSection={<IconUserPlus size={18} />}
              size="md"
              variant="outline"
              onClick={() => navigate('/add-employee')}
            >
              Добавить сотрудника
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              size="md"
              onClick={openCreateModal}
            >
              Создать подразделение
            </Button>
          </Group>
        </Group>

        <Divider my="xl" />

        {error && (
          <Alert
            variant="light"
            color="red"
            title="Ошибка загрузки данных"
            mb="xl"
          >
            {error}
          </Alert>
        )}

        <LoadingOverlay visible={loading} zIndex={1000} />

        {!loading && !error && (
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {departments.map((department) => (
              <Card
                key={department.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                h="100%"
              >
                <Stack gap="sm" h="100%" justify="space-between">
                  <Group justify="space-between" align="flex-start">
                    <Title order={3}>{department.name}</Title>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => openEditModal(department)}
                        >
                          Редактировать
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => handleDelete(department.id)}
                        >
                          Удалить
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  <Divider />

                  <Stack gap="xs" flex={1}>
                    <Text fw={500} size="sm">Сотрудники:</Text>
                    {department.employees.slice(0, 3).map((employee) => (
                      <Group key={employee.id} justify="space-between">
                        <Text size="sm">{employee.fio}</Text>
                      </Group>
                    ))}
                    {department.employees.length > 3 && (
                      <Text size="sm" c="dimmed">
                        и ещё {department.employees.length - 3} сотруд. ...
                      </Text>
                    )}
                    {department.employees.length === 0 && (
                      <Text size="sm" c="dimmed">
                        Нет сотрудников
                      </Text>
                    )}
                  </Stack>

                  <Button
                    variant="light"
                    color="blue"
                    rightSection={<IconChevronRight size={16} />}
                    onClick={() => navigate(`/department/${department.id}`)}
                  >
                    Подробнее
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Paper>

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDept(null);
        }}
        title={editingDept ? "Редактировать подразделение" : "Создать подразделение"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Название подразделения"
              placeholder="Введите название подразделения"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
            />
            
            <Select
              label="Менеджер подразделения"
              placeholder="Выберите менеджера"
              data={allUsers}
              value={managerId}
              onChange={setManagerId}
              clearable
            />
            
            <Group justify="right" mt="xl">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {editingDept ? "Сохранить" : "Создать"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}