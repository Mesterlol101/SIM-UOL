#include "CandlestickCalculator.h"
#include "Candlestick.h"
#include "CSVReader.h"
#include <iostream>
#include <vector>
#include <map>
#include <limits>
#include <iomanip>
#include <cmath>

CandlestickCalculator::CandlestickCalculator(){
}

// std::vector<Candlestick> CandlestickCalculator::CandlestickYear(std::vector<std::vector<std::string>> data, int column){
//     // Make maps for different candletick values, has entries per month as number of days per year can vary (Leap years are 366 days long instead of 365)
//     std::map<std::string, double> SumOfValuesPerYear;
//     std::map<std::string, int>    EntriesPerYear;
//     std::map<std::string, double> HighestTempInYear;
//     std::map<std::string, double> LowestTempInYear;

//     // Initialize highest and lowest values
//     for (const auto& row : data) {
//         if (row.size() > column) {
//             std::string year = row[0].substr(0, 4);
//             // Highest and lowest set to extreme values to ensure it dosent get missed
//             HighestTempInYear[year] = -100;
//             LowestTempInYear[year] = 100;
//         }
//     }

//     // Start from the 2nd row of csv file as 1st is column names
//     for (int i = 1; i < data.size(); ++i) {
//         if (data[i].size() > column) {
//             // Getting timestamp from 1st column of data
//             std::string timestamp = data[i][0];

//             // For checking which year the data belongs to
//             std::string year = timestamp.substr(0, 4);

//             double temperature = std::stod(data[i][column]);
//             SumOfValuesPerYear[year] += temperature;
//             EntriesPerYear[year]++;

//             // Check if value is highest or lowest for the year
//             if (temperature > HighestTempInYear[year]) {
//                 HighestTempInYear[year] = temperature;
//             }
//             if (temperature < LowestTempInYear[year]) {
//                 LowestTempInYear[year] = temperature;
//             }

//         }
//     }

//     // Calculate the open and close values for each year
//     std::map<std::string, double> OpenCloseValuesPerYear;
//     for (const auto& pair : SumOfValuesPerYear) {
//         OpenCloseValuesPerYear[pair.first] = pair.second / EntriesPerYear[pair.first];
//     }

//     // Create a vector of Candlestick objects
//     std::vector<Candlestick> candlesticks;
//     // Variable to store the close value for the next row's open value
//     std::string previousYear;
//     for (const auto& year : SumOfValuesPerYear) {
//         // For the first row only as there will be no previous Close
//         std::string openValue = previousYear.empty() ? "Null    " : std::to_string(OpenCloseValuesPerYear[previousYear]);
//         // Creating Candlestick object from data
//         Candlestick candlestick(year.first, openValue,  HighestTempInYear[year.first], LowestTempInYear[year.first], OpenCloseValuesPerYear[year.first]);
//         // Adding Candlestick object to vector
//         candlesticks.push_back(candlestick);

//         // Setting previous year to current year for Open value in next row
//         previousYear = year.first;
//     }

//     return candlesticks;
// }

// Only this one is needed now as it can be used for all frequencies
std::vector<Candlestick> CandlestickCalculator::CandlestickRange(std::vector<std::vector<std::string>> data, int column, std::string startDate, std::string endDate, int frequency) {
    // Make maps for different candlestick values
    std::map<std::string, double> SumOfValuesPerRange;
    std::map<std::string, int>    EntriesPerRange;
    std::map<std::string, double> HighestTempInRange;
    std::map<std::string, double> LowestTempInRange;

    // Initialize highest and lowest values
    for (const auto& row : data) {
        if (row.size() > column) {
            std::string date;
            if (frequency == 1) {
                date = row[0].substr(0, 4); // Yearly
            } else if (frequency == 2) {
                date = row[0].substr(0, 7); // Monthly
            } else {
                date = row[0].substr(0, 10); // Daily
            }

            if ((startDate.empty() || date >= startDate) && (endDate.empty() || date <= endDate)) {
                // Highest and lowest set to extreme values to ensure it doesn't get missed
                HighestTempInRange[date] = -100;
                LowestTempInRange[date] = 100;
            }
        }
    }

    // Start from the 2nd row of csv file as 1st is column names
    for (int i = 1; i < data.size(); ++i) {
        if (data[i].size() > column) {
            // Get timestamp from 1st column
            std::string timestamp = data[i][0];
            std::string date;
            if (frequency == 1) {
                date = timestamp.substr(0, 4); // Yearly
            } else if (frequency == 2) {
                date = timestamp.substr(0, 7); // Monthly
            } else {
                date = timestamp.substr(0, 10); // Daily
            }

            if ((startDate.empty() || date >= startDate) && (endDate.empty() || date <= endDate)) {
                double temperature = std::stod(data[i][column]);
                SumOfValuesPerRange[date] += temperature;
                EntriesPerRange[date]++;

                // Check if value is highest or lowest for the date
                if (temperature > HighestTempInRange[date]) {
                    HighestTempInRange[date] = temperature;
                }
                if (temperature < LowestTempInRange[date]) {
                    LowestTempInRange[date] = temperature;
                }
            }
        }
    }

    // Calculate the mean values for each date
    std::map<std::string, double> OpenCloseValuesPerRange;
    for (const auto& pair : SumOfValuesPerRange) {
        OpenCloseValuesPerRange[pair.first] = pair.second / EntriesPerRange[pair.first];
    }

    // Create a vector of Candlestick objects
    std::vector<Candlestick> candlesticks;
    std::string previousDate;
    for (const auto& date : SumOfValuesPerRange) {
        // For the first row only as there will be no previous Close
        std::string openValue = previousDate.empty() ? "Null    " : std::to_string(OpenCloseValuesPerRange[previousDate]);

        // Creating Candlestick object from data
        Candlestick candlestick(date.first, openValue, HighestTempInRange[date.first], LowestTempInRange[date.first], OpenCloseValuesPerRange[date.first]);

        // Adding Candlestick object to vector
        candlesticks.push_back(candlestick);

        // Setting previous date to current date for Open value in next row
        previousDate = date.first;
    }

    return candlesticks;
}

void CandlestickCalculator::printCandlestickPlot(std::vector<Candlestick> candlesticks) {

    int overallLow = round(candlesticks[0].getLow());
    int overallHigh = round(candlesticks[0].getHigh());

    // Find overall low and high values
    for (const auto& candlestick : candlesticks) {
        if (round(candlestick.getLow()) < overallLow) overallLow = round(candlestick.getLow());
        if (round(candlestick.getHigh()) > overallHigh) overallHigh = round(candlestick.getHigh());
    }

    // +-5 as leeway
    overallLow -= 5;
    overallHigh += 5;

    // Print the candlestick data
    std::cout << "Number |> represents the Low value, Number | represents the Close value,  | Number represents the Open value,  <| Number represents the High value" << std::endl;
    for (int row = 0; row < candlesticks.size(); ++row) {
        // Print the year value with line separator
        std::cout << candlesticks[row].getDate() << " | "; 
        for (int i = overallLow; i <= overallHigh; ++i) {
            if (row == 0) {
                if(i == round(candlesticks[row].getLow())) {
                    std::cout << " " << candlesticks[row].getLow() << " |>  ";
                } 
                if(i == round(candlesticks[row].getClose())) {
                    std::cout << " " << candlesticks[row].getClose() << " | ";
                } 
                if(i == round(candlesticks[row].getHigh())) {
                    std::cout << " " << candlesticks[row].getHigh() << "  <| ";
                } 
            } else {
                if(i == round(candlesticks[row].getLow())) {
                    std::cout << " " << candlesticks[row].getLow() << " |>  ";
                } 
                if(i == round(candlesticks[row].getClose())) {
                    std::cout << " " << candlesticks[row].getClose() << " | ";
                } 
                if(i == round(std::stod(candlesticks[row].getOpen()))) {
                    std::cout << " | " << candlesticks[row].getOpen() << " ";
                } 
                if(i == round(candlesticks[row].getHigh())) {
                    std::cout << "  <| " << candlesticks[row].getHigh() << " ";
                } 
            }
        }
        std::cout << std::endl;
    }
    std::cout << std::endl;
}