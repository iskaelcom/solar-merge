const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist');
const ROUTES = ['privacy-policy', 'delete-account'];

/**
 * For static hosting without rewrite rules, we create physical directories
 * and copy index.html into them. This allows URLs like /privacy-policy/ to work.
 * We also create a 404.html as a fallback for some providers.
 */
function prepareStaticRoutes() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('Error: dist directory does not exist. Run build:web first.');
        process.exit(1);
    }

    const indexPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error('Error: dist/index.html not found.');
        process.exit(1);
    }

    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // 1. Create 404.html (standard for GitHub Pages, etc.)
    fs.writeFileSync(path.join(DIST_DIR, '404.html'), indexContent);
    console.log('✓ Created 404.html');

    // 2. Create physical routes
    ROUTES.forEach(route => {
        const routeDir = path.join(DIST_DIR, route);
        if (!fs.existsSync(routeDir)) {
            fs.mkdirSync(routeDir, { recursive: true });
        }
        fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent);
        console.log(`✓ Created static route for /${route}`);
    });

    console.log('Static routes preparation complete.');
}

prepareStaticRoutes();
