module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
      diagnostics: true,
    },
  },
};
