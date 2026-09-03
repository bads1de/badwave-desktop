/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import GenreCard from "@/components/genre/GenreCard";

describe("GenreCard", () => {
  it("should render genre name", () => {
    render(<GenreCard genre="Pop" color="bg-purple-500" />);
    expect(screen.getByText("Pop")).toBeInTheDocument();
  });

  it("should render as a link", () => {
    render(<GenreCard genre="Rock" color="bg-blue-500" />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
