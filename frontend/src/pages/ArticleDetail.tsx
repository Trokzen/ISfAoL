import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Notification,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { IconAward, IconBook, IconBuilding, IconMail, IconPhone, IconEdit, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
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
  external_id?: number; // Внешний ID статьи из elibrary
  title: string;
  year_pub: number;
  in_rinc: boolean;
  authors: Author[];
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

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

  const fetchArticle = useCallback(async () => {
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
  }, [id]);

  const handleDeleteArticle = async () => {
    if (!id) return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await api.delete(`/articles/${id}`);
      setDeleteModalOpen(false);
      navigate('/'); // Перенаправляем на главную страницу после удаления
    } catch (error) {
      console.error('Error deleting article:', error);
      setDeleteError('Ошибка при удалении статьи. Пожалуйста, попробуйте снова.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

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
                {article.external_id ? (
                  <>
                    Внешний ID: <Text span fw={700}>#{article.external_id}</Text>
                  </>
                ) : (
                  <>
                    Внешний ID: <Text span fw={700} c="red">отсутствует</Text>
                  </>
                )}
              </Text>
              <Group>
                {currentUserRole === 'admin' || currentUserRole === 'manager' ? (
                  <Button
                    variant="outline"
                    color="blue"
                    leftSection={<IconEdit />}
                    onClick={() => navigate(`/edit-article/${article.id}`)}
                  >
                    Редактировать
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    color="blue"
                    leftSection={<IconEdit />}
                    disabled
                  >
                    Редактировать
                  </Button>
                )}
                {currentUserRole === 'admin' && (
                  <Button
                    variant="outline"
                    color="red"
                    leftSection={<IconTrash />}
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Удалить статью
                  </Button>
                )}
              </Group>
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

          {/* Информация о вкладах авторов */}
          <Paper shadow="md" p="xl" radius="md" withBorder>
            <Group justify="space-between">
              <Stack gap="sm" style={{ flex: 1 }}>
                <Text size="lg" fw={600}>
                  Всего авторов: {article.authors.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Сумма вкладов: {article.authors.reduce((sum, author) => sum + author.contribution, 0).toFixed(1)}%
                </Text>
                <Text
                  size="sm"
                  c={article.authors.reduce((sum, author) => sum + author.contribution, 0) > 100 ? 'red' : 'green'}
                  fw={700}
                >
                  Неиспользовано: {(100 - article.authors.reduce((sum, author) => sum + author.contribution, 0)).toFixed(1)}%
                </Text>
              </Stack>
            </Group>
          </Paper>
        </Stack>
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
            Вы уверены, что хотите удалить статью <Text fw={700}>"{article?.title}"</Text>?
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
              onClick={handleDeleteArticle}
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

export default ArticleDetail;