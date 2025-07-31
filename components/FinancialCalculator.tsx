"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Move, Calculator } from "lucide-react";
import { usePathname } from "next/navigation";

interface Position {
  x: number;
  y: number;
}

interface CalculatorState {
  display: string;
  expression: string;
  previousValue: number | null;
  operator: string | null;
  waitingForNewValue: boolean;
  memory: number;
  justCalculated: boolean;
  error: string | null;
}

const FinancialCalculator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [calculator, setCalculator] = useState<CalculatorState>({
    display: "0",
    expression: "",
    previousValue: null,
    operator: null,
    waitingForNewValue: false,
    memory: 0,
    justCalculated: false,
    error: null,
  });

  const formatDisplay = (value: string): string => {
    if (value.length > 12) {
      return parseFloat(value).toExponential(6);
    }
    return value;
  };

  const inputNumber = (num: string) => {
    setCalculator((prev) => {
      if (prev.error) {
        return {
          ...prev,
          display: num === "." ? "0." : num,
          expression: num,
          error: null,
          waitingForNewValue: false,
          justCalculated: false,
        };
      }

      if (prev.waitingForNewValue || prev.justCalculated) {
        return {
          ...prev,
          display: num === "." ? "0." : num,
          expression: prev.expression + (prev.justCalculated ? num : ` ${num}`),
          waitingForNewValue: false,
          justCalculated: false,
        };
      }

      if (num === "." && prev.display.includes(".")) {
        return prev;
      }

      const newDisplay =
        prev.display === "0" && num !== "." ? num : prev.display + num;

      return {
        ...prev,
        display: formatDisplay(newDisplay),
        expression: prev.expression + num,
      };
    });
  };

  const performCalculation = (
    firstValue: number,
    secondValue: number,
    operator: string
  ): number => {
    switch (operator) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        if (secondValue === 0) {
          setCalculator((prev) => ({
            ...prev,
            error: "Cannot divide by zero",
          }));
          return NaN;
        }
        return firstValue / secondValue;
      case "%":
        return (firstValue * secondValue) / 100;
      default:
        return secondValue;
    }
  };

  const inputOperator = (nextOperator: string) => {
    if (calculator.error) return;

    const inputValue = parseFloat(calculator.display);
    if (isNaN(inputValue)) return;

    if (calculator.previousValue === null) {
      setCalculator((prev) => ({
        ...prev,
        previousValue: inputValue,
        operator: nextOperator,
        expression: prev.expression + ` ${nextOperator} `,
        waitingForNewValue: true,
        justCalculated: false,
      }));
    } else if (calculator.operator) {
      const currentValue = calculator.previousValue || 0;
      const newValue = performCalculation(
        currentValue,
        inputValue,
        calculator.operator
      );

      if (isNaN(newValue)) return;

      setCalculator((prev) => ({
        ...prev,
        display: String(newValue),
        expression: prev.expression + ` = ${newValue} ${nextOperator} `,
        previousValue: newValue,
        operator: nextOperator,
        waitingForNewValue: true,
        justCalculated: false,
        error: null,
      }));
    }
  };

  const calculate = () => {
    if (calculator.error) return;

    const inputValue = parseFloat(calculator.display);
    if (isNaN(inputValue)) return;

    if (calculator.previousValue !== null && calculator.operator) {
      const newValue = performCalculation(
        calculator.previousValue,
        inputValue,
        calculator.operator
      );

      if (isNaN(newValue)) return;

      setCalculator((prev) => ({
        ...prev,
        display: String(newValue),
        expression: prev.expression + ` = ${newValue}`,
        previousValue: null,
        operator: null,
        waitingForNewValue: true,
        justCalculated: true,
        error: null,
      }));
    }
  };

  const clear = () => {
    setCalculator((prev) => ({
      ...prev,
      display: "0",
      expression: "",
      previousValue: null,
      operator: null,
      waitingForNewValue: false,
      justCalculated: false,
      error: null,
    }));
  };

  const clearAll = () => {
    setCalculator({
      display: "0",
      expression: "",
      previousValue: null,
      operator: null,
      waitingForNewValue: false,
      memory: 0,
      justCalculated: false,
      error: null,
    });
  };

  const addToMemory = () => {
    const value = parseFloat(calculator.display);
    if (isNaN(value)) return;

    setCalculator((prev) => ({
      ...prev,
      memory: prev.memory + value,
    }));
  };

  const recallMemory = () => {
    setCalculator((prev) => ({
      ...prev,
      display: formatDisplay(String(prev.memory)),
      waitingForNewValue: true,
      justCalculated: false,
      error: null,
    }));
  };

  const clearMemory = () => {
    setCalculator((prev) => ({
      ...prev,
      memory: 0,
    }));
  };

  const backspace = () => {
    if (calculator.error || calculator.waitingForNewValue) return;

    setCalculator((prev) => {
      const newDisplay =
        prev.display.length > 1 ? prev.display.slice(0, -1) : "0";
      return {
        ...prev,
        display: newDisplay,
        expression: prev.expression.slice(0, -1),
      };
    });
  };

  const calculatePercentage = () => {
    if (calculator.error) return;

    const value = parseFloat(calculator.display);
    if (isNaN(value)) return;

    const newValue = value / 100;
    setCalculator((prev) => ({
      ...prev,
      display: formatDisplay(String(newValue)),
      expression: prev.expression + "%",
      waitingForNewValue: true,
      justCalculated: false,
      error: null,
    }));
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;

      const calculatorKeys = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "+",
        "-",
        "*",
        "/",
        "=",
        "%",
        ".",
        "Enter",
        "Escape",
        "Backspace",
        "c",
        "C",
      ];

      if (calculatorKeys.includes(e.key)) e.preventDefault();

      switch (e.key) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          inputNumber(e.key);
          break;
        case ".":
          if (!calculator.display.includes(".")) inputNumber(".");
          break;
        case "+":
          inputOperator("+");
          break;
        case "-":
          inputOperator("-");
          break;
        case "*":
          inputOperator("×");
          break;
        case "/":
          inputOperator("÷");
          break;
        case "%":
          calculatePercentage();
          break;
        case "=":
        case "Enter":
          calculate();
          break;
        case "c":
        case "C":
          clear();
          break;
        case "Escape":
          clearAll();
          break;
        case "Backspace":
          backspace();
          break;
      }
    },
    [isVisible, calculator.display, calculator.error]
  );

  useEffect(() => {
    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (calculatorRef.current) {
      const rect = calculatorRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 h-10 rounded-full bg-zinc-900 text-zinc-100 shadow-lg transition-all hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
        size="sm"
      >
        <span className="flex items-center gap-2 px-4 py-2">
          <Calculator className="h-4 w-4" />
        </span>
      </Button>
    );
  }

  return (
    <Card
      ref={calculatorRef}
      className="fixed z-50 w-80 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg focus-within:outline-none"
      tabIndex={-1}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div
        className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing bg-zinc-200 dark:bg-zinc-700"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
          <Move size={16} />
          <span className="text-sm font-medium">Financial Calculator</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="p-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg mb-4 border border-zinc-200 dark:border-zinc-700">
          <div className="text-right">
            <div
              className={`text-sm min-h-[20px] font-mono ${
                calculator.error
                  ? "text-red-500 dark:text-red-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {calculator.error || calculator.expression || "\u00A0"}
            </div>

            <div
              className={`text-2xl font-mono min-h-[32px] break-all ${
                calculator.error
                  ? "text-red-600 dark:text-red-300"
                  : "text-zinc-800 dark:text-zinc-100"
              }`}
            >
              {calculator.error ? "Error" : calculator.display}
            </div>

            <div className="flex justify-between items-center mt-1">
              {calculator.memory !== 0 && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  M: {calculator.memory}
                </div>
              )}
              <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                Keyboard enabled
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={clearMemory}
            className="h-12 text-sm bg-purple-500 hover:bg-purple-600 text-white"
          >
            MC
          </Button>
          <Button
            onClick={recallMemory}
            className="h-12 text-sm bg-purple-500 hover:bg-purple-600 text-white"
          >
            MR
          </Button>
          <Button
            onClick={addToMemory}
            className="h-12 text-sm bg-purple-500 hover:bg-purple-600 text-white"
          >
            M+
          </Button>
          <Button
            onClick={clearAll}
            className="h-12 text-sm bg-red-500 hover:bg-red-600 text-white"
          >
            AC
          </Button>

          <Button
            onClick={clear}
            className="h-12 text-sm bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100"
          >
            C
          </Button>
          <Button
            onClick={calculatePercentage}
            className="h-12 text-sm bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100"
          >
            %
          </Button>
          <Button
            onClick={() => inputOperator("÷")}
            className="h-12 text-sm bg-blue-500 hover:bg-blue-600 text-white"
          >
            ÷
          </Button>
          <Button
            onClick={() => inputOperator("×")}
            className="h-12 text-sm bg-blue-500 hover:bg-blue-600 text-white"
          >
            ×
          </Button>

          <Button
            onClick={() => inputNumber("7")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            7
          </Button>
          <Button
            onClick={() => inputNumber("8")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            8
          </Button>
          <Button
            onClick={() => inputNumber("9")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            9
          </Button>
          <Button
            onClick={() => inputOperator("-")}
            className="h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            −
          </Button>

          <Button
            onClick={() => inputNumber("4")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            4
          </Button>
          <Button
            onClick={() => inputNumber("5")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            5
          </Button>
          <Button
            onClick={() => inputNumber("6")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            6
          </Button>
          <Button
            onClick={() => inputOperator("+")}
            className="h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            +
          </Button>

          <Button
            onClick={() => inputNumber("1")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            1
          </Button>
          <Button
            onClick={() => inputNumber("2")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            2
          </Button>
          <Button
            onClick={() => inputNumber("3")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            3
          </Button>
          <Button
            onClick={calculate}
            className="h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white row-span-2"
          >
            =
          </Button>

          <Button
            onClick={() => inputNumber("0")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100 col-span-2"
          >
            0
          </Button>
          <Button
            onClick={() => inputNumber(".")}
            className="h-12 text-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-800 dark:text-zinc-100"
          >
            .
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FinancialCalculator;
