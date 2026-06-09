-- CareerPilot AI Schema Definition

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    college VARCHAR(150),
    graduation_year INT,
    target_role VARCHAR(100),
    profile_completion INT DEFAULT 0,
    daily_streak INT DEFAULT 0,
    points INT DEFAULT 0,
    resume_score INT DEFAULT 0,
    ats_score INT DEFAULT 0,
    coding_score INT DEFAULT 0,
    aptitude_score INT DEFAULT 0,
    hr_interview_score INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_profile_id BIGINT NOT NULL,
    skill_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coding_challenges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    description TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    sample_input TEXT,
    sample_output TEXT,
    template_java TEXT,
    template_python TEXT,
    template_js TEXT
);

CREATE TABLE IF NOT EXISTS aptitude_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255),
    option_d VARCHAR(255),
    answer VARCHAR(255) NOT NULL,
    explanation TEXT
);
