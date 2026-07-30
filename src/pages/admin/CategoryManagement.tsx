import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { categoryApi } from '../../api';
import { Category } from '../../types';

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await categoryApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!categoryName.trim()) return;
    try {
      await categoryApi.createCategory(categoryName.trim());
      setCategoryName('');
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleEdit = async () => {
    if (!categoryName.trim() || !editingCategory) return;
    try {
      await categoryApi.updateCategory(editingCategory.id, categoryName.trim());
      setCategoryName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？删除后相关文章将无法正常显示。')) return;
    try {
      const response = await categoryApi.deleteCategory(id);
      if (response.success) {
        fetchCategories();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">分类管理</h1>
          <p className="text-gray-500 mt-1">管理文章分类</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建分类
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">名称</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">文章数</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">创建时间</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto" />
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">slug: {category.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{category.articleCount}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(category.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openModal(category)}
                        className="p-2 text-gray-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <p className="text-gray-500">暂无分类</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-gray-900">
                {editingCategory ? '编辑分类' : '新建分类'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  setCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类名称</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="请输入分类名称"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  setCategoryName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={editingCategory ? handleEdit : handleCreate}
                disabled={!categoryName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {editingCategory ? '保存修改' : '创建分类'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
