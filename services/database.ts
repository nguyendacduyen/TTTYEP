// @ts-ignore: Suppress TS checking for module resolution in web editor
import { initializeApp } from "firebase/app";
// @ts-ignore: Suppress TS checking for module resolution in web editor
import { getDatabase, ref, onValue, set, update, remove } from "firebase/database";
import { Performance, Score, Judge } from '../types';

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAMv6aQWKhQwJDboSPzI8-LLFkysDyznwI",
  authDomain: "tttg-efc5d.firebaseapp.com",
  databaseURL: "https://tttg-efc5d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tttg-efc5d",
  storageBucket: "tttg-efc5d.firebasestorage.app",
  messagingSenderId: "343174357121",
  appId: "1:343174357121:web:688b4e591ab7ff46e9ed80",
  measurementId: "G-TBC0TX20TS"
};

// Khởi tạo Firebase
// Sử dụng standard named import, tương thích với import map firebase@10.9.0
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export interface AppData {
  performances: Performance[];
  scores: Score[];
  judges: Judge[];
  activePerformanceId: string | null;
  maxScore: number;
}

class DatabaseService {
  constructor() {
    console.log("🔥 Đã kết nối Firebase Realtime Database");
  }

  // --- SUBSCRIBER (Lắng nghe dữ liệu realtime) ---
  subscribe(callback: (data: AppData) => void) {
    const dbRef = ref(db);
    
    // onValue trả về hàm unsubscribe
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      const performances = data.performances ? Object.values(data.performances) as Performance[] : [];
      // Sắp xếp theo thứ tự biểu diễn
      performances.sort((a, b) => a.order - b.order);

      const judges = data.judges ? Object.values(data.judges) as Judge[] : [];
      const scores = data.scores ? Object.values(data.scores) as Score[] : [];
      
      const activePerformanceId = data.settings?.activePerformanceId || null;
      const maxScore = data.settings?.maxScore || 10;

      callback({
        performances,
        scores,
        judges,
        activePerformanceId,
        maxScore
      });
    });

    return unsubscribe;
  }

  // --- WRITE METHODS (Ghi dữ liệu lên Firebase) ---

  // 1. Performances
  addPerformance(p: Performance) {
    set(ref(db, `performances/${p.id}`), p);
  }

  updatePerformance(p: Performance) {
    update(ref(db, `performances/${p.id}`), p);
  }

  deletePerformance(id: string) {
    remove(ref(db, `performances/${id}`));
  }

  setActivePerformance(id: string | null) {
    set(ref(db, 'settings/activePerformanceId'), id);
  }

  // 2. Scores
  submitScore(s: Score) {
    const key = `${s.judgeId}_${s.performanceId}`;
    set(ref(db, `scores/${key}`), s);
  }

  // 3. Judges
  addJudge(name: string) {
    const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
    const id = `j${Date.now()}`;
    const newJudge: Judge = { id, name, accessCode };
    set(ref(db, `judges/${id}`), newJudge);
  }

  updateJudge(id: string, name: string) {
    update(ref(db, `judges/${id}`), { name });
  }

  deleteJudge(id: string) {
    remove(ref(db, `judges/${id}`));
  }

  // 4. Settings
  setMaxScore(score: number) {
    set(ref(db, 'settings/maxScore'), score);
  }
}

export const databaseService = new DatabaseService();