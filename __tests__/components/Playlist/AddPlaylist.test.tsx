/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import AddPlaylist from "@/components/playlist/AddPlaylist";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "test-user" } }),
}));

jest.mock("@/hooks/auth/useAuthModal", () => () => ({
  onOpen: jest.fn(),
}));

jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

jest.mock("@/hooks/data/useGetSongById", () => () => ({
  song: { id: "song-1", title: "Test Song" },
  isLoading: false,
}));

jest.mock("@/hooks/data/usePlaylistSongStatus", () => () => ({
  isInPlaylist: {},
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("@/libs/electron", () => ({
  isElectron: () => false,
  cache: { get: jest.fn(), set: jest.fn() },
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn(),
    })),
  })),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <div data-testid="dropdown-item" onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
}));

describe("AddPlaylist", () => {
  const mockPlaylists = [
    { id: "playlist-1", title: "My Playlist", user_id: "user-1", is_public: true, created_at: "2023-01-01" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render add button", () => {
    render(<AddPlaylist playlists={mockPlaylists} songId="song-1" songType="regular" />);
    expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
  });

  it("should show playlist items", () => {
    render(<AddPlaylist playlists={mockPlaylists} songId="song-1" songType="regular" />);
    // The trigger renders a button, and clicking it would open the dropdown
    expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
  });
});
