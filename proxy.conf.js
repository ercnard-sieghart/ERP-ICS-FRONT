module.exports = {
  '/rest/**': {
    target: 'http://localhost:8181',
    secure: false,
    logLevel: 'silent'
  }
};
