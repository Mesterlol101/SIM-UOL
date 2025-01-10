const chai = require('chai');
const script = require('../src/script.js');

const expect = chai.expect;

describe('Scientific Calculator', function() {
    let form;

    beforeEach(function() {
        form = document.forms['calc'];
    });

    it('should add characters to the display', function() {
        script.addChar(form.display, '5');
        expect(form.display.value).to.equal('5');
        script.addChar(form.display, '3');
        expect(form.display.value).to.equal('53');
    });

    it('should calculate cosine', function() {
        form.display.value = '0';
        script.cos(form);
        expect(form.display.value).to.equal('1');
    });

    it('should calculate sine', function() {
        form.display.value = '0';
        script.sin(form);
        expect(form.display.value).to.equal('0');
    });

    it('should calculate tangent', function() {
        form.display.value = '0';
        script.tan(form);
        expect(form.display.value).to.equal('0');
    });

    it('should calculate square root', function() {
        form.display.value = '4';
        script.sqrt(form);
        expect(form.display.value).to.equal('2');
    });

    it('should calculate natural logarithm', function() {
        form.display.value = '1';
        script.ln(form);
        expect(form.display.value).to.equal('0');
    });

    it('should calculate exponent', function() {
        form.display.value = '1';
        script.exp(form);
        expect(form.display.value).to.equal('2.718281828459045');
    });

    it('should delete the last character', function() {
        form.display.value = '123';
        script.deleteChar(form.display);
        expect(form.display.value).to.equal('12');
    });

    it('should change the sign of the number', function() {
        form.display.value = '5';
        script.changeSign(form.display);
        expect(form.display.value).to.equal('-5');
        script.changeSign(form.display);
        expect(form.display.value).to.equal('5');
    });

    it('should compute the expression', function() {
        form.display.value = '2+3';
        script.compute(form);
        expect(form.display.value).to.equal('5');
    });

    it('should calculate the square of a number', function() {
        form.display.value = '3';
        script.square(form);
        expect(form.display.value).to.equal('9');
    });

    it('should validate numbers correctly', function() {
        expect(script.checkNum('123')).to.be.true;
        expect(script.checkNum('123a')).to.be.false;
    });
});