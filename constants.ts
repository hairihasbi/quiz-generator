import { SubjectCategory, CognitiveLevel, Difficulty, QuestionType } from './types';

export const SUBJECTS: Record<SubjectCategory, string[]> = {
  [SubjectCategory.WAJIB]: [
    'Pendidikan Agama Islam dan Budi Pekerti',
    'Pendidikan Agama Kristen dan Budi Pekerti',
    'Pendidikan Agama Katolik dan Budi Pekerti',
    'Pendidikan Agama Hindu dan Budi Pekerti',
    'Pendidikan Agama Buddha dan Budi Pekerti',
    'Pendidikan Agama Khonghucu dan Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Matematika (Wajib)',
    'Bahasa Inggris',
    'Sejarah',
    'Pendidikan Jasmani Olahraga dan Kesehatan',
    'Seni dan Budaya (Rupa/Musik/Tari/Teater)',
    'Informatika'
  ],
  [SubjectCategory.IPA]: [
    'Biologi',
    'Kimia',
    'Fisika',
    'Matematika Tingkat Lanjut'
  ],
  [SubjectCategory.IPS]: [
    'Ekonomi',
    'Sosiologi',
    'Geografi',
    'Antropologi'
  ],
  [SubjectCategory.BAHASA]: [
    'Bahasa dan Sastra Indonesia',
    'Bahasa dan Sastra Inggris',
    'Bahasa Arab',
    'Bahasa Jepang',
    'Bahasa Mandarin',
    'Bahasa Korea',
    'Bahasa Perancis',
    'Bahasa Jerman'
  ],
  [SubjectCategory.VOKASI]: [
    'Dasar-dasar Teknik Otomotif',
    'Dasar-dasar Teknik Elektronika',
    'Dasar-dasar Teknik Mesin',
    'Akuntansi dan Keuangan Lembaga',
    'Manajemen Perkantoran dan Layanan Bisnis',
    'Agribisnis Pengolahan Hasil Pertanian',
    'Usaha Layanan Pariwisata',
    'Produksi Film',
    'Animasi'
  ]
};

export const GRADES = ['Kelas 10 (Fase E)', 'Kelas 11 (Fase F)', 'Kelas 12 (Fase F)'];

export const COGNITIVE_LEVELS = Object.values(CognitiveLevel);
export const DIFFICULTIES = Object.values(Difficulty);
export const QUESTION_TYPES = Object.values(QuestionType);

export const DEFAULT_BLOGS = [
  {
    id: '1',
    title: 'Transformasi Evaluasi Kurikulum Merdeka',
    content: 'Kurikulum Merdeka menekankan pada asesmen formatif dan sumatif yang tidak hanya menguji hafalan, tetapi juga kemampuan bernalar kritis siswa melalui soal-soal berbasis HOTS (Higher Order Thinking Skills)...',
    author: 'Sistem Admin',
    date: '2024-05-21',
    status: 'published',
    category: 'Wajib Umum'
  }
];
