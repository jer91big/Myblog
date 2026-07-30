import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { noteApi } from '../../api';

export const NoteEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await noteApi.getNoteById(id!);
      if (response.success && response.data) {
        const note = response.data;
        setTitle(note.title);
        setContent(note.content);
        setTagsInput(note.tags.join(', '));
        setStatus(note.status);
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
    }
  };

  const handleSave = async (publish: boolean) => {
    setSaveError('');

    if (!title.trim()) {
      setSaveError('请输入笔记标题');
      return;
    }
    if (!content.trim()) {
      setSaveError('请输入笔记内容');
      return;
    }

    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data = {
        title,
        content,
        tags,
        status: (publish ? 'published' : 'draft') as 'published' | 'draft',
      };

      let response;
      if (id) {
        response = await noteApi.updateNote(id, data);
      } else {
        response = await noteApi.createNote(data);
      }

      if (!response.success) {
        setSaveError(response.message || '保存失败，请重试');
        return;
      }

      navigate('/admin/notes');
    } catch (error) {
      console.error('Failed to save note:', error);
      setSaveError('网络错误，请检查连接后重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {id ? '编辑笔记' : '新建笔记'}
          </h1>
          <p className="text-gray-500 mt-1">
            {id ? '修改现有笔记' : '使用 Markdown 编写新笔记'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? '编辑' : '预览'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            {isSaving ? '发布中...' : '发布笔记'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <input
              type="text"
              placeholder="笔记标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2 focus:border-accent-500 focus:outline-none"
            />
          </div>

          {showPreview ? (
            <div className="bg-white rounded-xl shadow-md p-6 min-h-[400px]">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*暂无内容*'}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="使用 **Markdown** 编写笔记..."
                className="w-full min-h-[500px] p-6 font-mono text-sm leading-relaxed border-0 focus:outline-none resize-y rounded-xl"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">标签</h3>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="多个标签用逗号分隔"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">例如：React, 教程, 入门</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">状态</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('draft')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'draft'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                草稿
              </button>
              <button
                onClick={() => setStatus('published')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
