#include "CSVReader.h"
#include <fstream>
#include <iostream>
#include <sstream>

CSVReader::CSVReader()
{
}

std::vector<std::vector<std::string>> CSVReader::LoadCSVData(std::string csvFile){
    // Define a 2D array to store the CSV data
    std::vector<std::vector<std::string>> data;
    std::string line, cell;
    int count = 0;
    // Store the CSV data from the CSV file to the 2D array
    std::ifstream dataFile{csvFile};
    if (dataFile.is_open()){    

        // std::cout << "CSV has been opened" << std::endl;

        while (std::getline(dataFile, line)) {
            std::vector<std::string> row;
            std::stringstream linestream(line);
            while (std::getline(linestream, cell, ',')) {
                row.push_back(cell);
            }
            data.push_back(row);
            count++;
        }

        // close the file after read opeartion is complete
        dataFile.close();
        std::cout << "Number of rows processed : " << count << std::endl;
        std::cout << "CSV has been closed." << std::endl;
        std::cout << "Temperature Data has been loaded." << std::endl;

        std::cout << "First 5 rows of the data:" << std::endl;
        for (int i = 0; i < std::min(5, static_cast<int>(data.size())); ++i) {
            for (const auto& cell : data[i]) {
                std::cout << cell << " ";
            }
            std::cout << std::endl;
        }
    }
    return data;
}