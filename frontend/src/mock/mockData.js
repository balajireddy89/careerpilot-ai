// Mock Database and LocalStorage State Manager for CareerPilot AI

export const INITIAL_PROFILE = {
  // Onboarding status flag
  onboarded: false,
  
  // 1. Basic Details
  name: "",
  email: "",
  phone: "",
  college: "",
  degree: "",
  branch: "",
  currentYear: "3rd",
  graduationYear: 2027,
  cgpa: "",

  // 2. Career Goals
  targetRole: "",
  primaryPriority: "",
  learningRoadmap: [],
  quizRewards: {},
  codingRewards: {},
  roadmapRewards: {},
  aims: [], // Internship, Placement, Higher Studies, etc.
  preferredPaths: [], // Full Stack Developer, Frontend Developer, etc.

  // 3. Skills Assessment (with proficiency)
  skills: [], // Array of strings e.g. ["Java", "SQL"]
  skillsProficiency: {}, // e.g. { "Java": "Advanced", "SQL": "Intermediate" }

  // 4. Resume Upload Detail
  resumeDetails: {
    fileName: "",
    uploadedAt: "",
    score: 0,
    atsScore: 0,
    formattingScore: 0,
    keywordsScore: 0,
    detectedKeywords: [],
    missingKeywords: [],
    suggestions: []
  },

  // 5. Project Experience
  projects: [], // Array of { name, tech, role, desc, github, live }

  // 6. Certifications
  certifications: [], // Array of { name, provider, date }

  // 7. Coding Ability Assessment (1-5)
  codingRating: {
    dsa: 1,
    algorithms: 1,
    problemSolving: 1
  },
  codingStats: {
    solvedEasy: 0,
    solvedMedium: 0,
    solvedHard: 0,
    totalEasy: 30,
    totalMedium: 40,
    totalHard: 20,
    accuracy: 0,
    score: 0
  },

  // 8. Aptitude Evaluation (mini test)
  aptitudeStats: {
    quantitative: 0,
    logical: 0,
    verbal: 0,
    testsTaken: 0,
    score: 0
  },

  // 9. HR Readiness Assessment (1-10)
  hrRating: {
    confidence: 1,
    publicSpeaking: 1,
    communication: 1,
    englishProficiency: 1
  },
  interviewStats: {
    hrScore: 0,
    techScore: 0,
    communication: 0,
    confidence: 0,
    sessionsCount: 0
  },

  // 10. Preferred Companies
  preferredCompanies: [], // TCS, Infosys, Wipro, Accenture, Google, Microsoft, Other

  // 11. Preferred Work Type
  workType: "Hybrid", // On-site, Remote, Hybrid

  // 12. Areas of Interest
  interests: [], // Web Dev, AI/ML, Data Science, etc.

  // 13. Weekly Availability (hours)
  weeklyHours: "10-20",

  // 14. Personality Quiz Results
  personalityResults: {
    enjoyCoding: false,
    enjoyData: false,
    preferDesign: false,
    likeMath: false,
    enjoyTeamwork: false
  },
  points: 100, // starting points
  dailyStreak: 1,
  badges: [],
  isAdmin: false,
};

const CAREER_PATHS = [
  {
    id: "full-stack",
    name: "Full Stack Development",
    match: 85,
    description: "Builds both the front-end (user interface) and back-end (database, server logic) of web applications.",
    whyMatch: "You have strong foundations in Java, SQL, HTML, and CSS. Learning frontend frameworks like React will quickly make you ready.",
    missingSkills: ["JavaScript", "React", "Spring Boot", "REST APIs"],
    nextSteps: [
      "Complete the React.js interactive path (Month 2)",
      "Learn Spring Boot server setups (Month 3)",
      "Deploy a full-stack project combining React, Spring Boot, and MySQL."
    ]
  },
  {
    id: "software-dev",
    name: "Software Development",
    match: 80,
    description: "Focuses on building desktop, systems, and enterprise business applications using Java, C++, or Python.",
    whyMatch: "Your Java skills and core problem-solving capabilities match standard software engineering requirements.",
    missingSkills: ["Data Structures & Algorithms", "Operating Systems", "System Design"],
    nextSteps: [
      "Solve medium-difficulty array and dynamic programming challenges.",
      "Review multi-threading and OOP design patterns in Java."
    ]
  },
  {
    id: "data-science",
    name: "Data Science",
    match: 45,
    description: "Analyzes raw data to extract insights using statistical models, databases, and machine learning.",
    whyMatch: "Your strong SQL logic is helpful, but you need Python/R libraries and statistical foundations.",
    missingSkills: ["Python", "Pandas & NumPy", "Machine Learning", "Statistics"],
    nextSteps: [
      "Take the Python syntax course.",
      "Learn linear algebra, calculus, and basic machine learning regressions."
    ]
  },
  {
    id: "ai-ml",
    name: "AI/ML Engineering",
    match: 40,
    description: "Designs, trains, and deploys intelligence-based neural network models and agents.",
    whyMatch: "This is a mathematically rigorous field. You'll need solid foundations in Python and deep learning frameworks.",
    missingSkills: ["Python", "PyTorch/TensorFlow", "Deep Learning", "NLP/Computer Vision"],
    nextSteps: [
      "Learn Python object-oriented constructs.",
      "Take basic introductory courses in Neural Networks and Gemini/OpenAI API integrations."
    ]
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    match: 50,
    description: "Secures computer networks, cloud storage infrastructures, and software systems against digital threats.",
    whyMatch: "SQL basics help with understanding SQL injections, but system-level security knowledge is required.",
    missingSkills: ["Computer Networks", "Cryptography", "Linux Admin", "Penetration Testing"],
    nextSteps: [
      "Learn network layers (TCP/IP, HTTP/S).",
      "Get a fundamental understanding of encryption, hashing, and security certificates."
    ]
  },
  {
    id: "devops",
    name: "DevOps Engineering",
    match: 55,
    description: "Orchestrates build, test, and release cycles. Bridges developer actions and production deployments.",
    whyMatch: "Good foundations in SQL and backend logic. System automation and cloud hosting are needed next.",
    missingSkills: ["Linux / Shell Scripting", "Docker & Kubernetes", "CI/CD Pipelines", "AWS / Azure"],
    nextSteps: [
      "Learn basic terminal commands.",
      "Understand containerization concepts using Docker."
    ]
  },
  {
    id: "ui-ux",
    name: "UI/UX Design",
    match: 60,
    description: "Researches user behavior and designs high-fidelity wireframes, UI graphics, and mockups.",
    whyMatch: "Your HTML/CSS knowledge helps bridge design and implementation, but typography and wireframing need study.",
    missingSkills: ["Figma", "User Research", "Wireframing", "Color Theory"],
    nextSteps: [
      "Complete a basic Figma tool guide.",
      "Read about design grids, visual hierarchy, and color palettes."
    ]
  },
  {
    id: "cloud-computing",
    name: "Cloud Computing",
    match: 58,
    description: "Hosts, scales, and manages server infrastructures on platforms like AWS, Google Cloud, and Azure.",
    whyMatch: "Database concepts are useful for managing cloud RDS data, but core virtualization and cloud service patterns are missing.",
    missingSkills: ["Virtualization", "AWS Services (EC2, S3, IAM)", "Cloud Security"],
    nextSteps: [
      "Take the AWS Cloud Practitioner foundation syllabus.",
      "Deploy a static webpage on AWS S3."
    ]
  }
];

const CODING_CHALLENGES = [
  {
    id: "code-1",
    title: "Reverse a String",
    difficulty: "Easy",
    category: "Strings",
    description: "Write a function that reverses a string. The input string is given as an array of characters.",
    inputFormat: "char[] s",
    outputFormat: "void (modify s in-place)",
    sampleInput: '["h","e","l","l","o"]',
    sampleOutput: '["o","l","l","e","h"]',
    templateJava: `public class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n        \n    }\n}`,
    templatePython: `class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        # Write your code here\n        pass`,
    templateJS: `function reverseString(s) {\n    // Write your code here\n    \n}`,
    testCases: [
      { input: '["h","e","l","l","o"]', expected: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', expected: '["h","a","n","n","a","H"]' }
    ]
  },
  {
    id: "code-2",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    inputFormat: "int[] nums, int target",
    outputFormat: "int[] (array of 2 indices)",
    sampleInput: "nums = [2,7,11,15], target = 9",
    sampleOutput: "[0,1]",
    templateJava: `public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{}; \n    }\n}`,
    templatePython: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        return []`,
    templateJS: `function twoSum(nums, target) {\n    // Write your code here\n    return [];\n}`,
    testCases: [
      { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", expected: "[1,2]" }
    ]
  },
  {
    id: "code-3",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    inputFormat: "String s",
    outputFormat: "int (length)",
    sampleInput: '"abcabcbb"',
    sampleOutput: "3 (The substring is 'abc')",
    templateJava: `public class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n        return 0;\n    }\n}`,
    templatePython: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your code here\n        return 0`,
    templateJS: `function lengthOfLongestSubstring(s) {\n    // Write your code here\n    return 0;\n}`,
    testCases: [
      { input: '"abcabcbb"', expected: "3" },
      { input: '"bbbbb"', expected: "1" },
      { input: '"pwwkew"', expected: "3" }
    ]
  }
];

const APTITUDE_QUESTIONS = {
  quantitative: [
    {
      id: "quant-1",
      question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
      options: ["120 metres", "150 metres", "324 metres", "180 metres"],
      answer: "150 metres",
      explanation: "Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of train = Speed * Time = (50/3) * 9 = 150 metres."
    }
  ],
  logical: [
    {
      id: "log-1",
      question: "Look at this series: 36, 34, 30, 28, 24, ... What number should come next?",
      options: ["20", "22", "23", "26"],
      answer: "22",
      explanation: "This is an alternating subtraction series: -2, -4, -2, -4. 36-2=34, 34-4=30, 30-2=28, 28-4=24, 24-2=22."
    }
  ],
  verbal: [
    {
      id: "verb-1",
      question: "Choose the word which is most nearly OPPOSITE in meaning to the word: OBSTINATE",
      options: ["Stubborn", "Flexible", "Rigid", "Dogmatic"],
      answer: "Flexible",
      explanation: "Obstinate means stubborn or unyielding. The opposite is flexible or submissive."
    }
  ]
};

const HR_QUESTIONS = [
  "Tell me about yourself.",
  "Why do you want to join our company?",
  "What are your greatest strengths and weaknesses?"
];

/** Static fallback only — live quizzes use AI generation in Technical Interview */
const TECH_QUIZZES = {};

const MOCK_INTERNSHIPS = [
  { id: "int-1", role: "Frontend Development Intern", company: "WebFlow Inc.", match: 90, required: ["React", "HTML", "CSS", "JavaScript"], location: "Remote", stipend: "$800/mo" },
  { id: "int-2", role: "Java Software Engineer Intern", company: "Enterprise Solutions", match: 95, required: ["Java", "SQL", "Spring Boot", "Git"], location: "Bangalore (On-site)", stipend: "₹25,000/mo" },
  { id: "int-3", role: "Full Stack Intern", company: "SaaS Rocket", match: 80, required: ["JavaScript", "React", "Node.js", "SQL"], location: "Hybrid", stipend: "₹30,000/mo" }
];

const CHATBOT_REPLIES = [
  { pattern: /career|role|job|path|developer|programmer|engineer|fullstack|frontend|backend/i, reply: "Based on your onboarding assessment, your **Full Stack Developer** readiness is at 89%. You should focus on learning Spring Boot and React databases next. Please check the **Learning Roadmap** tab to view your visual month-by-month progress plan!" },
  { pattern: /resume|ats|format/i, reply: "Your resume score is **85/100**. Key suggestions: 1. Add 'React' and 'JavaScript' keywords to match your Full Stack targets." },
  { pattern: /ready|placement|prepare|predict/i, reply: "Your current Overall Placement Readiness Score is **82%**. Your strengths lie in **Coding** and **Problem Solving**." },
  { pattern: /internship|apply|openings/i, reply: "Recommended internships include: **Java Intern, Backend Intern, and Full Stack Intern**. Check the Internship section for more info!" },
  { pattern: /hello|hi|hey/i, reply: "Hello! I am your OpenAI Powered CareerPilot Advisor. How can I help you today?" }
];

// Helper methods for localStorage management
export const getStoredProfile = () => {
  const data = localStorage.getItem("careerpilot_profile");
  if (!data) {
    localStorage.setItem("careerpilot_profile", JSON.stringify(INITIAL_PROFILE));
    return INITIAL_PROFILE;
  }
  return JSON.parse(data);
};

export const saveProfile = (profile) => {
  localStorage.setItem("careerpilot_profile", JSON.stringify(profile));
};

const PLACEHOLDER_RESUME_NAMES = new Set(['', 'Manual_Setup.pdf', 'Resume_Extracted.pdf']);

export const hasUploadedResume = (profile) => {
  const fileName = profile?.resumeDetails?.fileName?.trim() ?? '';
  return fileName.length > 0 && !PLACEHOLDER_RESUME_NAMES.has(fileName);
};

export const calculateProfileCompletion = (profile) => {
  const has = (value) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

  const checks = [
    { weight: 12, done: has(profile.name) },
    { weight: 8, done: has(profile.email) },
    { weight: 5, done: has(profile.phone) },
    { weight: 12, done: has(profile.college) },
    { weight: 6, done: has(profile.degree) },
    { weight: 6, done: has(profile.branch) },
    { weight: 5, done: has(profile.cgpa) },
    { weight: 10, done: (profile.aims?.length ?? 0) > 0 },
    { weight: 10, done: (profile.preferredPaths?.length ?? 0) > 0 || has(profile.targetRole) },
    { weight: 12, done: (profile.skills?.length ?? 0) > 0 },
    { weight: 14, done: hasUploadedResume(profile) },
    { weight: 5, done: (profile.preferredCompanies?.length ?? 0) > 0 },
    { weight: 5, done: (profile.interests?.length ?? 0) > 0 },
  ];

  const earned = checks.reduce((sum, check) => sum + (check.done ? check.weight : 0), 0);
  return Math.min(100, Math.max(0, earned));
};

export const getProfileChecklist = (profile) => [
  {
    label: 'Basic details (name & email)',
    done: Boolean(profile.name?.trim() && profile.email?.trim()),
  },
  {
    label: 'College & academics',
    done: Boolean(profile.college?.trim() && profile.branch?.trim()),
  },
  {
    label: 'Career goals selected',
    done: (profile.aims?.length ?? 0) > 0 || (profile.preferredPaths?.length ?? 0) > 0,
  },
  {
    label: `Skills added (${profile.skills?.length ?? 0})`,
    done: (profile.skills?.length ?? 0) > 0,
  },
  {
    label: 'Resume uploaded & parsed',
    done: hasUploadedResume(profile),
  },
  {
    label: 'Preferred companies chosen',
    done: (profile.preferredCompanies?.length ?? 0) > 0,
  },
];

export { buildPlacementBreakdown, recalculateReadiness } from '../lib/placementReadiness';

const PROFICIENCY_PERCENT = {
  Beginner: 35,
  Intermediate: 60,
  Advanced: 85,
  Expert: 95,
  Verified: 100,
};

const SKILL_BAR_COLORS = [
  'from-amber-500 to-orange-400',
  'from-blue-500 to-indigo-500',
  'from-orange-500 to-red-400',
  'from-cyan-500 to-teal-500',
  'from-emerald-500 to-green-400',
  'from-purple-500 to-pink-400',
  'from-rose-500 to-orange-400',
  'from-indigo-500 to-violet-500',
];

export function proficiencyToPercent(level) {
  return PROFICIENCY_PERCENT[level] ?? 25;
}

/** Build skill verification bars from Supabase profile.skills + skills_proficiency */
export function getSkillVerificationEntries(profile) {
  const skills = profile.skills ?? [];
  if (skills.length === 0) return [];

  const verifiedTopics = new Set(
    (profile.badges ?? [])
      .filter((b) => b.id?.includes('_verified'))
      .map((b) => b.name?.replace(' Master', ''))
  );

  return skills.slice(0, 8).map((skill, idx) => {
    const level = profile.skillsProficiency?.[skill];
    let val = level ? proficiencyToPercent(level) : 30;
    if (verifiedTopics.has(skill) || profile.badges?.some((b) => b.name?.includes(skill))) {
      val = Math.min(100, val + 15);
    }
    return {
      name: skill,
      val: Math.min(100, val),
      level: level || (val >= 70 ? 'Tracked' : 'Listed'),
      color: SKILL_BAR_COLORS[idx % SKILL_BAR_COLORS.length],
    };
  });
}

export {
  CAREER_PATHS,
  CODING_CHALLENGES,
  APTITUDE_QUESTIONS,
  HR_QUESTIONS,
  TECH_QUIZZES,
  MOCK_INTERNSHIPS,
  CHATBOT_REPLIES
};
