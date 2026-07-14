// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// socket.io-client / engine.io-client ship `exports` maps whose ESM ("import")
// branch wins under Metro's package-exports resolution (Expo SDK 53+ default).
// Those ESM builds use `.js`-suffixed relative imports (e.g. "./contrib/parseuri.js")
// that Metro's resolver can't follow, so bundling fails. Route just the socket.io
// dependency graph through its CommonJS builds (package exports stays on for the
// rest of the app).
const SOCKET_IO_CJS =
  /^(socket\.io-client|engine\.io-client|engine\.io-parser|socket\.io-parser|@socket\.io\/component-emitter)(\/.*)?$/;

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (SOCKET_IO_CJS.test(moduleName)) {
    return resolve({ ...context, unstable_enablePackageExports: false }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
