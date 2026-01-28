
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Layout, Settings, Users, FileText, PlusCircle, LogOut, X, 
  ChevronDown, BookOpen, CheckCircle, Trash2, User as UserIcon, 
  Key, Upload, Printer, FileDown, Zap, RotateCcw, Calendar, 
  Loader2, CheckCircle2, Sparkles, UserPlus, PowerOff, Power, Info, MessageSquare, ShieldCheck, ChevronRight, Image as ImageIcon,
  AlertCircle, History, ListRestart, Database, XCircle, Activity, Clock, Timer, Globe, Search, Languages, Code, UserMinus, UserCheck, UserX,
  FileBox, FileDigit, FileType, Eye, EyeOff, Table as TableIcon, Phone, Edit3
} from 'lucide-react';
import { 
  User, UserRole, QuizConfig, QuizTask, SubjectCategory, 
  QuestionType, CognitiveLevel, Difficulty, ApiKeyEntry, 
  SiteSettings, QuizResult, Question, LogEntry, SystemSettings
} from './types';
import { SUBJECTS, GRADES } from './constants';
import { generateQuizWithGemini, generateImageWithGemini, getRotatingApiKey } from './services/gemini';
import * as docx from 'docx';

// --- Shared UI ---
const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer";
  const variants: any = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200",
    secondary: "bg-white border-2 border-orange-200 hover:border-orange-500 text-orange-600",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200",
    ghost: "text-orange-600 hover:bg-orange-50",
    dark: "bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-200"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = "", title = "", subtitle = "" }: any) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-orange-100 p-6 sm:p-8 ${className}`}>
    {title && (
      <div className="mb-6 print-hidden">
        <h3 className="text-xl font-extrabold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        <div className="h-1 w-12 bg-orange-500 rounded-full mt-3"></div>
      </div>
    )}
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>}
    <input className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all text-sm font-medium" {...props} />
  </div>
);

const TextArea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>}
    <textarea className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all text-sm font-medium min-h-[100px]" {...props} />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>}
    <div className="relative">
      <select className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 outline-none transition-all text-sm font-medium appearance-none cursor-pointer" {...props}>
        {options.map((opt: any) => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
    </div>
  </div>
);

// --- Admin Pages ---
function AdminUserManager({ users, setUsers }: { users: User[], setUsers: any }) {
  const [formData, setFormData] = useState({ name: '', username: '', password: '', quota: '10' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editQuota, setEditQuota] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return alert("Lengkapi data user!");
    
    // Strict Password Validation
    const { password } = formData;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[\W_]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      return alert("Password tidak memenuhi standar keamanan!\n\nSyarat minimal:\n- Minimal 8 karakter\n- Mengandung huruf BESAR\n- Mengandung huruf kecil\n- Mengandung angka (0-9)\n- Mengandung simbol (!@#$%^&* dll)");
    }
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: UserRole.TEACHER,
      status: 'active',
      quota: parseInt(formData.quota) || 10,
      usedQuota: 0
    };

    setUsers((prev: User[]) => [...prev, newUser]);
    setFormData({ name: '', username: '', password: '', quota: '10' });
    alert("Guru berhasil didaftarkan.");
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev: User[]) => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  const deleteUser = (id: string) => {
    if (confirm("Hapus user ini secara permanen?")) {
      setUsers((prev: User[]) => prev.filter(u => u.id !== id));
    }
  };

  const handleUpdateQuota = (id: string) => {
    const newVal = parseInt(editQuota);
    if (isNaN(newVal)) return alert("Quota harus berupa angka!");
    setUsers((prev: User[]) => prev.map(u => u.id === id ? { ...u, quota: newVal } : u));
    setEditingUserId(null);
    setEditQuota('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Manajemen User</h2>
          <p className="text-slate-500 font-medium">Kelola akses guru, staf, dan kuota pembuatan soal.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1" title="Tambah Guru Baru">
          <form onSubmit={handleAddUser} className="space-y-4">
            <Input label="Nama Lengkap" placeholder="Contoh: Budi Santoso, S.Pd" value={formData.name} onChange={(e:any)=>setFormData({...formData, name: e.target.value})} />
            <Input label="Username" placeholder="username_guru" value={formData.username} onChange={(e:any)=>setFormData({...formData, username: e.target.value})} />
            <div className="space-y-1">
              <Input label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={(e:any)=>setFormData({...formData, password: e.target.value})} />
              <p className="text-[10px] text-slate-400 font-medium px-1 leading-relaxed">
                * Wajib: 8+ karakter, huruf besar, kecil, angka, & simbol.
              </p>
            </div>
            <Input label="Kuota Awal (Generate)" type="number" value={formData.quota} onChange={(e:any)=>setFormData({...formData, quota: e.target.value})} />
            <Button type="submit" className="w-full py-4 mt-2">
              <UserPlus size={18} /> Daftarkan Guru
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2" title="Daftar Guru & Staf">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-orange-50">
                  <th className="py-4 px-2">Nama & Username</th>
                  <th className="py-4 px-2">Kuota (Pakai/Batas)</th>
                  <th className="py-4 px-2">Status</th>
                  <th className="py-4 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {users.map((u: User) => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider italic">@{u.username} • <span className="uppercase">{u.role}</span></p>
                    </td>
                    <td className="py-4 px-2">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 border rounded text-xs" 
                            value={editQuota} 
                            onChange={(e) => setEditQuota(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => handleUpdateQuota(u.id)} className="p-1 bg-green-500 text-white rounded"><CheckCircle size={14} /></button>
                          <button onClick={() => setEditingUserId(null)} className="p-1 bg-slate-300 text-white rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/quota">
                          <div className="flex flex-col">
                            <span className={`text-xs font-black ${u.usedQuota >= u.quota ? 'text-red-500' : 'text-orange-600'}`}>
                              {u.usedQuota} / {u.quota}
                            </span>
                            <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full ${u.usedQuota >= u.quota ? 'bg-red-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min((u.usedQuota / u.quota) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <button 
                            onClick={() => { setEditingUserId(u.id); setEditQuota(u.quota.toString()); }} 
                            className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover/quota:opacity-100 transition-opacity"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase ${u.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                          {u.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      {u.role !== UserRole.ADMIN && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => toggleUserStatus(u.id)} className={`p-2 rounded-xl transition-all ${u.status === 'active' ? 'text-orange-400 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`} title={u.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}>
                            {u.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Hapus User">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminSiteSettings({ siteSettings, setSiteSettings }: { siteSettings: SiteSettings, setSiteSettings: any }) {
  const [localSettings, setLocalSettings] = useState(siteSettings);

  const handleSave = () => {
    setSiteSettings(localSettings);
    alert("Pengaturan situs berhasil diperbarui!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Pengaturan Situs</h2>
        <p className="text-slate-500 font-medium">Kelola identitas, SEO, dan parameter teknis aplikasi.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Identitas Situs" subtitle="Nama dan ikon utama aplikasi.">
          <div className="space-y-4">
            <Input label="Nama Situs" value={localSettings.siteName} onChange={(e:any) => setLocalSettings({...localSettings, siteName: e.target.value})} />
            <Input label="URL Ikon Situs (.png/svg)" value={localSettings.siteIcon} onChange={(e:any) => setLocalSettings({...localSettings, siteIcon: e.target.value})} placeholder="https://example.com/icon.png" />
          </div>
        </Card>

        <Card title="Optimasi SEO" subtitle="Pengaturan metadata mesin pencari.">
          <div className="space-y-4">
            <Input label="Judul SEO (Meta Title)" value={localSettings.seoTitle} onChange={(e:any) => setLocalSettings({...localSettings, seoTitle: e.target.value})} />
            <TextArea label="Deskripsi Meta" value={localSettings.seoDescription} onChange={(e:any) => setLocalSettings({...localSettings, seoDescription: e.target.value})} />
          </div>
        </Card>

        <Card title="Lokalisasi" subtitle="Format waktu dan zona daerah.">
          <div className="space-y-4">
            <Select 
              label="Zona Waktu" 
              options={[
                { value: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta)' },
                { value: 'Asia/Makassar', label: 'WITA (Asia/Makassar)' },
                { value: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura)' }
              ]} 
              value={localSettings.timeZone} 
              onChange={(e:any) => setLocalSettings({...localSettings, timeZone: e.target.value})} 
            />
            <Select 
              label="Format Tanggal" 
              options={[
                { value: 'DD/MM/YYYY', label: '31/12/2024' },
                { value: 'YYYY-MM-DD', label: '2024-12-31' },
                { value: 'D MMMM YYYY', label: '31 Desember 2024' }
              ]} 
              value={localSettings.dateFormat} 
              onChange={(e:any) => setLocalSettings({...localSettings, dateFormat: e.target.value})} 
            />
          </div>
        </Card>

        <Card title="File Teknis" subtitle="Konfigurasi perayapan bot.">
          <div className="space-y-4">
            <TextArea label="Sitemap XML" value={localSettings.sitemapXml} onChange={(e:any) => setLocalSettings({...localSettings, sitemapXml: e.target.value})} placeholder="<?xml version='1.0' encoding='UTF-8'?>..." />
            <TextArea label="Robots.txt" value={localSettings.robotsTxt} onChange={(e:any) => setLocalSettings({...localSettings, robotsTxt: e.target.value})} placeholder="User-agent: * Allow: /" />
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="px-12 py-4 text-lg">
          <CheckCircle size={20} /> Simpan Semua Pengaturan
        </Button>
      </div>
    </div>
  );
}

function AdminCronJob({ systemSettings, setSystemSettings, tasks }: { systemSettings: SystemSettings, setSystemSettings: any, tasks: QuizTask[] }) {
  const [localSettings, setLocalSettings] = useState(systemSettings);
  
  const handleSave = () => {
    setSystemSettings(localSettings);
    alert("Konfigurasi Cron Job berhasil disimpan!");
  };

  const getUsageLastHour = () => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return tasks.filter(t => t.createdAt > oneHourAgo && (t.status === 'completed' || t.status === 'processing')).length;
  };

  const currentUsage = getUsageLastHour();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Konfigurasi Cron Job</h2>
        <p className="text-slate-500 font-medium">Atur ritme kerja AI dan batasi beban sistem.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card title="Waktu Tunggu (Interval)" subtitle="Jeda antar proses antrean.">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
              <Clock className="text-blue-500" size={24} />
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Interval Saat Ini</p>
                <p className="text-xl font-black text-blue-900">{localSettings.cronInterval} Detik</p>
              </div>
            </div>
            <Input 
              label="Interval (Detik)" 
              type="number" 
              value={localSettings.cronInterval} 
              onChange={(e: any) => setSystemSettings({...localSettings, cronInterval: parseInt(e.target.value) || 1})} 
            />
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              * Semakin besar interval, semakin ringan beban API Key Anda. Disarankan minimal 5-10 detik.
            </p>
          </div>
        </Card>

        <Card title="Limit Soal per Jam" subtitle="Membatasi jumlah paket soal harian.">
          <div className="space-y-6">
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Activity className="text-orange-500" size={24} />
                <div>
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-widest">Penggunaan 1 Jam Terakhir</p>
                  <p className="text-xl font-black text-blue-900">{currentUsage} / {localSettings.hourlyLimit}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 flex items-center justify-center font-black text-xs text-orange-600">
                {Math.round((currentUsage / localSettings.hourlyLimit) * 100)}%
              </div>
            </div>
            <Input 
              label="Batas Paket per Jam" 
              type="number" 
              value={localSettings.hourlyLimit} 
              onChange={(e: any) => setLocalSettings({...localSettings, hourlyLimit: parseInt(e.target.value) || 10})} 
            />
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              * Melindungi API Key dari rate-limit Google. Jika limit tercapai, antrean akan ditangguhkan hingga jam berikutnya.
            </p>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="w-full md:w-auto px-12" onClick={handleSave}>Simpan Perubahan Cron</Button>
      </div>
    </div>
  );
}

function AdminApiKeyManager({ apiKeys, setApiKeys }: any) {
  const [formData, setFormData] = useState({ key: '' });
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      setIsBulkLoading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const keys = text.split('\n').map(k => k.trim()).filter(k => k.length > 20); // Basic validation
        
        const newKeys: ApiKeyEntry[] = keys.map(k => ({
          id: Math.random().toString(36).substr(2, 9),
          key: k,
          label: `Auto Added Key`,
          status: 'active',
          usageCount: 0
        }));

        setApiKeys((prev: ApiKeyEntry[]) => [...prev, ...newKeys]);
        setIsBulkLoading(false);
        alert(`Berhasil menambahkan ${newKeys.length} API Key.`);
      };
      reader.readAsText(file);
    }
  };

  const toggleStatus = (id: string) => {
    setApiKeys((prev: ApiKeyEntry[]) => prev.map(k => 
      k.id === id ? { ...k, status: k.status === 'active' ? 'inactive' : 'active' } : k
    ));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">API Manager</h2>
          <p className="text-slate-500 font-medium">Manajemen kunci rotasi Google Gemini AI Studio.</p>
        </div>
        <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-100">
          <Upload size={18} />
          <span>Upload List (.txt)</span>
          <input type="file" className="hidden" accept=".txt" onChange={handleBulkUpload} disabled={isBulkLoading} />
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1" title="Input Manual">
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (!formData.key) return;
            setApiKeys((p: any) => [...p, { 
              id: Math.random().toString(36).substr(2,9), 
              key: formData.key, 
              label: 'Manual Key', 
              status: 'active', 
              usageCount: 0 
            }]);
            setFormData({key:''});
          }}>
            <Input label="Google Gemini Key" value={formData.key} onChange={(e:any)=>setFormData({...formData, key: e.target.value})} placeholder="AIza..." />
            <Button type="submit" className="w-full">Tambahkan Key</Button>
          </form>
        </Card>

        <Card className="md:col-span-2" title={`Daftar Key (${apiKeys.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-[10px] font-black text-slate-400 uppercase border-b border-orange-50">
                <tr>
                  <th className="py-3 px-2 text-left">Label</th>
                  <th className="py-3 px-2 text-left">Status</th>
                  <th className="py-3 px-2 text-center">Usage</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {apiKeys.map((k: ApiKeyEntry) => (
                  <tr key={k.id} className="group hover:bg-slate-50/50">
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 text-sm">{k.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{k.key.substring(0,8)}...{k.key.slice(-4)}</p>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                        k.status === 'active' ? 'bg-green-100 text-green-600' : 
                        k.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-center text-xs font-bold text-slate-600">{k.usageCount}x</td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => toggleStatus(k.id)} title="Toggle Status" className="p-2 hover:bg-orange-100 rounded-lg text-orange-500 transition-colors">
                          {k.status === 'active' ? <Power size={16} /> : <PowerOff size={16} />}
                        </button>
                        <button onClick={() => setApiKeys((prev: any) => prev.filter((x: any) => x.id !== k.id))} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {apiKeys.length === 0 && <div className="p-10 text-center text-slate-400 text-sm italic font-medium">Tidak ada API Key tersedia.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminLogSystem({ logs, setLogs }: { logs: LogEntry[], setLogs: any }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Log Sistem</h2>
          <p className="text-slate-500 font-medium">Monitoring aktivitas AI secara real-time.</p>
        </div>
        <Button variant="danger" onClick={() => { if(confirm('Hapus semua log sistem?')) setLogs([]); }}>
          <Trash2 size={18} /> Hapus Log
        </Button>
      </div>

      <Card className="p-0 overflow-hidden bg-slate-900 border-slate-800">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem Online</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{logs.length} Entri Tercatat</span>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto p-4 space-y-3 font-mono">
          {logs.map((log) => (
            <div key={log.id} className="text-[12px] group">
              <div className="flex items-start gap-4">
                <span className="text-slate-500 shrink-0 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`font-bold shrink-0 uppercase w-16 ${
                  log.level === 'success' ? 'text-green-400' :
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-orange-400' : 'text-blue-400'
                }`}>
                  {log.level}
                </span>
                <div className="flex-1">
                  <p className="text-slate-300">{log.message}</p>
                  {log.details && <p className="text-slate-500 mt-1 italic leading-relaxed text-[11px]">{log.details}</p>}
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="py-20 text-center text-slate-600 italic">Belum ada aktivitas yang dicatat.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminSystemSettings({ apiKeys, setApiKeys, systemSettings, setSystemSettings }: any) {
  const cleanBrokenKeys = () => {
    const originalCount = apiKeys.length;
    const activeOnly = apiKeys.filter((k: ApiKeyEntry) => k.status === 'active');
    setApiKeys(activeOnly);
    alert(`Berhasil membersihkan ${originalCount - activeOnly.length} key yang bermasalah/tidak aktif.`);
  };

  const resetUsage = () => {
    setApiKeys((prev: ApiKeyEntry[]) => prev.map(k => ({ ...k, usageCount: 0 })));
    alert("Statistik penggunaan semua key telah direset.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900">Pengaturan Lanjutan</h2>
        <p className="text-slate-500 font-medium">Konfigurasi mendalam dan pemeliharaan platform.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card title="Pemeliharaan API Key" subtitle="Bersihkan kunci yang menyebabkan error.">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
              <AlertCircle className="text-red-500 shrink-0" size={24} />
              <div>
                <p className="text-sm font-bold text-red-800">Pembersihan Massal</p>
                <p className="text-xs text-red-600 mt-1">Hapus semua API Key yang memiliki status 'error' atau 'inactive' untuk menjaga stabilitas generator.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="danger" className="flex-1" onClick={cleanBrokenKeys}><Trash2 size={16} /> Hapus Key Rusak</Button>
              <Button variant="secondary" className="flex-1" onClick={resetUsage}><RotateCcw size={16} /> Reset Statistik</Button>
            </div>
          </div>
        </Card>

        <Card title="Fitur Global" subtitle="Kontrol fitur kecerdasan buatan.">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-800">AI Fact Checker</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Validasi Otomatis</p>
                </div>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={systemSettings.factCheckerEnabled} onChange={(e) => setSystemSettings({...systemSettings, factCheckerEnabled: e.target.checked})} />
            </label>
            
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100">
              <div className="flex items-center gap-3">
                <Database className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-800">Auto-Rotation Mode</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">Dynamic Switching</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">SELALU AKTIF</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- LoginPage Component ---
// Fix: Added missing LoginPage component to allow user authentication.
function LoginPage({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md" title="Portal Guru" subtitle="Silakan masuk ke akun Anda.">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Username" value={username} onChange={(e: any) => setUsername(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <Button type="submit" className="w-full py-4">Masuk ke Dashboard</Button>
          <div className="text-center pt-4">
             <Link to="/" className="text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
               <ChevronRight size={16} className="rotate-180" /> Kembali ke Beranda
             </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

// --- App Root ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<QuizTask[]>(() => JSON.parse(localStorage.getItem('quiz_tasks_list') || '[]'));
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>(() => JSON.parse(localStorage.getItem('quiz_api_keys') || '[]'));
  const [logs, setLogs] = useState<LogEntry[]>(() => JSON.parse(localStorage.getItem('quiz_system_logs') || '[]'));
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('quiz_users_list');
    if (saved) return JSON.parse(saved);
    // Default Users: Admin and Teacher
    return [
      { id: '1', username: 'hairi', password: 'Midorima88@@', name: 'Administrator', role: UserRole.ADMIN, status: 'active', quota: 9999, usedQuota: 0 },
      { id: '2', username: 'guru', password: 'guru123', name: 'Guru Pengajar', role: UserRole.TEACHER, status: 'active', quota: 10, usedQuota: 0 }
    ];
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => JSON.parse(localStorage.getItem('quiz_system_settings') || '{"factCheckerEnabled":true, "cronInterval": 10, "hourlyLimit": 50}'));
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => JSON.parse(localStorage.getItem('quiz_site_settings') || '{"siteName":"AI QUIZ SMA","siteIcon":"","seoTitle":"AI Quiz Generator - Kurikulum Merdeka SMA","seoDescription":"Platform AI tercanggih untuk evaluasi Kurikulum Merdeka.","timeZone":"Asia/Jakarta","dateFormat":"DD/MM/YYYY","sitemapXml":"","robotsTxt":""}'));
  
  const navigate = useNavigate();

  useEffect(() => localStorage.setItem('quiz_tasks_list', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('quiz_api_keys', JSON.stringify(apiKeys)), [apiKeys]);
  useEffect(() => localStorage.setItem('quiz_system_logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('quiz_system_settings', JSON.stringify(systemSettings)), [systemSettings]);
  useEffect(() => localStorage.setItem('quiz_site_settings', JSON.stringify(siteSettings)), [siteSettings]);
  useEffect(() => localStorage.setItem('quiz_users_list', JSON.stringify(users)), [users]);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info', details?: string, taskId?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      level,
      details,
      taskId
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Simpan 100 log terakhir
  }, []);

  useEffect(() => {
    const worker = setInterval(async () => {
      // Check Hourly Limit
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const usageThisHour = tasks.filter(t => t.createdAt > oneHourAgo && (t.status === 'completed' || t.status === 'processing')).length;
      
      const pending = tasks.find(t => t.status === 'pending');
      
      if (pending) {
        if (usageThisHour >= systemSettings.hourlyLimit) {
          addLog("Limit Per Jam Tercapai", "warning", `Antrean ditangguhkan. Terpakai: ${usageThisHour}/${systemSettings.hourlyLimit}`);
          return;
        }

        setTasks(prev => prev.map(t => t.id === pending.id ? { ...t, status: 'processing' } : t));
        addLog(`Memulai pemrosesan soal: ${pending.config.topic}`, 'info', `Mapel: ${pending.config.subject}`, pending.id);
        
        // Pick rotating API key
        const selectedKeyEntry = getRotatingApiKey(apiKeys);
        
        if (!selectedKeyEntry) {
          const errMsg = "Tidak ada API Key aktif yang tersedia.";
          setTasks(prev => prev.map(t => t.id === pending.id ? { ...t, status: 'failed', error: errMsg } : t));
          addLog(`Gagal memproses ${pending.config.topic}`, 'error', errMsg, pending.id);
          return;
        }

        addLog(`API Key terpilih: ${selectedKeyEntry.label}`, 'info', `Status: ${selectedKeyEntry.status}`, pending.id);

        try {
          const config = { ...pending.config, factCheckerEnabled: systemSettings.factCheckerEnabled };
          addLog(`Mengirim request ke Gemini...`, 'info', `Prompt size: ~${JSON.stringify(config).length} chars`, pending.id);
          
          const result = await generateQuizWithGemini(config as QuizConfig, selectedKeyEntry);
          
          addLog(`Gemini merespon. Berhasil mendapatkan ${result.questions.length} soal.`, 'success', undefined, pending.id);

          // Update usage statistics
          setApiKeys(prev => prev.map(k => k.id === selectedKeyEntry.id ? { ...k, usageCount: k.usageCount + 1, lastUsedAt: Date.now() } : k));

          // GENERASI GAMBAR SOAL
          if (config.imageCount > 0) {
            const countToGen = Math.min(config.imageCount, result.questions.length);
            addLog(`Memulai generate ${countToGen} ilustrasi bergambar...`, 'info', undefined, pending.id);
            for (let i = 0; i < countToGen; i++) {
              let q = result.questions[i];
              const imgKey = getRotatingApiKey(apiKeys) || selectedKeyEntry;
              q.imageUrl = await generateImageWithGemini(q.imagePrompt || q.questionText, imgKey.key) || undefined;
            }
            addLog(`Ilustrasi soal selesai.`, 'success', undefined, pending.id);
          }

          // GENERASI GAMBAR PILIHAN JAWABAN
          if (config.imageOptionCount > 0) {
            const countToGen = Math.min(config.imageOptionCount, result.questions.length);
            addLog(`Memulai generate ilustrasi pilihan jawaban untuk ${countToGen} soal...`, 'info', undefined, pending.id);
            for (let i = 0; i < countToGen; i++) {
              let q = result.questions[i];
              if (q.options && q.optionImagePrompts) {
                q.optionImageUrls = [];
                for (let j = 0; j < q.options.length; j++) {
                   const imgKey = getRotatingApiKey(apiKeys) || selectedKeyEntry;
                   const prompt = q.optionImagePrompts[j] || q.options[j];
                   const url = await generateImageWithGemini(prompt, imgKey.key);
                   if (url) q.optionImageUrls.push(url);
                }
              }
            }
            addLog(`Ilustrasi pilihan jawaban selesai.`, 'success', undefined, pending.id);
          }
          
          setTasks(prev => prev.map(t => t.id === pending.id ? { ...t, status: 'completed', result } : t));
          addLog(`Paket soal "${pending.config.topic}" siap digunakan.`, 'success', undefined, pending.id);
        } catch (e: any) {
          console.error("Gemini Error:", e);
          const errorMsg = `API Error (${selectedKeyEntry.label}): ${e.message}`;
          
          // Mark API Key as error
          setApiKeys(prev => prev.map(k => k.id === selectedKeyEntry.id ? { ...k, status: 'error', errorMessage: e.message } : k));
          setTasks(prev => prev.map(t => t.id === pending.id ? { ...t, status: 'failed', error: errorMsg } : t));
          addLog(`Eror pada pemrosesan ${pending.config.topic}`, 'error', errorMsg, pending.id);
        }
      }
    }, systemSettings.cronInterval * 1000); // Dynamic interval based on settings
    
    return () => clearInterval(worker);
  }, [tasks, apiKeys, systemSettings, addLog]);

  const handleLogin = (u: string, p: string) => {
    const foundUser = users.find(user => user.username === u && user.password === p);
    if (foundUser) {
      if (foundUser.status === 'inactive') {
        alert("Akun Anda telah dinonaktifkan oleh administrator.");
        return false;
      }
      setUser(foundUser);
      navigate('/dashboard'); 
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      setUser(null);
      navigate('/');
    }
  };

  return (
    <Routes>
      <Route path="/" element={<HomeLanding siteSettings={siteSettings} />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      {user && (
        <Route path="/*" element={
          <div className="flex min-h-screen lg:pl-72 bg-slate-50/30">
            <Sidebar 
              user={user} 
              siteSettings={siteSettings}
              onLogout={handleLogout} 
              isOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
              unviewedCount={tasks.filter(t => t.ownerId === user.id && !t.viewed).length} 
              isProcessing={tasks.some(t => t.status === 'processing')} 
            />
            <main className="p-6 sm:p-10 pt-24 lg:pt-10 flex-1">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden fixed top-6 left-6 p-3 bg-white border border-orange-100 rounded-xl text-orange-500 shadow-sm z-40"><Layout size={24} /></button>
              <Routes>
                <Route path="dashboard" element={<Dashboard user={user} tasks={tasks} setTasks={setTasks} />} />
                <Route path="quiz/create" element={<CreateQuiz user={user} users={users} setUsers={setUsers} setTasks={setTasks} />} />
                <Route path="quiz/history" element={<QuizHistory tasks={tasks} setTasks={setTasks} user={user} markViewed={() => setTasks(p => p.map(t => t.ownerId === user.id ? {...t, viewed: true} : t))} />} />
                <Route path="quiz/view/:id" element={<QuizResultView tasks={tasks} siteSettings={siteSettings} />} />
                <Route path="admin/site-settings" element={<AdminSiteSettings siteSettings={siteSettings} setSiteSettings={setSiteSettings} />} />
                <Route path="admin/users" element={<AdminUserManager users={users} setUsers={setUsers} />} />
                <Route path="admin/api-keys" element={<AdminApiKeyManager apiKeys={apiKeys} setApiKeys={setApiKeys} />} />
                <Route path="admin/cron" element={<AdminCronJob systemSettings={systemSettings} setSystemSettings={setSystemSettings} tasks={tasks} />} />
                <Route path="admin/logs" element={<AdminLogSystem logs={logs} setLogs={setLogs} />} />
                <Route path="admin/settings" element={<AdminSystemSettings apiKeys={apiKeys} setApiKeys={setApiKeys} systemSettings={systemSettings} setSystemSettings={setSystemSettings} />} />
              </Routes>
            </main>
          </div>
        } />
      )}
    </Routes>
  );
}

// --- HomeLanding Component ---
// Fix: Removed duplicate HomeLanding function implementation.
function HomeLanding({ siteSettings }: any) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-orange-50 h-20 flex items-center justify-between px-6 lg:px-20">
        <div className="flex items-center gap-3 font-black text-2xl text-orange-500 uppercase">
          {siteSettings.siteIcon ? <img src={siteSettings.siteIcon} className="w-8 h-8 object-contain" /> : <BookOpen size={22} />} 
          {siteSettings.siteName}
        </div>
        <Link to="/login" className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg shadow-orange-100">Portal Guru</Link>
      </nav>
      <section className="pt-48 pb-32 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase mb-6 inline-block tracking-widest">Kurikulum Merdeka SMA</span>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">{siteSettings.seoTitle}</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">{siteSettings.seoDescription}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link to="/login" className="px-12 py-5 bg-orange-500 text-white text-lg font-black rounded-full shadow-2xl flex items-center gap-3 justify-center transition-transform hover:scale-105 active:scale-95">Mulai Sekarang <Zap size={20} /></Link>
             <a href="https://wa.me/6285248481527" target="_blank" rel="noopener noreferrer" className="px-12 py-5 bg-white border-2 border-orange-200 text-orange-600 text-lg font-black rounded-full shadow-lg flex items-center gap-3 justify-center transition-transform hover:scale-105 active:scale-95">Hubungi Admin <Phone size={20} /></a>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/6285248481527" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-[9999]"
        title="Hubungi kami di WhatsApp"
      >
        <MessageSquare size={32} fill="white" />
      </a>
    </div>
  );
}

function Dashboard({ user, tasks, setTasks }: any) {
  const myTasks = tasks.filter((t: any) => t.ownerId === user.id);
  const recentTasks = [...myTasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const handleDelete = (id: string) => {
    if (confirm("Hapus soal ini dari riwayat?")) {
      setTasks((prev: any) => prev.filter((t: any) => t.id !== id));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-black text-slate-900">Dashboard</h2><p className="text-slate-500 font-medium">Selamat datang kembali, {user.name}.</p></div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-3"><Calendar size={18} className="text-orange-500" /><span className="font-bold text-sm">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="bg-orange-500 text-white border-none shadow-orange-200"><FileText size={24} /><h4 className="text-4xl font-black mt-3">{myTasks.length}</h4><p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1">Total Paket Soal</p></Card>
        <Card className="bg-green-600 text-white border-none shadow-green-200"><CheckCircle2 size={24} /><h4 className="text-4xl font-black mt-3">{myTasks.filter((t:any)=>t.status==='completed').length}</h4><p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1">Berhasil Digenerate</p></Card>
        <div className="flex flex-col gap-2">
          <Link to="/quiz/create" className="group h-full">
            <Card className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 h-full flex flex-col items-center justify-center text-center transition-all group-hover:bg-orange-50/50">
              <PlusCircle size={32} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-black text-slate-800">Buat Soal Baru</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">Sisa Kuota: {user.quota - user.usedQuota}</p>
            </Card>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><History size={20} className="text-orange-500" /> Aktivitas Terbaru</h3>
          <Link to="/quiz/history" className="text-sm font-bold text-orange-600 hover:underline">Lihat Semua</Link>
        </div>
        
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-orange-50">
            {recentTasks.map((t: any) => (
              <div key={t.id} className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {t.status === 'completed' ? <CheckCircle size={20} /> : <Loader2 size={20} className="animate-spin" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-tight">{t.config.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase">{t.config.topic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 mr-2">{new Date(t.createdAt).toLocaleDateString()}</span>
                  {t.status === 'completed' && (
                    <Link to={`/quiz/view/${t.id}`} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-sm shadow-orange-100">
                      <ChevronRight size={16} />
                    </Link>
                  )}
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div className="p-10 text-center text-slate-400 italic text-sm font-medium">Belum ada riwayat aktivitas.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuizHistory({ tasks, setTasks, user, markViewed }: any) {
  useEffect(() => { markViewed(); }, []);
  const myTasks = tasks.filter((t: any) => t.ownerId === user.id);

  const handleDeleteTask = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus riwayat soal ini?")) {
      setTasks((prev: QuizTask[]) => prev.filter(t => t.id !== id));
    }
  };

  const handleCancelTask = (id: string) => {
    if (confirm("Batalkan proses pembuatan soal?")) {
      setTasks((prev: QuizTask[]) => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Antrean & Riwayat</h2>
          <p className="text-slate-500 font-medium">Lacak status pembuatan soal Anda secara real-time.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sesi</span>
          <p className="text-2xl font-black text-orange-500">{myTasks.length}</p>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b-2 border-orange-50 text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="py-4 px-6">Topik / Mapel</th>
                <th className="py-4 px-6">Status & Progres</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {myTasks.map((t: QuizTask) => (
                <tr key={t.id} className="group hover:bg-orange-50/10 transition-colors">
                  <td className="py-6 px-6">
                    <p className="font-black text-slate-800 leading-tight">{t.config.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium italic">{t.config.topic}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">{t.config.grade}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {t.status === 'processing' && <Loader2 className="animate-spin text-blue-500" size={14} />}
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                          t.status === 'completed' ? 'bg-green-100 text-green-600' : 
                          t.status === 'failed' ? 'bg-red-100 text-red-600' : 
                          t.status === 'processing' ? 'bg-blue-100 text-blue-600' : 
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {t.status === 'pending' ? 'Dalam Antrean' : 
                           t.status === 'processing' ? 'AI Sedang Bekerja...' : 
                           t.status === 'completed' ? 'Siap Digunakan' : 'Gagal Dibuat'}
                        </span>
                      </div>
                      {t.status === 'processing' && (
                        <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                        </div>
                      )}
                      {t.status === 'failed' && (
                        <p className="text-[10px] text-red-500 font-bold truncate max-w-[200px]" title={t.error}>{t.error}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {t.status === 'completed' ? (
                        <>
                          <Link to={`/quiz/view/${t.id}`} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100 transition-all flex items-center gap-2">
                            <Sparkles size={14} /> Buka Soal
                          </Link>
                          <button onClick={() => handleDeleteTask(t.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Hapus Riwayat">
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : t.status === 'failed' ? (
                        <button onClick={() => handleDeleteTask(t.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 font-bold text-xs">
                          <Trash2 size={16} /> Hapus
                        </button>
                      ) : (
                        <button onClick={() => handleCancelTask(t.id)} className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl text-xs font-black transition-all flex items-center gap-2">
                          <XCircle size={14} /> Batalkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myTasks.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                <FileText size={40} />
              </div>
              <p className="text-slate-400 font-black text-lg">Belum Ada Riwayat</p>
              <p className="text-slate-300 text-sm mt-1">Mulailah dengan membuat soal pertama Anda.</p>
              <Link to="/quiz/create" className="mt-6 inline-flex items-center gap-2 text-orange-500 font-bold hover:gap-3 transition-all">
                Buat Soal Sekarang <ChevronRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </Card>
      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

function Sidebar({ user, siteSettings, onLogout, isOpen, onClose, unviewedCount, isProcessing }: any) {
  const isAdmin = user.role === UserRole.ADMIN;
  const location = useLocation();
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside className={`w-72 min-h-screen bg-white border-r border-orange-100 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 lg:translate-x-0 print:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-200">
            {siteSettings.siteIcon ? <img src={siteSettings.siteIcon} className="w-8 h-8 object-contain filter invert brightness-0" /> : <BookOpen size={28} />}
          </div>
          <div><h1 className="font-black text-slate-800 text-lg uppercase leading-tight truncate max-w-[140px]">{siteSettings.siteName}</h1><p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Generator</p></div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <Link to="/dashboard" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/dashboard' ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'text-slate-600 hover:bg-orange-50'}`}><Layout size={20} /><span className="font-bold">Dashboard</span></Link>
          <Link to="/quiz/create" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/quiz/create' ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'text-slate-600 hover:bg-orange-50'}`}><PlusCircle size={20} /><span className="font-bold">Buat Soal</span></Link>
          <Link to="/quiz/history" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all relative ${location.pathname.startsWith('/quiz/history') ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'text-slate-600 hover:bg-orange-50'}`}><FileText size={20} /><span className="font-bold">Riwayat Soal</span>{unviewedCount > 0 && <span className="absolute top-3 right-5 h-6 w-6 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black animate-bounce ring-4 ring-white">{unviewedCount}</span>}</Link>
          {isAdmin && (
            <>
              <div className="pt-8 pb-4 ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</div>
              <Link to="/admin/site-settings" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/admin/site-settings' ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'text-slate-600 hover:bg-orange-50'}`}><Globe size={20} /><span className="font-bold">Site Settings</span></Link>
              <Link to="/admin/users" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/admin/users' ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'text-slate-600 hover:bg-orange-50'}`}><Users size={20} /><span className="font-bold">Kelola User</span></Link>
              <Link to="/admin/api-keys" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/admin/api-keys' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-orange-50'}`}><Key size={20} /><span className="font-bold">API Manager</span></Link>
              <Link to="/admin/cron" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/admin/cron' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-orange-50'}`}><Timer size={20} /><span className="font-bold">Cron Job</span></Link>
              <Link to="/admin/logs" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/admin/logs' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-orange-50'}`}><Activity size={20} /><span className="font-bold">Log Sistem</span></Link>
              <Link to="/admin/settings" onClick={onClose} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${location.pathname === '/admin/settings' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-orange-50'}`}><Settings size={20} /><span className="font-bold">Pengaturan</span></Link>
            </>
          )}
          <div className="pt-4 border-t border-orange-50/50 mt-4">
            <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold">
              <LogOut size={20} />
              <span>Keluar Sistem</span>
            </button>
          </div>
        </nav>
        {isProcessing && <div className="m-6 p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl animate-pulse flex items-center gap-4"><Loader2 size={18} className="animate-spin text-orange-500" /><p className="text-[10px] font-black text-orange-600 uppercase">Gemini Generating...</p></div>}
        <div className="p-6 border-t border-orange-50">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-black uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tight">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-400 truncate uppercase">Level: {user.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

function CreateQuiz({ user, users, setUsers, setTasks }: any) {
  const [config, setConfig] = useState<Partial<QuizConfig>>({ 
    category: SubjectCategory.WAJIB, 
    subject: SUBJECTS[SubjectCategory.WAJIB][0], 
    grade: GRADES[0], 
    questionType: QuestionType.PG, 
    totalQuestions: 10, 
    optionsCount: 5, 
    difficulty: Difficulty.SEDANG, 
    cognitiveLevel: CognitiveLevel.C1, 
    imageCount: 0,
    imageOptionCount: 0
  });
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [summary, setSummary] = useState('');
  const navigate = useNavigate();

  // Find live user record to check quota
  const currentUserRecord = users.find((u: User) => u.id === user.id);
  const remainingQuota = currentUserRecord ? currentUserRecord.quota - currentUserRecord.usedQuota : 0;
  const isQuotaExhausted = remainingQuota <= 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => setSummary(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleGenerate = () => {
    if (isQuotaExhausted) return alert('Kuota pembuatan soal Anda telah habis! Silakan hubungi administrator.');
    if (!topic) return alert('Mohon isi topik materi!');
    
    // Deduct quota immediately
    setUsers((prev: User[]) => prev.map(u => u.id === user.id ? { ...u, usedQuota: u.usedQuota + 1 } : u));

    const newTask: QuizTask = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      config: { ...config, topic, subTopic, summaryText: summary } as QuizConfig,
      ownerId: user.id,
      createdAt: Date.now()
    };
    setTasks((prev: any) => [newTask, ...prev]);
    navigate('/quiz/history');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100"><PlusCircle size={32} /></div>
          <div><h2 className="text-3xl font-black text-slate-900">Generator Soal Merdeka</h2><p className="text-slate-500 font-medium">Buat evaluasi presisi sesuai Fase E/F SMA.</p></div>
        </div>
        <div className={`px-6 py-3 rounded-2xl border-2 flex flex-col items-center ${isQuotaExhausted ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Kuota</span>
          <span className={`text-xl font-black ${isQuotaExhausted ? 'text-red-500' : 'text-orange-600'}`}>{remainingQuota}</span>
        </div>
      </div>

      {isQuotaExhausted && (
        <div className="p-6 bg-red-100 border-2 border-red-200 rounded-3xl flex items-center gap-4 text-red-700">
          <AlertCircle size={32} />
          <div>
            <p className="font-black">Batas Pembuatan Soal Tercapai</p>
            <p className="text-sm">Anda telah menggunakan semua kuota langganan. Hubungi admin untuk menambah kuota atau memperpanjang masa aktif.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Identitas Pelajaran">
           <div className="space-y-6">
              <Select label="Jenjang (Fase)" options={GRADES} value={config.grade} onChange={(e: any) => setConfig({...config, grade: e.target.value})} />
              <Select label="Kelompok Peminatan" options={Object.values(SubjectCategory)} value={config.category} onChange={(e: any) => setConfig({...config, category: e.target.value as SubjectCategory, subject: SUBJECTS[e.target.value as SubjectCategory][0]})} />
              <Select label="Mata Pelajaran" options={SUBJECTS[config.category as SubjectCategory] || []} value={config.subject} onChange={(e: any) => setConfig({...config, subject: e.target.value})} />
              
              <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-6">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Parameter Visual AI</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Jml Soal Bergambar" 
                    type="number" 
                    min="0" 
                    max={config.totalQuestions}
                    value={config.imageCount} 
                    onChange={(e:any) => setConfig({...config, imageCount: Math.min(parseInt(e.target.value) || 0, config.totalQuestions || 10)})} 
                  />
                  <Input 
                    label="Jml Jawaban Bergambar" 
                    type="number" 
                    min="0" 
                    max={config.totalQuestions}
                    value={config.imageOptionCount} 
                    onChange={(e:any) => setConfig({...config, imageOptionCount: Math.min(parseInt(e.target.value) || 0, config.totalQuestions || 10)})} 
                  />
                </div>
                <p className="text-[9px] text-orange-400 font-medium leading-relaxed italic">* Jawaban bergambar membutuhkan waktu pemrosesan lebih lama karena AI akan membuat ilustrasi untuk setiap pilihan.</p>
              </div>
            </div>
        </Card>
        <Card title="Topik Materi">
           <div className="space-y-6">
              <Input label="Topik Utama / TP" value={topic} onChange={(e: any) => setTopic(e.target.value)} placeholder="Misal: Perubahan Lingkungan" />
              <Input label="Sub-materi" value={subTopic} onChange={(e: any) => setSubTopic(e.target.value)} placeholder="Opsional..." />
              
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-bold text-slate-700 ml-1">Unggah Referensi Materi (.txt)</label>
                <div className="relative group">
                  <label className="w-full px-5 py-3.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-orange-500 hover:bg-white transition-all flex items-center gap-3 cursor-pointer overflow-hidden">
                    <Upload size={18} className="text-slate-400 group-hover:text-orange-500" />
                    <span className="text-sm font-medium text-slate-500 truncate">{summary ? 'Materi Terunggah' : 'Pilih file .txt'}</span>
                    <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
                  </label>
                  {summary && <button onClick={() => setSummary('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipe Soal" options={Object.values(QuestionType)} value={config.questionType} onChange={(e: any) => setConfig({...config, questionType: e.target.value as QuestionType})} />
                <Select label="Kesulitan" options={Object.values(Difficulty)} value={config.difficulty} onChange={(e: any) => setConfig({...config, difficulty: e.target.value as Difficulty})} />
              </div>
              
              {(config.questionType === QuestionType.PG || config.questionType === QuestionType.PGK) && (
                <Select 
                  label="Jumlah Opsi Jawaban" 
                  options={[
                    { value: 4, label: '4 Opsi (A-D)' },
                    { value: 5, label: '5 Opsi (A-E)' }
                  ]} 
                  value={config.optionsCount || 5} 
                  onChange={(e: any) => setConfig({...config, optionsCount: parseInt(e.target.value)})} 
                />
              )}

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-bold text-slate-700 ml-1">Total Soal</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-orange-500 outline-none font-bold" 
                  value={config.totalQuestions} 
                  min="1" 
                  max="50"
                  onChange={(e:any) => setConfig({...config, totalQuestions: parseInt(e.target.value) || 1})} 
                />
              </div>
              <Button onClick={handleGenerate} className="w-full py-5 text-lg" disabled={isQuotaExhausted}><Zap size={22} fill="white" /> Generate Paket Soal</Button>
            </div>
        </Card>
      </div>
    </div>
  );
}

// --- QuizResultView ---
function QuizResultView({ tasks, siteSettings }: any) {
  const { id } = useParams();
  const task = tasks.find((t: any) => t.id === id);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'LEGAL'>('A4');
  const [showAnswersInPrint, setShowAnswersInPrint] = useState(true);
  const [activeTab, setActiveTab] = useState<'soal' | 'blueprint'>('soal');
  
  useEffect(() => {
    const renderMath = () => {
      const MathJax = (window as any).MathJax;
      if (MathJax && MathJax.typesetPromise && containerRef.current) {
        MathJax.typesetPromise([containerRef.current]).catch((err: any) => console.error('MathJax failed:', err));
      }
    };
    renderMath();
  }, [task?.id, task?.result, activeTab]);

  if (!task || !task.result) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500 mb-4" size={48} /><p className="font-black">Memuat Hasil...</p></div>;

  const getPageDimensions = () => {
    if (paperSize === 'A4') {
      return { width: 11906, height: 16838 }; // A4: 210mm x 297mm
    } else {
      return { width: 12189, height: 18708 }; // Folio/F4: 215mm x 330mm (umum di Indo sebagai 'Legal')
    }
  };

  const handleDownloadSoalDocx = async () => {
    const dimensions = getPageDimensions();
    const children: any[] = [
      new docx.Paragraph({ 
        text: "EVALUASI PEMBELAJARAN", 
        heading: docx.HeadingLevel.HEADING_1, 
        alignment: docx.AlignmentType.CENTER 
      }),
      new docx.Paragraph({ text: `Mata Pelajaran: ${task.config.subject}`, spacing: { before: 200 } }),
      new docx.Paragraph({ text: `Kelas / Jenjang: ${task.config.grade}` }),
      new docx.Paragraph({ text: `Topik Materi: ${task.config.topic}`, spacing: { after: 400 } }),
    ];

    task.result.questions.forEach((q: any, i: number) => {
      children.push(
        new docx.Paragraph({
          children: [
            new docx.TextRun({ text: `${i + 1}. `, bold: true }),
            new docx.TextRun({ text: q.questionText }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );

      if (q.options) {
        q.options.forEach((opt: string, idx: number) => {
          children.push(
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: `    ${String.fromCharCode(65 + idx)}. `, bold: true }),
                new docx.TextRun({ text: opt }),
              ],
              spacing: { after: 50 },
            })
          );
        });
      }
    });

    if (showAnswersInPrint) {
      children.push(new docx.Paragraph({ text: "", spacing: { before: 400 } }));
      children.push(new docx.Paragraph({ text: "KUNCI JAWABAN & PEMBAHASAN", heading: docx.HeadingLevel.HEADING_2 }));
      
      task.result.questions.forEach((q: any, i: number) => {
        children.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({ text: `${i + 1}. Jawaban: ${q.correctAnswer}`, bold: true }),
            ],
            spacing: { before: 100 },
          })
        );
        children.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({ text: `Pembahasan: ${q.explanation}`, italics: true }),
            ],
            spacing: { after: 100 },
          })
        );
      });
    }

    const doc = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: dimensions.width,
                height: dimensions.height,
              },
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              }
            }
          },
          children: children,
        },
      ],
    });

    const blob = await docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Soal_${task.config.subject.replace(/ /g, '_')}_${paperSize}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBlueprintPdf = () => {
    setActiveTab('blueprint');
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadKisiKisi = async () => {
    const dimensions = getPageDimensions();
    const tableRows = [
      new docx.TableRow({
        children: [
          new docx.TableCell({ width: { size: 500, type: docx.WidthType.DXA }, children: [new docx.Paragraph({ text: "No", alignment: docx.AlignmentType.CENTER, style: "bold" })] }),
          new docx.TableCell({ width: { size: 2500, type: docx.WidthType.DXA }, children: [new docx.Paragraph({ text: "Topik/Materi", alignment: docx.AlignmentType.CENTER, style: "bold" })] }),
          new docx.TableCell({ width: { size: 1500, type: docx.WidthType.DXA }, children: [new docx.Paragraph({ text: "Level Kognitif", alignment: docx.AlignmentType.CENTER, style: "bold" })] }),
          new docx.TableCell({ width: { size: 4000, type: docx.WidthType.DXA }, children: [new docx.Paragraph({ text: "Indikator Soal", alignment: docx.AlignmentType.CENTER, style: "bold" })] }),
          new docx.TableCell({ width: { size: 1000, type: docx.WidthType.DXA }, children: [new docx.Paragraph({ text: "Kunci", alignment: docx.AlignmentType.CENTER, style: "bold" })] }),
        ],
      }),
    ];

    task.result.questions.forEach((q: any, idx: number) => {
      tableRows.push(
        new docx.TableRow({
          children: [
            new docx.TableCell({ children: [new docx.Paragraph({ text: (idx + 1).toString(), alignment: docx.AlignmentType.CENTER })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: task.config.topic })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: q.cognitiveLevel || task.config.cognitiveLevel })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: q.questionText.substring(0, 100) + (q.questionText.length > 100 ? "..." : "") })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: q.correctAnswer.toString(), alignment: docx.AlignmentType.CENTER })] }),
          ],
        })
      );
    });

    const doc = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: dimensions.width,
                height: dimensions.height,
              }
            }
          },
          children: [
            new docx.Paragraph({ text: "KISI-KISI EVALUASI PEMBELAJARAN", heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER }),
            new docx.Paragraph({ text: `Mata Pelajaran: ${task.config.subject}`, spacing: { before: 200 } }),
            new docx.Paragraph({ text: `Kelas / Jenjang: ${task.config.grade}` }),
            new docx.Paragraph({ text: `Topik Materi: ${task.config.topic}`, spacing: { after: 400 } }),
            new docx.Table({
              rows: tableRows,
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    const blob = await docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kisi_Kisi_${task.config.subject.replace(/ /g, '_')}_${paperSize}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 tex2jax_process" ref={containerRef}>
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'A4' ? 'A4' : '215mm 330mm'};
            margin: 15mm 20mm;
          }
          body { background: white !important; font-size: 11pt; color: black; }
          .print-hidden, header, nav, aside { display: none !important; }
          .no-shadow { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .break-inside-avoid { break-inside: avoid; }
          .print-only { display: block !important; }
          .print-header { 
            border-bottom: 2px solid black; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end;
          }
          .print-header h1 { font-size: 14pt; font-weight: 800; margin: 0; }
          .print-header p { font-size: 9pt; margin: 0; }
          .print-info-grid {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 8px 40px;
             font-size: 10pt;
             margin-bottom: 25px;
             padding: 10px;
             border: 1px solid #ddd;
             border-radius: 8px;
          }
          .option-box { background: transparent !important; border: 1px solid #ddd !important; }
          .answer-box { border-left-color: #000 !important; background: transparent !important; margin-top: 10px !important; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .print-table th, .print-table td { border: 1px solid black; padding: 8px; text-align: left; font-size: 9pt; }
          .print-table th { background-color: #f2f2f2 !important; font-weight: bold; text-align: center; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Formal Header for Print Mode */}
      <div className="print-only">
        <div className="print-header">
           <div>
             <h1>{activeTab === 'blueprint' ? 'KISI-KISI ' : ''}{task.config.subject.toUpperCase()}</h1>
             <p>Topik: {task.config.topic}</p>
             <p>Tingkat: {task.config.grade} | Kesulitan: {task.config.difficulty}</p>
           </div>
           <div className="text-right">
             <p className="font-bold">{activeTab === 'blueprint' ? 'DOKUMEN KURIKULUM' : 'LEMBAR EVALUASI'}</p>
             <p>Waktu: {activeTab === 'blueprint' ? '-' : '60 - 90 Menit'}</p>
           </div>
        </div>
        {activeTab === 'soal' && (
          <div className="print-info-grid">
            <div className="flex flex-col gap-2">
              <span>Nama : ...............................................</span>
              <span>Kelas : ...............................................</span>
            </div>
            <div className="flex flex-col gap-2">
              <span>No. Absen : ............</span>
              <span>Tanggal : ............</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 space-y-6 print-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase leading-tight">{task.config.subject}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{task.config.grade}</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase">{task.config.difficulty}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase">{task.result.questions.length} Soal</span>
            </div>
          </div>
          <div className="flex flex-col gap-4 shrink-0 items-end">
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <button 
                onClick={() => setPaperSize('A4')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${paperSize === 'A4' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
               >A4</button>
               <button 
                onClick={() => setPaperSize('LEGAL')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${paperSize === 'LEGAL' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
               >LEGAL (F4)</button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-orange-50 pt-6 justify-center md:justify-start">
           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl mr-2">
             <button onClick={() => setActiveTab('soal')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'soal' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
               <FileText size={16} /> Paket Soal
             </button>
             <button onClick={() => setActiveTab('blueprint')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'blueprint' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
               <TableIcon size={16} /> Kisi-Kisi
             </button>
           </div>
           
           {activeTab === 'soal' ? (
             <>
               <Button variant="secondary" onClick={() => window.print()}>
                 <Printer size={18} /> Simpan PDF
               </Button>
               <Button variant="primary" onClick={handleDownloadSoalDocx}>
                 <FileText size={18} /> Simpan Soal (.doc)
               </Button>
               <button 
                onClick={() => setShowAnswersInPrint(!showAnswersInPrint)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${showAnswersInPrint ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
               >
                 {showAnswersInPrint ? <Eye size={16} /> : <EyeOff size={16} />}
                 {showAnswersInPrint ? 'Kunci: TAMPIL' : 'Kunci: SEMBUNYI'}
               </button>
             </>
           ) : (
             <>
               <Button variant="secondary" onClick={handleDownloadBlueprintPdf}>
                 <Printer size={18} /> Kisi-Kisi (PDF)
               </Button>
               <Button variant="success" onClick={handleDownloadKisiKisi}>
                 <FileBox size={18} /> Kisi-Kisi (.doc)
               </Button>
             </>
           )}
        </div>
      </div>
      
      {activeTab === 'soal' ? (
        <div className="space-y-8">
          {task.result.questions.map((q: any, i: number) => (
            <Card key={i} className="relative overflow-hidden break-inside-avoid no-shadow">
              <div className="flex items-start gap-4 mb-6 print:mb-4">
                <span className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black shrink-0 print:bg-transparent print:text-black print:w-auto print:h-auto print:font-bold print:text-lg">{i + 1}.</span>
                <div className="text-xl font-bold text-slate-800 leading-relaxed print:text-lg pt-1">{q.questionText}</div>
              </div>
              {q.imageUrl && <img src={q.imageUrl} className="w-full max-h-[400px] object-contain rounded-2xl mb-8 border border-slate-100 print:max-h-[300px]" alt="Stimulus" />}
              {q.options && (
                <div className="grid grid-cols-1 gap-4 mb-10 print:gap-2 print:mb-6">
                  {q.options.map((opt: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-50 bg-slate-50/30 option-box print:p-2 print:border-none print:bg-transparent">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 shrink-0 print:border-black print:text-black print:w-6 print:h-6 print:text-sm">{String.fromCharCode(65 + idx)}</div>
                      <div className="font-bold text-slate-700 print:font-normal pt-0.5">{opt}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {(showAnswersInPrint || !window.matchMedia('print').matches) && (
                <div className={`p-8 bg-orange-50 rounded-2xl border-l-8 border-orange-500 answer-box ${!showAnswersInPrint ? 'print:hidden' : ''}`}>
                  <p className="font-black text-slate-800 mb-2 print:text-sm">Jawaban: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</p>
                  <p className="text-sm text-slate-600 leading-relaxed italic tex2jax_process print:text-xs print:italic">{q.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="no-shadow overflow-hidden p-0 sm:p-0">
           <div className="overflow-x-auto print:overflow-visible">
             <table className="w-full text-sm border-collapse print-table">
               <thead className="bg-slate-50 border-b-2 border-orange-100 text-[10px] font-black text-slate-400 uppercase tracking-wider print:hidden">
                 <tr>
                   <th className="py-4 px-6 text-center w-16">No</th>
                   <th className="py-4 px-6 text-left">Indikator Soal</th>
                   <th className="py-4 px-6 text-center">Level</th>
                   <th className="py-4 px-6 text-center">Tipe</th>
                   <th className="py-4 px-6 text-center">Kunci</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-orange-50 print:divide-y-0">
                 {task.result.questions.map((q: any, idx: number) => (
                   <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                     <td className="py-4 px-6 text-center font-black text-slate-400 print:text-black print:font-normal">{idx + 1}</td>
                     <td className="py-4 px-6 font-medium text-slate-700 leading-relaxed max-w-md print:text-black">{q.questionText.substring(0, 150)}{q.questionText.length > 150 ? '...' : ''}</td>
                     <td className="py-4 px-6 text-center print:text-black">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase print:bg-transparent print:p-0 print:text-xs">{q.cognitiveLevel || task.config.cognitiveLevel.split(' - ')[0]}</span>
                     </td>
                     <td className="py-4 px-6 text-center text-[10px] font-bold text-slate-500 uppercase print:text-black print:text-xs">{task.config.questionType}</td>
                     <td className="py-4 px-6 text-center font-black text-orange-500 print:text-black print:font-normal">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="p-8 bg-slate-50 border-t border-orange-50 print:hidden">
             <p className="text-xs text-slate-500 italic flex items-center gap-2">
               <Info size={14} className="text-orange-400" />
               Tabel ini disusun secara otomatis oleh AI berdasarkan analisis konten soal terhadap taksonomi kognitif dan tujuan pembelajaran.
             </p>
           </div>
        </Card>
      )}
    </div>
  );
}
