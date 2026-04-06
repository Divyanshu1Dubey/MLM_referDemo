import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import Course from '../models/Course';
import User from '../models/User';
import { nanoid } from 'nanoid';

dotenv.config();

const courses = [
  {
    title: 'C1 - Web Development Mastery',
    description:
      'Complete web development course covering HTML, CSS, JavaScript, React, and Node.js. Perfect for beginners to advanced.',
    price: 4999,
    courseHours: 60,
    syllabus: [
      'HTML5 & CSS3 Fundamentals',
      'JavaScript ES6+ Deep Dive',
      'React.js Complete Guide',
      'Node.js & Express Backend',
      'MongoDB Database',
      'Authentication & Security',
      'Deployment & DevOps',
      'Real-world Projects',
    ],
    rating: 4.9,
    numRatings: 1250,
    creditsRequired: 50,
    instructor: 'Rahul Sharma',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'C2 - Digital Marketing Pro',
    description:
      'Master digital marketing including SEO, Social Media, Google Ads, Facebook Ads, and Email Marketing.',
    price: 3999,
    courseHours: 45,
    syllabus: [
      'Digital Marketing Fundamentals',
      'SEO & Content Marketing',
      'Google Ads Mastery',
      'Facebook & Instagram Ads',
      'Email Marketing Automation',
      'Analytics & Reporting',
      'Social Media Strategy',
      'Lead Generation Tactics',
    ],
    rating: 4.8,
    numRatings: 890,
    creditsRequired: 40,
    instructor: 'Priya Patel',
    level: 'Intermediate',
    commissionPercent: 15,
    referralDiscount: 20,
  },
  {
    title: 'C3 - Data Science & AI',
    description:
      'Comprehensive data science course with Python, Machine Learning, Deep Learning, and AI projects.',
    price: 7999,
    courseHours: 80,
    syllabus: [
      'Python for Data Science',
      'Statistics & Mathematics',
      'Data Analysis with Pandas',
      'Machine Learning Algorithms',
      'Deep Learning with TensorFlow',
      'Natural Language Processing',
      'Computer Vision',
      'Capstone AI Projects',
    ],
    rating: 4.9,
    numRatings: 756,
    creditsRequired: 70,
    instructor: 'Dr. Amit Kumar',
    level: 'Advanced',
    commissionPercent: 12,
    referralDiscount: 20,
  },
  {
    title: 'Advanced TypeScript',
    description:
      'Master advanced TypeScript concepts like generics, decorators, and conditional types.',
    price: 3499,
    courseHours: 24,
    syllabus: [
      'TypeScript Fundamentals Review',
      'Advanced Types and Generics',
      'Decorators and Metadata',
      'Conditional Types and Mapped Types',
      'Type Guards and Narrowing',
      'Advanced Patterns and Best Practices',
      'Building Type-Safe Libraries',
      'Real-world TypeScript Projects',
    ],
    rating: 4.8,
    numRatings: 324,
    creditsRequired: 25,
    instructor: 'Sarah Johnson',
    level: 'Advanced',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Next.js 14 Deep Dive',
    description:
      'Build high-performance web applications with the latest features of Next.js.',
    price: 4499,
    courseHours: 32,
    syllabus: [
      'Next.js 14 Introduction',
      'App Router and Server Components',
      'Data Fetching Strategies',
      'Server Actions and Mutations',
      'Streaming and Suspense',
      'Route Handlers and Middleware',
      'Authentication with NextAuth',
      'Deployment and Optimization',
      'Full-Stack Next.js Projects',
    ],
    rating: 4.9,
    numRatings: 512,
    creditsRequired: 30,
    instructor: 'Michael Chen',
    level: 'Intermediate',
    commissionPercent: 12,
    referralDiscount: 20,
  },
  {
    title: 'Modern Backend with Express & Zod',
    description:
      'Learn to build robust, type-safe RESTful APIs with Node.js, Express, and Zod.',
    price: 3299,
    courseHours: 20,
    syllabus: [
      'Node.js and Express Fundamentals',
      'RESTful API Design Principles',
      'Request Validation with Zod',
      'Error Handling and Middleware',
      'Database Integration with MongoDB',
      'Authentication and Authorization',
      'API Security Best Practices',
      'Testing and Documentation',
      'Deployment to Production',
    ],
    rating: 4.7,
    numRatings: 289,
    creditsRequired: 20,
    instructor: 'David Rodriguez',
    level: 'Intermediate',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Tailwind CSS From Scratch',
    description:
      'Go from beginner to pro with Tailwind CSS and build beautiful, custom UIs.',
    price: 2999,
    courseHours: 16,
    syllabus: [
      'Tailwind CSS Setup and Configuration',
      'Utility-First CSS Approach',
      'Responsive Design with Tailwind',
      'Custom Colors and Themes',
      'Components and Patterns',
      'Dark Mode Implementation',
      'Animations and Transitions',
      'Production Optimization',
      'Building Real-World Interfaces',
    ],
    rating: 4.6,
    numRatings: 445,
    creditsRequired: 15,
    instructor: 'Emily Parker',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Full-Stack Authentication Mastery',
    description:
      'Implement secure authentication systems with JWT, OAuth, and NextAuth.',
    price: 3799,
    courseHours: 28,
    syllabus: [
      'Authentication Fundamentals',
      'JWT Implementation',
      'Session Management',
      'OAuth 2.0 and Social Login',
      'NextAuth.js Deep Dive',
      'Role-Based Access Control',
      'Security Best Practices',
      'Password Reset and Email Verification',
      'Multi-Factor Authentication',
      'Full-Stack Auth Project',
    ],
    rating: 4.9,
    numRatings: 387,
    creditsRequired: 22,
    instructor: 'Alex Thompson',
    level: 'Intermediate',
    commissionPercent: 12,
    referralDiscount: 20,
  },
  {
    title: 'React Performance Optimization',
    description:
      'Learn advanced techniques to optimize React applications for maximum performance.',
    price: 3999,
    courseHours: 22,
    syllabus: [
      'React Rendering Behavior',
      'Memoization Techniques',
      'Code Splitting and Lazy Loading',
      'Virtual DOM Optimization',
      'React DevTools Profiler',
      'Bundle Size Optimization',
      'Server-Side Rendering',
      'Performance Testing',
    ],
    rating: 4.8,
    numRatings: 256,
    creditsRequired: 27,
    instructor: 'Jennifer Lee',
    level: 'Advanced',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'MongoDB & Mongoose Mastery',
    description:
      'Master MongoDB database design, queries, and integration with Node.js applications.',
    price: 3499,
    courseHours: 26,
    syllabus: [
      'MongoDB Fundamentals',
      'Document Modeling',
      'CRUD Operations',
      'Mongoose Schema Design',
      'Query Optimization',
      'Aggregation Pipeline',
      'Indexing Strategies',
      'Database Security',
      'Scaling and Replication',
    ],
    rating: 4.7,
    numRatings: 412,
    creditsRequired: 21,
    instructor: 'Robert Martinez',
    level: 'Intermediate',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'UI/UX Design Fundamentals',
    description:
      'Learn the principles of user interface and user experience design from scratch.',
    price: 3199,
    courseHours: 18,
    syllabus: [
      'Design Thinking Process',
      'User Research Methods',
      'Wireframing and Prototyping',
      'Color Theory and Typography',
      'Visual Hierarchy',
      'Usability Testing',
      'Responsive Design Principles',
      'Design Tools (Figma)',
    ],
    rating: 4.5,
    numRatings: 534,
    creditsRequired: 17,
    instructor: 'Lisa Anderson',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'GraphQL API Development',
    description:
      'Build modern, efficient APIs using GraphQL, Apollo Server, and best practices.',
    price: 3899,
    courseHours: 25,
    syllabus: [
      'GraphQL vs REST',
      'Schema Design',
      'Resolvers and Data Sources',
      'Apollo Server Setup',
      'Authentication & Authorization',
      'Query Optimization',
      'Subscriptions',
      'Testing GraphQL APIs',
      'Production Deployment',
    ],
    rating: 4.8,
    numRatings: 298,
    creditsRequired: 24,
    instructor: 'Chris Brown',
    level: 'Advanced',
    commissionPercent: 12,
    referralDiscount: 20,
  },
  {
    title: 'Docker for Developers',
    description:
      'Master containerization with Docker and streamline your development workflow.',
    price: 3599,
    courseHours: 20,
    syllabus: [
      'Docker Fundamentals',
      'Images and Containers',
      'Dockerfile Best Practices',
      'Docker Compose',
      'Networking and Volumes',
      'Multi-Stage Builds',
      'Docker in Development',
      'Production Deployment',
    ],
    rating: 4.6,
    numRatings: 378,
    creditsRequired: 19,
    instructor: 'Kevin Wilson',
    level: 'Intermediate',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Python for Data Science',
    description:
      'Learn Python programming and data analysis with pandas, NumPy, and visualization.',
    price: 4299,
    courseHours: 35,
    syllabus: [
      'Python Basics',
      'NumPy Arrays',
      'Pandas DataFrames',
      'Data Cleaning',
      'Exploratory Data Analysis',
      'Matplotlib & Seaborn',
      'Statistical Analysis',
      'Machine Learning Basics',
      'Real-World Projects',
    ],
    rating: 4.9,
    numRatings: 687,
    creditsRequired: 26,
    instructor: 'Dr. Amanda Foster',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'AWS Cloud Practitioner',
    description:
      'Get certified in AWS with comprehensive coverage of cloud computing fundamentals.',
    price: 4999,
    courseHours: 30,
    syllabus: [
      'Cloud Computing Concepts',
      'AWS Global Infrastructure',
      'EC2 and Compute Services',
      'Storage Solutions (S3, EBS)',
      'Database Services (RDS, DynamoDB)',
      'Networking and Security',
      'Monitoring and Management',
      'Pricing and Billing',
      'Exam Preparation',
    ],
    rating: 4.8,
    numRatings: 543,
    creditsRequired: 32,
    instructor: 'Mark Johnson',
    level: 'Beginner',
    commissionPercent: 12,
    referralDiscount: 20,
  },
  {
    title: 'Vue.js 3 Complete Guide',
    description:
      'Build modern web applications with Vue.js 3, Composition API, and Pinia.',
    price: 3799,
    courseHours: 28,
    syllabus: [
      'Vue.js 3 Fundamentals',
      'Composition API',
      'Vue Router',
      'State Management with Pinia',
      'Component Design Patterns',
      'Form Handling',
      'HTTP and API Integration',
      'Testing Vue Applications',
      'Production Deployment',
    ],
    rating: 4.7,
    numRatings: 321,
    creditsRequired: 23,
    instructor: 'Sophie Chen',
    level: 'Intermediate',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Cybersecurity Essentials',
    description:
      'Learn the fundamentals of cybersecurity and protect web applications from threats.',
    price: 4499,
    courseHours: 24,
    syllabus: [
      'Security Fundamentals',
      'Common Web Vulnerabilities',
      'OWASP Top 10',
      'Encryption and Hashing',
      'Secure Authentication',
      'Network Security',
      'Penetration Testing Basics',
      'Security Best Practices',
    ],
    rating: 4.9,
    numRatings: 412,
    creditsRequired: 28,
    instructor: 'James Miller',
    level: 'Advanced',
    commissionPercent: 12,
    referralDiscount: 20,
  },
  {
    title: 'Flutter Mobile Development',
    description:
      'Create beautiful, native mobile apps for iOS and Android with Flutter and Dart.',
    price: 4999,
    courseHours: 40,
    syllabus: [
      'Dart Programming',
      'Flutter Widgets',
      'Layouts and Navigation',
      'State Management',
      'API Integration',
      'Local Storage',
      'Firebase Integration',
      'App Deployment',
      'Building Real Apps',
    ],
    rating: 4.8,
    numRatings: 476,
    creditsRequired: 29,
    instructor: 'Maria Garcia',
    level: 'Intermediate',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Git & GitHub Mastery',
    description:
      'Master version control with Git and collaborate effectively using GitHub.',
    price: 2999,
    courseHours: 12,
    syllabus: [
      'Git Fundamentals',
      'Branching and Merging',
      'Resolving Conflicts',
      'GitHub Workflows',
      'Pull Requests',
      'Git Best Practices',
      'Advanced Git Commands',
      'Team Collaboration',
    ],
    rating: 4.6,
    numRatings: 892,
    creditsRequired: 12,
    instructor: 'Tom Harris',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Machine Learning with TensorFlow',
    description:
      'Build and deploy machine learning models using TensorFlow and Keras.',
    price: 6999,
    courseHours: 45,
    syllabus: [
      'ML Fundamentals',
      'Neural Networks',
      'TensorFlow Basics',
      'Keras API',
      'Convolutional Neural Networks',
      'Recurrent Neural Networks',
      'Transfer Learning',
      'Model Deployment',
      'Real-World Projects',
    ],
    rating: 4.9,
    numRatings: 234,
    creditsRequired: 35,
    instructor: 'Dr. Rachel Kim',
    level: 'Advanced',
    commissionPercent: 15,
    referralDiscount: 20,
  },
  {
    title: 'Figma UI Design',
    description:
      'Design stunning user interfaces and prototypes using Figma from scratch.',
    price: 3299,
    courseHours: 16,
    syllabus: [
      'Figma Interface',
      'Design Basics',
      'Components and Variants',
      'Auto Layout',
      'Prototyping',
      'Design Systems',
      'Collaboration Features',
      'Handoff to Developers',
    ],
    rating: 4.7,
    numRatings: 645,
    creditsRequired: 16,
    instructor: 'Nina Patel',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
  {
    title: 'Microservices Architecture',
    description:
      'Design and build scalable microservices using Node.js, Docker, and Kubernetes.',
    price: 5999,
    courseHours: 38,
    syllabus: [
      'Microservices Principles',
      'Service Design Patterns',
      'API Gateway',
      'Inter-Service Communication',
      'Docker Containerization',
      'Kubernetes Orchestration',
      'Service Mesh',
      'Monitoring and Logging',
      'Real-World Implementation',
    ],
    rating: 4.8,
    numRatings: 189,
    creditsRequired: 36,
    instructor: 'Daniel Cooper',
    level: 'Advanced',
    commissionPercent: 15,
    referralDiscount: 20,
  },
  {
    title: 'SEO & Digital Marketing',
    description:
      'Master search engine optimization and grow your online presence organically.',
    price: 3499,
    courseHours: 20,
    syllabus: [
      'SEO Fundamentals',
      'Keyword Research',
      'On-Page Optimization',
      'Technical SEO',
      'Link Building',
      'Content Strategy',
      'Analytics and Tracking',
      'Local SEO',
    ],
    rating: 4.5,
    numRatings: 567,
    creditsRequired: 18,
    instructor: 'Jessica White',
    level: 'Beginner',
    commissionPercent: 10,
    referralDiscount: 20,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Course.deleteMany({});
    console.log('✅ Cleared existing courses');

    // Insert new courses (add commissionPercent and referralDiscount to all courses)
    const coursesWithCommission = courses.map(course => ({
      ...course,
      commissionPercent: course.commissionPercent || 10,
      referralDiscount: course.referralDiscount || 20,
    }));
    
    const createdCourses = await Course.insertMany(coursesWithCommission);
    console.log(`✅ Seeded ${createdCourses.length} courses`);

    console.log('\n📚 Created Courses:');
    createdCourses.forEach((course) => {
      console.log(`  - ${course.title} (₹${course.price}) - ${course.commissionPercent}% commission`);
    });

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@coursestore.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const adminUser = new User({
        username: 'admin',
        email: 'admin@coursestore.com',
        password: hashedPassword,
        referralCode: nanoid(8).toUpperCase(),
        role: 'admin',
      });
      await adminUser.save();
      console.log('\n👤 Created admin user:');
      console.log('  Email: admin@coursestore.com');
      console.log('  Password: admin123');
    } else {
      console.log('\n👤 Admin user already exists');
    }

    // Create a demo user with referral code for testing
    const existingDemo = await User.findOne({ email: 'demo@coursestore.com' });
    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      const demoUser = new User({
        username: 'demo_user',
        email: 'demo@coursestore.com',
        password: hashedPassword,
        referralCode: 'DEMO2024',
        role: 'user',
      });
      await demoUser.save();
      console.log('\n👤 Created demo user:');
      console.log('  Email: demo@coursestore.com');
      console.log('  Password: demo123');
      console.log('  Referral Code: DEMO2024');
    }

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
