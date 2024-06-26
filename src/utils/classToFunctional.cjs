/**
 * src/utils/classToFunctional.cjs
 * 
 * This is a basic jscodeshift script to start converting React class components
 * to functional components by transforming class method declarations.
 */
const { parse } = require('recast');

module.exports = function transformer(file, api) {
  const j = api.jscodeshift.withParser('tsx');
  const root = j(file.source);

  root.find(j.ClassDeclaration).forEach(path => {
    const className = path.value.id.name;
    // Create a new array to hold functions and other statements for the functional component
    const functionalComponentBody = [];
    const hooksImportCheck = new Set();

    // Convert class methods to functions
    path.value.body.body.forEach(classElement => {
      if (classElement.type === 'MethodDefinition' && classElement.kind === 'method') {
        const methodName = classElement.key.name;
        // Skip constructor and React lifecycle methods for manual handling or specific conversion
        if (methodName !== 'constructor' && !['render', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount'].includes(methodName)) {
          const methodFunction = j.functionDeclaration(j.identifier(methodName), classElement.value.params, classElement.value.body);
          functionalComponentBody.push(methodFunction);
        }
      }
    });

    // Check for state and lifecycle methods to add useState and useEffect hooks if needed
    // This part is simplified and needs more logic to handle actual conversion
    if (path.value.body.body.some(element => element.type === 'ClassProperty' && element.key.name === 'state')) {
      hooksImportCheck.add('useState');
    }

    if (path.value.body.body.some(element => ['componentDidMount', 'componentDidUpdate', 'componentWillUnmount'].includes(element.key.name))) {
      hooksImportCheck.add('useEffect');
    }

    // Create the functional component
    const functionalComponent = j.variableDeclaration("const", [
      j.variableDeclarator(
        j.identifier(className),
        j.arrowFunctionExpression([], j.blockStatement(functionalComponentBody))
      )
    ]);

    // Ensure hooks are imported if needed
    if (hooksImportCheck.size > 0) {
      let reactImportDeclaration = root.find(j.ImportDeclaration, { source: { value: 'react' } });
      if (reactImportDeclaration.size() === 0) {
        // If there's no React import (unlikely but just in case), add one
        reactImportDeclaration = j.importDeclaration([], j.literal('react'));
        root.get().node.program.body.unshift(reactImportDeclaration);
      }
  
      const { specifiers } = reactImportDeclaration.paths()[0].value;
      hooksImportCheck.forEach(hookName => {
        if (!specifiers.some(specifier => specifier.imported.name === hookName)) {
          specifiers.push(j.importSpecifier(j.identifier(hookName)));
        }
      });
    }

    // Insert the functional component before the class component
    j(path).insertBefore(functionalComponent);

    // Remove the class component
    j(path).remove();
  });

  return root.toSource({ quote: 'single' });
};