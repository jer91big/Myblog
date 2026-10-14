import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, PenLine, Trash2 } from 'lucide-react';
import { Lightbox } from '../components/Lightbox';
import HalftoneReveal from '../components/HalftoneReveal';
import { diaryApi } from '../api';
import { Diary } from '../types';
import { diaryDisplayTitle, formatDiaryDate } from '../lib/diary';

interface ContentImage {
  src: string;
  alt: string;
}

// WebGL2 缺失时网点效果渲染不出来，直接退回普通图片
const supportsReveal = (() => {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
})();

// 正文图片的半调网点显现包装：近视口才挂载 WebGL 组件以控制上下文数量，
// 跨域图片若读取像素会抛安全错误（WebGL 纹理同样会被污染），先用 1x1 探针验证
const RevealImage = ({ src, alt, onOpen }: { src: string; alt: string; onOpen: () => void }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [usable, setUsable] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => setNear(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: '400px 0px' }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!supportsReveal) return;
    if (src.startsWith('data:')) {
      setUsable(true);
      return;
    }
    let alive = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!alive) return;
      try {
        const probe = document.createElement('canvas').getContext('2d');
        if (!probe) throw new Error('no 2d context');
        probe.drawImage(image, 0, 0, 1, 1);
        probe.getImageData(0, 0, 1, 1);
        setUsable(true);
      } catch {
        setUsable(false);
      }
    };
    image.onerror = () => {
      if (alive) setUsable(false);
    };
    image.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  return (
    <div
      ref={hostRef}
      className="relative my-4 h-72 w-full cursor-zoom-in overflow-hidden rounded-lg md:h-96"
      onClick={onOpen}
    >
      {near && usable ? (
        <HalftoneReveal src={src} fit="contain" mode="color" clickBurst={false} />
      ) : (
        <img src={src} alt={alt} className="!m-0 h-full w-full max-w-none bg-white object-contain" />
      )}
    </div>
  );
};

export const DiaryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<ContentImage | null>(null);
  const [reveal, setReveal] = useState<{ html: string; images: ContentImage[] }>({
    html: '',
    images: [],
  });
  const [portalHosts, setPortalHosts] = useState<HTMLElement[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    fetchDiary();
  }, [id]);

  // 正文里的图片换成占位节点，再以 portal 把 HalftoneReveal 渲染回原位
  useEffect(() => {
    if (!diary) return;
    const images: ContentImage[] = [];
    const doc = new DOMParser().parseFromString(diary.content || '', 'text/html');
    doc.body.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src) return;
      const marker = doc.createElement('div');
      marker.setAttribute('data-diary-image', String(images.length));
      images.push({ src, alt: img.getAttribute('alt') || '' });
      const parent = img.parentElement;
      // 图片独占一个段落时整个段落换成占位块，避免留下空段落
      if (
        parent &&
        parent.tagName === 'P' &&
        parent.children.length === 1 &&
        !parent.textContent?.trim()
      ) {
        parent.replaceWith(marker);
      } else {
        img.replaceWith(marker);
      }
    });
    setReveal({ html: doc.body.innerHTML, images });
  }, [diary]);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    setPortalHosts(
      Array.from(contentRef.current.querySelectorAll<HTMLElement>('[data-diary-image]'))
    );
  }, [reveal]);

  const fetchDiary = async () => {
    setIsLoading(true);
    try {
      const response = await diaryApi.getDiaryById(id!);
      if (response.success && response.data) {
        setDiary(response.data);
      } else {
        setErrorMessage(response.message || '日记不存在或无权访问');
      }
    } catch (error) {
      console.error('Failed to fetch diary:', error);
      setErrorMessage('加载日记失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!diary) return;
    if (!window.confirm('确定删除这篇日记吗？删除后无法恢复。')) return;

    setIsDeleting(true);
    try {
      const response = await diaryApi.deleteDiary(diary.id);
      if (response.success) {
        navigate('/diaries');
      } else {
        setErrorMessage(response.message || '删除失败，请重试');
      }
    } catch (error) {
      console.error('Failed to delete diary:', error);
      setErrorMessage('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-gray-900 mb-2">无法打开这篇日记</p>
          <p className="text-gray-500 mb-6">{errorMessage || '日记不存在或无权访问'}</p>
          <Link
            to="/diaries"
            className="inline-block px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            返回日记列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 pt-24 pb-12">
        <article className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/diaries"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-accent-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              日记列表
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to={`/diaries/${diary.id}/edit`}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <PenLine className="w-4 h-4" />
                编辑
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6 sm:p-10">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDiaryDate(diary.date)}
              </span>
              {diary.status === 'draft' && (
                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                  草稿
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">
              {diaryDisplayTitle(diary)}
            </h1>

            <div ref={contentRef} className="article-content">
              <div dangerouslySetInnerHTML={{ __html: reveal.html }} />
              {portalHosts.map((host, index) => {
                const image = reveal.images[index];
                if (!image) return null;
                return createPortal(
                  <RevealImage
                    src={image.src}
                    alt={image.alt}
                    onOpen={() => setLightbox(image)}
                  />,
                  host
                );
              })}
            </div>
          </div>
        </article>
      </main>

      <Lightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
};
