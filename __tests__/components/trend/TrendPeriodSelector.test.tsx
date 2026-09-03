/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TrendPeriodSelector from "@/components/trend/TrendPeriodSelector";

describe("TrendPeriodSelector", () => {
  it("should render period buttons", () => {
    render(<TrendPeriodSelector selectedPeriod="week" onPeriodChange={jest.fn()} />);
    expect(screen.getByText(/week/i)).toBeInTheDocument();
    expect(screen.getByText(/month/i)).toBeInTheDocument();
  });
});
