
package com.esg.esgreporting.controller;

import com.esg.esgreporting.service.MetricCalculationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/calculations")
public class CalculationController {

    private final MetricCalculationService calculationService;

    public CalculationController(
            MetricCalculationService calculationService) {
        this.calculationService = calculationService;
    }

    @PostMapping("/emissions")
    public Map<String, Double> calculateEmissions(
            @RequestBody Map<String, Double> input) {

        try {
            double total = calculationService.calculateEmissionTotal(
                    input.get("scope1"),
                    input.get("scope2"),
                    input.get("scope3"));

            return Map.of("totalEmissions", total);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/recycling-rate")
    public Map<String, Double> calculateRecyclingRate(
            @RequestBody Map<String, Double> input) {

        try {
            double rate = calculationService.calculateRecyclingRate(
                    input.get("recycledWaste"),
                    input.get("totalWaste"));

            return Map.of("recyclingRate", rate);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/turnover-rate")
    public Map<String, Double> calculateTurnoverRate(
            @RequestBody Map<String, Double> input) {

        try {
            double rate = calculationService.calculateEmployeeTurnoverRate(
                    input.get("employeesLeft"),
                    input.get("averageHeadcount"));

            return Map.of("turnoverRate", rate);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/training-rate")
    public Map<String, Double> calculateTrainingRate(
            @RequestBody Map<String, Double> input) {

        try {
            double rate = calculationService.calculateTrainingCompletionRate(
                    input.get("employeesTrained"),
                    input.get("totalEmployees"));

            return Map.of("trainingCompletionRate", rate);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
