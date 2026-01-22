import { useState, useEffect } from 'react';
import { Card, TextInput, Button, Group, Text, Anchor } from '@mantine/core';
import api from '../utils/api';

export default function IndexPage() {
  const [articles, setArticles] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [searchTitle, setSearchTitle] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    api.get('/articles', {
      params: { search_id: searchId, search_title: searchTitle }
    })
    .then(res => setArticles(res.data))
    .catch(err => console.error(err));
  };

  return (
    <Card shadow="sm" p="lg">
      <Text size="xl" mb="md">Список научных трудов</Text>
      <Group mb="md">
        <TextInput label="Поиск по ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        <TextInput label="Поиск по названию" value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} />
        <Button onClick={fetchArticles}>Найти</Button>
      </Group>
      <ul>
        {articles.map((a: any) => (
          <li key={a.id}>
            <Anchor href={`/article/${a.id}`}>{a.id} — {a.title}</Anchor>
          </li>
        ))}
      </ul>
    </Card>
  );
}