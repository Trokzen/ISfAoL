import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Badge,
  Group,
  Divider,
  Stack,
  Button,
  LoadingOverlay,
  Alert,
  Card,
  Avatar,
  ThemeIcon,
  rem,
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import { IconAward, IconBook, IconBuilding, IconMail, IconPhone, IconEdit, IconDatabase } from '@tabler/icons-react';
import api from '../utils/api';

interface Author {
  id: number;
  article_id: number;
  author_name: string;
  contribution: number;
  applied_for_award: boolean;
  award_applied_date: string | null;
  department?: string;
  email?: string;
  phone?: string;
}

interface Article {
  id: number;
  title: string;
  year_pub: number;
  in_rinc: boolean;
  authors: Author[];
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = async () => {
    try {
      setError(null);
      const response = await api.get<Article>(`/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
      setError('Ошибка при загрузке данных статьи. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [id, fetchArticle]);

  if (error) {
    return (
      <Container size="xl" mt="xl">
        <Alert variant="light" color="red" title="Ошибка загрузки данных">
          {error}
        </Alert>
        <Button
          onClick={fetchArticle}
          variant="light"
          color="blue"
          mt="md"
        >
          Повторить попытку
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl" mt="xl">
      <LoadingOverlay visible={loading} zIndex={1000} />

      {article && (
        <Stack gap="xl">
          {/* Заголовок статьи */}
          <Paper shadow="md" p="xl" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group gap="sm" mb="md">
                  <Badge
                    variant={article.in_rinc ? "filled" : "outline"}
                    color={article.in_rinc ? "green" : "gray"}
                    size="lg"
                  >
                    {article.in_rinc ? 'Включена в РИНЦ' : 'Не включена в РИНЦ'}
                  </Badge>
                  {article.authors.some(author => author.applied_for_award) && (
                    <Badge
                      variant="light"
                      color="yellow"
                      leftSection={<IconAward size={14} />}
                      size="lg"
                    >
                      Подана на премию
                    </Badge>
                  )}
                </Group>

                <Title order={1}>{article.title}</Title>
                <Text c="dimmed" size="lg" mt="sm">
                  Год публикации: <Text span fw={600}>{article.year_pub}</Text>
                </Text>
              </div>

              <ThemeIcon size={80} radius="md" variant="light" color="blue">
                <IconBook style={{ width: rem(40), height: rem(40) }} />
              </ThemeIcon>
            </Group>

            <Divider my="xl" />

            <Group justify="space-between">
              <Text size="lg">
                Идентификатор статьи: <Text span fw={700}>#{article.id}</Text>
              </Text>
              <Button
                variant="outline"
                color="blue"
                leftSection={<IconEdit />}
              >
                Редактировать
              </Button>
            </Group>
          </Paper>

          {/* Информация об авторах */}
          <Paper shadow="md" p="xl" radius="md" withBorder>
            <Title order={2} mb="lg">Информация об авторах</Title>

            <Stack gap="lg">
              {article.authors.map((author) => (
                <Card key={author.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start">
                    <Avatar size="lg" color="blue" radius="xl">
                      {author.author_name.charAt(0).toUpperCase()}
                    </Avatar>

                    <Stack gap="xs" flex={1} ml="md">
                      <Group justify="space-between" w="100%">
                        <Title order={3}>{author.author_name}</Title>
                        <Badge size="lg" variant="light" color="blue">
                          Вклад: {author.contribution}%
                        </Badge>
                      </Group>

                      {author.department && (
                        <Group gap="xs">
                          <IconBuilding size={16} />
                          <Text>{author.department}</Text>
                        </Group>
                      )}

                      {author.email && (
                        <Group gap="xs">
                          <IconMail size={16} />
                          <Text c="dimmed">{author.email}</Text>
                        </Group>
                      )}

                      {author.phone && (
                        <Group gap="xs">
                          <IconPhone size={16} />
                          <Text c="dimmed">{author.phone}</Text>
                        </Group>
                      )}

                      {author.applied_for_award && author.award_applied_date && (
                        <Group gap="xs">
                          <IconAward size={16} color="#f59f00" />
                          <Text>
                            Подан на премию: <Text span fw={600}>{new Date(author.award_applied_date).toLocaleDateString()}</Text>
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Paper>

          {/* Действия */}
          <Paper shadow="md" p="xl" radius="md" withBorder>
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                Всего авторов: {article.authors.length}
              </Text>
              <Group>
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconDatabase />}
                >
                  Экспорт данных
                </Button>
                <Button
                  variant="filled"
                  color="orange"
                  leftSection={<IconAward />}
                >
                  Подать на премию
                </Button>
              </Group>
            </Group>
          </Paper>
        </Stack>
      )}
    </Container>
  );
};

export default ArticleDetail;