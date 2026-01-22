import { useState } from 'react';
import { Card, TextInput, Button, Text, Anchor, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { login, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/');
    } catch (err) {
      alert('Ошибка входа');
    }
  };

  return (
    <Card shadow="sm" p="lg" style={{ maxWidth: 400, margin: 'auto' }}>
      <Text size="xl" mb="md">Вход</Text>
      <TextInput label="Логин" value={login} onChange={(e) => setLogin(e.target.value)} mb="sm" />
      <TextInput type="password" label="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} mb="sm" />
      <Button onClick={handleLogin}>Войти</Button>
      <Group mt="md">
        <Anchor href="/register">Регистрация</Anchor>
      </Group>
    </Card>
  );
}