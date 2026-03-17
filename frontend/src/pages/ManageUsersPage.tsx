import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Button,
  LoadingOverlay,
  Alert,
  Table,
  ScrollArea,
  Badge,
  ActionIcon,
  Tooltip,
  Modal,
  Stack,
  Avatar,
  TextInput,
  Box,
  ThemeIcon,
  Divider,
  PasswordInput,
  Select,
  Tabs,
  SimpleGrid,
} from '@mantine/core';
import {
  IconUsers,
  IconTrash,
  IconAlertTriangle,
  IconSearch,
  IconUser,
  IconEdit,
  IconX,
  IconCheck,
  IconUserPlus,
  IconBuilding,
  IconAt,
  IconLock,
  IconHash,
  IconShield,
} from '@tabler/icons-react';
import api from '../utils/api';

interface User {
  id: number;
  login: string;
  full_name: string;
  email: string | null;
  role: string;
}

interface UserData {
  login: string;
  password: string;
  email: string;
  full_name: string;
  id_elibrary_user: string;
  role: string;
}

interface ManagerData {
  login: string;
  password: string;
  email: string;
  full_name: string;
  id_elibrary_user: string;
  department_id: string;
}

interface EmployeeData {
  login: string;
  password: string;
  full_name: string;
  id_elibrary_user: string;
  email: string;
  department_ids: string[];
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editData, setEditData] = useState<UserData>({
    login: '',
    password: '',
    email: '',
    full_name: '',
    id_elibrary_user: '',
    role: '',
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([]);
  const [sortBy, setSortBy] = useState<string>('full_name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  
  // Состояния для создания менеджера
  const [createManagerModalOpen, setCreateManagerModalOpen] = useState<boolean>(false);
  const [managerData, setManagerData] = useState<ManagerData>({
    login: '',
    password: '',
    email: '',
    full_name: '',
    id_elibrary_user: '',
    department_id: '',
  });
  const [createManagerLoading, setCreateManagerLoading] = useState<boolean>(false);
  const [createManagerError, setCreateManagerError] = useState<string | null>(null);
  
  // Состояния для создания сотрудника
  const [createEmployeeModalOpen, setCreateEmployeeModalOpen] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    login: '',
    password: '',
    full_name: '',
    id_elibrary_user: '',
    email: '',
    department_ids: [],
  });
  const [createEmployeeLoading, setCreateEmployeeLoading] = useState<boolean>(false);
  const [createEmployeeError, setCreateEmployeeError] = useState<string | null>(null);

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedDepartment) params.append('department_id', selectedDepartment);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      const response = await api.get(`/auth/users?${params.toString()}`);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Ошибка при загрузке списка пользователей');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка списка подразделений
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/');
      const deptOptions = response.data.map((dept: any) => ({
        value: dept.id.toString(),
        label: dept.name
      }));
      setDepartments(deptOptions);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Обработка удаления пользователя
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/auth/users/${userToDelete.id}`);
      setSuccessMessage(`Пользователь ${userToDelete.login} успешно удален`);
      fetchUsers();
      setDeleteModalOpen(false);
      setUserToDelete(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.detail || 'Ошибка при удалении пользователя');
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Обработка изменения поиска
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Обработка изменения подразделения
  const handleDepartmentChange = (value: string | null) => {
    setSelectedDepartment(value);
  };

  // Обработка изменения сортировки
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Отдельный эффект для загрузки данных при изменении фильтров
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce 300мс
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedDepartment, sortBy, sortOrder]);

  // Открытие модального окна редактирования
  const handleOpenEditModal = (user: User) => {
    setUserToEdit(user);
    setEditData({
      login: user.login,
      password: '',
      email: user.email || '',
      full_name: user.full_name,
      id_elibrary_user: '',
      role: user.role,
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  // Сохранение изменений
  const handleSaveUser = async () => {
    if (!userToEdit) return;

    setEditLoading(true);
    setEditError(null);

    try {
      await api.put(`/auth/users/${userToEdit.id}`, {
        ...editData,
        id_elibrary_user: editData.id_elibrary_user || null,
        email: editData.email || null,
      });
      setSuccessMessage(`Пользователь ${editData.full_name} успешно обновлен`);
      fetchUsers();
      setEditModalOpen(false);
      setUserToEdit(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Ошибка при обновлении пользователя');
    } finally {
      setEditLoading(false);
    }
  };

  // Создание менеджера
  const handleCreateManager = async () => {
    setCreateManagerLoading(true);
    setCreateManagerError(null);

    try {
      await api.post('/auth/create-manager', {
        login: managerData.login,
        password: managerData.password,
        email: managerData.email || null,
        full_name: managerData.full_name,
        id_elibrary_user: managerData.id_elibrary_user || null,
        department_id: managerData.department_id ? parseInt(managerData.department_id) : null,
      });
      setSuccessMessage(`Менеджер ${managerData.full_name} успешно создан`);
      setCreateManagerModalOpen(false);
      setManagerData({
        login: '',
        password: '',
        email: '',
        full_name: '',
        id_elibrary_user: '',
        department_id: '',
      });
      fetchUsers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setCreateManagerError(err.response?.data?.detail || 'Ошибка при создании менеджера');
    } finally {
      setCreateManagerLoading(false);
    }
  };

  // Создание сотрудника
  const handleCreateEmployee = async () => {
    setCreateEmployeeLoading(true);
    setCreateEmployeeError(null);

    try {
      await api.post('/employees/with-details', {
        login: employeeData.login,
        password: employeeData.password,
        full_name: employeeData.full_name,
        id_elibrary_user: employeeData.id_elibrary_user || null,
        email: employeeData.email || null,
        department_ids: employeeData.department_ids.map(Number),
      });
      setSuccessMessage(`Сотрудник ${employeeData.full_name} успешно создан`);
      setCreateEmployeeModalOpen(false);
      setEmployeeData({
        login: '',
        password: '',
        full_name: '',
        id_elibrary_user: '',
        email: '',
        department_ids: [],
      });
      fetchUsers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setCreateEmployeeError(err.response?.data?.detail || 'Ошибка при создании сотрудника');
    } finally {
      setCreateEmployeeLoading(false);
    }
  };

  // Начальная загрузка подразделений и пользователей
  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  return (
    <Container size="xl" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="md">
            <Group align="center" gap="sm">
              <ThemeIcon size={60} radius="md" variant="light" color="blue">
                <IconUsers style={{ width: 40, height: 40 }} />
              </ThemeIcon>
              <div>
                <Title order={1}>Управление пользователями</Title>
                <Text c="dimmed">
                  Просмотр, создание и редактирование пользователей системы
                </Text>
              </div>
            </Group>
            <Group>
              <Button
                leftSection={<IconUserPlus size={18} />}
                size="md"
                variant="outline"
                color="blue"
                onClick={() => setCreateManagerModalOpen(true)}
              >
                Создать менеджера
              </Button>
              <Button
                leftSection={<IconUserPlus size={18} />}
                size="md"
                variant="outline"
                color="green"
                onClick={() => setCreateEmployeeModalOpen(true)}
              >
                Создать сотрудника
              </Button>
            </Group>
          </Group>
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

        {successMessage && (
          <Alert
            variant="light"
            color="green"
            title="Успех"
            mb="md"
            onClose={() => setSuccessMessage(null)}
            withCloseButton
          >
            {successMessage}
          </Alert>
        )}

        <Group mb="md" grow>
          <TextInput
            leftSection={<IconSearch size={18} />}
            placeholder="Поиск по ФИО, логину или email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="md"
          />

          <Select
            placeholder="Все подразделения"
            data={departments}
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            clearable
            size="md"
            style={{ minWidth: 200 }}
          />

          <Select
            placeholder="Сортировка"
            data={[
              { value: 'full_name-asc', label: 'ФИО (А-Я)' },
              { value: 'full_name-desc', label: 'ФИО (Я-А)' },
              { value: 'login-asc', label: 'Логин (А-Я)' },
              { value: 'login-desc', label: 'Логин (Я-А)' },
              { value: 'role-asc', label: 'Роль (А-Я)' },
              { value: 'role-desc', label: 'Роль (Я-А)' },
            ]}
            value={`${sortBy}-${sortOrder}`}
            onChange={handleSortChange}
            size="md"
            style={{ minWidth: 200 }}
          />
        </Group>

        <LoadingOverlay visible={loading} zIndex={1000} />

        {!loading && (
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Пользователь</Table.Th>
                  <Table.Th>Логин</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Роль</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map(user => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          {user.full_name.charAt(0)}
                        </Avatar>
                        <Text size="sm" fw={500}>{user.full_name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.login}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{user.email || '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={
                          user.role === 'admin' ? 'red' :
                          user.role === 'manager' ? 'blue' : 'gray'
                        }
                      >
                        {user.role === 'admin' ? 'Администратор' :
                         user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Редактировать пользователя">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Удалить пользователя">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteModalOpen(true);
                            }}
                            disabled={user.role === 'admin'}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {/* Модальное окно подтверждения удаления */}
        <Modal
          opened={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          title={
            <Group gap="sm">
              <IconAlertTriangle color="red" />
              <Text fw={600}>Подтверждение удаления</Text>
            </Group>
          }
          centered
        >
          <Stack gap="md">
            <Text>
              Вы уверены, что хотите удалить пользователя{' '}
              <Text span fw={700}>{userToDelete?.full_name}</Text> (логин:{' '}
              <Text span fw={700}>{userToDelete?.login}</Text>
              )?
            </Text>

            <Alert color="orange" radius="md">
              Это действие нельзя отменить. Все данные пользователя будут удалены.
            </Alert>

            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                Отмена
              </Button>
              <Button
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDeleteUser}
              >
                Удалить
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Модальное окно редактирования пользователя */}
        <Modal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setUserToEdit(null);
            setEditError(null);
          }}
          title={
            <Group gap="sm">
              <IconEdit />
              <Text fw={600}>Редактирование пользователя</Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">
            {editError && (
              <Alert variant="light" color="red" onClose={() => setEditError(null)} withCloseButton>
                {editError}
              </Alert>
            )}

            <TextInput
              label="Логин"
              placeholder="Введите логин"
              value={editData.login}
              onChange={(e) => setEditData({ ...editData, login: e.target.value })}
              required
            />

            <PasswordInput
              label="Пароль (оставьте пустым, чтобы не менять)"
              placeholder="••••••••"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
            />

            <TextInput
              label="Email"
              placeholder="email@example.com"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              type="email"
            />

            <TextInput
              label="ФИО"
              placeholder="Введите полное имя"
              value={editData.full_name}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
              required
            />

            <TextInput
              label="ID пользователя в elibrary (опционально)"
              placeholder="Введите ID"
              value={editData.id_elibrary_user}
              onChange={(e) => setEditData({ ...editData, id_elibrary_user: e.target.value })}
            />

            <Select
              label="Роль"
              placeholder="Выберите роль"
              data={[
                { value: 'user', label: 'Пользователь' },
                { value: 'manager', label: 'Менеджер' },
                { value: 'admin', label: 'Администратор' },
              ]}
              value={editData.role}
              onChange={(value) => setEditData({ ...editData, role: value || 'user' })}
              required
            />

            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setEditModalOpen(false);
                  setUserToEdit(null);
                  setEditError(null);
                }}
                disabled={editLoading}
              >
                Отмена
              </Button>
              <Button
                color="blue"
                leftSection={<IconCheck size={16} />}
                onClick={handleSaveUser}
                loading={editLoading}
              >
                Сохранить
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Модальное окно создания менеджера */}
        <Modal
          opened={createManagerModalOpen}
          onClose={() => {
            setCreateManagerModalOpen(false);
            setManagerData({
              login: '',
              password: '',
              email: '',
              full_name: '',
              id_elibrary_user: '',
              department_id: '',
            });
            setCreateManagerError(null);
          }}
          title={
            <Group gap="sm">
              <IconShield />
              <Text fw={600}>Создание менеджера подразделения</Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">
            {createManagerError && (
              <Alert variant="light" color="red" onClose={() => setCreateManagerError(null)} withCloseButton>
                {createManagerError}
              </Alert>
            )}

            <TextInput
              label="Логин"
              placeholder="Введите логин"
              value={managerData.login}
              onChange={(e) => setManagerData({ ...managerData, login: e.target.value })}
              required
            />

            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              value={managerData.password}
              onChange={(e) => setManagerData({ ...managerData, password: e.target.value })}
              required
            />

            <TextInput
              label="ФИО"
              placeholder="Введите полное имя"
              value={managerData.full_name}
              onChange={(e) => setManagerData({ ...managerData, full_name: e.target.value })}
              required
            />

            <TextInput
              label="Email (опционально)"
              placeholder="email@example.com"
              value={managerData.email}
              onChange={(e) => setManagerData({ ...managerData, email: e.target.value })}
              type="email"
            />

            <TextInput
              label="ID пользователя в elibrary (опционально)"
              placeholder="Введите ID"
              value={managerData.id_elibrary_user}
              onChange={(e) => setManagerData({ ...managerData, id_elibrary_user: e.target.value })}
            />

            <Select
              label="Подразделение"
              placeholder="Выберите подразделение"
              data={departments}
              value={managerData.department_id}
              onChange={(value) => setManagerData({ ...managerData, department_id: value || '' })}
              clearable
            />

            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setCreateManagerModalOpen(false);
                  setCreateManagerError(null);
                }}
                disabled={createManagerLoading}
              >
                Отмена
              </Button>
              <Button
                color="blue"
                leftSection={<IconCheck size={16} />}
                onClick={handleCreateManager}
                loading={createManagerLoading}
              >
                Создать менеджера
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Модальное окно создания сотрудника */}
        <Modal
          opened={createEmployeeModalOpen}
          onClose={() => {
            setCreateEmployeeModalOpen(false);
            setEmployeeData({
              login: '',
              password: '',
              full_name: '',
              id_elibrary_user: '',
              email: '',
              department_ids: [],
            });
            setCreateEmployeeError(null);
          }}
          title={
            <Group gap="sm">
              <IconUserPlus />
              <Text fw={600}>Создание сотрудника</Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">
            {createEmployeeError && (
              <Alert variant="light" color="red" onClose={() => setCreateEmployeeError(null)} withCloseButton>
                {createEmployeeError}
              </Alert>
            )}

            <TextInput
              label="Логин"
              placeholder="Введите логин"
              value={employeeData.login}
              onChange={(e) => setEmployeeData({ ...employeeData, login: e.target.value })}
              required
            />

            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              value={employeeData.password}
              onChange={(e) => setEmployeeData({ ...employeeData, password: e.target.value })}
              required
            />

            <TextInput
              label="ФИО"
              placeholder="Введите полное имя"
              value={employeeData.full_name}
              onChange={(e) => setEmployeeData({ ...employeeData, full_name: e.target.value })}
              required
            />

            <TextInput
              label="ID пользователя в elibrary (опционально)"
              placeholder="Введите ID"
              value={employeeData.id_elibrary_user}
              onChange={(e) => setEmployeeData({ ...employeeData, id_elibrary_user: e.target.value })}
            />

            <TextInput
              label="Email (опционально)"
              placeholder="email@example.com"
              value={employeeData.email}
              onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
              type="email"
            />

            <Select
              label="Подразделения"
              placeholder="Выберите подразделения"
              data={departments}
              value={employeeData.department_ids}
              onChange={(value) => setEmployeeData({ ...employeeData, department_ids: value || [] })}
              clearable
              multiple
            />

            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setCreateEmployeeModalOpen(false);
                  setCreateEmployeeError(null);
                }}
                disabled={createEmployeeLoading}
              >
                Отмена
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={handleCreateEmployee}
                loading={createEmployeeLoading}
              >
                Создать сотрудника
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Paper>
    </Container>
  );
}
