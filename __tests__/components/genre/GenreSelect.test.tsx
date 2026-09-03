/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GenreSelect from "@/components/genre/GenreSelect";

describe("GenreSelect", () => {
  it("should render genre dropdown", () => {
    render(<GenreSelect onGenreChange={jest.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
