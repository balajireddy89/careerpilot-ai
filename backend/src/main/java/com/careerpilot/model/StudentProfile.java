package com.careerpilot.model;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String college;
    
    @Column(name = "graduation_year")
    private Integer graduationYear;
    
    @Column(name = "target_role")
    private String targetRole;
    
    @Column(name = "profile_completion")
    private Integer profileCompletion = 0;
    
    @Column(name = "daily_streak")
    private Integer dailyStreak = 0;
    
    private Integer points = 0;
    
    @Column(name = "resume_score")
    private Integer resumeScore = 0;
    
    @Column(name = "ats_score")
    private Integer atsScore = 0;
    
    @Column(name = "coding_score")
    private Integer codingScore = 0;
    
    @Column(name = "aptitude_score")
    private Integer aptitudeScore = 0;
    
    @Column(name = "hr_interview_score")
    private Integer hrInterviewScore = 0;

    // Additional Profile fields from Wizard
    private String phone;
    private String degree;
    private String branch;
    
    @Column(name = "current_year")
    private String currentYear;
    
    private String cgpa;
    
    @Column(name = "work_type")
    private String workType = "Hybrid";
    
    @Column(name = "weekly_hours")
    private String weeklyHours = "10-20";

    @ElementCollection
    @CollectionTable(name = "skills", joinColumns = @JoinColumn(name = "student_profile_id"))
    @Column(name = "skill_name")
    private List<String> skills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "student_aims", joinColumns = @JoinColumn(name = "student_profile_id"))
    @Column(name = "aim_name")
    private List<String> aims = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "preferred_paths", joinColumns = @JoinColumn(name = "student_profile_id"))
    @Column(name = "path_name")
    private List<String> preferredPaths = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "preferred_companies", joinColumns = @JoinColumn(name = "student_profile_id"))
    @Column(name = "company_name")
    private List<String> preferredCompanies = new ArrayList<>();

    // Coding Ratings
    @Column(name = "rating_dsa")
    private Integer ratingDsa = 1;
    
    @Column(name = "rating_algorithms")
    private Integer ratingAlgorithms = 1;
    
    @Column(name = "rating_problem_solving")
    private Integer ratingProblemSolving = 1;

    // HR Ratings
    @Column(name = "rating_confidence")
    private Integer ratingConfidence = 1;
    
    @Column(name = "rating_public_speaking")
    private Integer ratingPublicSpeaking = 1;
    
    @Column(name = "rating_communication")
    private Integer ratingCommunication = 1;
    
    @Column(name = "rating_english_proficiency")
    private Integer ratingEnglishProficiency = 1;

    // Default Constructor
    public StudentProfile() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public Integer getGraduationYear() { return graduationYear; }
    public void setGraduationYear(Integer graduationYear) { this.graduationYear = graduationYear; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Integer getProfileCompletion() { return profileCompletion; }
    public void setProfileCompletion(Integer profileCompletion) { this.profileCompletion = profileCompletion; }

    public Integer getDailyStreak() { return dailyStreak; }
    public void setDailyStreak(Integer dailyStreak) { this.dailyStreak = dailyStreak; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Integer getResumeScore() { return resumeScore; }
    public void setResumeScore(Integer resumeScore) { this.resumeScore = resumeScore; }

    public Integer getAtsScore() { return atsScore; }
    public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }

    public Integer getCodingScore() { return codingScore; }
    public void setCodingScore(Integer codingScore) { this.codingScore = codingScore; }

    public Integer getAptitudeScore() { return aptitudeScore; }
    public void setAptitudeScore(Integer aptitudeScore) { this.aptitudeScore = aptitudeScore; }

    public Integer getHrInterviewScore() { return hrInterviewScore; }
    public void setHrInterviewScore(Integer hrInterviewScore) { this.hrInterviewScore = hrInterviewScore; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getCurrentYear() { return currentYear; }
    public void setCurrentYear(String currentYear) { this.currentYear = currentYear; }

    public String getCgpa() { return cgpa; }
    public void setCgpa(String cgpa) { this.cgpa = cgpa; }

    public String getWorkType() { return workType; }
    public void setWorkType(String workType) { this.workType = workType; }

    public String getWeeklyHours() { return weeklyHours; }
    public void setWeeklyHours(String weeklyHours) { this.weeklyHours = weeklyHours; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<String> getAims() { return aims; }
    public void setAims(List<String> aims) { this.aims = aims; }

    public List<String> getPreferredPaths() { return preferredPaths; }
    public void setPreferredPaths(List<String> preferredPaths) { this.preferredPaths = preferredPaths; }

    public List<String> getPreferredCompanies() { return preferredCompanies; }
    public void setPreferredCompanies(List<String> preferredCompanies) { this.preferredCompanies = preferredCompanies; }

    public Integer getRatingDsa() { return ratingDsa; }
    public void setRatingDsa(Integer ratingDsa) { this.ratingDsa = ratingDsa; }

    public Integer getRatingAlgorithms() { return ratingAlgorithms; }
    public void setRatingAlgorithms(Integer ratingAlgorithms) { this.ratingAlgorithms = ratingAlgorithms; }

    public Integer getRatingProblemSolving() { return ratingProblemSolving; }
    public void setRatingProblemSolving(Integer ratingProblemSolving) { this.ratingProblemSolving = ratingProblemSolving; }

    public Integer getRatingConfidence() { return ratingConfidence; }
    public void setRatingConfidence(Integer ratingConfidence) { this.ratingConfidence = ratingConfidence; }

    public Integer getRatingPublicSpeaking() { return ratingPublicSpeaking; }
    public void setRatingPublicSpeaking(Integer ratingPublicSpeaking) { this.ratingPublicSpeaking = ratingPublicSpeaking; }

    public Integer getRatingCommunication() { return ratingCommunication; }
    public void setRatingCommunication(Integer ratingCommunication) { this.ratingCommunication = ratingCommunication; }

    public Integer getRatingEnglishProficiency() { return ratingEnglishProficiency; }
    public void setRatingEnglishProficiency(Integer ratingEnglishProficiency) { this.ratingEnglishProficiency = ratingEnglishProficiency; }
}
