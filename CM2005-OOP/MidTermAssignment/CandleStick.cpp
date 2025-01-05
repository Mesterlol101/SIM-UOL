#include "Candlestick.h"

#include <string>

// Constructors
Candlestick::Candlestick() : m_Date(""), m_Open(""), m_High(0.0), m_Low(0.0), m_Close(0.0) {}

Candlestick::Candlestick(std::string Date, std::string Open, double High, double Low, double Close) 
    : m_Date(Date), m_Open(Open), m_High(High), m_Low(Low), m_Close(Close) {}

//Accessors
std::string Candlestick::getDate() const { return m_Date; }
std::string Candlestick::getOpen() const { return m_Open; }
double Candlestick::getHigh() const { return m_High; }
double Candlestick::getLow() const { return m_Low; }
double Candlestick::getClose() const { return m_Close; }