#include "MerkelMain.h"
#include "CSVReader.h"
#include "CandlestickCalculator.h"
#include <iostream>

MerkelMain::MerkelMain()
{
}

void MerkelMain::init()
{
    int input;
    // Load data from csv to use later
    // std::vector<std::vector<std::string>> csvData;
    // csvData = CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv");
    while (true)
    {
        printMenu();
        input = getUserOption();
        processUserOption(input);
    }
}

void MerkelMain::printMenu()
{
    // 1 print help
    std::cout << "1: Print Yearly Candlestick data" << std::endl;
    // 2 print exchange stats
    std::cout << "2: Print Monthly Candlestick data" << std::endl;
    // 3 make an offer
    std::cout << "3: Print Daily Candlestick data " << std::endl;
    // 4 make a bid
    std::cout << "4: Print Hourly Candlestick data " << std::endl;
    // 5 print wallet
    std::cout << "5: Print wallet " << std::endl;
    // 6 continue
    std::cout << "6: Continue " << std::endl;

    std::cout << "============== " << std::endl;

}

int MerkelMain::getUserOption()
{
    int userOption = 0;
    std::string line;
    std::cout << "Type in 1-6" << std::endl;
    getline(std::cin, line);
    try
    {
        userOption = stoi(line);
    }
    catch (const std::exception &e)
    {
        //
    }
    std::cout << "You chose: " << userOption << std::endl;
    return userOption;
}

void MerkelMain::processUserOption(int userOption)
{
    if (userOption == 0) // bad input
    {
        std::cout << "Invalid choice. Choose 1-6" << std::endl;
    }
    if (userOption == 1)
    {
        CandlestickCalculator::CandlestickYear(CSVReader::LoadCSVData("EU_WeatherData_1980-2019.csv"),1);
    }
    if (userOption == 2)
    {
        std::cout << "Option 2" << std::endl;
    }
    if (userOption == 3)
    {
        std::cout << "Option 3" << std::endl;
    }
    if (userOption == 4)
    {
        std::cout << "Option 4" << std::endl;
    }
    if (userOption == 5)
    {
        std::cout << "Option 5" << std::endl;
    }
    if (userOption == 6)
    {
        std::cout << "Option 6" << std::endl;
    }
}