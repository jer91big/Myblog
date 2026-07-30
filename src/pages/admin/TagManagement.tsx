import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { tagApi } from '../../api';
import { Tag } from '../../types';

export const TagManagement = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await tagApi.getTags();
      if (response.success && response.data) {
        setTags(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!tagName.trim()) return;
    try {
      await tagApi.createTag(tagName.trim());
      setTagName('');
      setIsModalOpen(false);
      fetchTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return;
    try {
      await tagApi.deleteTag(id);
      fetchTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">标签管理</h1>
          <p className="text-gray-500 mt-1">管理文章标签</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建标签
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-3">
          {isLoading ? (
            <div className="w-full flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
            </div>
          ) : tags.length > 0 ? (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full"
              >
                <span className="font-medium text-gray-700">#{tag.name}</span>
                <span className="text-sm text-gray-500">({tag.articleCount})</span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 w-full text-center">暂无标签</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-gray-900">新建标签</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setTagName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签名称</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="请输入标签名称"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setTagName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!tagName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                创建标签
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
