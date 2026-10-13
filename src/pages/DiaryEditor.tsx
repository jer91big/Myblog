import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Eye, AlertCircle, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { diaryApi } from '../api';
import { dataImageUrlTransform } from '../lib/markdown';
import { localDateInputValue, toDateInputValue } from '../lib/diary';

// Vercel 函数请求体上限约 4.5MB，留出余量后封顶，超了就明确报错而不是 413
const MAX_PAYLOAD_BYTES = 4_200_000;
// 单张图片压缩后仍超过这个体积就再压一轮
const SECOND_PASS_THRESHOLD = 1_500_000;

export const DiaryEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => localDateInputValue());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchDiary();
    }
  }, [id]);

  const fetchDiary = async () => {
    try {
      const response = await diaryApi.getDiaryById(id!);
      if (response.success && response.data) {
        setTitle(response.data.title);
        setContent(response.data.content || '');
        setDate(toDateInputValue(response.data.date));
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

  // 在光标处插入内容并恢复光标，避免插入后跳回开头
  const insertAtCursor = (snippet: string) => {
    const textarea = textareaRef.current;
    const cursor = textarea ? textarea.selectionStart : content.length;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    const inserted = `${prefix}${snippet}\n`;
    setContent(`${before}${inserted}${after}`);

    const caret = cursor + inserted.length;
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(caret, caret);
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
      // base64 内嵌会随请求体一起提交，过大时再压一轮
      if (dataUrl.length > SECOND_PASS_THRESHOLD) {
        dataUrl = await compressImage(file, 800, 0.6);
      }
      insertAtCursor(`![图片](${dataUrl})`);
    } catch (error) {
      console.error('Failed to compress image:', error);
      setSaveError('图片处理失败，请重试');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaveError('');

    if (!content.trim()) {
      setSaveError('请输入日记内容');
      return;
    }

    const payload = { title, content, date };
    // 用 Blob 量字节数，中文按 UTF-8 算才准
    if (new Blob([JSON.stringify(payload)]).size > MAX_PAYLOAD_BYTES) {
      setSaveError('日记内容过大（图片太多），请减少图片或改用图片链接');
      return;
    }

    setIsSaving(true);
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
      setIsSaving(false);
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
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {id ? '编辑日记' : '写日记'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-11 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:border-accent-500 focus:outline-none"
              />
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="min-h-11 flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? '编辑' : '预览'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isCompressing}
                className="min-h-11 flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-4">
            <input
              type="text"
              placeholder="标题（可留空，留空时以日期为标题）"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 focus:border-accent-500 focus:outline-none"
            />

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isCompressing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                插入图片
              </button>
              <span className="text-xs text-gray-400">图片会压缩后随正文一起保存</span>
            </div>

            {showPreview ? (
              <div className="prose prose-lg max-w-none min-h-[420px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  urlTransform={dataImageUrlTransform}
                >
                  {content || '*暂无内容*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="今天发生了什么？支持 **Markdown** 格式..."
                className="w-full min-h-[420px] p-4 font-mono text-sm leading-relaxed border-0 focus:outline-none resize-y rounded-xl bg-gray-50"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
