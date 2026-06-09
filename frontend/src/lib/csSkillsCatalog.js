/** CS skills & subjects for autocomplete — grouped for display */
export const CS_SKILL_CATEGORIES = {
  Frontend: [
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js',
  ],
  Backend: [
    'Node.js', 'Express.js', 'RESTful API design', 'GraphQL', 'Python', 'Java', 'C++', 'C', 'C#', 'Spring Boot',
  ],
  Databases: [
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'DBMS',
  ],
  'DevOps & Infrastructure': [
    'Git version control', 'Docker containerization', 'CI/CD pipelines', 'GitHub Actions', 'Jenkins',
    'AWS', 'Azure', 'GCP', 'Kubernetes', 'Linux',
  ],
  'Testing & Security': [
    'Jest', 'Mocha', 'Cypress', 'Unit testing', 'Web security fundamentals',
  ],
  'Core Theory & Systems': [
    'Data Structures and Algorithms (DSA)', 'Operating Systems (OS)', 'Computer Networks',
    'Computer Organization and Architecture (COA)', 'Compiler Design', 'Theory of Computation',
  ],
  Mathematics: [
    'Discrete Mathematics', 'Linear Algebra', 'Calculus', 'Probability and Statistics',
  ],
  'Project Management': [
    'Agile/Scrum development process',
  ],
  'AI & Data': [
    'Machine Learning', 'Deep Learning', 'Data Science', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch',
  ],
};

export const ALL_CS_SKILLS = Object.values(CS_SKILL_CATEGORIES).flat();

export const TECH_INTERVIEW_TOPICS = [
  'Java',
  'Python',
  'JavaScript',
  'Databases & SQL',
  'Data Structures & Algorithms',
  'Operating Systems',
  'Computer Networks',
  'System Design',
  'Web Development',
  'DevOps & Cloud',
  'Machine Learning',
  'C++',
];

export function filterSkillSuggestions(query, existingSkills = []) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const existing = new Set(existingSkills.map((s) => s.toLowerCase()));
  return ALL_CS_SKILLS.filter(
    (skill) => skill.toLowerCase().includes(q) && !existing.has(skill.toLowerCase())
  ).slice(0, 8);
}
