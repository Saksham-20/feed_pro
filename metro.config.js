const { getDefaultConfig } = require("metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

module.exports = (async () => {
  const config = await getDefaultConfig();

  return {
    ...config,
    resolver: {
      ...config.resolver,
      blockList: exclusionList([/backend\/.*/]),
    },
  };
})();
