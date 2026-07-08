module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css)$": "<rootDir>/jest/style-mock.js",
  },
  // Ignore build/output dirs.
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "/dist/"],
};
