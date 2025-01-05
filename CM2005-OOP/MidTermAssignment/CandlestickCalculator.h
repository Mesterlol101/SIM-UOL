#pragma once

#include "CandleStick.h"

#include <vector>

class CandlestickCalculator{
    public:
        CandlestickCalculator();
        // std::vector<CandleStick>
        // static std::vector<Candlestick> CandlestickYear(std::vector<std::vector<std::string>> data, int column);
        static std::vector<Candlestick> CandlestickRange(std::vector<std::vector<std::string>> data, int column, std::string startDate, std::string endDate, int frequency);
        static void printCandlestickPlot(std::vector<Candlestick> candlesticks);

    private:
};