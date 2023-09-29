module.exports = {
  crawlFrom: "./",
  includeSubComponents: true,
  exclude: [/^(.*)node_modules([\s\S]*)$/],
  importedFrom: /^(.*)grommet$/,
  processors: [["count-components", { outputTo: "./report.json" }]],
};
