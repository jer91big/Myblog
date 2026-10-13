import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  List,
  Quote,
  Code,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExtension from '@tiptap/extension-image';
import { diaryApi } from '../api';
import { localDateInputValue, toDateInputValue } from '../lib/diary';

// Vercel 函数请求体上限约 4.5MB，留出余量后封顶，超了就明确报错而不是 413
const MAX_PAYLOAD_BYTES = 4_200_000;
// 单张图片压缩后仍超过这个体积就再压一轮
const SECOND_PASS_THRESHOLD = 1_500_000;

// 扩展实例放在模块作用域，避免每次渲染新建实例破坏 Tiptap 的配置比较
const extensions = [
  StarterKit,
  ImageExtension.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: 'rounded-lg max-w-full',
    },
  }),
  Placeholder.configure({
    placeholder: '今天发生了什么？',
  }),
];

export const DiaryEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => localDateInputValue());
  const [status, setStatus] = useState<'draft' | 'completed'>('completed');
  const [loadedContent, setLoadedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [savingStatus, setSavingStatus] = useState<'draft' | 'completed' | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions,
    content: '',
  });

  useEffect(() => {
    if (id) {
      fetchDiary();
    }
  }, [id]);

  // 正文要等编辑器实例和接口数据都就绪后写入，分开处理避免首次渲染时 editor 还是 null
  useEffect(() => {
    if (editor && loadedContent !== null) {
      editor.commands.setContent(loadedContent);
    }
  }, [editor, loadedContent]);

  const fetchDiary = async () => {
    try {
      const response = await diaryApi.getDiaryById(id!);
      if (response.success && response.data) {
        const diary = response.data;
        setTitle(diary.title);
        setDate(toDateInputValue(diary.date));
        setStatus(diary.status);
        setLoadedContent(diary.content || '');
      } else {
        setSaveError(response.message || '日记不存在或无权访问');
      }
    } catch (error) {
      console.error('Failed to fetch diary:', error);
      setSaveError('加载日记失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
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
          resolve(canvas.toDataURL('image/jpeg', quality));
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
      setSaveError('请选择图片文件');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('图片不能超过 5MB');
      e.target.value = '';
      return;
    }

    setSaveError('');
    setIsCompressing(true);
    try {
      let dataUrl = await compressImage(file, 1080, 0.72);
      // base64 会随请求体一起提交，过大时再压一轮
      if (dataUrl.length > SECOND_PASS_THRESHOLD) {
        dataUrl = await compressImage(file, 800, 0.6);
      }
      editor?.chain().focus().setImage({ src: dataUrl }).run();
    } catch (error) {
      console.error('Failed to compress image:', error);
      setSaveError('图片处理失败，请重试');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const insertImageByUrl = () => {
    const url = prompt('请输入图片 URL：');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleSave = async (nextStatus: 'draft' | 'completed') => {
    setSaveError('');

    const content = editor?.getHTML() || '';
    if (!content || content === '<p></p>') {
      setSaveError('请输入日记内容');
      return;
    }

    const payload = { title, content, date, status: nextStatus };
    // 用 Blob 量字节数，中文按 UTF-8 算才准
    if (new Blob([JSON.stringify(payload)]).size > MAX_PAYLOAD_BYTES) {
      setSaveError('日记内容过大（图片太多），请减少图片或改用图片链接');
      return;
    }

    setSavingStatus(nextStatus);
    try {
      const response = id
        ? await diaryApi.updateDiary(id, payload)
        : await diaryApi.createDiary(payload);

      if (!response.success) {
        setSaveError(response.message || '保存失败，请重试');
        return;
      }

      navigate(`/diaries/${id || response.data?.id}`);
    } catch (error) {
      // 413 返回的是 HTML，response.json() 会抛异常，统一兜在这里
      console.error('Failed to save diary:', error);
      setSaveError('保存失败：内容可能过大或网络异常');
    } finally {
      setSavingStatus(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to={id ? `/diaries/${id}` : '/diaries'}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-accent-500 transition-colors mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-gray-900">
                  {id ? '编辑日记' : '写日记'}
                </h1>
                {id && status === 'draft' && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    草稿
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-11 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:border-accent-500 focus:outline-none"
              />
              <button
                onClick={() => handleSave('draft')}
                disabled={savingStatus !== null}
                className="min-h-11 flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingStatus === 'draft' ? '保存中...' : '保存草稿'}
              </button>
              <button
                onClick={() => handleSave('completed')}
                disabled={savingStatus !== null}
                className="min-h-11 flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {savingStatus === 'completed' ? '保存中...' : '完成'}
              </button>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <input
              type="text"
              placeholder="标题（可留空，留空时以日期为标题）"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 focus:border-accent-500 focus:outline-none"
            />

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
                disabled={isCompressing}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                title="上传本地图片"
              >
                {isCompressing ? (
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

            <EditorContent editor={editor} className="prose max-w-none overflow-x-auto" />
          </div>
        </div>
      </main>
    </div>
  );
};
