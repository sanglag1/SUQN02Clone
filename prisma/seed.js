const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Convert seed answers into array format expected by UI
function toAnswerArray(questionData) {
  const raw = questionData.answers;
  const correctKey = questionData.correctAnswer || questionData.correct || questionData._correct;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([k, v]) => typeof v === 'string')
      .map(([k, v]) => ({
        content: v,
        isCorrect: typeof correctKey === 'string' && k.toUpperCase() === String(correctKey).toUpperCase()
      }));
  }
  return [];
}

async function main() {
  console.log('🌱 Seeding roles...')

  // Tạo role user trước
  await prisma.role.upsert({
    where: { id: 'user_role_id' },
    update: {},
    create: {
      id: 'user_role_id',
      name: 'user',
      displayName: 'User',
      description: 'Standard user role',
      isDefault: true,
      isActive: true
    }
  })

  // Tạo role admin
  await prisma.role.upsert({
    where: { id: 'admin_role_id' },
    update: {},
    create: {
      id: 'admin_role_id',
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrator with full access',
      isDefault: false,
      isActive: true
    }
  })

  console.log('✅ Roles seeded successfully!')

  console.log('🌱 Seeding service packages...')

  // Tạo gói Free
  await prisma.servicePackage.upsert({
    where: { id: 'free_package_id' },
    update: {},
    create: {
      id: 'free_package_id',
      name: 'Gói Free',
      price: 0,
      duration: 365, // 1 năm
      avatarInterviewLimit: 3,
      testQuizEQLimit: 10,
      jdUploadLimit: 2,
      description: 'Gói miễn phí với các tính năng cơ bản',
      highlight: false,
      isActive: true
    }
  })

  // Tạo gói Basic
  await prisma.servicePackage.upsert({
    where: { id: 'basic_package_id' },
    update: {},
    create: {
      id: 'basic_package_id',
      name: 'Gói Basic',
      price: 299000,
      duration: 30,
      avatarInterviewLimit: 10,
      testQuizEQLimit: 50,
      jdUploadLimit: 10,
      description: 'Gói cơ bản cho người mới bắt đầu',
      highlight: false,
      isActive: true
    }
  })

  // Tạo gói Pro
  await prisma.servicePackage.upsert({
    where: { id: 'pro_package_id' },
    update: {},
    create: {
      id: 'pro_package_id',
      name: 'Gói Pro',
      price: 599000,
      duration: 30,
      avatarInterviewLimit: 30,
      testQuizEQLimit: 150,
      jdUploadLimit: 30,
      description: 'Gói chuyên nghiệp cho người có kinh nghiệm',
      highlight: true,
      isActive: true
    }
  })

  // Tạo gói Enterprise
  await prisma.servicePackage.upsert({
    where: { id: 'enterprise_package_id' },
    update: {},
    create: {
      id: 'enterprise_package_id',
      name: 'Gói Enterprise',
      price: 999000,
      duration: 30,
      avatarInterviewLimit: 100,
      testQuizEQLimit: 500,
      jdUploadLimit: 100,
      description: 'Gói doanh nghiệp với tính năng cao cấp',
      highlight: false,
      isActive: true
    }
  })

  console.log('✅ Service packages seeded successfully!')

  console.log('🌱 Seeding job categories...')

  // Tạo job categories cho IT
  const frontendCategory = await prisma.jobCategory.upsert({
    where: { id: 'frontend_category_id' },
    update: {},
    create: {
      id: 'frontend_category_id',
      name: 'Frontend Development',
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'Angular', 'TypeScript', 'SASS', 'Webpack', 'Vite']
    }
  })

  const backendCategory = await prisma.jobCategory.upsert({
    where: { id: 'backend_category_id' },
    update: {},
    create: {
      id: 'backend_category_id',
      name: 'Backend Development',
      skills: ['Node.js', 'Python', 'Java', 'C#', '.NET', 'PHP', 'Go', 'Rust', 'Database', 'API Design', 'Microservices']
    }
  })

  const fullstackCategory = await prisma.jobCategory.upsert({
    where: { id: 'fullstack_category_id' },
    update: {},
    create: {
      id: 'fullstack_category_id',
      name: 'Full Stack Development',
      skills: ['Frontend', 'Backend', 'Database', 'DevOps', 'API Design', 'System Design', 'Cloud Services']
    }
  })

  const mobileCategory = await prisma.jobCategory.upsert({
    where: { id: 'mobile_category_id' },
    update: {},
    create: {
      id: 'mobile_category_id',
      name: 'Mobile Development',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Mobile UI/UX', 'App Store']
    }
  })

  const devopsCategory = await prisma.jobCategory.upsert({
    where: { id: 'devops_category_id' },
    update: {},
    create: {
      id: 'devops_category_id',
      name: 'DevOps & Cloud',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Terraform', 'Monitoring', 'Linux']
    }
  })

  const dataCategory = await prisma.jobCategory.upsert({
    where: { id: 'data_category_id' },
    update: {},
    create: {
      id: 'data_category_id',
      name: 'Data & AI',
      skills: ['Python', 'SQL', 'Machine Learning', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Big Data', 'Statistics']
    }
  })

  console.log('✅ Job categories seeded successfully!')

  console.log('🌱 Seeding job specializations...')

  // Tạo specializations
  const reactSpecialization = await prisma.jobSpecialization.upsert({
    where: { id: 'react_specialization_id' },
    update: {},
    create: {
      id: 'react_specialization_id',
      name: 'React Development',
      categoryId: frontendCategory.id
    }
  })

  const nodeSpecialization = await prisma.jobSpecialization.upsert({
    where: { id: 'node_specialization_id' },
    update: {},
    create: {
      id: 'node_specialization_id',
      name: 'Node.js Development',
      categoryId: backendCategory.id
    }
  })

  const pythonSpecialization = await prisma.jobSpecialization.upsert({
    where: { id: 'python_specialization_id' },
    update: {},
    create: {
      id: 'python_specialization_id',
      name: 'Python Development',
      categoryId: backendCategory.id
    }
  })

  console.log('✅ Job specializations seeded successfully!')

  console.log('🌱 Seeding job roles...')

  // Frontend Roles
  await prisma.jobRole.upsert({
    where: { id: 'frontend_junior_id' },
    update: {},
    create: {
      id: 'frontend_junior_id',
      key: 'frontend-junior',
      title: 'Frontend Developer (Junior)',
      level: 'Junior',
      description: 'Phát triển giao diện người dùng với HTML, CSS, JavaScript cơ bản',
      minExperience: 0,
      maxExperience: 2,
      order: 1,
      categoryId: frontendCategory.id,
      specializationId: reactSpecialization.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'frontend_mid_id' },
    update: {},
    create: {
      id: 'frontend_mid_id',
      key: 'frontend-mid',
      title: 'Frontend Developer (Mid-level)',
      level: 'Mid',
      description: 'Phát triển ứng dụng web với React, Vue.js và các framework hiện đại',
      minExperience: 2,
      maxExperience: 5,
      order: 2,
      categoryId: frontendCategory.id,
      specializationId: reactSpecialization.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'frontend_senior_id' },
    update: {},
    create: {
      id: 'frontend_senior_id',
      key: 'frontend-senior',
      title: 'Senior Frontend Developer',
      level: 'Senior',
      description: 'Lãnh đạo phát triển frontend, tối ưu hiệu suất và kiến trúc',
      minExperience: 5,
      maxExperience: null,
      order: 3,
      categoryId: frontendCategory.id,
      specializationId: reactSpecialization.id
    }
  })

  // Backend Roles
  await prisma.jobRole.upsert({
    where: { id: 'backend_junior_id' },
    update: {},
    create: {
      id: 'backend_junior_id',
      key: 'backend-junior',
      title: 'Backend Developer (Junior)',
      level: 'Junior',
      description: 'Phát triển API và logic backend cơ bản',
      minExperience: 0,
      maxExperience: 2,
      order: 4,
      categoryId: backendCategory.id,
      specializationId: nodeSpecialization.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'backend_mid_id' },
    update: {},
    create: {
      id: 'backend_mid_id',
      key: 'backend-mid',
      title: 'Backend Developer (Mid-level)',
      level: 'Mid',
      description: 'Phát triển hệ thống backend với Node.js, Python và database',
      minExperience: 2,
      maxExperience: 5,
      order: 5,
      categoryId: backendCategory.id,
      specializationId: nodeSpecialization.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'backend_senior_id' },
    update: {},
    create: {
      id: 'backend_senior_id',
      key: 'backend-senior',
      title: 'Senior Backend Developer',
      level: 'Senior',
      description: 'Thiết kế kiến trúc hệ thống, microservices và tối ưu hiệu suất',
      minExperience: 5,
      maxExperience: null,
      order: 6,
      categoryId: backendCategory.id,
      specializationId: nodeSpecialization.id
    }
  })

  // Full Stack Roles
  await prisma.jobRole.upsert({
    where: { id: 'fullstack_junior_id' },
    update: {},
    create: {
      id: 'fullstack_junior_id',
      key: 'fullstack-junior',
      title: 'Full Stack Developer (Junior)',
      level: 'Junior',
      description: 'Phát triển cả frontend và backend với kiến thức cơ bản',
      minExperience: 0,
      maxExperience: 2,
      order: 7,
      categoryId: fullstackCategory.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'fullstack_mid_id' },
    update: {},
    create: {
      id: 'fullstack_mid_id',
      key: 'fullstack-mid',
      title: 'Full Stack Developer (Mid-level)',
      level: 'Mid',
      description: 'Phát triển ứng dụng hoàn chỉnh với frontend và backend',
      minExperience: 2,
      maxExperience: 5,
      order: 8,
      categoryId: fullstackCategory.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'fullstack_senior_id' },
    update: {},
    create: {
      id: 'fullstack_senior_id',
      key: 'fullstack-senior',
      title: 'Senior Full Stack Developer',
      level: 'Senior',
      description: 'Lãnh đạo phát triển toàn bộ hệ thống và kiến trúc',
      minExperience: 5,
      maxExperience: null,
      order: 9,
      categoryId: fullstackCategory.id
    }
  })

  // Mobile Roles
  await prisma.jobRole.upsert({
    where: { id: 'mobile_junior_id' },
    update: {},
    create: {
      id: 'mobile_junior_id',
      key: 'mobile-junior',
      title: 'Mobile Developer (Junior)',
      level: 'Junior',
      description: 'Phát triển ứng dụng mobile với React Native hoặc Flutter',
      minExperience: 0,
      maxExperience: 2,
      order: 10,
      categoryId: mobileCategory.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'mobile_mid_id' },
    update: {},
    create: {
      id: 'mobile_mid_id',
      key: 'mobile-mid',
      title: 'Mobile Developer (Mid-level)',
      level: 'Mid',
      description: 'Phát triển ứng dụng mobile nâng cao với native và cross-platform',
      minExperience: 2,
      maxExperience: 5,
      order: 11,
      categoryId: mobileCategory.id
    }
  })

  // DevOps Roles
  await prisma.jobRole.upsert({
    where: { id: 'devops_mid_id' },
    update: {},
    create: {
      id: 'devops_mid_id',
      key: 'devops-mid',
      title: 'DevOps Engineer (Mid-level)',
      level: 'Mid',
      description: 'Quản lý infrastructure, CI/CD và cloud services',
      minExperience: 2,
      maxExperience: 5,
      order: 12,
      categoryId: devopsCategory.id
    }
  })

  await prisma.jobRole.upsert({
    where: { id: 'devops_senior_id' },
    update: {},
    create: {
      id: 'devops_senior_id',
      key: 'devops-senior',
      title: 'Senior DevOps Engineer',
      level: 'Senior',
      description: 'Thiết kế kiến trúc cloud, automation và monitoring',
      minExperience: 5,
      maxExperience: null,
      order: 13,
      categoryId: devopsCategory.id
    }
  })

  // Data Roles
  await prisma.jobRole.upsert({
    where: { id: 'data_mid_id' },
    update: {},
    create: {
      id: 'data_mid_id',
      key: 'data-mid',
      title: 'Data Engineer (Mid-level)',
      level: 'Mid',
      description: 'Xử lý dữ liệu, ETL và data pipeline',
      minExperience: 2,
      maxExperience: 5,
      order: 14,
      categoryId: dataCategory.id
    }
  })

  console.log('✅ Job roles seeded successfully!')

  console.log('🌱 Seeding questions...')

  // Frontend Questions
  const frontendQuestions = [
    {
      question: "Giải thích sự khác biệt giữa let, const và var trong JavaScript?",
      answers: {
        A: "let và const có block scope, var có function scope",
        B: "Tất cả đều có function scope",
        C: "let và var có block scope, const có function scope",
        D: "Không có sự khác biệt"
      },
      correctAnswer: "A",
      fields: ["Frontend Development"],
      topics: ["JavaScript", "ES6"],
      levels: ["junior", "middle"],
      explanation: "let và const được giới thiệu trong ES6 và có block scope, trong khi var có function scope. const không thể reassign, let có thể reassign."
    },
    {
      question: "React hooks nào được sử dụng để quản lý state trong functional component?",
      answers: {
        A: "useState",
        B: "useEffect", 
        C: "useContext",
        D: "useReducer"
      },
      correctAnswer: "A",
      fields: ["Frontend Development"],
      topics: ["React", "Hooks"],
      levels: ["junior", "middle"],
      explanation: "useState là hook cơ bản nhất để quản lý state trong functional component. useEffect dùng cho side effects, useContext cho context, useReducer cho complex state."
    },
    {
      question: "Virtual DOM trong React hoạt động như thế nào?",
      answers: {
        A: "Là bản sao của real DOM trong memory",
        B: "Là real DOM được tối ưu",
        C: "Là database của React",
        D: "Là cache của browser"
      },
      correctAnswer: "A",
      fields: ["Frontend Development"],
      topics: ["React", "Virtual DOM"],
      levels: ["middle", "senior"],
      explanation: "Virtual DOM là bản sao của real DOM được lưu trong memory. React so sánh Virtual DOM với real DOM để tối ưu việc update UI."
    },
    {
      question: "CSS Grid và Flexbox khác nhau như thế nào?",
      answers: {
        A: "Grid cho layout 2D, Flexbox cho layout 1D",
        B: "Grid cho layout 1D, Flexbox cho layout 2D", 
        C: "Cả hai đều cho layout 2D",
        D: "Cả hai đều cho layout 1D"
      },
      correctAnswer: "A",
      fields: ["Frontend Development"],
      topics: ["CSS", "Layout"],
      levels: ["junior", "middle"],
      explanation: "CSS Grid được thiết kế cho layout 2 chiều (rows và columns), trong khi Flexbox được thiết kế cho layout 1 chiều (row hoặc column)."
    }
  ]

  // Backend Questions
  const backendQuestions = [
    {
      question: "RESTful API là gì và các nguyên tắc cơ bản?",
      answers: {
        A: "API tuân theo các nguyên tắc REST",
        B: "API chỉ dùng GET và POST",
        C: "API chỉ dùng JSON",
        D: "API chỉ dùng HTTP"
      },
      correctAnswer: "A",
      fields: ["Backend Development"],
      topics: ["API Design", "REST"],
      levels: ["junior", "middle"],
      explanation: "RESTful API tuân theo các nguyên tắc REST: stateless, client-server, cacheable, uniform interface, layered system."
    },
    {
      question: "Middleware trong Express.js có tác dụng gì?",
      answers: {
        A: "Xử lý request trước khi đến route handler",
        B: "Chỉ xử lý response",
        C: "Chỉ xử lý database",
        D: "Chỉ xử lý authentication"
      },
      correctAnswer: "A",
      fields: ["Backend Development"],
      topics: ["Node.js", "Express.js"],
      levels: ["junior", "middle"],
      explanation: "Middleware trong Express.js là các function được thực thi theo thứ tự, có thể xử lý request, response, hoặc chuyển tiếp đến middleware tiếp theo."
    },
    {
      question: "Database indexing có tác dụng gì?",
      answers: {
        A: "Tăng tốc độ truy vấn dữ liệu",
        B: "Giảm dung lượng database",
        C: "Tăng bảo mật",
        D: "Giảm backup time"
      },
      correctAnswer: "A",
      fields: ["Backend Development"],
      topics: ["Database", "Performance"],
      levels: ["middle", "senior"],
      explanation: "Database indexing tạo ra cấu trúc dữ liệu để tăng tốc độ truy vấn, giảm thời gian tìm kiếm từ O(n) xuống O(log n)."
    }
  ]

  // Full Stack Questions
  const fullstackQuestions = [
    {
      question: "Microservices architecture có ưu điểm gì so với monolithic?",
      answers: {
        A: "Dễ scale, deploy độc lập, fault isolation",
        B: "Đơn giản hơn monolithic",
        C: "Ít phức tạp hơn",
        D: "Rẻ hơn để phát triển"
      },
      correctAnswer: "A",
      fields: ["Full Stack Development"],
      topics: ["Architecture", "Microservices"],
      levels: ["middle", "senior"],
      explanation: "Microservices cho phép scale từng service độc lập, deploy riêng biệt, và khi một service lỗi không ảnh hưởng toàn bộ hệ thống."
    },
    {
      question: "JWT token được sử dụng để làm gì?",
      answers: {
        A: "Xác thực và phân quyền người dùng",
        B: "Chỉ mã hóa dữ liệu",
        C: "Chỉ nén dữ liệu",
        D: "Chỉ cache dữ liệu"
      },
      correctAnswer: "A",
      fields: ["Full Stack Development"],
      topics: ["Authentication", "Security"],
      levels: ["middle", "senior"],
      explanation: "JWT (JSON Web Token) được sử dụng để xác thực và phân quyền người dùng, chứa thông tin được mã hóa và có thể verify."
    }
  ]

  // Mobile Questions
  const mobileQuestions = [
    {
      question: "React Native và Flutter khác nhau như thế nào?",
      answers: {
        A: "React Native dùng JavaScript, Flutter dùng Dart",
        B: "Cả hai đều dùng JavaScript",
        C: "React Native dùng Dart, Flutter dùng JavaScript",
        D: "Cả hai đều dùng TypeScript"
      },
      correctAnswer: "A",
      fields: ["Mobile Development"],
      topics: ["React Native", "Flutter"],
      levels: ["junior", "middle"],
      explanation: "React Native sử dụng JavaScript/TypeScript và bridge để giao tiếp với native code, Flutter sử dụng Dart và có engine riêng."
    }
  ]

  // DevOps Questions
  const devopsQuestions = [
    {
      question: "Docker container và virtual machine khác nhau như thế nào?",
      answers: {
        A: "Container chia sẻ OS kernel, VM có OS riêng",
        B: "Container có OS riêng, VM chia sẻ kernel",
        C: "Cả hai đều có OS riêng",
        D: "Cả hai đều chia sẻ kernel"
      },
      correctAnswer: "A",
      fields: ["DevOps & Cloud"],
      topics: ["Docker", "Virtualization"],
      levels: ["middle", "senior"],
      explanation: "Container chia sẻ OS kernel với host, nhẹ hơn và start nhanh hơn. VM có OS riêng, nặng hơn nhưng cô lập hoàn toàn."
    },
    {
      question: "CI/CD pipeline có tác dụng gì?",
      answers: {
        A: "Tự động hóa build, test và deploy",
        B: "Chỉ tự động test",
        C: "Chỉ tự động deploy",
        D: "Chỉ tự động build"
      },
      correctAnswer: "A",
      fields: ["DevOps & Cloud"],
      topics: ["CI/CD", "Automation"],
      levels: ["middle", "senior"],
      explanation: "CI/CD (Continuous Integration/Continuous Deployment) tự động hóa toàn bộ quy trình từ build, test đến deploy, giảm lỗi và tăng tốc độ release."
    }
  ]

  // Data Questions
  const dataQuestions = [
    {
      question: "SQL và NoSQL khác nhau như thế nào?",
      answers: {
        A: "SQL có schema cố định, NoSQL linh hoạt schema",
        B: "SQL linh hoạt schema, NoSQL có schema cố định",
        C: "Cả hai đều có schema cố định",
        D: "Cả hai đều linh hoạt schema"
      },
      correctAnswer: "A",
      fields: ["Data & AI"],
      topics: ["Database", "SQL", "NoSQL"],
      levels: ["middle", "senior"],
      explanation: "SQL databases có schema cố định và quan hệ, NoSQL databases có schema linh hoạt và thường không quan hệ."
    }
  ]

  // Combine all questions
  const allQuestions = [
    ...frontendQuestions,
    ...backendQuestions,
    ...fullstackQuestions,
    ...mobileQuestions,
    ...devopsQuestions,
    ...dataQuestions
  ]

  // Create questions
  for (const questionData of allQuestions) {
    await prisma.question.create({
      data: {
        question: questionData.question,
        answers: toAnswerArray(questionData),
        fields: questionData.fields,
        topics: questionData.topics,
        levels: questionData.levels,
        explanation: questionData.explanation
      }
    })
  }

  console.log('✅ Questions seeded successfully!')
  console.log(`📝 Created ${allQuestions.length} questions`)

  await prisma.$disconnect()
}

main().catch(console.error)
