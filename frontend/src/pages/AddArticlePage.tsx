import { useState } from 'react';
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
  Select,
  rem,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import { IconCirclePlus, IconBook, IconUser, IconCalendar, IconRuler, IconCheck, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Author {
  id: number;
  name: string;
  contribution: number;
  applied_for_award: boolean;
}

export default function AddArticlePage() {
  const [title, setTitle] = useState('');
  const [yearPub, setYearPub] = useState<number | undefined>(undefined);
  const [inRinc, setInRinc] = useState<boolean>(false);
  const [authors, setAuthors] = useState<Author[]>([{ id: Date.now(), name: '', contribution: 100, applied_for_award: false }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const addAuthor = () => {
    setAuthors([...authors, { id: Date.now(), name: '', contribution: 0, applied_for_award: false }]);
  };

  const removeAuthor = (id: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter(author => author.id !== id));
    }
  };

  const updateAuthor = (id: number, field: keyof Author, value: any) => {
    setAuthors(authors.map(author =>
      author.id === id ? { ...author, [field]: value } : author
    ));
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
      const articleData = {
        title,
        year_pub: yearPub,
        in_rinc: inRinc,
        authors: authors.map(({ name, contribution, applied_for_award }) => ({
          author_name: name,
          contribution,
          applied_for_award,
          award_applied_date: null  // Указываем null для даты, если она не установлена
        }))
      };

      await api.post('/articles/', articleData);  // Используем правильный маршрут с завершающим слэшем
      navigate('/');
    } catch (err) {
      setError('Ошибка при добавлении статьи. Пожалуйста, проверьте данные и попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <Container size="lg" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="green">
              <IconCirclePlus style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Добавить новую статью</Title>
          <Text c="dimmed" ta="center">
            Заполните информацию о научной статье и её авторах
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

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
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
              <Paper key={author.id} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="sm">
                  <Text fw={500}>Автор #{index + 1}</Text>
                  {authors.length > 1 && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      onClick={() => removeAuthor(author.id)}
                      leftSection={<IconX size={14} />}
                    >
                      Удалить
                    </Button>
                  )}
                </Group>

                <Stack gap="sm">
                  <TextInput
                    leftSection={<IconUser size={14} />}
                    label="ФИО автора"
                    placeholder="Фамилия Имя Отчество"
                    value={author.name}
                    onChange={(e) => updateAuthor(author.id, 'name', e.target.value)}
                    required
                  />

                  <Group grow>
                    <NumberInput
                      leftSection={<IconRuler size={14} />}
                      label="Вклад (%)"
                      placeholder="0-100"
                      value={author.contribution}
                      onChange={(value) => updateAuthor(author.id, 'contribution', value || 0)}
                      min={0}
                      max={100}
                      required
                    />

                    <Checkbox
                      mt="xl"
                      pt="md"
                      label="Подан на премию"
                      checked={author.applied_for_award}
                      onChange={(e) => updateAuthor(author.id, 'applied_for_award', e.currentTarget.checked)}
                    />
                  </Group>
                </Stack>
              </Paper>
            ))}

            <Group>
              <Button
                variant="light"
                color="blue"
                onClick={addAuthor}
                leftSection={<IconUser size={16} />}
              >
                Добавить автора
              </Button>
            </Group>

            <Divider my="md" />

            <Group justify="space-between" mt="xl">
              <Button
                variant="outline"
                color="gray"
                onClick={() => navigate('/')}
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
                Добавить статью
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}