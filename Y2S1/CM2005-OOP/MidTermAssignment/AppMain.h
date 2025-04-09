#pragma once

#include <string>

class AppMain{

    public:
        AppMain();
        void init();

    private:
        void printMenu();
        int getMenuOption();
        int getCountryOption();
        int getFrequencyOption();
        std::string getStartDate();
        std::string getEndDate();
        void processUserOption(int userOption);
};
