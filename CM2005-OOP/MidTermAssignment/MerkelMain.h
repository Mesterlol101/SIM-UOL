#pragma once

class MerkelMain{

    public:
        MerkelMain();
        void init();

    private:
        void printMenu();
        int getUserOption();
        void processUserOption(int userOption);
};
