#pragma once

#include <string>

class Candlestick{
public:
    // Constructors
    Candlestick();
    Candlestick(
        std::string Date,
        std::string Open, // Average mean temp per time frame (i.e if asked for 2015, give 2014)
        double High, // Highest temp for time frame
        double Low, // Lowest temp for time frame
        double Close // Average mean temp for current time frame
        );

    // Accessor functions
    std::string getDate() const;
    std::string getOpen() const;
    double getHigh() const;
    double getLow() const;
    double getClose() const;

private:
    std::string m_Date;
    std::string m_Open;
    double m_High;
    double m_Low;
    double m_Close;
};