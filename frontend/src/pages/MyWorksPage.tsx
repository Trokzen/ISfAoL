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
  Table,
  ScrollArea,
  Select,
  Checkbox,
  TextInput,
  NumberInput,
} from '@mantine/core';
import {
  IconBook,
  IconFileDescription,
  IconChevronLeft,
  IconBriefcase,
  IconSearch,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

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

export default function MyArticlesPage() {
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [inRincFilter, setInRincFilter] = useState<string>('');
  const [appliedForAwardFilter, setAppliedForAwardFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  // Загрузка статей текущего пользователя
  const fetchMyArticles = async () => {
    try {
      const response = await api.get('/articles/my/articles');
      setMyArticles(response.data);
    } catch (err) {
      console.error('Error fetching my articles:', err);
      setError('Ошибка при загрузке ваших статей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyArticles();
  }, []);

  // Получение минимального и максимального года
  const years = myArticles.map(article => article.year_pub);
  const minYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear();
  const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

  // Фильтрация статей
  const filteredArticles = myArticles.filter(article => {
    // Фильтр по диапазону годов
    if (yearFrom && article.year_pub < parseInt(yearFrom)) return false;
    if (yearTo && article.year_pub > parseInt(yearTo)) return false;
    
    // Фильтр по РИНЦ
    if (inRincFilter && ((inRincFilter === 'yes' && !article.in_rinc) || (inRincFilter === 'no' && article.in_rinc))) return false;
    
    // Фильтр по заявке на премию
    const hasAuthorApplied = article.authors.some(a => a.applied_for_award);
    if (appliedForAwardFilter && ((appliedForAwardFilter === 'yes' && !hasAuthorApplied) || (appliedForAwardFilter === 'no' && hasAuthorApplied))) return false;
    
    // Поиск по названию
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  return (
    <Container size="xl" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="md">
            <Group align="center" gap="sm">
              <ThemeIcon size={60} radius="md" variant="light" color="green">
                <IconBriefcase style={{ width: rem(32), height: rem(32) }} />
              </ThemeIcon>
              <div>
                <Title order={1}>Мои работы</Title>
                <Text c="dimmed">Ваши публикации в системе</Text>
              </div>
            </Group>

            <Button
              variant="outline"
              onClick={() => navigate('/articles')}
            >
              Привязать статьи
            </Button>
          </Group>
        </Box>

        <Divider my="xl" />

        {error && (
          <Alert variant="light" color="red" title="Ошибка" mb="xl">
            {error}
          </Alert>
        )}

        <LoadingOverlay visible={loading} zIndex={1000} />

        {!loading && !error && (
          <>
            {/* Панель фильтров */}
            <Group mb="md" grow>
              <TextInput
                leftSection={<IconSearch size={18} />}
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="md"
              />

              <NumberInput
                placeholder="Год (от)"
                value={yearFrom}
                onChange={(value) => setYearFrom(value?.toString() || '')}
                min={minYear}
                max={maxYear}
                size="md"
                clearable
              />

              <NumberInput
                placeholder="Год (до)"
                value={yearTo}
                onChange={(value) => setYearTo(value?.toString() || '')}
                min={minYear}
                max={maxYear}
                size="md"
                clearable
              />

              <Select
                placeholder="РИНЦ"
                data={[
                  { value: 'yes', label: 'Да' },
                  { value: 'no', label: 'Нет' },
                ]}
                value={inRincFilter}
                onChange={(value) => setInRincFilter(value || '')}
                clearable
                size="md"
              />

              <Select
                placeholder="Заявка на премию"
                data={[
                  { value: 'yes', label: 'Да' },
                  { value: 'no', label: 'Нет' },
                ]}
                value={appliedForAwardFilter}
                onChange={(value) => setAppliedForAwardFilter(value || '')}
                clearable
                size="md"
              />
            </Group>

            {myArticles.length === 0 ? (
              <Box ta="center" py="xl">
                <ThemeIcon size={80} radius="md" variant="light" color="gray" mb="md">
                  <IconFileDescription style={{ width: rem(40), height: rem(40) }} />
                </ThemeIcon>
                <Title order={3} mb="sm">У вас пока нет работ</Title>
                <Text c="dimmed" mb="md">
                  Найдите свои работы в общем списке и привяжите их к себе
                </Text>
                <Button
                  leftSection={<IconBook size={18} />}
                  onClick={() => navigate('/articles')}
                >
                  Привязать статьи
                </Button>
              </Box>
            ) : filteredArticles.length === 0 ? (
              <Box ta="center" py="xl">
                <ThemeIcon size={80} radius="md" variant="light" color="gray" mb="md">
                  <IconSearch style={{ width: rem(40), height: rem(40) }} />
                </ThemeIcon>
                <Title order={3} mb="sm">Ничего не найдено</Title>
                <Text c="dimmed" mb="md">
                  Попробуйте изменить параметры фильтров
                </Text>
                <Button
                  variant="outline"
                  onClick={() => {
                    setYearFrom('');
                    setYearTo('');
                    setInRincFilter('');
                    setAppliedForAwardFilter('');
                    setSearchQuery('');
                  }}
                >
                  Сбросить фильтры
                </Button>
              </Box>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ minWidth: '300px' }}>Название</Table.Th>
                      <Table.Th style={{ minWidth: '80px' }}>Год</Table.Th>
                      <Table.Th style={{ minWidth: '80px' }}>РИНЦ</Table.Th>
                      <Table.Th style={{ minWidth: '100px' }}>Ваш вклад (%)</Table.Th>
                      <Table.Th style={{ minWidth: '100px' }}>Заявка на премию</Table.Th>
                      <Table.Th style={{ minWidth: '100px' }}>Действия</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredArticles.map(article => {
                      // Находим автора, который соответствует текущему пользователю
                      const myAuthor = article.authors.find(
                        a => a.user_employee_id !== null
                      );

                      return (
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
                            <Text size="sm" style={{ whiteSpace: 'nowrap' }}>{myAuthor?.contribution || 'N/A'}</Text>
                          </Table.Td>
                          <Table.Td>
                            {myAuthor?.applied_for_award ? (
                              <Badge color="green" size="sm" style={{ whiteSpace: 'nowrap' }}>Да</Badge>
                            ) : (
                              <Badge color="gray" size="sm" style={{ whiteSpace: 'nowrap' }}>Нет</Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => navigate(`/article/${article.id}`)}
                            >
                              Подробнее
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
