import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { noteApi } from '../api';
import { Note } from '../types';

export const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setIsLoading(true);
    try {
      const response = await noteApi.getNoteById(id!);
      if (response.success && response.data) {
        setNote(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">笔记不存在</p>
          <Link to="/notes" className="text-accent-500 hover:underline mt-4 block">
            返回笔记列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent-500 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            返回笔记列表
          </Link>

          <article className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-10">
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {note.title}
              </h1>

              <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(note.publishedAt)}
                </span>
                {note.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {note.author.username}
                  </span>
                )}
              </div>

              <div className="article-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ className, children, ...props }: any) => {
                      const isInline = !className;
                      if (isInline) {
                        return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
                      }
                      return (
                        <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto my-4">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
};
