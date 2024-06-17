const fs = require('fs');
const path = require('path');
const glob = require('glob');

const componentsDir = path.join(__dirname, 'src/components');
const outputDir = path.join(__dirname, 'component-docs');

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Use glob to handle file matching
glob(path.join(componentsDir, '**/*.tsx'), async (error, files) => {
  if (error) {
    console.error('Error with glob pattern:', error);
    return;
  }

  // Dynamically import the reactDocgen module
  const reactDocgen = await import('react-docgen');

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    try {
      const doc = reactDocgen.parse(source);
      const outputPath = path.join(outputDir, path.basename(file, path.extname(file)) + '.json');
      fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));
      console.log(`Documentation generated for ${file}`);
    } catch (e) {
      console.error(`Error generating documentation for ${file}:`, e);
    }
  }
});