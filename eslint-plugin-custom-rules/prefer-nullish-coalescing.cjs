/* eslint-disable custom-rules/prefer-nullish-coalescing */
/** @type {import('@typescript-eslint/utils').TSESLint.RuleModule} */
const ts = require('typescript');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer nullish coalescing operator (??) over logical OR (||) when handling null/undefined values',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-nullish-coalescing.md'
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNullishCoalescing: 'Use nullish coalescing operator (??) instead of logical OR (||) when handling null/undefined values. Refer to docs/linting/type_safety_strategies.md for more details.'
    }
  },
  create(context) {
    // Disable this rule entirely when processing its own file
    if (context.getFilename().includes('eslint-plugin-custom-rules/prefer-nullish-coalescing.cjs')) {
      return {
        // Return an empty rule object
        Program() {}
      };
    }

    const sourceCode = context.getSourceCode();

    return {
      LogicalExpression(node) {
        if (node.operator === '||') {
          const leftText = sourceCode.getText(node.left);

          // Check if the left operand is explicitly compared with null/undefined
          const isExplicitNullish =
            node.left.type === 'BinaryExpression' &&
            ['==', '===', '!=', '!=='].includes(node.left.operator) &&
            node.left.right.type === 'Identifier' &&
            (node.left.right.name === 'null' || node.left.right.name === 'undefined');

          // Get TypeScript type information if available
          const tsNode = context.parserServices.esTreeNodeToTSNodeMap?.get(node.left);
          const typeChecker = context.parserServices.program?.getTypeChecker();
          const isTypeNullish = Boolean(tsNode && typeChecker &&
            (typeChecker.getTypeAtLocation(tsNode).getFlags() &
             (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0);

          if (isExplicitNullish || isTypeNullish) {
            context.report({
              node,
              messageId: 'preferNullishCoalescing',
              fix(fixer) {
                return fixer.replaceText(node, `${leftText} ?? ${sourceCode.getText(node.right)}`);
              }
            });
          }
        }
      }
    };
  }
};
