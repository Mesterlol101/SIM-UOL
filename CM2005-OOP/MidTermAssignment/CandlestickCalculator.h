#pragma once

#include "CandleStick.h"

#include <vector>

class CandlestickCalculator{
public:
    CandlestickCalculator();
    // std::vector<CandleStick>
    static void CandlestickYear(std::vector<std::vector<std::string>> data,int column);
};