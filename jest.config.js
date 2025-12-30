/** @type {import('ts-jest').JestConfigWithTsJest} */
const commonConfig = {
  preset: "ts-jest",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          module: "commonjs",
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "hooks/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

module.exports = {
  projects: [
    {
      displayName: "electron-main",
      testMatch: ["**/__tests__/**/*.test.ts"],
      runner: "@kayahr/jest-electron-runner/main",
      testEnvironment: "node",
      ...commonConfig,
    },
    {
      displayName: "dom",
      testMatch: ["**/__tests__/**/*.test.tsx"],
      testEnvironment: "jsdom",
      ...commonConfig,
    },
  ],
};
