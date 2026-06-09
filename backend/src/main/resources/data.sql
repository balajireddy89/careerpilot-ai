-- Seed Database with Initial CareerPilot AI configurations

-- Seed default Admin and Student accounts (Passwords are pre-hashed for 'admin123' and 'student123')
INSERT INTO users (name, email, password, role) 
VALUES ('System Admin', 'admin@careerpilot.ai', '$2a$10$tMhlyxexL.T9wGomWj.cNu.H0aD8yL1yQ.tD/q28j5tMszU.T562q', 'ADMIN')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO users (name, email, password, role) 
VALUES ('Balaji Reddy', 'balaji.reddy@college.edu', '$2a$10$tMhlyxexL.T9wGomWj.cNu.H0aD8yL1yQ.tD/q28j5tMszU.T562q', 'STUDENT')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Student Profile for Balaji
INSERT INTO student_profiles (user_id, college, graduation_year, target_role, profile_completion, daily_streak, points, resume_score, ats_score, coding_score, aptitude_score, hr_interview_score)
VALUES (2, 'National Institute of Technology', 2027, 'Full Stack Developer', 80, 5, 1250, 74, 71, 720, 75, 78)
ON DUPLICATE KEY UPDATE id=id;

-- Seed default skills
INSERT INTO skills (student_profile_id, skill_name) VALUES (1, 'Java'), (1, 'HTML'), (1, 'CSS'), (1, 'SQL');

-- Seed coding problems
INSERT INTO coding_challenges (title, difficulty, category, description, input_format, output_format, sample_input, sample_output, template_java, template_python, template_js)
VALUES (
    'Reverse a String', 'Easy', 'Strings', 
    'Write a function that reverses a string. The input string is given as an array of characters.', 
    'char[] s', 'void (modify s in-place)', '["h","e","l","l","o"]', '["o","l","l","e","h"]',
    'public class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}',
    'class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        # Write your code here\n        pass',
    'function reverseString(s) {\n    // Write your code here\n}'
),
(
    'Two Sum', 'Easy', 'Arrays',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    'int[] nums, int target', 'int[] (array of 2 indices)', 'nums = [2,7,11,15], target = 9', '[0,1]',
    'public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}',
    'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        return []',
    'function twoSum(nums, target) {\n    return [];\n}'
);

-- Seed aptitude assessments
INSERT INTO aptitude_questions (category, question, option_a, option_b, option_c, option_d, answer, explanation)
VALUES (
    'quantitative', 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
    '120 metres', '150 metres', '324 metres', '180 metres', '150 metres',
    'Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of train = Speed * Time = (50/3) * 9 = 150 metres.'
),
(
    'logical', 'Look at this series: 36, 34, 30, 28, 24, ... What number should come next?',
    '20', '22', '23', '26', '22',
    'This is an alternating subtraction series: -2, -4, -2, -4. 36-2=34, 34-4=30, 30-2=28, 28-4=24, 24-2=22.'
);
