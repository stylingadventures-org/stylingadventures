/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  testMatch: ["**/*.test.ts", "**/*.spec.ts"],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/cdk.out/",
    "/dist/",
    "/project-lakechain/",
    "/thumb-head/",
  ],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        diagnostics: true,
      },
    ],
  },

  transformIgnorePatterns: [
    "node_modules/(?!(node-fetch)/)",
  ],

  clearMocks: true,
  restoreMocks: true,
};
