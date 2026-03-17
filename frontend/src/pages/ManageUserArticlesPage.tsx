import { useState, useEffect, useMemo } from 'react';
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
  TextInput,
  ActionIcon,
  Tooltip,
  Modal,
  Table,
  ScrollArea,
  Checkbox,
  Skeleton,
  Avatar,
  Menu,
} from '@mantine/core';
import {
  IconBook,
  IconSearch,
  IconUserPlus,
  IconCheck,
  IconX,
  IconFileDescription,
  IconBriefcase,
  IconUsers,
  IconUnlink,
  IconDots,
  IconPlus,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface User {
  id: number;
  login: string;
  full_name: string;
  email: string | null;
  role: string;
}

interface Author {
  id: number;
  article_id: number;
  author_name: string;
  user_employee_id: number | null;
  contribution: number;
  applied_for_award: boolean;
}

interface Article {
  id: number;
  external_id: number | null;
  title: string;
  year_pub: number;
  in_rinc: boolean;
  authors: Author[];
}

export default function ManageUserArticlesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suggestedArticles, setSuggestedArticles] = useState<Article[]>([]);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticlesForClaim, setSelectedArticlesForClaim] = useState<Set<number>>(new Set());
  const [bulkClaimLoading, setBulkClaimLoading] = useState<boolean>(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(true);
  const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [claimingAuthor, setClaimingAuthor] = useState<string>('');
  const [unclaimModalOpen, setUnclaimModalOpen] = useState<boolean>(false);
  const [unclaimingAuthor, setUnclaimingAuthor] = useState<Author | null>(null);
  const navigate = useNavigate();

  const [userFullName, setUserFullName] = useState<string>('');

  // Получаем ФИО текущего пользователя из токена
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenPayload = token.split('.')[1];
        const decodedPayload = atob(tokenPayload);
        const payload = JSON.parse(decodedPayload);
        setUserFullName(payload.full_name || payload.sub || '');
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }, []);

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/articles/management/users', {
        params: { search: searchQuery || undefined }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка предложенных статей для выбранного пользователя
  const fetchSuggestedArticles = async (userId: number) => {
    try {
      setSuggestionsLoading(true);
      const response = await api.get(`/articles/management/users/${userId}/suggestions`);
      setSuggestedArticles(response.data);
    } catch (err) {
      console.error('Error fetching suggested articles:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Загрузка статей выбранного пользователя
  const fetchUserArticles = async (userId: number) => {
    try {
      const response = await api.get(`/articles/management/users/${userId}/articles`);
      setUserArticles(response.data);
    } catch (err) {
      console.error('Error fetching user articles:', err);
    }
  };

  // Выбор пользователя
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    fetchSuggestedArticles(user.id);
    fetchUserArticles(user.id);
    setSelectedArticlesForClaim(new Set());
  };

  // Обработка массовой привязки статей
  const handleBulkClaimArticles = async () => {
    if (!selectedUser || selectedArticlesForClaim.size === 0) return;

    setBulkClaimLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const articleId of Array.from(selectedArticlesForClaim)) {
        const article = suggestedArticles.find(a => a.id === articleId);
        if (!article) continue;
        
        const likelyAuthor = article.authors.find(a => 
          a.user_employee_id === null && isLikelyMyAuthor(a.author_name, selectedUser.full_name)
        );
        
        if (!likelyAuthor) {
          errorCount++;
          continue;
        }
        
        try {
          await api.post(`/articles/articles/${articleId}/claim-for-user`, null, {
            params: {
              author_name: likelyAuthor.author_name,
              user_id: selectedUser.id
            }
          });
          successCount++;
        } catch (error) {
          console.error('Error claiming article:', articleId, error);
          errorCount++;
        }
      }

      // Обновляем списки
      await fetchSuggestedArticles(selectedUser.id);
      await fetchUserArticles(selectedUser.id);
      setSelectedArticlesForClaim(new Set());
      
      if (successCount > 0) {
        alert(`Успешно привязано ${successCount} статей(и)`);
      } else if (errorCount > 0) {
        alert(`Не удалось привязать ${errorCount} статей(и)`);
      }
    } catch (err: any) {
      console.error('Error bulk claiming articles:', err);
      alert(err.response?.data?.detail || 'Ошибка при привязке статей');
    } finally {
      setBulkClaimLoading(false);
    }
  };

  // Обработка привязки одной статьи
  const handleClaimArticle = async () => {
    if (!selectedArticle || !selectedUser || !claimingAuthor) return;

    try {
      await api.post(`/articles/articles/${selectedArticle.id}/claim-for-user`, null, {
        params: {
          author_name: claimingAuthor,
          user_id: selectedUser.id
        }
      });

      await fetchSuggestedArticles(selectedUser.id);
      await fetchUserArticles(selectedUser.id);
      setClaimModalOpen(false);
      setClaimingAuthor('');
      setSelectedArticle(null);
      alert('Статья успешно привязана!');
    } catch (err: any) {
      console.error('Error claiming article:', err);
      alert(err.response?.data?.detail || 'Ошибка при привязке статьи');
    }
  };

  // Обработка отвязки статьи
  const handleUnclaimArticle = async () => {
    if (!unclaimingAuthor || !selectedArticle) return;

    try {
      await api.post(`/articles/articles/${selectedArticle.id}/unclaim`, null, {
        params: {
          author_id: unclaimingAuthor.id
        }
      });

      await fetchUserArticles(selectedUser!.id);
      setUnclaimModalOpen(false);
      setUnclaimingAuthor(null);
      alert('Статья отвязана!');
    } catch (err: any) {
      console.error('Error unclaiming article:', err);
      alert(err.response?.data?.detail || 'Ошибка при отвязке статьи');
    }
  };

  // Проверка, является ли автор подходящим для пользователя
  const isLikelyMyAuthor = (authorName: string, userFullName: string): boolean => {
    if (!userFullName) return false;

    const userParts = userFullName.trim().split(/\s+/);
    const lastName = userParts[0] || '';
    const firstName = userParts[1] || '';
    const patronymic = userParts[2] || '';

    const authorParts = authorName.trim().split(/\s+/);
    const authorLastName = authorParts[0] || '';

    if (lastName.toLowerCase() !== authorLastName.toLowerCase()) {
      return false;
    }

    if (authorParts.length === 1) {
      return true;
    }

    if (authorParts.length >= 2) {
      const authorFirstInitial = authorParts[1].replace('.', '').charAt(0).toLowerCase();
      const userFirstInitial = firstName.charAt(0).toLowerCase();

      if (authorFirstInitial !== userFirstInitial) {
        return false;
      }

      if (authorParts.length >= 3 && patronymic) {
        const authorPatronymicInitial = authorParts[2].replace('.', '').charAt(0).toLowerCase();
        const userPatronymicInitial = patronymic.charAt(0).toLowerCase();

        if (authorPatronymicInitial !== userPatronymicInitial) {
          return false;
        }
      }

      return true;
    }

    return false;
  };

  // Переключение выбора статьи
  const toggleArticleSelection = (articleId: number) => {
    const newSelected = new Set(selectedArticlesForClaim);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticlesForClaim(newSelected);
  };

  // Фильтрация предложенных статей
  const filteredSuggestedArticles = useMemo(() => 
    suggestedArticles.filter(article => 
      article.authors.some(author => 
        author.user_employee_id === null && 
        selectedUser && 
        isLikelyMyAuthor(author.author_name, selectedUser.full_name)
      )
    ),
    [suggestedArticles, selectedUser]
  );

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  return (
    <Container size="xl" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="md">
            <Group align="center" gap="sm">
              <ThemeIcon size={60} radius="md" variant="light" color="blue">
                <IconUsers style={{ width: rem(32), height: rem(32) }} />
              </ThemeIcon>
              <div>
                <Title order={1}>Управление статьями пользователей</Title>
                <Text c="dimmed">Привязка и отвязка статей от пользователей</Text>
              </div>
            </Group>
            <Group>
              <Button
                leftSection={<IconPlus size={18} />}
                size="md"
                variant="outline"
                color="blue"
                onClick={() => navigate('/add-article')}
              >
                Добавить статью
              </Button>
            </Group>
          </Group>
        </Box>

        <Divider my="xl" />

        {/* Секция: Выбор пользователя */}
        <Box mb="xl">
          <Title order={3} mb="md">Выберите пользователя</Title>
          
          <TextInput
            leftSection={<IconSearch size={18} />}
            placeholder="Поиск пользователя по ФИО, логину или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            mb="md"
            size="md"
          />

          <LoadingOverlay visible={loading} zIndex={1000} />

          {!loading && (
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ФИО</Table.Th>
                    <Table.Th>Логин</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Роль</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map(user => (
                    <Table.Tr 
                      key={user.id}
                      style={{ 
                        backgroundColor: selectedUser?.id === user.id ? 'var(--mantine-color-blue-light)' : undefined 
                      }}
                    >
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl">{user.full_name.charAt(0)}</Avatar>
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
                        <Badge size="sm" color={user.role === 'admin' ? 'red' : user.role === 'manager' ? 'blue' : 'gray'}>
                          {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant={selectedUser?.id === user.id ? 'filled' : 'outline'}
                          onClick={() => handleSelectUser(user)}
                        >
                          {selectedUser?.id === user.id ? 'Выбран' : 'Выбрать'}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Box>

        {selectedUser && (
          <>
            {/* Секция: Предложенные статьи */}
            <Box mb="xl">
              <Group justify="space-between" align="center" mb="md">
                <Title order={3}>
                  <Text span c="green">Возможно, это работы пользователя {selectedUser.full_name}:</Text>
                </Title>
                <Button
                  size="sm"
                  color="green"
                  variant="light"
                  onClick={handleBulkClaimArticles}
                  loading={bulkClaimLoading}
                  disabled={selectedArticlesForClaim.size === 0 || suggestionsLoading}
                >
                  Привязать выбранные ({selectedArticlesForClaim.size})
                </Button>
              </Group>
              
              {suggestionsLoading ? (
                <Stack gap="md">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
                      <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                          <Skeleton width={20} height={20} radius="xl" />
                          <Skeleton width="80%" height={20} />
                        </Group>
                        <Group gap="xs">
                          <Skeleton width={50} height={20} radius="xl" />
                          <Skeleton width={50} height={20} radius="xl" />
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : filteredSuggestedArticles.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {filteredSuggestedArticles.map(article => (
                    <Card key={article.id} shadow="sm" padding="lg" radius="md" withBorder>
                      <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                          <Checkbox
                            checked={selectedArticlesForClaim.has(article.id)}
                            onChange={() => toggleArticleSelection(article.id)}
                          />
                          <Text fw={500} lineClamp={2} style={{ flex: 1 }}>{article.title}</Text>
                        </Group>
                        <Group gap="xs">
                          <Badge color="gray" size="sm">{article.year_pub}</Badge>
                          {article.in_rinc && <Badge color="green" size="sm">РИНЦ</Badge>}
                        </Group>
                        <Divider />
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed" fw={500}>Авторы:</Text>
                          {article.authors.map(author => {
                            const isMyAuthor = author.user_employee_id === null && isLikelyMyAuthor(author.author_name, selectedUser.full_name);
                            return (
                              <Group key={author.id} justify="space-between" gap="xs">
                                <Text size="sm">{author.author_name}</Text>
                                {isMyAuthor && (
                                  <Tooltip label="Привязать к пользователю">
                                    <ActionIcon
                                      size="sm"
                                      color="green"
                                      variant="light"
                                      onClick={() => {
                                        setSelectedArticle(article);
                                        setClaimingAuthor(author.author_name);
                                        setClaimModalOpen(true);
                                      }}
                                    >
                                      <IconUserPlus size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </Group>
                            );
                          })}
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Box ta="center" py="xl">
                  <ThemeIcon size={80} radius="md" variant="light" color="gray" mb="md">
                    <IconBook style={{ width: rem(40), height: rem(40) }} />
                  </ThemeIcon>
                  <Title order={3} mb="sm">Нет предложенных статей</Title>
                  <Text c="dimmed">
                    На данный момент нет статей, которые могут принадлежать пользователю
                  </Text>
                </Box>
              )}
            </Box>

            {/* Секция: Привязанные статьи пользователя */}
            <Box mb="xl">
              <Title order={3} mb="md">
                Привязанные статьи пользователя:
              </Title>
              
              {userArticles.length > 0 ? (
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ minWidth: '300px' }}>Название</Table.Th>
                        <Table.Th style={{ minWidth: '80px' }}>Год</Table.Th>
                        <Table.Th style={{ minWidth: '80px' }}>РИНЦ</Table.Th>
                        <Table.Th style={{ minWidth: '150px' }}>Автор</Table.Th>
                        <Table.Th style={{ minWidth: '100px' }}>Действия</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {userArticles.map(article => (
                        <Table.Tr key={article.id}>
                          <Table.Td>
                            <Text size="sm" lineClamp={2}>{article.title}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="sm" style={{ whiteSpace: 'nowrap' }}>{article.year_pub}</Badge>
                          </Table.Td>
                          <Table.Td>
                            {article.in_rinc ? (
                              <Badge color="green" size="sm" style={{ whiteSpace: 'nowrap' }}>Да</Badge>
                            ) : (
                              <Badge color="gray" size="sm" style={{ whiteSpace: 'nowrap' }}>Нет</Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              {article.authors
                                .filter(a => a.user_employee_id === selectedUser.id)
                                .map(author => (
                                  <Group key={author.id} gap="xs">
                                    <Text size="sm">{author.author_name}</Text>
                                  </Group>
                                ))
                              }
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon variant="subtle">
                                  <IconDots size={18} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconUnlink size={14} />}
                                  color="red"
                                  onClick={() => {
                                    setSelectedArticle(article);
                                    const author = article.authors.find(a => a.user_employee_id === selectedUser.id);
                                    setUnclaimingAuthor(author || null);
                                    setUnclaimModalOpen(true);
                                  }}
                                >
                                  Отвязать
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              ) : (
                <Box ta="center" py="xl">
                  <Text c="dimmed">У пользователя пока нет привязанных статей</Text>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Модальное окно для привязки статьи */}
        <Modal
          opened={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setClaimingAuthor('');
            setSelectedArticle(null);
          }}
          title="Привязать статью к пользователю"
          size="lg"
        >
          <Stack>
            <Text>
              Вы хотите привязать статью <b>{selectedArticle?.title}</b> к пользователю <b>{selectedUser?.full_name}</b> как автор <b>{claimingAuthor}</b>?
            </Text>
            
            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setClaimModalOpen(false);
                  setClaimingAuthor('');
                  setSelectedArticle(null);
                }}
              >
                Отмена
              </Button>
              <Button
                color="green"
                onClick={handleClaimArticle}
              >
                Привязать
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Модальное окно для отвязки статьи */}
        <Modal
          opened={unclaimModalOpen}
          onClose={() => {
            setUnclaimModalOpen(false);
            setUnclaimingAuthor(null);
            setSelectedArticle(null);
          }}
          title="Отвязать статью от пользователя"
          size="lg"
        >
          <Stack>
            <Text>
              Вы уверены, что хотите отвязать статью <b>{selectedArticle?.title}</b> от пользователя <b>{selectedUser?.full_name}</b>?
            </Text>
            
            <Alert color="orange" radius="md">
              После отвязки статья больше не будет отображаться в списке работ пользователя.
            </Alert>

            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setUnclaimModalOpen(false);
                  setUnclaimingAuthor(null);
                  setSelectedArticle(null);
                }}
              >
                Отмена
              </Button>
              <Button
                color="red"
                onClick={handleUnclaimArticle}
              >
                Отвязать
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Paper>
    </Container>
  );
}
