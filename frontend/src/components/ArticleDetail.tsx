import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/articles/${id}`);
        setArticle(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching article:', error);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div>
      <h1>{article.title}</h1>
      <p>Year: {article.year_pub}</p>
      <p>RINC: {article.in_rinc ? 'Yes' : 'No'}</p>
      <h3>Authors:</h3>
      <ul>
        {article.authors.map(author => (
          <li key={author.id}>
            {author.author_name} - Contribution: {author.contribution}%
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticleDetail;