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
  Avatar,
  Center,
  Checkbox,
  UnstyledButton,
  Loader,
  Skeleton,
  RingProgress,
} from '@mantine/core';
import {
  IconBook,
  IconSearch,
  IconUserPlus,
  IconCheck,
  IconX,
  IconFileDescription,
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

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [suggestedArticles, setSuggestedArticles] = useState<Article[]>([]);
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [claimingAuthor, setClaimingAuthor] = useState<string>('');
  const [claimLoading, setClaimLoading] = useState<boolean>(false);
  const [selectedArticlesForClaim, setSelectedArticlesForClaim] = useState<Set<number>>(new Set());
  const [bulkClaimLoading, setBulkClaimLoading] = useState<boolean>(false);
  const [userFullName, setUserFullName] = useState<string>('');
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Получаем ФИО пользователя из токена при загрузке
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

  // Загрузка списка статей
  const fetchArticles = async () => {
    try {
      const response = await api.get('/articles/', {
        params: { page: 1, per_page: 100 }
      });
      setArticles(response.data.articles || response.data);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Ошибка при загрузке статей');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка предложенных статей для текущего пользователя
  const fetchSuggestedArticles = async () => {
    try {
      setSuggestionsLoading(true);
      const response = await api.get('/articles/my/suggestions');
      setSuggestedArticles(response.data);
    } catch (err) {
      console.error('Error fetching suggested articles:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Загрузка статей текущего пользователя
  const fetchMyArticles = async () => {
    try {
      const response = await api.get('/articles/my/articles');
      setMyArticles(response.data);
    } catch (err) {
      console.error('Error fetching my articles:', err);
    }
  };

  // Обработка привязки статьи к пользователю
  const handleClaimArticle = async () => {
    if (!selectedArticle || !claimingAuthor) return;

    setClaimLoading(true);
    try {
      await api.post(`/articles/${selectedArticle.id}/claim`, {
        author_name: claimingAuthor
      });

      // Обновляем списки после привязки
      fetchSuggestedArticles();
      fetchMyArticles();
      fetchArticles();

      setClaimModalOpen(false);
      setClaimingAuthor('');
      setSelectedArticle(null);
    } catch (err: any) {
      console.error('Error claiming article:', err);
      alert(err.response?.data?.detail || 'Ошибка при привязке статьи');
    } finally {
      setClaimLoading(false);
    }
  };

  // Обработка массовой привязки статей
  const handleBulkClaimArticles = async () => {
    if (selectedArticlesForClaim.size === 0) {
      return;
    }

    setBulkClaimLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Привязываем каждую статью последовательно
      for (const articleId of Array.from(selectedArticlesForClaim)) {
        console.log('Processing article:', articleId);
        
        // Ищем статью во всех массивах
        let article = articles.find(a => a.id === articleId);
        
        // Если не нашли в загруженных, загружаем отдельно
        if (!article) {
          try {
            const response = await api.get(`/articles/${articleId}`);
            article = response.data;
            console.log('Article loaded separately:', article);
          } catch (error) {
            console.log('Article not found:', articleId);
            errorCount++;
            continue;
          }
        }
        
        // Используем кэш или вычисляем автора
        const cache = articleAuthorCache.get(articleId);
        let likelyAuthorName = cache?.likelyAuthorName;
        
        if (!likelyAuthorName) {
          const likelyAuthor = article.authors.find(a => 
            a.user_employee_id === null && isLikelyMyAuthor(a.author_name)
          );
          likelyAuthorName = likelyAuthor?.author_name || null;
        }
        
        if (!likelyAuthorName) {
          console.log('No likely author found for article:', articleId);
          errorCount++;
          continue;
        }
        
        console.log('Claiming article:', articleId, 'with author:', likelyAuthorName);
        
        try {
          const response = await api.post(`/articles/${articleId}/claim`, {
            author_name: likelyAuthorName
          });
          console.log('Successfully claimed article:', articleId, response.data);
          successCount++;
        } catch (error: any) {
          console.error('Error claiming article:', articleId, error);
          errorCount++;
          // Не прерываем цикл, продолжаем привязывать остальные статьи
        }
      }

      console.log('Bulk claim completed. Success:', successCount, 'Errors:', errorCount);

      // Обновляем списки после привязки
      await fetchSuggestedArticles();
      await fetchMyArticles();
      await fetchArticles();

      // Очищаем выбор
      setSelectedArticlesForClaim(new Set());
      
      if (successCount > 0) {
        alert(`Успешно привязано ${successCount} статей(и)`);
      } else if (errorCount > 0) {
        alert(`Не удалось привязать статьи. Ошибок: ${errorCount}`);
      }
    } catch (err: any) {
      console.error('Error bulk claiming articles:', err);
      alert(err.response?.data?.detail || 'Ошибка при привязке статей');
    } finally {
      setBulkClaimLoading(false);
    }
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

  // Переключение выбора всех видимых статей
  const toggleSelectAll = () => {
    if (selectedArticlesForClaim.size > 0) {
      setSelectedArticlesForClaim(new Set());
    } else {
      const allArticleIds = filteredArticles
        .filter(article => article.authors.some(a => a.user_employee_id === null && isLikelyMyAuthor(a.author_name)))
        .map(article => article.id);
      setSelectedArticlesForClaim(new Set(allArticleIds));
    }
  };

  // Открытие модального окна для привязки статьи
  const openClaimModal = (article: Article, authorName: string) => {
    setSelectedArticle(article);
    setClaimingAuthor(authorName);
    setClaimModalOpen(true);
  };

  // Определяет, является ли автор предполагаемым автором для текущего пользователя
  const isLikelyMyAuthor = (authorName: string): boolean => {
    if (!userFullName) return false;

    // Разбиваем ФИО на части
    const userParts = userFullName.trim().split(/\s+/);
    const lastName = userParts[0] || '';
    const firstName = userParts[1] || '';
    const patronymic = userParts[2] || '';

    // Разбиваем имя автора на части
    const authorParts = authorName.trim().split(/\s+/);
    const authorLastName = authorParts[0] || '';

    // Сравниваем фамилии (регистронезависимо)
    if (lastName.toLowerCase() !== authorLastName.toLowerCase()) {
      return false;
    }

    // Если у автора только фамилия - это может быть совпадение
    if (authorParts.length === 1) {
      return true;
    }

    // Если у автора есть инициалы
    if (authorParts.length >= 2) {
      const authorFirstInitial = authorParts[1].replace('.', '').charAt(0).toLowerCase();
      const userFirstInitial = firstName.charAt(0).toLowerCase();

      if (authorFirstInitial !== userFirstInitial) {
        return false;
      }

      // Если есть второй инициал (отчество)
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

  // Фильтрация статей по поисковому запросу
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.authors.some(author => author.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Кэшируем результаты проверки авторов для каждой статьи
  const articleAuthorCache = useMemo(() => {
    const cache = new Map<number, { hasUnclaimedAuthor: boolean; likelyAuthorName: string | null }>();
    
    [...articles, ...suggestedArticles].forEach(article => {
      if (cache.has(article.id)) return;
      
      const likelyAuthor = article.authors.find(a => 
        a.user_employee_id === null && isLikelyMyAuthor(a.author_name)
      );
      
      cache.set(article.id, {
        hasUnclaimedAuthor: !!likelyAuthor,
        likelyAuthorName: likelyAuthor?.author_name || null
      });
    });
    
    return cache;
  }, [articles, suggestedArticles, userFullName]);

  // Фильтруем статьи для секции "Возможно, это ваши работы" - только непривязанные
  const filteredSuggestedArticles = useMemo(() => 
    suggestedArticles.filter(article => 
      articleAuthorCache.get(article.id)?.hasUnclaimedAuthor
    ),
    [suggestedArticles, articleAuthorCache]
  );

  useEffect(() => {
    fetchArticles();
    fetchSuggestedArticles();
    fetchMyArticles();
  }, []);

  // Убираем индикатор загрузки после загрузки всех данных
  useEffect(() => {
    if (articles.length > 0 || suggestedArticles.length > 0) {
      setSuggestionsLoading(false);
    }
  }, [articles, suggestedArticles]);

  return (
    <Container size="xl" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="md">
            <Group align="center" gap="sm">
              <ThemeIcon size={60} radius="md" variant="light" color="blue">
                <IconBriefcase style={{ width: rem(32), height: rem(32) }} />
              </ThemeIcon>
              <div>
                <Title order={1}>Мои работы</Title>
                <Text c="dimmed">Поиск и привязка публикаций</Text>
              </div>
            </Group>

            <Group>
              <Button
                leftSection={<IconFileDescription size={18} />}
                variant="outline"
                onClick={() => navigate('/my-works')}
              >
                Мои работы
              </Button>
              <Button
                leftSection={<IconUserPlus size={18} />}
                variant="outline"
                onClick={() => navigate('/add-article')}
              >
                Добавить статью
              </Button>
            </Group>
          </Group>
        </Box>

        <Divider my="xl" />

        {/* Секция: Предложенные статьи */}
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>
              <Text span c="green">Возможно, это ваши работы:</Text>
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
            // Индикатор загрузки
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
                    <Divider />
                    <Stack gap="xs">
                      <Skeleton width={100} height={16} />
                      <Skeleton width="70%" height={14} />
                      <Skeleton width="60%" height={14} />
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : filteredSuggestedArticles.length > 0 ? (
            // Список статей
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {filteredSuggestedArticles.map(article => {
                const cache = articleAuthorCache.get(article.id);
                return (
                  <Card key={article.id} shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Checkbox
                          checked={selectedArticlesForClaim.has(article.id)}
                          onChange={() => toggleArticleSelection(article.id)}
                          disabled={!cache?.hasUnclaimedAuthor}
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
                          const isMyAuthor = author.user_employee_id === null && isLikelyMyAuthor(author.author_name);
                          return (
                            <Group key={author.id} justify="space-between" gap="xs">
                              <Text size="sm">{author.author_name}</Text>
                              {isMyAuthor && (
                                <Tooltip label="Привязать к себе">
                                  <ActionIcon
                                    size="sm"
                                    color="green"
                                    variant="light"
                                    onClick={() => openClaimModal(article, author.author_name)}
                                  >
                                    <IconUserPlus size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                              {author.user_employee_id !== null && (
                                <IconCheck size={16} color="green" />
                              )}
                            </Group>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          ) : (
            // Нет предложенных статей
            <Box ta="center" py="xl">
              <ThemeIcon size={80} radius="md" variant="light" color="gray" mb="md">
                <IconBook style={{ width: rem(40), height: rem(40) }} />
              </ThemeIcon>
              <Title order={3} mb="sm">Нет предложенных статей</Title>
              <Text c="dimmed" mb="md">
                На данный момент нет статей, которые могут вам принадлежать
              </Text>
              <Button
                leftSection={<IconSearch size={18} />}
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Поиск по всем статьям
              </Button>
            </Box>
          )}
        </Box>

        {/* Секция: Поиск статей */}
        <Box mb="xl">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>Все статьи</Title>
            {selectedArticlesForClaim.size > 0 && (
              <Button
                size="sm"
                color="green"
                variant="light"
                onClick={handleBulkClaimArticles}
                loading={bulkClaimLoading}
              >
                Привязать выбранные ({selectedArticlesForClaim.size})
              </Button>
            )}
          </Group>
          
          <TextInput
            leftSection={<IconSearch size={18} />}
            placeholder="Поиск по названию или автору..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            mb="md"
            size="md"
          />

          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Checkbox
                      checked={selectedArticlesForClaim.size > 0 && filteredArticles.every(article => 
                        selectedArticlesForClaim.has(article.id)
                      )}
                      onChange={toggleSelectAll}
                    />
                  </Table.Th>
                  <Table.Th>Название</Table.Th>
                  <Table.Th>Год</Table.Th>
                  <Table.Th>Авторы</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredArticles.map(article => {
                  const cache = articleAuthorCache.get(article.id);
                  const hasUnclaimedAuthor = cache?.hasUnclaimedAuthor || false;
                  return (
                    <Table.Tr key={article.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedArticlesForClaim.has(article.id)}
                          onChange={() => toggleArticleSelection(article.id)}
                          disabled={!hasUnclaimedAuthor}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>{article.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm">{article.year_pub}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          {article.authors.map(author => (
                            <Group key={author.id} gap="xs">
                              <Text size="sm">{author.author_name}</Text>
                              {author.user_employee_id !== null && (
                                <IconCheck size={14} color="green" />
                              )}
                            </Group>
                          ))}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => navigate(`/article/${article.id}`)}
                          >
                            Подробнее
                          </Button>
                          {hasUnclaimedAuthor && (
                            <Button
                              size="xs"
                              color="green"
                              variant="light"
                              onClick={() => {
                                const cache = articleAuthorCache.get(article.id);
                                if (cache?.likelyAuthorName) {
                                  openClaimModal(article, cache.likelyAuthorName);
                                }
                              }}
                            >
                              Привязать
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Box>

        {/* Модальное окно для привязки статьи */}
        <Modal
          opened={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setClaimingAuthor('');
            setSelectedArticle(null);
          }}
          title="Привязать статью к себе"
          size="lg"
        >
          <Stack>
            <Text>
              Вы хотите привязать статью <b>{selectedArticle?.title}</b> к себе как автор <b>{claimingAuthor}</b>?
            </Text>
            
            <Alert color="blue" radius="md">
              После привязки статья появится в списке "Мои статьи" и вы сможете редактировать информацию о своём вкладе.
            </Alert>

            <Group justify="right" mt="md">
              <Button
                variant="outline"
                color="gray"
                onClick={() => {
                  setClaimModalOpen(false);
                  setClaimingAuthor('');
                  setSelectedArticle(null);
                }}
                disabled={claimLoading}
              >
                Отмена
              </Button>
              <Button
                color="green"
                onClick={handleClaimArticle}
                loading={claimLoading}
                leftSection={<IconCheck size={16} />}
              >
                Привязать
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Paper>
    </Container>
  );
}
