
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export enum SubjectCategory {
  WAJIB = 'Wajib Umum',
  IPA = 'Peminatan IPA',
  IPS = 'Peminatan IPS',
  BAHASA = 'Peminatan Bahasa dan Budaya',
  VOKASI = 'Vokasi'
}

export enum CognitiveLevel {
  C1 = 'C1 - Mengingat',
  C2 = 'C2 - Memahami',
  C3 = 'C3 - Mengaplikasikan',
  C4 = 'C4 - Menganalisis',
  C5 = 'C5 - Mengevaluasi',
  C6 = 'C6 - Menciptakan'
}

export enum Difficulty {
  MUDAH = 'Mudah',
  SEDANG = 'Sedang',
  SULIT = 'Sulit'
}

export enum QuestionType {
  PG = 'Pilihan Ganda',
  PGK = 'Pilihan Ganda Kompleks',
  BS = 'Benar/Salah',
  US = 'Uraian Singkat',
  ESSAY = 'Essai'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  quota: number; // Batas maksimal generate soal
  usedQuota: number; // Jumlah yang sudah digunakan
}

export interface ApiKeyEntry {
  id: string;
  key: string;
  label: string;
  status: 'active' | 'inactive' | 'error';
  usageCount: number;
  lastUsedAt?: number;
  errorMessage?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  taskId?: string;
}

export interface QuizTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  config: QuizConfig;
  result?: QuizResult;
  error?: string;
  createdAt: number;
  ownerId: string;
  viewed?: boolean;
}

export interface QuizConfig {
  category: SubjectCategory;
  subject: string;
  grade: string;
  topic: string;
  subTopic?: string;
  learningGoal?: string;
  summaryText?: string;
  referenceImage?: {
    data: string; // base64
    mimeType: string;
  };
  questionType: QuestionType;
  optionsCount?: number;
  difficulty: Difficulty;
  cognitiveLevel: CognitiveLevel;
  totalQuestions: number;
  imageCount: number;
  imageOptionCount: number;
  factCheckerEnabled?: boolean;
}

export interface Question {
  id: number;
  questionText: string;
  options?: string[];
  imageUrl?: string;
  optionImageUrls?: string[];
  correctAnswer: string | string[];
  explanation: string;
  cognitiveLevel: string;
  imagePrompt?: string;
  optionImagePrompts?: string[];
}

export interface QuizResult {
  questions: Question[];
}

export interface SystemSettings {
  factCheckerEnabled: boolean;
  cronInterval: number; // in seconds
  hourlyLimit: number;
}

export interface SiteSettings {
  siteName: string;
  siteIcon: string;
  seoTitle: string;
  seoDescription: string;
  timeZone: string;
  dateFormat: string;
  sitemapXml: string;
  robotsTxt: string;
}
