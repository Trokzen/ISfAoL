import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Box,
  rem,
  ThemeIcon,
  Alert,
  Button,
  Stack,
  FileInput,
  Badge,
} from '@mantine/core';
import {
  IconDatabaseImport,
  IconAlertTriangle,
  IconCheck,
  IconFile,
  IconUpload,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function ImportCSVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{message: string, imported: number, skipped: number} | null>(null);
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import/import-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess({
        message: response.data.message,
        imported: response.data.imported,
        skipped: response.data.skipped,
      });
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при импорте CSV файла');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" my="xl">
      <Paper shadow="lg" p="xl" radius="md" withBorder>
        <Box mb="xl">
          <Group justify="center" mb="md">
            <ThemeIcon size={60} radius="md" variant="light" color="blue">
              <IconDatabaseImport style={{ width: rem(32), height: rem(32) }} />
            </ThemeIcon>
          </Group>

          <Title ta="center" mb="sm">Импорт статей из CSV</Title>
          <Text c="dimmed" ta="center">
            Загрузка данных о научных публикациях из CSV файла
          </Text>
        </Box>

        {error && (
          <Alert
            variant="light"
            color="red"
            title="Ошибка"
            mb="md"
            icon={<IconAlertTriangle />}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="light"
            color="green"
            title="Успешно"
            mb="md"
            icon={<IconCheck />}
            onClose={() => setSuccess(null)}
          >
            <Stack gap="sm">
              <Text>{success.message}</Text>
              <Group gap="xs">
                <Badge color="green" size="lg">
                  Импортировано: {success.imported}
                </Badge>
                <Badge color="gray" size="lg">
                  Пропущено: {success.skipped}
                </Badge>
              </Group>
            </Stack>
          </Alert>
        )}

        <Stack gap="lg">
          <FileInput
            label="Выберите CSV файл"
            placeholder="final_result.csv"
            value={file}
            onChange={setFile}
            accept=".csv"
            icon={<IconFile size={18} />}
            disabled={loading}
            required
            description="Файл должен содержать колонки: ID, Название, Авторы, Год публикации, В_РИНЦ"
          />

          <Button
            leftSection={<IconUpload size={18} />}
            onClick={handleImport}
            loading={loading}
            disabled={!file}
            size="lg"
          >
            Импортировать статьи
          </Button>

          <Alert variant="light" color="blue" icon={<IconDatabaseImport />}>
            <Text size="sm" fw={500}>Требования к файлу:</Text>
            <Stack gap="xs" mt="sm">
              <Text size="sm">• Формат: CSV с разделителем запятая</Text>
              <Text size="sm">• Кодировка: UTF-8</Text>
              <Text size="sm">• Обязательные колонки:</Text>
              <Text size="sm" ml="md">- ID (внешний идентификатор статьи)</Text>
              <Text size="sm" ml="md">- Название (название статьи)</Text>
              <Text size="sm" ml="md">- Авторы (список авторов в формате "Фамилия И.О.")</Text>
              <Text size="sm" ml="md">- Год публикации</Text>
              <Text size="sm" ml="md">- В_РИНЦ (Да/Нет)</Text>
              <Text size="sm">• Вклад авторов устанавливается в 0% и указывается вручную</Text>
              <Text size="sm">• Авторы импортируются как внешние (привязываются вручную)</Text>
            </Stack>
          </Alert>

          <Group justify="space-between" mt="xl">
            <Button
              variant="outline"
              color="gray"
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
