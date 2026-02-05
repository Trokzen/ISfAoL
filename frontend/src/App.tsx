import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import './globals.css';
import IndexPage from './pages/IndexPage';
import ArticleDetail from './pages/ArticleDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddArticlePage from './pages/AddArticlePage';
import AddEmployeePage from './pages/AddEmployeePage';
import DepartmentsListPage from './pages/DepartmentsListPage';
import AdminPage from './pages/AdminPage';
import ManagerPage from './pages/ManagerPage';
import Navbar from './components/Navbar';

const theme = createTheme({
  colors: {
    // Определяем кастомные цвета для темы
    customBlue: [
      '#e6f0ff',
      '#cce1ff',
      '#99c2ff',
      '#66a3ff',
      '#3385ff',
      '#0066ff',
      '#0052cc',
      '#003d99',
      '#002966',
      '#001433',
    ],
  },
  primaryColor: 'customBlue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif',
    sizes: {
      h1: { fontSize: '2rem', fontWeight: 700 },
      h2: { fontSize: '1.5rem', fontWeight: 600 },
      h3: { fontSize: '1.25rem', fontWeight: 600 },
    },
  },
});

function App() {
  return (
    <MantineProvider theme={theme}>
      <Router>
        <Navbar>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/add-article" element={<AddArticlePage />} />
            <Route path="/add-employee" element={<AddEmployeePage />} />
            <Route path="/departments" element={<DepartmentsListPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/manager" element={<ManagerPage />} />
          </Routes>
        </Navbar>
      </Router>
    </MantineProvider>
  );
}

export default App;