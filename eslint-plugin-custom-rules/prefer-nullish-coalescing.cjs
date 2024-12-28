/** @type {import('@typescript-eslint/utils').TSESLint.RuleModule} */
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
    const sourceCode = context.getSourceCode();

    return {
      LogicalExpression(node) {
        if (node.operator === '||') {
          const leftText = sourceCode.getText(node.left);

          // Check if the left operand could be null/undefined
          const isNullable = [
            'Identifier',
            'MemberExpression',
            'CallExpression',
            'OptionalMemberExpression',
            'OptionalCallExpression'
          ].includes(node.left.type);

          if (isNullable) {
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
