import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  LoadingOverlay,
  Paper,
  Card,
  Text,
  Anchor,
  Transition,
  Badge,
  Group,
  Divider,
  Box,
  SimpleGrid,
  rem,
  ThemeIcon,
  Stack,
  Alert,
  ActionIcon,
  Pagination,
  Select,
  Flex,
  Modal,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconAward, IconBook, IconSearch, IconUser, IconCalendar, IconDatabase, IconTrash, IconAlertTriangle, IconHash } from '@tabler/icons-react';
import api from '../utils/api';

interface Author {
  id: number;
  article_id: number;
  author_name: string;
  contribution: number;
  applied_for_award: boolean;
  award_applied_date: string | null;
}

interface Article {
  id: number;
  external_id?: number; // Внешний ID статьи из elibrary
  title: string;
  year_pub: number;
  in_rinc: boolean;
  authors: Author[];
}

interface ApiResponse {
  articles: Article[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchId, setSearchId] = useState<string>('');
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [searchAuthor, setSearchAuthor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(12); // По умолчанию 12 статей на странице
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalArticles, setTotalArticles] = useState<number>(0);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<{id: number, title: string} | null>(null);

  // Получаем роль текущего пользователя
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Декодируем JWT токен, чтобы получить роль
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const userData = JSON.parse(jsonPayload);
        setCurrentUserRole(userData.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const fetchArticles = async () => {
    try {
      setError(null);
      // Используем URLSearchParams для удобного формирования строки запроса
      const params = new URLSearchParams();
      if (searchId) params.append('search_id', searchId);
      if (searchTitle) params.append('search_title', searchTitle);
      if (searchAuthor) params.append('search_author', searchAuthor);
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      // Используем маршрут с завершающим слэшем, чтобы избежать редиректа
      const response = await api.get(`/articles/${params.toString() ? '?' + params.toString() : ''}`);

      // Прямо используем данные из ответа сервера
      setArticles(response.data.articles);
      setTotalPages(response.data.pages);
      setTotalArticles(response.data.total);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Ошибка при загрузке статей. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: number, title: string) => {
    setArticleToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await api.delete(`/articles/${articleToDelete.id}`);
      setDeleteModalOpen(false);
      // Обновляем список статей
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      setDeleteError('Ошибка при удалении статьи. Пожалуйста, попробуйте снова.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, perPage, searchId, searchTitle, searchAuthor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Сброс на первую страницу при новом поиске
    setLoading(true);
    fetchArticles();
  };

  const handlePerPageChange = (value: string | null) => {
    if (value) {
      setPerPage(Number(value));
      setPage(1); // Сброс на первую страницу при изменении количества на странице
    }
  };

  return (
    <Container size="xl" mt="xl">
      {/* Header Section */}
      <Box mb="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} mb="sm">Система учета научных трудов</Title>
            <Text c="dimmed" size="lg">
              Подача работ на премии и управление научными публикациями
            </Text>
          </div>
          <ThemeIcon size={60} radius="md" variant="light" color="blue">
            <IconBook style={{ width: rem(32), height: rem(32) }} />
          </ThemeIcon>
        </Group>

        <Divider my="xl" />
      </Box>

      {/* Search Section */}
      <Paper shadow="md" p="xl" radius="md" withBorder mb="xl">
        <Title order={2} mb="lg">Поиск научных трудов</Title>
        <form onSubmit={handleSubmit}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <TextInput
              leftSection={<IconSearch />}
              label="Поиск по ID"
              placeholder="Введите ID статьи"
              value={searchId}
              onChange={(e) => setSearchId(e.currentTarget.value)}
            />
            <TextInput
              leftSection={<IconSearch />}
              label="Поиск по названию"
              placeholder="Введите часть названия статьи"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.currentTarget.value)}
            />
            <TextInput
              leftSection={<IconUser />}
              label="Поиск по автору"
              placeholder="Введите имя автора"
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.currentTarget.value)}
            />
          </SimpleGrid>

          <Group justify="space-between" mt="md">
            <Select
              label="Работ на странице"
              value={perPage.toString()}
              onChange={handlePerPageChange}
              data={[
                { value: '6', label: '6' },
                { value: '12', label: '12' },
                { value: '24', label: '24' },
                { value: '48', label: '48' },
              ]}
              w={150}
            />
            <Button
              type="submit"
              loading={loading}
              leftSection={<IconSearch />}
              size="md"
            >
              Найти работы
            </Button>
          </Group>
        </form>
      </Paper>

      {/* Error Alert */}
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

      {/* Loading Overlay */}
      <Transition mounted={loading} transition="fade" duration={400}>
        {(styles) => <LoadingOverlay visible={loading} style={styles} zIndex={1000} />}
      </Transition>

      {/* Articles Section */}
      {!loading && !error && (
        <>
          <Group justify="space-between" mb="md">
            <Title order={2}>
              Найденные работы: {totalArticles}
            </Title>
            <Badge size="lg" variant="light" color={articles.length > 0 ? "green" : "gray"}>
              {articles.length > 0 ? `${articles.length} работ на странице` : 'Нет результатов'}
            </Badge>
          </Group>

          {articles.length > 0 ? (
            <SimpleGrid
              cols={{ base: 1, sm: 2, lg: 3 }}
              spacing="lg"
              verticalSpacing="lg"
            >
              {articles.map((article) => {
                const appliedForAward = article.authors.some(author => author.applied_for_award);

                return (
                  <Card
                    key={article.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    h="100%"
                  >
                    <Stack gap="sm" h="100%" justify="space-between">
                      <div>
                        <Group justify="space-between" mb="xs">
                          <Anchor href={`/article/${article.id}`} fw={700} size="lg">
                            {article.title}
                          </Anchor>
                          {appliedForAward && (
                            <Badge
                              variant="light"
                              color="yellow"
                              leftSection={<IconAward size={14} />}
                            >
                              На премию
                            </Badge>
                          )}
                        </Group>

                        <Box>
                          <Text size="sm" c="dimmed" mb="xs" component="div">
                            <Group gap="xs" align="center">
                              <IconCalendar size={14} />
                              {article.year_pub} год
                            </Group>
                            
                            <Group gap="xs" align="center">
                              <IconHash size={14} />
                              {article.external_id ? `#${article.external_id}` : 'отсутствует'}
                            </Group>
                          </Text>
                        </Box>

                        <Group gap="xs" mb="xs">
                          <Badge
                            variant={article.in_rinc ? "filled" : "outline"}
                            color={article.in_rinc ? "green" : "gray"}
                            size="sm"
                          >
                            {article.in_rinc ? 'РИНЦ' : 'Не в РИНЦ'}
                          </Badge>
                        </Group>

                        <Divider my="sm" />

                        <Box>
                          <Group gap="xs" mb="xs" align="center">
                            <IconUser size={14} />
                            <Text size="sm" fw={500}>Авторы:</Text>
                          </Group>
                          <Stack gap="xs">
                            {article.authors.map((author) => (
                              <Group key={author.id} justify="space-between">
                                <Text size="sm">{author.author_name}</Text>
                                <Badge variant="light" size="xs">
                                  {author.contribution}%
                                </Badge>
                              </Group>
                            ))}
                          </Stack>
                        </Box>
                      </div>

                      <Group justify="space-between" w="100%">
                        <ActionIcon
                          component="a"
                          href={`/article/${article.id}`}
                          variant="light"
                          color="blue"
                          aria-label="Перейти к работе"
                        >
                          <IconDatabase size={16} />
                        </ActionIcon>
                        {currentUserRole === 'admin' && (
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Удалить работу"
                            onClick={() => handleDeleteArticle(article.id, article.title)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          ) : (
            !loading && (
              <Paper p="xl" radius="md" withBorder ta="center">
                <ThemeIcon size={80} radius="md" variant="light" color="gray" mx="auto" mb="md">
                  <IconBook style={{ width: rem(40), height: rem(40) }} />
                </ThemeIcon>
                <Title order={3} mb="md">Работы не найдены</Title>
                <Text c="dimmed" mb="xl">
                  Попробуйте изменить параметры поиска или добавить новые работы в систему
                </Text>
                <Button
                  onClick={() => {
                    setSearchId('');
                    setSearchTitle('');
                    setPage(1);
                    setLoading(true);
                    fetchArticles();
                  }}
                  variant="light"
                  color="blue"
                >
                  Показать все работы
                </Button>
              </Paper>
            )
          )}

          {/* Пагинация */}
          {totalPages > 1 && (
            <Flex justify="center" mt="xl">
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="lg"
                radius="md"
              />
            </Flex>
          )}
        </>
      )}

      {/* Модальное окно подтверждения удаления */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
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
            Вы уверены, что хотите удалить статью <Text fw={700}>"{articleToDelete?.title}"</Text>?
          </Text>
          <Text c="dimmed">
            Это действие нельзя будет отменить. Все данные статьи будут безвозвратно удалены.
          </Text>
          
          {deleteError && (
            <Alert variant="light" color="red" title="Ошибка">
              {deleteError}
            </Alert>
          )}
          
          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Отмена
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash />}
              onClick={confirmDeleteArticle}
              loading={deleting}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default IndexPage;