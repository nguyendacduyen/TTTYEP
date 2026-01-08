import { GoogleGenAI } from "@google/genai";

export const generateCommentSuggestion = async (score: number, performanceName: string, maxScore: number = 10): Promise<string> => {
  // Guideline: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing.");
    return "Vui lòng cấu hình API Key để sử dụng tính năng này.";
  }

  // Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const percentage = (score / maxScore) * 100;
    
    const prompt = `
      Bạn là một giám khảo cuộc thi văn nghệ chuyên nghiệp. 
      Hãy viết một nhận xét ngắn gọn (khoảng 1-2 câu), mang tính xây dựng bằng tiếng Việt cho tiết mục "${performanceName}".
      Điểm số bạn đã chấm là: ${score}/${maxScore}.
      
      - Nếu điểm cao (trên 80%): Khen ngợi sự sáng tạo, kỹ thuật, biểu cảm.
      - Nếu điểm trung bình (50-79%): Ghi nhận nỗ lực, chỉ ra điểm cần cải thiện nhẹ nhàng.
      - Nếu điểm thấp (dưới 50%): Góp ý thẳng thắn nhưng lịch sự về sự chuẩn bị.
      
      Chỉ trả về nội dung nhận xét, không thêm dẫn dắt.
    `;

    // Guideline: Use ai.models.generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Guideline: Access .text property directly
    return response.text || "Không thể tạo nhận xét lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi khi kết nối với AI giám khảo.";
  }
};