const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedJobRoles() {
  try {
    console.log('🌱 Seeding job roles...');

    // Create job categories
    const categories = [
      { 
        name: 'Software Development',
        skills: ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Vite', 'Webpack', 'Docker', 'Git', 'REST API', 'GraphQL', 'SQL', 'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP']
      },
      { 
        name: 'Data Science',
        skills: ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Jupyter', 'Tableau', 'Power BI', 'Apache Spark', 'Hadoop', 'Machine Learning', 'Deep Learning', 'Statistics', 'Data Visualization']
      },
      { 
        name: 'DevOps',
        skills: ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible', 'AWS', 'Azure', 'GCP', 'Linux', 'Shell Scripting', 'Python', 'Go', 'Monitoring', 'Logging', 'ELK Stack', 'Prometheus', 'Grafana']
      },
      { 
        name: 'Product Management',
        skills: ['Product Strategy', 'User Research', 'Market Analysis', 'Agile', 'Scrum', 'JIRA', 'Confluence', 'Figma', 'Analytics', 'A/B Testing', 'Customer Development', 'Roadmapping', 'Stakeholder Management', 'Data Analysis']
      },
      { 
        name: 'Design',
        skills: ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'Prototyping', 'User Research', 'Wireframing', 'UI Design', 'UX Design', 'Design Systems', 'Typography', 'Color Theory', 'Accessibility']
      },
      { 
        name: 'Marketing',
        skills: ['Digital Marketing', 'SEO', 'SEM', 'Google Analytics', 'Facebook Ads', 'Google Ads', 'Email Marketing', 'Content Marketing', 'Social Media Marketing', 'Marketing Automation', 'CRM', 'HubSpot', 'Mailchimp', 'Canva']
      },
      { 
        name: 'Sales',
        skills: ['CRM', 'Salesforce', 'HubSpot', 'Lead Generation', 'Prospecting', 'Negotiation', 'Presentation Skills', 'Relationship Building', 'Sales Strategy', 'Pipeline Management', 'Customer Success', 'Account Management']
      },
      { 
        name: 'Customer Support',
        skills: ['Customer Service', 'Zendesk', 'Intercom', 'Live Chat', 'Email Support', 'Phone Support', 'Problem Solving', 'Communication Skills', 'Product Knowledge', 'Escalation Management', 'Customer Success', 'Feedback Collection']
      },
    ];

    for (const category of categories) {
      await prisma.jobCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }

    // Create job specializations
    const specializations = [
      { name: 'Frontend Development', categoryName: 'Software Development' },
      { name: 'Backend Development', categoryName: 'Software Development' },
      { name: 'Full Stack Development', categoryName: 'Software Development' },
      { name: 'Mobile Development', categoryName: 'Software Development' },
      { name: 'Machine Learning', categoryName: 'Data Science' },
      { name: 'Data Engineering', categoryName: 'Data Science' },
      { name: 'Data Analysis', categoryName: 'Data Science' },
      { name: 'Cloud Infrastructure', categoryName: 'DevOps' },
      { name: 'System Administration', categoryName: 'DevOps' },
      { name: 'UI/UX Design', categoryName: 'Design' },
      { name: 'Graphic Design', categoryName: 'Design' },
    ];

    for (const spec of specializations) {
      const category = await prisma.jobCategory.findUnique({
        where: { name: spec.categoryName },
      });
      
      if (category) {
        await prisma.jobSpecialization.upsert({
          where: { name: spec.name },
          update: {},
          create: {
            name: spec.name,
            categoryId: category.id,
          },
        });
      }
    }

    // Create job roles
    const jobRoles = [
      // Frontend Development
      {
        key: 'frontend-intern',
        title: 'Frontend Developer Intern',
        level: 'Intern',
        description: 'Learn frontend development with React, Vue, or Angular',
        minExperience: 0,
        maxExperience: 1,
        categoryName: 'Software Development',
        specializationName: 'Frontend Development',
        order: 1,
      },
      {
        key: 'frontend-junior',
        title: 'Junior Frontend Developer',
        level: 'Junior',
        description: 'Build responsive web applications using modern frameworks',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'Software Development',
        specializationName: 'Frontend Development',
        order: 2,
      },
      {
        key: 'frontend-mid',
        title: 'Mid-level Frontend Developer',
        level: 'Mid',
        description: 'Lead frontend development and mentor junior developers',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'Software Development',
        specializationName: 'Frontend Development',
        order: 3,
      },
      {
        key: 'frontend-senior',
        title: 'Senior Frontend Developer',
        level: 'Senior',
        description: 'Architect frontend solutions and drive technical decisions',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'Software Development',
        specializationName: 'Frontend Development',
        order: 4,
      },
      {
        key: 'frontend-lead',
        title: 'Frontend Team Lead',
        level: 'Lead',
        description: 'Lead frontend team and define technical strategy',
        minExperience: 8,
        maxExperience: 12,
        categoryName: 'Software Development',
        specializationName: 'Frontend Development',
        order: 5,
      },

      // Backend Development
      {
        key: 'backend-junior',
        title: 'Junior Backend Developer',
        level: 'Junior',
        description: 'Develop server-side applications and APIs',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'Software Development',
        specializationName: 'Backend Development',
        order: 6,
      },
      {
        key: 'backend-mid',
        title: 'Mid-level Backend Developer',
        level: 'Mid',
        description: 'Design and implement scalable backend systems',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'Software Development',
        specializationName: 'Backend Development',
        order: 7,
      },
      {
        key: 'backend-senior',
        title: 'Senior Backend Developer',
        level: 'Senior',
        description: 'Architect complex backend systems and mentor team',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'Software Development',
        specializationName: 'Backend Development',
        order: 8,
      },

      // Full Stack
      {
        key: 'fullstack-junior',
        title: 'Junior Full Stack Developer',
        level: 'Junior',
        description: 'Develop both frontend and backend components',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'Software Development',
        specializationName: 'Full Stack Development',
        order: 9,
      },
      {
        key: 'fullstack-mid',
        title: 'Mid-level Full Stack Developer',
        level: 'Mid',
        description: 'Build complete web applications end-to-end',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'Software Development',
        specializationName: 'Full Stack Development',
        order: 10,
      },
      {
        key: 'fullstack-senior',
        title: 'Senior Full Stack Developer',
        level: 'Senior',
        description: 'Lead full stack development and system architecture',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'Software Development',
        specializationName: 'Full Stack Development',
        order: 11,
      },

      // Data Science
      {
        key: 'ml-junior',
        title: 'Junior Machine Learning Engineer',
        level: 'Junior',
        description: 'Implement ML models and data preprocessing',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'Data Science',
        specializationName: 'Machine Learning',
        order: 12,
      },
      {
        key: 'ml-mid',
        title: 'Mid-level Machine Learning Engineer',
        level: 'Mid',
        description: 'Develop and optimize ML algorithms and pipelines',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'Data Science',
        specializationName: 'Machine Learning',
        order: 13,
      },
      {
        key: 'ml-senior',
        title: 'Senior Machine Learning Engineer',
        level: 'Senior',
        description: 'Lead ML initiatives and research new approaches',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'Data Science',
        specializationName: 'Machine Learning',
        order: 14,
      },

      // DevOps
      {
        key: 'devops-junior',
        title: 'Junior DevOps Engineer',
        level: 'Junior',
        description: 'Manage CI/CD pipelines and cloud infrastructure',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'DevOps',
        specializationName: 'Cloud Infrastructure',
        order: 15,
      },
      {
        key: 'devops-mid',
        title: 'Mid-level DevOps Engineer',
        level: 'Mid',
        description: 'Design and implement infrastructure automation',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'DevOps',
        specializationName: 'Cloud Infrastructure',
        order: 16,
      },
      {
        key: 'devops-senior',
        title: 'Senior DevOps Engineer',
        level: 'Senior',
        description: 'Lead infrastructure strategy and team operations',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'DevOps',
        specializationName: 'Cloud Infrastructure',
        order: 17,
      },

      // Product Management
      {
        key: 'pm-junior',
        title: 'Junior Product Manager',
        level: 'Junior',
        description: 'Assist in product planning and user research',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'Product Management',
        specializationName: null,
        order: 18,
      },
      {
        key: 'pm-mid',
        title: 'Product Manager',
        level: 'Mid',
        description: 'Lead product development and stakeholder management',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'Product Management',
        specializationName: null,
        order: 19,
      },
      {
        key: 'pm-senior',
        title: 'Senior Product Manager',
        level: 'Senior',
        description: 'Define product strategy and mentor product team',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'Product Management',
        specializationName: null,
        order: 20,
      },

      // Design
      {
        key: 'designer-junior',
        title: 'Junior UI/UX Designer',
        level: 'Junior',
        description: 'Create user interfaces and user experience designs',
        minExperience: 1,
        maxExperience: 3,
        categoryName: 'Design',
        specializationName: 'UI/UX Design',
        order: 21,
      },
      {
        key: 'designer-mid',
        title: 'UI/UX Designer',
        level: 'Mid',
        description: 'Design intuitive and engaging user experiences',
        minExperience: 3,
        maxExperience: 5,
        categoryName: 'Design',
        specializationName: 'UI/UX Design',
        order: 22,
      },
      {
        key: 'designer-senior',
        title: 'Senior UI/UX Designer',
        level: 'Senior',
        description: 'Lead design strategy and mentor design team',
        minExperience: 5,
        maxExperience: 8,
        categoryName: 'Design',
        specializationName: 'UI/UX Design',
        order: 23,
      },
    ];

    for (const role of jobRoles) {
      const category = await prisma.jobCategory.findUnique({
        where: { name: role.categoryName },
      });
      
      let specialization = null;
      if (role.specializationName) {
        specialization = await prisma.jobSpecialization.findUnique({
          where: { name: role.specializationName },
        });
      }

      await prisma.jobRole.upsert({
        where: { key: role.key },
        update: {},
        create: {
          key: role.key,
          title: role.title,
          level: role.level,
          description: role.description,
          minExperience: role.minExperience,
          maxExperience: role.maxExperience,
          categoryId: category.id,
          specializationId: specialization?.id || null,
          order: role.order,
        },
      });
    }

    console.log('✅ Job roles seeded successfully!');
    
    // Display summary
    const totalCategories = await prisma.jobCategory.count();
    const totalSpecializations = await prisma.jobSpecialization.count();
    const totalJobRoles = await prisma.jobRole.count();
    
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${totalCategories}`);
    console.log(`   - Specializations: ${totalSpecializations}`);
    console.log(`   - Job Roles: ${totalJobRoles}`);

  } catch (error) {
    console.error('❌ Error seeding job roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedJobRoles();
