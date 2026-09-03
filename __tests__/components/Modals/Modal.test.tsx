/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Modal from "@/components/modals/Modal";

describe("Modal", () => {
  it("should render children when open", () => {
    render(
      <Modal isOpen={true} onChange={jest.fn()} title="Test Modal" description="Test description">
        Modal Content
      </Modal>
    );
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(
      <Modal isOpen={true} onChange={jest.fn()} title="Test Title" description="Test description">
        Content
      </Modal>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should not render children when closed", () => {
    render(
      <Modal isOpen={false} onChange={jest.fn()} title="Test Modal" description="Test description">
        Hidden Content
      </Modal>
    );
    expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
  });
});
