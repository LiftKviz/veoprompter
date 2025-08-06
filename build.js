const webpack = require('webpack');
const config = require('./webpack.config.js');

const compiler = webpack(config);

compiler.run((err, stats) => {
  if (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }

  if (stats.hasErrors()) {
    console.error('Build errors:');
    console.error(stats.toString({ colors: true }));
    process.exit(1);
  }

  console.log('✅ Build completed successfully!');
  console.log(stats.toString({
    chunks: false,
    colors: true,
    modules: false
  }));
});