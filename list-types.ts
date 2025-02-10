import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// TODO: Put a comment here about how to call this and pass a parameter
interface TypeInfo {
  name: string;
  location: string;
}

function listTypesInFile(filePath: string): TypeInfo[] {
  const types: TypeInfo[] = [];
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const createSourceFile = ts.createSourceFile;
  const sourceFile = createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      if (node.name.text.startsWith('_')) {
        return;
      }
      types.push({
        name: node.name.text,
        location: `${filePath}:${node.name.getStart(sourceFile) + 1}`
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return types;
}

function walkDirectory(dir: string, fileList: string[] = []): string[] {
  if (dir.includes('node_modules')) {
    return fileList;
  }
  const files = fs.readdirSync(dir, { });

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      const nextFileList = walkDirectory(filePath, fileList);
      fileList = fileList.concat(nextFileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const projectRoot = process.cwd();
const allFiles = walkDirectory(projectRoot);
const allTypes: TypeInfo[] = [];

allFiles.forEach(file => {
  allTypes.push(...listTypesInFile(file));
});

// Sort types by name
allTypes.sort((a, b) => a.name.localeCompare(b.name));

// Print all types and their locations
console.log('Types found in the project:');
allTypes.forEach(type => {
  console.log(`${type.name}: ${type.location}`);
});

// Check for duplicates
const typeCounts = allTypes.reduce((acc, type) => {
  acc[type.name] = (acc[type.name] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const duplicates = Object.entries(typeCounts)
  .filter(([, count]) => count > 1)
  .map(([name]) => name);

if (duplicates.length > 0) {
  console.log('\nDuplicate types found:');
  duplicates.forEach(name => {
    console.log(`${name}:`);
    allTypes.filter(t => t.name === name).forEach(t => {
      console.log(`  ${t.location}`);
    });
  });
}
