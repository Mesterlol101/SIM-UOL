#include "AppMain.h"
#include "CSVReader.h"
#include "CandlestickCalculator.h"
#include "CandlestickPrediction.h"
#include <iostream>
#include <iomanip>
#include <regex>
#include <string>

AppMain::AppMain()
{
}

void AppMain::init()
{
    int input;
    while (true)
    {
        printMenu();
        input = getMenuOption();
        processUserOption(input);
    }
}

void AppMain::printMenu()
{
    // 1 : print yearly data
    std::cout << "1: Print Yearly Candlestick data" << std::endl;
    // 2 : print monthly data
    std::cout << "2: Print Monthly Candlestick data" << std::endl;
    // 3 : print daily data
    std::cout << "3: Print Daily Candlestick data " << std::endl;
    // 4 : print data from user preferences
    std::cout << "4: Print Candlestick data for given range and frequency" << std::endl;
    // 5 : print Actual close value and prediction close value from user preferences
    std::cout << "5: Use linear regression with moving average to predict temperature for given range and frequency" << std::endl;

    std::cout << "============== " << std::endl;

}

int AppMain::getMenuOption()
{
    int userOption = 0;
    std::string line;
    std::cout << "Type in 1-5" << "\n" << std::endl;
    getline(std::cin, line);
    try
    {
        userOption = stoi(line);
    }
    catch (const std::exception &e)
    {
        //
    }
    std::cout << "You chose: " <<  userOption << "\n" <<std::endl;
    return userOption;
}

int AppMain::getCountryOption()
{
    int userOption = 0;
    std::string line;
    std::cout << "Type in 1-27" << "\n" <<std::endl;
    getline(std::cin, line);
    try
    {
        userOption = stoi(line);
    }
    catch (const std::exception &e)
    {
        std::cout << "Please enter a number" << "\n" << std::endl;
    }
    if (userOption >= 1 && userOption <= 27)
    {
        std::cout << "You chose: " << userOption << "\n" << std::endl;
        return userOption;
    }else{
        std::cout << "Invalid choice. Please type in a number from 1-27" << "\n" << std::endl;
        getCountryOption();
    }
    return 1;
}

int AppMain::getFrequencyOption()
{
    int userOption = 0;
    std::string line;
    std::cout << "Type a number between 1-3. 1 : Yearly, 2 : Monthly, 3 : Daily" << "\n" <<std::endl;
    getline(std::cin, line);
    try
    {
        userOption = stoi(line);
    }
    catch (const std::exception &e)
    {
        std::cout << "Please enter a number" << "\n" << std::endl;
    }
    if (userOption >= 1 && userOption <= 3)
    {
        std::cout << "You chose: " << userOption << "\n" << std::endl;
        return userOption;
    }else{
        std::cout << "Invalid choice. Please type in a number from 1-3" << "\n" << std::endl;
        getFrequencyOption();
    }
    return 1;
}

std::string AppMain::getStartDate()
{
    // Use regex to check if user input is in usable date format
    // 3 different regex for different dates
    std::string date;
    std::regex Year("\\d{4}");
    std::regex Month("\\d{4}-\\d{2}");
    std::regex Full("\\d{4}-\\d{2}-\\d{2}");
    
    while (true)
    {
        std::cout << "Please enter a date from 1980-2019 (YYYY, YYYY-MM, or YYYY-MM-DD) or press Enter to skip: " << std::endl;
        std::getline(std::cin, date);
        if (date.empty())
        {
            std::cout << "No date entered. Results will start from 1980" << std::endl;
            return "";
        }
        if (std::regex_match(date, Year) || std::regex_match(date, Month) || std::regex_match(date, Full))
        {
            std::cout << "You entered: " << date << std::endl;
            return date;
        }
        else
        {
            std::cout << "Invalid date format. Please try again." << std::endl;
        }
    }
}

std::string AppMain::getEndDate()
{
    // Use regex to check if user input is in usable date format
    // 3 different regex for different dates
    std::string date;
    std::regex Year("\\d{4}");
    std::regex Month("\\d{4}-\\d{2}");
    std::regex Full("\\d{4}-\\d{2}-\\d{2}");
    
    while (true)
    {
        std::cout << "Please enter a date from 1980-2019 (YYYY, YYYY-MM, or YYYY-MM-DD) or press Enter to skip: " << std::endl;
        std::getline(std::cin, date);
        if (date.empty())
        {
            std::cout << "No date entered. Results will end with 2019" << std::endl;
            return "";
        }
        if (std::regex_match(date, Year) || std::regex_match(date, Month) || std::regex_match(date, Full))
        {
            std::cout << "You entered: " << date << std::endl;
            return date;
        }
        else
        {
            std::cout << "Invalid date format. Please try again." << std::endl;
        }
    }
}

void printCandleSticks(std::vector<Candlestick> data){
    // Print the results
    std::cout << std::setw(4)  << "Year" 
              << std::setw(12) << "Open" 
              << std::setw(12) << "High" 
              << std::setw(12) << "Low" 
              << std::setw(12) << "Close" 
              << std::endl;
    for (const auto& candlestick : data) {
        std::cout << std::setw(4)  << candlestick.getDate() 
                  << std::setw(12) << candlestick.getOpen()
                  << std::setw(12) << candlestick.getHigh()
                  << std::setw(12) << candlestick.getLow()
                  << std::setw(12) << candlestick.getClose()
                  << std::endl;
    }
    std::cout << std::endl;
}

void printActualandPrediction(std::vector<Candlestick> result, std::map<std::string, double> predictions){
    std::cout << "Date, Open Value, Predicted Value:" << std::endl;
    for (const auto& candle : result) {
        std::string date = candle.getDate();
        double openValue = candle.getClose();
        double predictedValue = predictions[date];
        std::cout << date << ", " << openValue << ", " << predictedValue << std::endl;
    }
}

void AppMain::processUserOption(int userOption)
{
    if (userOption == 0) // bad input
    {
        std::cout << "Invalid choice. Choose 1-6" << std::endl;
    }
    if (userOption == 1)
    {
        int countryOption = getCountryOption();
        std::vector<Candlestick> result = CandlestickCalculator::CandlestickRange(CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv"),countryOption,"","",1);;
        //Print the results
        printCandleSticks(result);
        //CandlestickCalc
        CandlestickCalculator::printCandlestickPlot(result);

        // Pause application so user can read the output without needing to scroll up as much
        std::system("pause");
    }
    if (userOption == 2)
    {
        int countryOption = getCountryOption();
        std::vector<Candlestick> result = CandlestickCalculator::CandlestickRange(CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv"),countryOption,"","",2);;
        // Print the results
        printCandleSticks(result);
        CandlestickCalculator::printCandlestickPlot(result);

        // Pause application so user can read the output without needing to scroll up as much     
        std::system("pause");
    }
    if (userOption == 3)
    {
        int countryOption = getCountryOption();
        std::vector<Candlestick> result = CandlestickCalculator::CandlestickRange(CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv"),countryOption,"","",3);
        // Print the results
        printCandleSticks(result);
        CandlestickCalculator::printCandlestickPlot(result);
        // Pause application so user can read the output without needing to scroll up as much
        std::system("pause");
    }
    if (userOption == 4)
    {
        int countryOption = getCountryOption();
        int frequencyOption = getFrequencyOption();
        std::string startDate = getStartDate();
        std::string endDate = getEndDate();

        // In case end date is before start date, swap the dates
        if (startDate > endDate) {
            std::swap(startDate, endDate);
        }

        std::vector<Candlestick> result = CandlestickCalculator::CandlestickRange(CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv"),countryOption,startDate,endDate,frequencyOption);
        // Print the results
        printCandleSticks(result);

        CandlestickCalculator::printCandlestickPlot(result);
        // Pause application so user can read the output without needing to scroll up as much
        std::system("pause");
    }
    if (userOption == 5)
    {
        int countryOption = getCountryOption();
        int frequencyOption = getFrequencyOption();
        std::string startDate = getStartDate();
        std::string endDate = getEndDate();

        // In case end date is before start date, swap the dates
        if (startDate > endDate) {
            std::swap(startDate, endDate);
        }

        std::vector<Candlestick> result = CandlestickCalculator::CandlestickRange(CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv"),countryOption,startDate,endDate,frequencyOption);
        
        std::map<std::string, double> predictions = CandlestickPrediction::CandlestickFilterLRMA(result);
        
        printActualandPrediction(result, predictions);
        // Pause application so user can read the output without needing to scroll up as much
        std::system("pause");
    }
}