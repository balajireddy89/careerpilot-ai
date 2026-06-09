package com.careerpilot.controller;

import com.careerpilot.model.StudentProfile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/students")
@CrossOrigin(origins = "*")
public class StudentController {

    // Simulating database endpoints for the client
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getStudentProfile() {
        Map<String, Object> mockProfile = new HashMap<>();
        mockProfile.put("name", "Balaji Reddy");
        mockProfile.put("email", "balaji.reddy@college.edu");
        mockProfile.put("college", "National Institute of Technology");
        mockProfile.put("graduationYear", 2027);
        mockProfile.put("targetRole", "Full Stack Developer");
        mockProfile.put("profileCompletion", 80);
        mockProfile.put("dailyStreak", 5);
        mockProfile.put("points", 1250);
        mockProfile.put("skills", Arrays.asList("Java", "HTML", "CSS", "SQL"));
        
        return ResponseEntity.ok(mockProfile);
    }

    @PostMapping("/skills")
    public ResponseEntity<Map<String, Object>> addSkill(@RequestBody Map<String, String> payload) {
        String skillName = payload.get("skill");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Skill '" + skillName + "' added to catalog.");
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/target-role")
    public ResponseEntity<Map<String, Object>> updateTargetRole(@RequestBody Map<String, String> payload) {
        String targetRole = payload.get("targetRole");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("targetRole", targetRole);
        
        return ResponseEntity.ok(response);
    }
}
