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
} from '@mantine/core';
import {
  IconBook,
  IconFileDescription,
  IconChevronLeft,
  IconBriefcase,
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
              leftSection={<IconChevronLeft size={18} />}
              variant="outline"
              onClick={() => navigate('/articles')}
            >
              К списку статей
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
                  leftSection={<IconBriefcase size={18} />}
                  onClick={() => navigate('/articles')}
                >
                  Перейти к поиску работ
                </Button>
              </Box>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Название</Table.Th>
                      <Table.Th>Год</Table.Th>
                      <Table.Th>РИНЦ</Table.Th>
                      <Table.Th>Ваш вклад (%)</Table.Th>
                      <Table.Th>Заявка на премию</Table.Th>
                      <Table.Th>Действия</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {myArticles.map(article => {
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
                            <Badge size="sm">{article.year_pub}</Badge>
                          </Table.Td>
                          <Table.Td>
                            {article.in_rinc ? (
                              <Badge color="green" size="sm">Да</Badge>
                            ) : (
                              <Badge color="gray" size="sm">Нет</Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{myAuthor?.contribution || 'N/A'}</Text>
                          </Table.Td>
                          <Table.Td>
                            {myAuthor?.applied_for_award ? (
                              <Badge color="green" size="sm">Да</Badge>
                            ) : (
                              <Badge color="gray" size="sm">Нет</Badge>
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
