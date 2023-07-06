module.exports = {
  crawlFrom: "./src/frontend/",
  includeSubComponents: true,
  exclude: [/^(.*)node_modules([\s\S]*)$/],
  importedFrom: /^(.*)grommet([\s\S]*)$/,
  processors: [["count-components", { outputTo: "./report.json" }]],
};
