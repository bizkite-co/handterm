module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow use of <button> element",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: null,
    schema: [],
  },
  create: function (context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.name === "button") {
          context.report({
            node,
            message: "Use of <button> element is not allowed in TUI applications.",
          });
        }
      },
    };
  },
};
