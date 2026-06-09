package com.careerpilot.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAIClientService {

    @Value("${careerpilot.openai.api-key}")
    private String apiKey;

    @Value("${careerpilot.openai.model}")
    private String model;

    @Value("${careerpilot.openai.endpoint-url}")
    private String endpointUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateChatCompletion(String userMessage) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.startsWith("YOUR_")) {
            return "{\"error\": \"OpenAI/OpenRouter API key is not configured.\"}";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            // OpenRouter optional tracking headers
            headers.set("HTTP-Referer", "http://localhost:8080"); 
            headers.set("X-Title", "CareerPilot AI");

            // Format standard OpenAI Chat completions payload
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);

            Map<String, String> messageMap = new HashMap<>();
            messageMap.put("role", "user");
            messageMap.put("content", userMessage);

            requestBody.put("messages", Collections.singletonList(messageMap));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                endpointUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                return "{\"error\": \"Failed to contact OpenRouter: Status Code " + response.getStatusCodeValue() + "\"}";
            }

        } catch (Exception e) {
            return "{\"error\": \"AI request exception: " + e.getMessage() + "\"}";
        }
    }
}
