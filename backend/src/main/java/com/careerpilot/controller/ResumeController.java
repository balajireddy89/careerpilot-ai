package com.careerpilot.controller;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@RestController
@RequestMapping("/resume")
@CrossOrigin(origins = "*")
public class ResumeController {

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeResume(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        
        if (file.isEmpty()) {
            result.put("error", "Uploaded file is empty");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }

        try {
            String filename = file.getOriginalFilename();
            String extractedText = "";

            // Parse PDF vs Word files
            if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
                try (InputStream is = file.getInputStream();
                     PDDocument document = PDDocument.load(is)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    extractedText = stripper.getText(document);
                }
            } else if (filename != null && (filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc"))) {
                try (InputStream is = file.getInputStream();
                     XWPFDocument doc = new XWPFDocument(is)) {
                    XWPFWordExtractor extractor = new XWPFWordExtractor(doc);
                    extractedText = extractor.getText();
                }
            } else {
                result.put("error", "Unsupported file format. Please upload PDF or DOCX.");
                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(result);
            }

            // Perform simple keyword scanner heuristics
            List<String> targetKeywords = Arrays.asList("Java", "Spring Boot", "SQL", "React", "JavaScript", "REST APIs", "Git", "Docker");
            List<String> detectedKeywords = new ArrayList<>();
            List<String> missingKeywords = new ArrayList<>();

            for (String kw : targetKeywords) {
                if (extractedText.toLowerCase().contains(kw.toLowerCase())) {
                    detectedKeywords.add(kw);
                } else {
                    missingKeywords.add(kw);
                }
            }

            // Scoring math
            int keywordScore = (int) (((double) detectedKeywords.size() / targetKeywords.size()) * 100);
            int formattingScore = extractedText.length() > 500 ? 90 : 50; // simple length heuristic
            int overallScore = (int) ((keywordScore * 0.5) + (formattingScore * 0.5));

            result.put("fileName", filename);
            result.put("score", overallScore);
            result.put("atsScore", Math.max(40, overallScore - 5));
            result.put("formattingScore", formattingScore);
            result.put("keywordsScore", keywordScore);
            result.put("detectedKeywords", detectedKeywords);
            result.put("missingKeywords", missingKeywords);
            
            List<String> suggestions = new ArrayList<>();
            if (missingKeywords.contains("React")) {
                suggestions.add("Add React framework experience to align with Web Development goals.");
            }
            if (missingKeywords.contains("Docker")) {
                suggestions.add("Incorporate DevOps keywords like Docker or CI/CD paths.");
            }
            suggestions.add("Use strong action verbs to highlight project responsibilities.");
            result.put("suggestions", suggestions);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("error", "Failed to parse document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
