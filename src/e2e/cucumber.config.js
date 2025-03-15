const config = {
    format: [
        // 'message:e2e/reports/cucumber-report.ndjson',
        'json:reports/cucumber-report.json',
        'html:reports/report.html',
        'summary',
        'progress-bar'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['src/e2e/scenarios/**/*.feature'], // Load feature files
    require: [
        'src/e2e/dist/steps/**/*.js', // Load compiled step definitions
    ],
    //   worldParameters: getWorldParams()
};

if (process.env.USE_ALLURE) {
    //   config.format.push('./src/support/reporters/allure-reporter.ts');
} else {
    config.format.push('@cucumber/pretty-formatter');
}
module.exports = config;