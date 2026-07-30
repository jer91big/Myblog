import { useState, useEffect } from 'react';
import { Save, Check, Globe, Mail, Shield, Palette } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'blog_settings';

const defaultSettings = {
  siteName: 'MyBlog',
  siteDescription: '一个现代化的个人博客网站',
  siteUrl: 'http://localhost:5173',
  defaultAuthor: 'Admin',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  email: 'admin@example.com',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'admin@example.com',
  smtpPassword: '',
  enableComments: true,
  requireLoginForComments: false,
  commentApproval: true,
  postsPerPage: 10,
  sidebarWidgets: ['popular', 'categories', 'tags'],
  primaryColor: '#1e3a5f',
  accentColor: '#f97316',
};

export const SystemSettings = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1">配置博客系统参数</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            saveSuccess
              ? 'bg-green-500 text-white'
              : 'bg-accent-500 text-white hover:bg-accent-600'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4" />
              已保存
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary-600" />
              <h2 className="font-display text-lg font-bold">基本设置</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">网站名称</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">网站描述</label>
                <input
                  type="text"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">网站 URL</label>
                <input
                  type="url"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">默认作者</label>
                <input
                  type="text"
                  value={settings.defaultAuthor}
                  onChange={(e) => setSettings({ ...settings, defaultAuthor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">时区</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                >
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">日期格式</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-accent-500" />
              <h2 className="font-display text-lg font-bold">邮件设置</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">管理员邮箱</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP 主机</label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP 端口</label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP 用户名</label>
                <input
                  type="email"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP 密码</label>
                <input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-500" />
              <h2 className="font-display text-lg font-bold">评论设置</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.enableComments}
                  onChange={(e) => setSettings({ ...settings, enableComments: e.target.checked })}
                  className="w-5 h-5 text-accent-500 rounded"
                />
                <span className="text-gray-700">启用评论功能</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.requireLoginForComments}
                  onChange={(e) => setSettings({ ...settings, requireLoginForComments: e.target.checked })}
                  className="w-5 h-5 text-accent-500 rounded"
                />
                <span className="text-gray-700">登录后才能评论</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.commentApproval}
                  onChange={(e) => setSettings({ ...settings, commentApproval: e.target.checked })}
                  className="w-5 h-5 text-accent-500 rounded"
                />
                <span className="text-gray-700">评论需要审核</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-pink-500" />
              <h2 className="font-display text-lg font-bold">显示设置</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">每页文章数</label>
                <input
                  type="number"
                  value={settings.postsPerPage}
                  onChange={(e) => setSettings({ ...settings, postsPerPage: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">主色调</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <span className="text-gray-500">{settings.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">强调色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                  />
                  <span className="text-gray-500">{settings.accentColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
