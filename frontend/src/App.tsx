import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import IndexPage from './pages/IndexPage';
import ArticleDetail from './pages/ArticleDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddArticlePage from './pages/AddArticlePage';
import AddEmployeePage from './pages/AddEmployeePage';
import DepartmentsListPage from './pages/DepartmentsListPage';

function App() {
  return (
    <MantineProvider>
      <Router>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/add-article" element={<AddArticlePage />} />
          <Route path="/add-employee" element={<AddEmployeePage />} />
          <Route path="/departments" element={<DepartmentsListPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}

export default App;