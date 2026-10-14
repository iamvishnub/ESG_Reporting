

package com.esg.esgreporting.service;

import org.springframework.stereotype.Service;

@Service
public class MetricCalculationService {

    public double calculateEmissionTotal(
            Double scope1,
            Double scope2,
            Double scope3) {

        return safeValue(scope1)
                + safeValue(scope2)
                + safeValue(scope3);
    }

    public double calculateRecyclingRate(
            Double recycledWaste,
            Double totalWaste) {

        if (recycledWaste == null || totalWaste == null
                || totalWaste <= 0
                || recycledWaste < 0
                || recycledWaste > totalWaste) {
            throw new IllegalArgumentException(
                    "Recycled waste must be between zero and total waste.");
        }

        return (recycledWaste / totalWaste) * 100.0;
    }

    public double calculateEmployeeTurnoverRate(
            Double employeesLeft,
            Double averageHeadcount) {

        if (employeesLeft == null || averageHeadcount == null
                || employeesLeft < 0
                || averageHeadcount <= 0
                || employeesLeft > averageHeadcount) {
            throw new IllegalArgumentException(
                    "Invalid employee turnover inputs.");
        }

        return (employeesLeft / averageHeadcount) * 100.0;
    }

    public double calculateTrainingCompletionRate(
            Double employeesTrained,
            Double totalEmployees) {

        if (employeesTrained == null || totalEmployees == null
                || employeesTrained < 0
                || totalEmployees <= 0
                || employeesTrained > totalEmployees) {
            throw new IllegalArgumentException(
                    "Invalid training completion inputs.");
        }

        return (employeesTrained / totalEmployees) * 100.0;
    }

    private double safeValue(Double value) {
        if (value == null) {
            return 0.0;
        }

        if (!Double.isFinite(value) || value < 0) {
            throw new IllegalArgumentException(
                    "Values must be finite and non-negative.");
        }

        return value;
    }
}
