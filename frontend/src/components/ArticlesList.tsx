import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Author {
  id: number;
  article_id: number;
  author_name: string;
  contribution: number;
  applied_for_award: boolean;
  award_applied_date: string | null;
}

interface Article {
  id: number;
  title: string;
  year_pub: number;
  in_rinc: boolean;
  authors: Author[];
}

const ArticlesList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get('/articles/');
        setArticles(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Articles</h1>
      {articles.map(article => (
        <div key={article.id}>
          <h2>{article.title}</h2>
          <p>Year: {article.year_pub}</p>
          <p>RINC: {article.in_rinc ? 'Yes' : 'No'}</p>
          <h3>Authors:</h3>
          <ul>
            {article.authors.map(author => (
              <li key={author.id}>{author.author_name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ArticlesList;