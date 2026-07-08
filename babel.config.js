module.exports = function (api) {
  api.cache(true);
  // In tests, drop NativeWind's jsx transform so JSX uses the standard React
  // runtime (className becomes an inert prop) — avoids the css-interop runtime in Node.
  const isTest = process.env.NODE_ENV === "test";
  return {
    presets: [
      isTest
        ? "babel-preset-expo"
        : ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      ...(isTest ? [] : ["nativewind/babel"]),
    ],
  };
};
