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
} from '@mantine/core';
import { IconAward, IconBook, IconSearch, IconUser, IconCalendar, IconDatabase } from '@tabler/icons-react';
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

  const fetchArticles = async () => {
    try {
      setError(null);
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
      setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [searchId, searchTitle, page, perPage]);

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

                      <ActionIcon
                        component="a"
                        href={`/article/${article.id}`}
                        variant="light"
                        color="blue"
                        aria-label="Перейти к работе"
                        w="100%"
                      >
                        <IconDatabase size={16} />
                      </ActionIcon>
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
    </Container>
  );
};

export default IndexPage;