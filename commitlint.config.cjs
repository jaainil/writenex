module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [
            2,
            'always',
            [
                'astro',      // @writenex/astro package
                'app',        // writenex app
                'deps',       // dependencies
                'ci',         // CI/CD
                'docs',       // documentation
                'config',     // configuration
                'release'     // release commits
            ]
        ]
    }
};
