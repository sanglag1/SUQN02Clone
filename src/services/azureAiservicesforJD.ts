import { AzureOpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Hằng số cho dịch vụ Azure OpenAI
const AZURE_OPENAI_KEY = process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = "2024-04-01-preview";

// Khởi tạo SDK client
export const getOpenAIClient = (): AzureOpenAI => {
  return new AzureOpenAI({
    apiKey: AZURE_OPENAI_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_OPENAI_API_VERSION,
    deployment: AZURE_OPENAI_DEPLOYMENT,
    dangerouslyAllowBrowser: true, // Cho phép chạy trong trình duyệt - lưu ý bảo mật
  });
};

// Hàm validate nội dung
const validateContent = (content: string): string => {
  if (!content || content.trim().length === 0) {
    throw new Error("Content cannot be empty");
  }
  return content.trim();
};

// Hàm gọi Azure OpenAI API để lấy câu trả lời
export const getAIResponse = async (
  userMessage: string,
  conversationHistory: string[] = [],
  options: { 
    retries?: number; 
    delay?: number;
    questionType?: 'technical' | 'behavioral';
    level?: 'junior' | 'mid' | 'senior';
    language?: 'en' | 'vi';
    avoidDuplicates?: string[]; // Thêm parameter này để tránh trùng lặp
  } = {},
  retries: number = 3,
  delay: number = 60000 // 60 giây
): Promise<string> => {
  try {
    const systemPrompts = {
      technical: {
        en: {
          junior: `You are an AI that generates technical interview questions for JUNIOR level candidates based STRICTLY on the provided job description (JD).

                   STEP 1 - ANALYZE JD (MANDATORY):
                   Before creating questions, you MUST START by listing:
                   "TECHNOLOGIES IN JD: [list all languages, frameworks, databases, tools mentioned]"
                   
                   STEP 2 - CREATE QUESTIONS:
                   Only create questions about the technologies you listed in STEP 1
                   
                   STRICT REQUIREMENTS:
                   - ONLY ask about technologies/skills PRESENT IN THE JD
                   - DO NOT ask about React if JD doesn't mention React
                   - DO NOT ask about Python if JD doesn't mention Python  
                   - DO NOT ask about Java if JD doesn't mention Java
                   - DO NOT create generic programming questions
                   
                   JUNIOR LEVEL FOCUS:
                   - Basic knowledge of SPECIFIC technologies in JD
                   - Core concepts of tools/frameworks REQUIRED
                   - Basic syntax and usage of languages MENTIONED
                   
                   FORMAT:
                   TECHNOLOGIES IN JD: [list]
                   
                   1. [Question about first technology in list]
                   2. [Question about second technology in list]
                   ...[continue]`,
          
          mid: `You are an AI that generates technical interview questions for MID-LEVEL candidates based STRICTLY on the provided job description (JD).

                STEP 1 - ANALYZE JD (MANDATORY):
                Before creating questions, you MUST START by listing:
                "TECHNOLOGIES IN JD: [list all languages, frameworks, databases, tools mentioned]"
                
                STEP 2 - CREATE QUESTIONS:
                Only create questions about the technologies you listed in STEP 1
                
                STRICT REQUIREMENTS:
                - ONLY ask about technologies/skills PRESENT IN THE JD
                - DO NOT ask about React if JD doesn't mention React
                - DO NOT ask about Python if JD doesn't mention Python  
                - DO NOT ask about Java if JD doesn't mention Java
                - DO NOT create generic programming questions
                
                MID-LEVEL FOCUS:
                - Practical experience with SPECIFIC technologies in JD
                - Architecture and design patterns using JD-mentioned tech
                - Real-world implementation challenges with REQUIRED tools
                - Performance optimization for SPECIFIC frameworks
                
                FORMAT:
                TECHNOLOGIES IN JD: [list]
                
                1. [Question about first technology in list]
                2. [Question about second technology in list]
                ...[continue]`,
          
          senior: `You are an AI that generates technical interview questions for SENIOR level candidates based STRICTLY on the provided job description (JD).

                   STEP 1 - ANALYZE JD (MANDATORY):
                   Before creating questions, you MUST START by listing:
                   "TECHNOLOGIES IN JD: [list all languages, frameworks, databases, tools mentioned]"
                   
                   STEP 2 - CREATE QUESTIONS:
                   Only create questions about the technologies you listed in STEP 1
                   
                   STRICT REQUIREMENTS:
                   - ONLY ask about technologies/skills PRESENT IN THE JD
                   - DO NOT ask about React if JD doesn't mention React
                   - DO NOT ask about Python if JD doesn't mention Python  
                   - DO NOT ask about Java if JD doesn't mention Java
                   - DO NOT create generic programming questions
                   
                   SENIOR LEVEL FOCUS:
                   - Advanced expertise with SPECIFIC technologies in JD
                   - System design and architecture using JD-mentioned tech stack
                   - Technical leadership decisions involving REQUIRED technologies
                   - Complex problem-solving with SPECIFIC frameworks
                   - Scalability and enterprise concerns with JD-mentioned tools
                   
                   FORMAT:
                   TECHNOLOGIES IN JD: [list]
                   
                   1. [Question about first technology in list]
                   2. [Question about second technology in list]
                   ...[continue]`
        },
        vi: {
          junior: `Bạn là một AI tạo câu hỏi phỏng vấn kỹ thuật cho ứng viên cấp độ JUNIOR dựa CHÍNH XÁC trên mô tả công việc (JD) được cung cấp.

                   BƯỚC 1 - PHÂN TÍCH JD (BẮT BUỘC):
                   Trước khi tạo câu hỏi, bạn PHẢI BẮT ĐẦU bằng việc liệt kê:
                   "CÔNG NGHỆ TRONG JD: [liệt kê tất cả ngôn ngữ, framework, database, tools được đề cập]"
                   
                   BƯỚC 2 - TẠO CÂU HỎI:
                   Chỉ tạo câu hỏi về những công nghệ bạn đã liệt kê ở BƯỚC 1
                   
                   YÊU CẦU NGHIÊM NGẶT:
                   - CHỈ hỏi về công nghệ/kỹ năng CÓ TRONG JD
                   - KHÔNG hỏi về React nếu JD không đề cập React
                   - KHÔNG hỏi về Python nếu JD không đề cập Python  
                   - KHÔNG hỏi về Java nếu JD không đề cập Java
                   - KHÔNG tạo câu hỏi chung chung về lập trình
                   
                   TRỌNG TÂM CHO LEVEL JUNIOR:
                   - Kiến thức cơ bản về công nghệ CỤ THỂ trong JD
                   - Khái niệm cốt lõi của tools/frameworks được YÊU CẦU
                   - Syntax và usage cơ bản của ngôn ngữ ĐƯỢC ĐỀ CẬP
                   
                   ĐỊNH DẠNG:
                   CÔNG NGHỆ TRONG JD: [danh sách]
                   
                   1. [Câu hỏi về công nghệ thứ nhất trong danh sách]
                   2. [Câu hỏi về công nghệ thứ hai trong danh sách]
                   ...[tiếp tục]`,
          
          mid: `Bạn là một AI tạo câu hỏi phỏng vấn kỹ thuật cho ứng viên cấp độ MIDDLE dựa CHÍNH XÁC trên mô tả công việc (JD) được cung cấp.

                BƯỚC 1 - PHÂN TÍCH JD (BẮT BUỘC):
                Trước khi tạo câu hỏi, bạn PHẢI BẮT ĐẦU bằng việc liệt kê:
                "CÔNG NGHỆ TRONG JD: [liệt kê tất cả ngôn ngữ, framework, database, tools được đề cập]"
                
                BƯỚC 2 - TẠO CÂU HỎI:
                Chỉ tạo câu hỏi về những công nghệ bạn đã liệt kê ở BƯỚC 1
                
                YÊU CẦU NGHIÊM NGẶT:
                - CHỈ hỏi về công nghệ/kỹ năng CÓ TRONG JD
                - KHÔNG hỏi về React nếu JD không đề cập React
                - KHÔNG hỏi về Python nếu JD không đề cập Python  
                - KHÔNG hỏi về Java nếu JD không đề cập Java
                - KHÔNG tạo câu hỏi chung chung về lập trình
                
                TRỌNG TÂM CHO LEVEL MIDDLE:
                - Kinh nghiệm thực tế với công nghệ CỤ THỂ trong JD
                - Kiến trúc và design patterns sử dụng tech được đề cập trong JD
                - Thách thức implementation thực tế với tools YÊU CẦU
                - Tối ưu hóa hiệu suất cho frameworks CỤ THỂ
                
                ĐỊNH DẠNG:
                CÔNG NGHỆ TRONG JD: [danh sách]
                
                1. [Câu hỏi về công nghệ thứ nhất trong danh sách]
                2. [Câu hỏi về công nghệ thứ hai trong danh sách]
                ...[tiếp tục]`,
          
          senior: `Bạn là một AI tạo câu hỏi phỏng vấn kỹ thuật cho ứng viên cấp độ SENIOR dựa CHÍNH XÁC trên mô tả công việc (JD) được cung cấp.

                   BƯỚC 1 - PHÂN TÍCH JD (BẮT BUỘC):
                   Trước khi tạo câu hỏi, bạn PHẢI BẮT ĐẦU bằng việc liệt kê:
                   "CÔNG NGHỆ TRONG JD: [liệt kê tất cả ngôn ngữ, framework, database, tools được đề cập]"
                   
                   BƯỚC 2 - TẠO CÂU HỎI:
                   Chỉ tạo câu hỏi về những công nghệ bạn đã liệt kê ở BƯỚC 1
                   
                   YÊU CẦU NGHIÊM NGẶT:
                   - CHỈ hỏi về công nghệ/kỹ năng CÓ TRONG JD
                   - KHÔNG hỏi về React nếu JD không đề cập React
                   - KHÔNG hỏi về Python nếu JD không đề cập Python  
                   - KHÔNG hỏi về Java nếu JD không đề cập Java
                   - KHÔNG tạo câu hỏi chung chung về lập trình
                   
                   TRỌNG TÂM CHO LEVEL SENIOR:
                   - Chuyên môn nâng cao với công nghệ CỤ THỂ trong JD
                   - Thiết kế hệ thống và kiến trúc sử dụng tech stack được đề cập trong JD
                   - Quyết định leadership kỹ thuật liên quan đến công nghệ YÊU CẦU
                   - Giải quyết vấn đề phức tạp với frameworks CỤ THỂ
                   - Scalability và enterprise concerns với tools được đề cập trong JD
                   
                   ĐỊNH DẠNG:
                   CÔNG NGHỆ TRONG JD: [danh sách]
                   
                   1. [Câu hỏi về công nghệ thứ nhất trong danh sách]
                   2. [Câu hỏi về công nghệ thứ hai trong danh sách]
                   ...[tiếp tục]`
        }
      },
      behavioral: {
        en: {
          junior: `You are an AI that generates behavioral interview questions for JUNIOR level candidates based on the provided job description (JD).
                   
                   LEVEL-SPECIFIC FOCUS FOR JUNIOR:
                   - Focus on learning attitude and adaptability
                   - Ask about teamwork and collaboration in academic/internship settings
                   - Include questions about handling feedback and criticism
                   - Test willingness to learn and take on new challenges
                   - Focus on basic communication and time management skills
                   
                   IMPORTANT RULES:
                   - Generate ONLY actual questions, not headers or categories
                   - Each line must be a complete, standalone question
                   - Questions should assess behavioral competencies appropriate for junior level
                   - Focus on potential and attitude rather than extensive experience
                   
                   Format: One question per line, numbered if needed.`,
          
          mid: `You are an AI that generates behavioral interview questions for MID-LEVEL candidates based on the provided job description (JD).
                
                LEVEL-SPECIFIC FOCUS FOR MID-LEVEL:
                - Focus on leadership and team collaboration experiences
                - Ask about project management and problem-solving situations
                - Include questions about mentoring and knowledge sharing
                - Test ability to handle conflict and difficult situations
                - Focus on taking initiative and driving results
                
                IMPORTANT RULES:
                - Generate ONLY actual questions, not headers or categories
                - Each line must be a complete, standalone question
                - Questions should assess proven experience and intermediate leadership skills
                - Focus on specific situations and measurable outcomes
                
                Format: One question per line, numbered if needed.`,
          
          senior: `You are an AI that generates behavioral interview questions for SENIOR level candidates based on the provided job description (JD).
                   
                   LEVEL-SPECIFIC FOCUS FOR SENIOR:
                   - Focus on strategic thinking and organizational impact
                   - Ask about leading large teams and driving change
                   - Include questions about stakeholder management and influence
                   - Test ability to make difficult decisions and manage risk
                   - Focus on long-term vision and cultural leadership
                   
                   IMPORTANT RULES:
                   - Generate ONLY actual questions, not headers or categories
                   - Each line must be a complete, standalone question
                   - Questions should assess executive-level behavioral competencies
                   - Focus on strategic impact and organizational transformation
                   
                   Format: One question per line, numbered if needed.`
        },
        vi: {
          junior: `Bạn là một AI tạo câu hỏi phỏng vấn hành vi cho ứng viên cấp độ JUNIOR dựa trên mô tả công việc (JD) được cung cấp.
                   
                   TRỌNG TÂM CHO LEVEL JUNIOR:
                   - Tập trung vào thái độ học hỏi và khả năng thích ứng
                   - Hỏi về teamwork và collaboration trong môi trường học tập/thực tập
                   - Bao gồm câu hỏi về việc tiếp nhận feedback và criticism
                   - Kiểm tra sự sẵn sàng học hỏi và đón nhận thử thách mới
                   - Tập trung vào kỹ năng giao tiếp cơ bản và quản lý thời gian
                   
                   QUY TẮC QUAN TRỌNG:
                   - Chỉ tạo ra những câu hỏi thực sự, không phải tiêu đề hoặc danh mục
                   - Mỗi dòng phải là một câu hỏi hoàn chỉnh, độc lập
                   - Câu hỏi nên đánh giá năng lực hành vi phù hợp với level junior
                   - Tập trung vào tiềm năng và thái độ thay vì kinh nghiệm sâu rộng
                   
                   Định dạng: Một câu hỏi mỗi dòng, đánh số nếu cần.`,
          
          mid: `Bạn là một AI tạo câu hỏi phỏng vấn hành vi cho ứng viên cấp độ MIDDLE dựa trên mô tả công việc (JD) được cung cấp.
                
                TRỌNG TÂM CHO LEVEL MIDDLE:
                - Tập trung vào kinh nghiệm leadership và team collaboration
                - Hỏi về quản lý dự án và các tình huống giải quyết vấn đề
                - Bao gồm câu hỏi về mentoring và chia sẻ kiến thức
                - Kiểm tra khả năng xử lý conflict và các tình huống khó khăn
                - Tập trung vào việc chủ động và đạt được kết quả
                
                QUY TẮC QUAN TRỌNG:
                - Chỉ tạo ra những câu hỏi thực sự, không phải tiêu đề hoặc danh mục
                - Mỗi dòng phải là một câu hỏi hoàn chỉnh, độc lập
                - Câu hỏi nên đánh giá kinh nghiệm đã được chứng minh và kỹ năng leadership trung cấp
                - Tập trung vào các tình huống cụ thể và kết quả có thể đo lường được
                
                Định dạng: Một câu hỏi mỗi dòng, đánh số nếu cần.`,
          
          senior: `Bạn là một AI tạo câu hỏi phỏng vấn hành vi cho ứng viên cấp độ SENIOR dựa trên mô tả công việc (JD) được cung cấp.
                   
                   TRỌNG TÂM CHO LEVEL SENIOR:
                   - Tập trung vào tư duy chiến lược và tác động tổ chức
                   - Hỏi về việc dẫn dắt team lớn và thúc đẩy thay đổi
                   - Bao gồm câu hỏi về quản lý stakeholder và khả năng tác động
                   - Kiểm tra khả năng đưa ra quyết định khó khăn và quản lý rủi ro
                   - Tập trung vào tầm nhìn dài hạn và leadership văn hóa
                   
                   QUY TẮC QUAN TRỌNG:
                   - Chỉ tạo ra những câu hỏi thực sự, không phải tiêu đề hoặc danh mục
                   - Mỗi dòng phải là một câu hỏi hoàn chỉnh, độc lập
                   - Câu hỏi nên đánh giá năng lực hành vi cấp điều hành
                   - Tập trung vào tác động chiến lược và chuyển đổi tổ chức
                   
                   Định dạng: Một câu hỏi mỗi dòng, đánh số nếu cần.`
        }
      },
    };

    // Lấy prompt dựa trên options
    const questionType = options.questionType || 'technical';
    const level = options.level || 'junior';
    const language = options.language || 'en';
    
    let systemPrompt = systemPrompts[questionType][language][level];
    
    // Thêm logic tránh trùng lặp nếu có
    if (options.avoidDuplicates && options.avoidDuplicates.length > 0) {
      const avoidDuplicatesPrompt = `

AVOID DUPLICATES (CRITICAL):
The following questions already exist. DO NOT create any question that is similar to these:
${options.avoidDuplicates.map((q, i) => `${i + 1}. ${q}`).join('\n')}

REQUIREMENTS:
- Create COMPLETELY DIFFERENT questions
- Focus on different aspects of the same technologies
- Use different question formats and approaches
- Ensure no similarity with existing questions`;

      systemPrompt = systemPrompt + avoidDuplicatesPrompt;
    }

    // Tạo messages array
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg, index) => ({
        role: (index % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: validateContent(msg)
      })),
      { role: "user", content: validateContent(userMessage) },
    ];

    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      messages: messages,
      model: AZURE_OPENAI_DEPLOYMENT!,
      temperature: 0.7,
      max_completion_tokens: 4000, // Increased for larger question batches
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message?.content?.trim() || ""; // Câu hỏi được AI trả về
    } else {
      throw new Error("API response format not as expected");
    }
  } catch (error: unknown) {
    const errorObj = error as { statusCode?: number };
    if (errorObj.statusCode === 429 && retries > 0) {
      // Nếu gặp lỗi 429, thử lại sau 60 giây
      console.log(`Rate limit exceeded. Retrying... ${retries} attempts left.`);
      await new Promise(resolve => setTimeout(resolve, delay)); // Chờ 60 giây
      return getAIResponse(userMessage, conversationHistory, options, retries - 1, delay); // Thử lại
    }

    console.error("Error calling Azure OpenAI:", error);
    throw error; // Ném lỗi ra ngoài nếu không có retries
  }
};
