export interface Performance {
  id: string;
  name: string;
  performer: string; // Group or individual name
  imageUrl: string;
  order: number;
}

export interface Judge {
  id: string;
  name: string;
  accessCode: string; // Mã truy cập riêng cho giám khảo
}

export interface Score {
  performanceId: string;
  judgeId: string; // Changed from number to string to support UUIDs
  value: number;
  comment?: string;
  timestamp: number;
}

export interface AppState {
  performances: Performance[];
  scores: Score[];
  judges: Judge[];
  activePerformanceId: string | null; // The performance currently being judged
  isLocked: boolean; // If true, scores cannot be modified for finished performances
}

export enum UserRole {
  ADMIN = 'ADMIN',
  JUDGE = 'JUDGE',
}