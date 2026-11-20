const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// The gluestack generator also emits `index.web.tsx` variants that render raw DOM elements (<span>, <div>,
// <script>) for Next.js. This is react-native-web, which needs the RN variants (`index.tsx`), so on web we
// resolve files under components/gluestack without the platform extension.
const GLUESTACK_DIR = path.join(__dirname, 'src', 'components', 'gluestack') + path.sep;
const upstreamResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstreamResolve ?? context.resolveRequest;
  if (platform === 'web') {
    const isGluestackImport = moduleName.includes('components/gluestack/');
    const fromGluestack = context.originModulePath?.startsWith(GLUESTACK_DIR) && moduleName.startsWith('.');
    if (isGluestackImport || fromGluestack) {
      return resolve({ ...context, preferNativePlatform: false }, moduleName, null);
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
  extraThemes: ['dark'],
});
