#include "Candlestick.h"
#include <vector>
#include <map>

class CandlestickPrediction{
    public:
        CandlestickPrediction();
        static std::map<std::string, double> CandlestickFilterLRMA(std::vector<Candlestick> data);
    private:
};