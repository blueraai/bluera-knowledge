/**
 * Custom updater for commit-and-tag-version to update README.md version badge
 */

const { version } = require('../package.json');

const versionRegex = /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[\d.]+(-[\w.]+)?-blue\)/;

module.exports.readVersion = function () {
  return version;
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(
    versionRegex,
    `![Version](https://img.shields.io/badge/version-${version}-blue)`
  );
};
