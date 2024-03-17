import { JestConfigWithTsJest } from "ts-jest";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./tests"],
  coveragePathIgnorePatterns: ["node_modules", "mocks"],
  collectCoverage: true,
  coverageReporters: ["json", "lcov", "text", "clover", "json-summary"],
  reporters: ["default", "jest-junit"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^./esm/index.js$": "dist/esm/index.js",
    "^./cjs/index.js$": "dist/cjs/index.js",
  },
  modulePaths: ["dist"],
} as JestConfigWithTsJest;
