#include <cppunit/TestCase.h>
#include <cppunit/TestCaller.h>
#include <cppunit/ui/text/TestRunner.h>
class FixtureTests : public CppUnit::TestFixture {
    public:
        void setUp() override
        {       
        }
        void tearDown() override
        {
        }
        void testAddition()
        {
        CPPUNIT_ASSERT(2+3 == 4);
        CPPUNIT_ASSERT(2+3 == 6);
        }
};
int main(){
CppUnit::TextUi::TestRunner runner{};
runner.addTest(new CppUnit::TestCaller<FixtureTests>{"test the addition operator",&FixtureTests::testAddition});
runner.run();
return 0;
}