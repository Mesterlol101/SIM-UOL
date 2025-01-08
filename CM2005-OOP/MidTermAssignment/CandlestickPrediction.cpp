#include "alglib-cpp/src/stdafx.h"
#include "alglib-cpp/src/interpolation.h"
#include "alglib-cpp/src/dataanalysis.h"

#include "CandlestickPrediction.h"
#include "Candlestick.h"
#include "CSVReader.h"

#include <iostream>
#include <vector>
#include <map>
#include <limits>
#include <iomanip>
#include <cmath>
#include <algorithm>

#include <vector>
// Constructor
CandlestickPrediction::CandlestickPrediction(){
    
}
// Using filterlrma to predict the close value
std::map<std::string, double> CandlestickPrediction::CandlestickFilterLRMA(std::vector<Candlestick> data) {
    std::map<std::string, double> predictions;

    // Prepare data for linear regression moving average filter
    alglib::real_1d_array y;
    y.setlength(data.size());
    for (int i = 0; i < data.size(); ++i) {
        // y value
        y[i] = data[i].getClose();  
    }

    // How many data points it takes into consideration
    int window_size = 3;
    // Apply linear regression moving average filter
    alglib::filterlrma(y, window_size);

    // Store predictions
    for (int i = 0; i < data.size(); ++i) {
        std::string date = data[i].getDate();
        predictions[date] = y[i];
    }

    return predictions;
}