#include "CandleStick.h"

#include <string>

// Constructors
CandleStick::CandleStick() : m_Date(""), m_Open(0.0), m_High(0.0), m_Low(0.0), m_Close(0.0) {}

CandleStick::CandleStick(std::string &Date, double Open, double High, double Low, double Close) 
    : m_Date(Date), m_Open(Open), m_High(Close), m_Low(Low), m_Close(Close) {}

//Accessors
std::string CandleStick::getDate() const { return m_Date; }
double CandleStick::getOpen() const { return m_Open; }
double CandleStick::getHigh() const { return m_High; }
double CandleStick::getLow() const { return m_Low; }
double CandleStick::getClose() const { return m_Close; }