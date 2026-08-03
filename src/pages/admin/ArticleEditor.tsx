import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, AlertCircle, Image as ImageIcon, Bold, Italic, Heading2, List, Quote, Code } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import { articleApi, categoryApi, tagApi } from '../../api';
import { Category, Tag } from '../../types';

export const ArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder: '开始写作...',
      }),
    ],
    content: '',
  });

  // 本地图片压缩转 base64
  const compressImage = (file: File, maxWidth = 1280): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片不能超过 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const dataUrl = await compressImage(file);
      editor?.chain().focus().setImage({ src: dataUrl }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('图片上传失败，请重试');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const insertImageByUrl = () => {
    const url = prompt('请输入图片 URL：');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await tagApi.getTags();
      if (response.success && response.data) {
        setTags(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchArticle = async () => {
    try {
      const response = await articleApi.getArticleById(id!);
      if (response.success && response.data) {
        const article = response.data;
        setTitle(article.title);
        setExcerpt(article.excerpt);
        setCategoryId(article.category.id);
        setSelectedTags(article.tags.map((tag) => tag.id));
        setStatus(article.status);
        setFeaturedImage(article.featuredImage);
        setMetaTitle(article.metaTitle);
        setMetaDescription(article.metaDescription);
        editor?.commands.setContent(article.content);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    }
  };

  const handleSave = async (publish: boolean) => {
    setSaveError('');

    // 客户端验证
    if (!title.trim()) {
      setSaveError('请输入文章标题');
      return;
    }
    if (!categoryId) {
      setSaveError('请选择一个分类');
      return;
    }
    const content = editor?.getHTML() || '';
    if (!content || content === '<p></p>') {
      setSaveError('请输入文章内容');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        categoryId,
        tagIds: selectedTags,
        status: (publish ? 'published' : 'draft') as 'published' | 'draft',
        featuredImage,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || (excerpt || content.substring(0, 160)),
      };

      let response;
      if (id) {
        response = await articleApi.updateArticle(id, data);
      } else {
        response = await articleApi.createArticle(data);
      }

      if (!response.success) {
        setSaveError(response.message || '保存失败，请重试');
        return;
      }

      navigate('/admin/articles');
    } catch (error) {
      console.error('Failed to save article:', error);
      setSaveError('网络错误，请检查连接后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {id ? '编辑文章' : '新建文章'}
          </h1>
          <p className="text-gray-500 mt-1">{id ? '修改现有文章' : '创建一篇新文章'}</p>
        </div>
        <div className="flex items-center gap-3">
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
            {isSaving ? '发布中...' : '发布文章'}
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
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2 focus:border-accent-500 focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            {/* 编辑器工具栏 */}
            <div className="flex items-center gap-1 border-b border-gray-100 pb-3 mb-3 flex-wrap">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('bold') ? 'bg-accent-100 text-accent-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="加粗"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('italic') ? 'bg-accent-100 text-accent-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="斜体"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-accent-100 text-accent-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="二级标题"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('bulletList') ? 'bg-accent-100 text-accent-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="无序列表"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('blockquote') ? 'bg-accent-100 text-accent-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="引用"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('codeBlock') ? 'bg-accent-100 text-accent-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="代码块"
              >
                <Code className="w-4 h-4" />
              </button>
              <span className="w-px h-5 bg-gray-200 mx-1" />
              <button
                onClick={insertImageByUrl}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
                title="通过 URL 插入图片"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                title="上传本地图片"
              >
                {isUploadingImage ? (
                  <div className="animate-spin w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>
              <span className="text-xs text-gray-400 ml-auto">
                支持本地图片上传（自动压缩）和 URL 插入
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <EditorContent editor={editor} className="prose max-w-none" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">分类</h3>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
            >
              <option value="">选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
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

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">特色图片</h3>
            <input
              type="url"
              placeholder="图片URL"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">SEO 设置</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Meta 标题"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
              />
              <textarea
                placeholder="Meta 描述"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
