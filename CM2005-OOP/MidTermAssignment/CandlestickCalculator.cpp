#include "CandlestickCalculator.h"
#include "Candlestick.h"
#include <iostream>
#include <vector>
#include <map>

CandlestickCalculator::CandlestickCalculator(){

}

void CandlestickCalculator::CandlestickYear(std::vector<std::vector<std::string>> data, int column){
    std::map<std::string, double> ValuesPerYear;
    std::cout << "Printing Values for column number :" << column << std::endl;

    // Start from the 2nd row of csv file as 1st is column names
    for (int i = 1; i < data.size(); ++i) {
         // Takes first column values as timestamps for checking
        std::string timestamp = data[i][0];
        // Gets year value from timestamp
        std::string year = timestamp.substr(0, 4);
        double value = 0;
        if (data[i].size() > column) {           
            value = std::stod(data[i][column]);
            ValuesPerYear[year] += value;            
        }
    }
        // Print the summed values for each year
    for (const auto& pair : ValuesPerYear) {
        std::cout << "Year: " << pair.first << " Total Value: " << pair.second << std::endl;
    }
}