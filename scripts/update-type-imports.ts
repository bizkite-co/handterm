import { Project } from 'ts-morph';
import { globSync } from 'glob';
import fs from 'fs';
import path from 'path';

const DRY_RUN = false; // Set to false to actually modify files
const BACKUP_DIR = path.join(process.cwd(), 'backups/type-imports');

// Ensure backup directory exists
if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const project = new Project();
const files = globSync(['src/**/*.ts', 'src/**/*.tsx'], {
  ignore: ['**/node_modules/**', '**/dist/**']
});

files.forEach(filePath => {
  const sourceFile = project.addSourceFileAtPath(filePath);
  let modified = false;

  // Process import declarations
  const imports = sourceFile.getImportDeclarations();
  imports.forEach(imp => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier.startsWith('src/types')) {
      const newSpecifier = moduleSpecifier.replace(
        /^src\/types/,
        '@handterm/types'
      );

      // Skip if no actual types are imported
      const namedImports = imp.getNamedImports();
      const defaultImport = imp.getDefaultImport();
      if (namedImports.length === 0 && !defaultImport) {
        console.log(`Skipping side-effect import in ${filePath}`);
        return;
      }

      console.log(`Updating import in ${filePath}:`);
      console.log(`  FROM: ${moduleSpecifier}`);
      console.log(`  TO:   ${newSpecifier}`);

      imp.setModuleSpecifier(newSpecifier);
      modified = true;
    }
  });

  if (modified) {
    const output = sourceFile.getFullText();

    if (!DRY_RUN) {
      // Create backup
      const backupPath = path.join(BACKUP_DIR, path.basename(filePath));
      fs.copyFileSync(filePath, backupPath);

      // Write changes
      fs.writeFileSync(filePath, output);
    }
  }
});

console.log(`${DRY_RUN ? 'Dry run complete' : 'Migration complete'}. Processed ${files.length} files.`);