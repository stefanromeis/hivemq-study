package com.hivemqstudy.backend.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * POST /api/weather/summary
 * Accepts a city name + hourly weather snapshot, proxies to Groq (Llama 3)
 * for a natural-language weather summary with status assessment.
 */
@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = {"http://localhost:3000"})
public class WeatherSummaryController {

    private static final Logger log = LoggerFactory.getLogger(WeatherSummaryController.class);

    private final RestClient groq;

    public WeatherSummaryController(
            @Value("${groq.api-key:}") String apiKey) {
        this.groq = RestClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public record SummaryRequest(
            @NotBlank String city,
            @NotNull WeatherSnapshot weather) {
    }

    public record WeatherSnapshot(
            List<String> time,
            List<Double> temperature_2m,
            List<Double> relative_humidity_2m,
            List<Double> apparent_temperature,
            List<Double> precipitation,
            List<Integer> weather_code,
            List<Double> wind_speed_10m,
            List<Double> cloud_cover) {
    }

    public record SummaryResponse(String summary, String status) {
    }

    @PostMapping("/summary")
    public SummaryResponse summary(@RequestBody SummaryRequest req) {
        String prompt = buildPrompt(req);

        var body = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt()),
                        Map.of("role", "user", "content", prompt)),
                "temperature", 0.3,
                "max_tokens", 400);

        GroqResponse response = groq.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(GroqResponse.class);

        if (response == null || response.choices().isEmpty()) {
            log.warn("Empty Groq response for {}", req.city());
            return new SummaryResponse("Unable to generate summary.", "green");
        }

        String text = response.choices().get(0).message().content().trim();

        // Extract status from the text (model is instructed to include it)
        String status = "green";
        String lower = text.toLowerCase();
        if (lower.contains("[red]") || lower.contains("status: red")) {
            status = "red";
        } else if (lower.contains("[orange]") || lower.contains("status: orange")) {
            status = "orange";
        }

        // Clean the status markers from the visible text
        String cleanText = text
                .replaceAll("(?i)\\[(?:red|orange|green)]", "")
                .replaceAll("(?i)status:\\s*(?:red|orange|green)", "")
                .trim();

        return new SummaryResponse(cleanText, status);
    }

    private String systemPrompt() {
        return """
                You are a concise weather analyst. Given 24-hour hourly weather data for a city, \
                write a 2-3 sentence natural-language summary suitable for a dashboard. \
                Highlight anything unusual: extreme temperatures, heavy precipitation, strong winds, \
                or thunderstorms. If everything looks normal, say so.
                
                End your response with exactly one of these status tags on its own line:
                [green] — all normal, no concerns
                [orange] — some caution warranted (e.g. moderate rain, high heat, fog)
                [red] — severe weather alert (e.g. storms, extreme heat/cold, heavy rain >10mm/h, gales)
                """;
    }

    private String buildPrompt(SummaryRequest req) {
        var w = req.weather();
        var sb = new StringBuilder();
        sb.append("City: ").append(req.city()).append("\n\n");
        sb.append("Hourly data (24h):\n");
        sb.append("Time | Temp(°C) | Feels(°C) | Humidity(%) | Precip(mm) | Wind(km/h) | Clouds(%) | WMO\n");

        int n = Math.min(w.time().size(), 24);
        for (int i = 0; i < n; i++) {
            sb.append(String.format("%s | %.1f | %.1f | %.0f | %.1f | %.0f | %.0f | %d\n",
                    w.time().get(i),
                    w.temperature_2m().get(i),
                    w.apparent_temperature().get(i),
                    w.relative_humidity_2m().get(i),
                    w.precipitation().get(i),
                    w.wind_speed_10m().get(i),
                    w.cloud_cover().get(i),
                    w.weather_code().get(i)));
        }
        return sb.toString();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record GroqResponse(List<Choice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(Message message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Message(String content) {
    }
}
