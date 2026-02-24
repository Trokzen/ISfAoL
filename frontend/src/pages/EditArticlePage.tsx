import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  Text,
  Paper,
  Group,
  Divider,
  Box,
  Stack,
  NumberInput,
  Checkbox,
  rem,
  ThemeIcon,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { IconCirclePlus, IconBook, IconUser, IconCalendar, IconRuler, IconCheck, IconX, IconHash } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

interface Author {
  id: number;
  name: string;
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

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [articleId, setArticleId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [yearPub, setYearPub] = useState<number | undefined>(undefined);
  const [inRinc, setInRinc] = useState<boolean>(false);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные статьи
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setInitialLoading(true);
        const response = await api.get<Article>(`/articles/${id}`);
        const article = response.data;
        
        setArticleId(article.external_id ? article.external_id.toString() : '');
        setTitle(article.title);
        setYearPub(article.year_pub);
        setInRinc(article.in_rinc);
        setAuthors(article.authors.map(author => ({
          ...author,
          name: author.author_name,
          applied_for_award: author.applied_for_award,
          award_applied_date: author.award_applied_date
        })));
      } catch (err) {
        setError('Ошибка при загрузке данных статьи. Пожалуйста, попробуйте снова.');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  const updateAuthor = (index: number, field: keyof Author, value: any) => {
    const updatedAuthors = [...authors];
    updatedAuthors[index] = { ...updatedAuthors[index], [field]: value };
    setAuthors(updatedAuthors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Проверяем, что все поля заполнены
    if (!title || !yearPub || authors.some(author => !author.name.trim())) {
      setError('Пожалуйста, заполните все обязательные поля');
      setLoading(false);
      return;
    }

    // Проверяем, что сумма вкладов равна 100%
    const totalContribution = authors.reduce((sum, author) => sum + author.contribution, 0);
    if (totalContribution !== 100) {
      setError(`Сумма вкладов авторов должна быть равна 100% (текущая сумма: ${totalContribution}%)`);
      setLoading(false);
      return;
    }

    try {
      const articleData: any = {
        external_id: articleId ? parseInt(articleId, 10) : undefined,
        title,
        year_pub: yearPub,
        in_rinc: inRinc,
        authors: authors.map(({ name, contribution, applied_for_award, award_applied_date }) => ({
          author_name: name,
          contribution,
          applied_for_award,
          award_applied_date: award_applied_date
        }))
      };

      await api.put(`/articles/${id}`, articleData);
      navigate(`/article/${id}`);
    } catch (err) {
      setError('Ошибка при обновлении статьи. Пожалуйста, проверьте данные и попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <Container size="lg" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="blue">
              <IconCirclePlus style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Редактировать статью</Title>
          <Text c="dimmed" ta="center">
            Обновите информацию о научной статье и её авторах
          </Text>
        </Box>

        <Divider my="lg" />

        {error && (
          <Alert
            variant="light"
            color="red"
            title="Ошибка"
            mb="lg"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <LoadingOverlay visible={initialLoading} />

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <TextInput
              leftSection={<IconHash size={16} />}
              label="Внешний ID статьи (из elibrary)"
              placeholder="Введите внешний ID статьи"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              size="md"
            />

            <TextInput
              leftSection={<IconBook size={16} />}
              label="Название статьи"
              placeholder="Введите полное название статьи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              size="md"
            />

            <Group grow>
              <NumberInput
                leftSection={<IconCalendar size={16} />}
                label="Год публикации"
                placeholder="Например: 2023"
                value={yearPub}
                onChange={setYearPub}
                min={1900}
                max={new Date().getFullYear() + 1}
                required
                size="md"
              />

              <Checkbox
                mt="lg"
                pt="xl"
                label="Включена в РИНЦ"
                checked={inRinc}
                onChange={(e) => setInRinc(e.currentTarget.checked)}
                size="md"
              />
            </Group>

            <Divider my="md" />

            <Title order={3} mb="md">Информация об авторах</Title>

            {authors.map((author, index) => (
              <Paper key={author.id || index} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="sm">
                  <Text fw={500}>Автор #{index + 1}</Text>
                </Group>

                <Stack gap="sm">
                  <TextInput
                    leftSection={<IconUser size={14} />}
                    label="ФИО автора"
                    placeholder="Фамилия Имя Отчество"
                    value={author.name}
                    onChange={(e) => updateAuthor(index, 'name', e.target.value)}
                    required
                  />

                  <Group grow>
                    <NumberInput
                      leftSection={<IconRuler size={14} />}
                      label="Вклад (%)"
                      placeholder="0-100"
                      value={author.contribution}
                      onChange={(value) => updateAuthor(index, 'contribution', value || 0)}
                      min={0}
                      max={100}
                      required
                    />

                    <Checkbox
                      mt="xl"
                      pt="md"
                      label="Подан на премию"
                      checked={author.applied_for_award}
                      onChange={(e) => updateAuthor(index, 'applied_for_award', e.currentTarget.checked)}
                    />
                  </Group>
                </Stack>
              </Paper>
            ))}

            <Divider my="md" />

            <Group justify="space-between" mt="xl">
              <Button
                variant="outline"
                color="gray"
                onClick={() => navigate(`/article/${id}`)}
                leftSection={<IconX size={16} />}
              >
                Отмена
              </Button>

              <Button
                type="submit"
                leftSection={<IconCheck size={16} />}
                loading={loading}
                size="md"
                px="xl"
              >
                Обновить статью
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}