#pragma once

#include <string>
#include <vector>

class CSVReader
{
    public:
        CSVReader();
        static std::vector<std::vector<std::string>> LoadCSVData(std::string csvFile);  
          

    private:

     
};