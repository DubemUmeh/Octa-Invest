module.exports = function override(config, env) {
  // Enable top-level await
  config.experiments = {
    ...config.experiments,
    topLevelAwait: true,
  };
  
  return config;
};