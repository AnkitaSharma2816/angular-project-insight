import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { generatePdf } from './utils/pdfGenerator';

export function activate(context: vscode.ExtensionContext) {
    console.log('Angular Project Insight extension is now active');

    let disposable = vscode.commands.registerCommand('angular-project-insight.generateReport', async () => {
        await generateFullReport();
    });

    context.subscriptions.push(disposable);
}

async function generateFullReport() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace first');
        return;
    }

    const format = await vscode.window.showQuickPick(
        ['Markdown', 'PDF', 'Both (Markdown + PDF)'],
        { placeHolder: 'Select output format for the report' }
    );

    if (!format) return;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Angular Project Report...',
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: 'Scanning project files...' });
        
        const reportContent = await generateDetailedReportContent(workspaceFolder.uri.fsPath);
        
        progress.report({ increment: 50, message: 'Creating report files...' });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const baseFileName = `angular-insight-${timestamp}`;
        const workspacePath = workspaceFolder.uri.fsPath;

        try {
            if (format === 'Markdown') {
                const outputPath = path.join(workspacePath, `${baseFileName}.md`);
                fs.writeFileSync(outputPath, reportContent);
                progress.report({ increment: 100, message: 'Complete!' });
                
                const openReport = await vscode.window.showInformationMessage(
                    `✅ Report saved: ${path.basename(outputPath)}`,
                    'Open Report'
                );
                
                if (openReport === 'Open Report') {
                    const doc = await vscode.workspace.openTextDocument(outputPath);
                    await vscode.window.showTextDocument(doc);
                }
            } 
            else if (format === 'PDF') {
                const outputPath = path.join(workspacePath, `${baseFileName}.pdf`);
                await generatePdf(reportContent, outputPath);
                progress.report({ increment: 100, message: 'Complete!' });
            }
            else if (format === 'Both (Markdown + PDF)') {
                const mdPath = path.join(workspacePath, `${baseFileName}.md`);
                const pdfPath = path.join(workspacePath, `${baseFileName}.pdf`);
                
                fs.writeFileSync(mdPath, reportContent);
                await generatePdf(reportContent, pdfPath);
                
                progress.report({ increment: 100, message: 'Complete!' });
                
                vscode.window.showInformationMessage(`✅ Reports saved to: ${workspacePath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate report: ${error}`);
            console.error('Report generation error:', error);
        }
    });
}

async function generateDetailedReportContent(projectPath: string): Promise<string> {
    console.log('Scanning project:', projectPath);
    
    // Get project name and description from package.json
    let projectName = path.basename(projectPath);
    let projectDescription = 'No description provided';
    let projectVersion = '1.0.0';
    let projectAuthor = 'Unknown';
    let projectLicense = 'Unknown';
    let projectKeywords: string[] = [];
    
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            projectName = packageJson.name || projectName;
            projectDescription = packageJson.description || 'No description provided';
            projectVersion = packageJson.version || '1.0.0';
            projectAuthor = packageJson.author || 'Unknown';
            projectLicense = packageJson.license || 'Unknown';
            projectKeywords = packageJson.keywords || [];
        }
    } catch (error) {
        console.error('Error reading package.json:', error);
    }
    
    // Scan all file types
    const components = await findFiles(projectPath, /\.component\.ts$/);
    const services = await findFiles(projectPath, /\.service\.ts$/);
    const modules = await findFiles(projectPath, /\.module\.ts$/);
    const routeFiles = await findFiles(projectPath, /-routing\.module\.ts$|\.routes\.ts$/);
    const guards = await findFiles(projectPath, /\.guard\.ts$/);
    const interceptors = await findFiles(projectPath, /\.interceptor\.ts$/);
    const pipes = await findFiles(projectPath, /\.pipe\.ts$/);
    const directives = await findFiles(projectPath, /\.directive\.ts$/);
    
    // Scan assets
    const images = await findFiles(projectPath, /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i);
    const fonts = await findFiles(projectPath, /\.(ttf|otf|woff|woff2|eot)$/i);
    const styles = await findFiles(projectPath, /\.(css|scss|sass|less)$/i);
    const scripts = await findFiles(projectPath, /\.(js|ts)$/i);
    
    // Scan translation files
    const translationFiles = await findFiles(projectPath, /\.(json|xliff|xlf|po|mo)$/i);
    const i18nFolders = await findI18nFolders(projectPath);
    const translationKeys = await extractTranslationKeys(projectPath);
    
    // Scan configuration files
    const configFiles = await findConfigFiles(projectPath);
    
    // Get Angular version
    let angularVersion = 'Not detected';
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            angularVersion = packageJson.dependencies?.['@angular/core'] || 
                            packageJson.devDependencies?.['@angular/core'] || 
                            'Not found';
            angularVersion = angularVersion.replace(/[\^~]/g, '');
        }
    } catch (error) {
        console.error('Error reading package.json:', error);
    }
    
    let content = `# 📊 Angular Project Insight Report\n\n`;
    content += `## 📋 Project Information\n\n`;
    content += `| Property | Value |\n`;
    content += `|----------|-------|\n`;
    content += `| **Project Name** | ${projectName} |\n`;
    content += `| **Version** | ${projectVersion} |\n`;
    content += `| **Description** | ${projectDescription} |\n`;
    content += `| **Author** | ${projectAuthor} |\n`;
    content += `| **License** | ${projectLicense} |\n`;
    content += `| **Angular Version** | ${angularVersion} |\n`;
    if (projectKeywords.length > 0) {
        content += `| **Keywords** | ${projectKeywords.join(', ')} |\n`;
    }
    content += `\n> **Generated:** ${new Date().toLocaleString()}\n\n`;
    content += `---\n\n`;
    
    // Project Statistics Dashboard
    content += `## 📈 Project Statistics\n\n`;
    content += `| Category | Count |\n`;
    content += `|----------|-------|\n`;
    content += `| **Components** | ${components.length} |\n`;
    content += `| **Services** | ${services.length} |\n`;
    content += `| **Modules** | ${modules.length} |\n`;
    content += `| **Route Files** | ${routeFiles.length} |\n`;
    content += `| **Guards** | ${guards.length} |\n`;
    content += `| **Interceptors** | ${interceptors.length} |\n`;
    content += `| **Pipes** | ${pipes.length} |\n`;
    content += `| **Directives** | ${directives.length} |\n\n`;
    
    // Assets Section
    content += `## 🎨 Assets & Resources\n\n`;
    content += `| Type | Count |\n`;
    content += `|------|-------|\n`;
    content += `| **Images** | ${images.length} |\n`;
    content += `| **Fonts** | ${fonts.length} |\n`;
    content += `| **Styles (CSS/SCSS)** | ${styles.length} |\n`;
    content += `| **Scripts** | ${scripts.length} |\n\n`;
    
    if (images.length > 0) {
        content += `### 📷 Images\n\n`;
        images.slice(0, 15).forEach(img => {
            const relativePath = path.relative(projectPath, img);
            content += `- \`${relativePath}\`\n`;
        });
        if (images.length > 15) {
            content += `\n*... and ${images.length - 15} more images*\n`;
        }
        content += `\n`;
    }
    
    if (fonts.length > 0) {
        content += `### 🔤 Fonts\n\n`;
        fonts.slice(0, 15).forEach(font => {
            const relativePath = path.relative(projectPath, font);
            content += `- \`${relativePath}\`\n`;
        });
        content += `\n`;
    }
    
    // Internationalization / Translation Section
    content += `## 🌐 Internationalization (i18n)\n\n`;
    content += `| Language Files | Count |\n`;
    content += `|---------------|-------|\n`;
    content += `| **Translation Files** | ${translationFiles.length} |\n`;
    content += `| **i18n Folders** | ${i18nFolders.length} |\n`;
    content += `| **Translation Keys** | ${translationKeys.length} |\n\n`;
    
    if (translationFiles.length > 0) {
        content += `### 📄 Translation Files\n\n`;
        translationFiles.slice(0, 20).forEach(file => {
            const relativePath = path.relative(projectPath, file);
            const language = detectLanguageFromPath(relativePath);
            content += `- **${language}** : \`${relativePath}\`\n`;
        });
        content += `\n`;
    }
    
    if (i18nFolders.length > 0) {
        content += `### 📁 i18n Folders\n\n`;
        i18nFolders.forEach(folder => {
            const relativePath = path.relative(projectPath, folder);
            content += `- \`${relativePath}\`\n`;
        });
        content += `\n`;
    }
    
    if (translationKeys.length > 0) {
        content += `### 🔑 Sample Translation Keys\n\n`;
        translationKeys.slice(0, 20).forEach(key => {
            content += `- \`${key}\`\n`;
        });
        if (translationKeys.length > 20) {
            content += `\n*... and ${translationKeys.length - 20} more keys*\n`;
        }
        content += `\n`;
    } else {
        content += `*No translation keys detected. Consider adding i18n support for multiple languages.*\n\n`;
    }
    
    // Configuration Files Section
    content += `## ⚙️ Configuration Files\n\n`;
    content += `| File | Purpose |\n`;
    content += `|------|---------|\n`;
    for (const [file, purpose] of configFiles) {
        const relativePath = path.relative(projectPath, file);
        content += `| \`${relativePath}\` | ${purpose} |\n`;
    }
    content += `\n`;
    
    // Components Section
    if (components.length > 0) {
        content += `## 🧩 Components (${components.length})\n\n`;
        content += `| # | Component Name | Path |\n`;
        content += `|---|----------------|------|\n`;
        
        const sortedComponents = components.sort();
        sortedComponents.forEach((comp, index) => {
            const name = path.basename(comp).replace('.component.ts', '');
            let relativePath = path.relative(projectPath, comp);
            if (relativePath.length > 50) {
                relativePath = '...' + relativePath.slice(-47);
            }
            content += `| ${index + 1} | \`${name}\` | \`${relativePath}\` |\n`;
        });
        content += `\n`;
    }
    
    // Services Section
    if (services.length > 0) {
        content += `## 🔧 Services (${services.length})\n\n`;
        content += `| # | Service Name | Path |\n`;
        content += `|---|---------------|------|\n`;
        
        const sortedServices = services.sort();
        sortedServices.forEach((service, index) => {
            const name = path.basename(service).replace('.service.ts', '');
            let relativePath = path.relative(projectPath, service);
            if (relativePath.length > 50) {
                relativePath = '...' + relativePath.slice(-47);
            }
            content += `| ${index + 1} | \`${name}\` | \`${relativePath}\` |\n`;
        });
        content += `\n`;
    }
    
    // Project Structure
    content += `## 📁 Project Structure\n\n`;
    content += `\`\`\`\n`;
    content += getFileTree(projectPath, '', true, 2);
    content += `\`\`\`\n\n`;
    
    // What This Project Does
    content += `## 🎯 What This Project Does\n\n`;
    content += await generateProjectDescription(projectPath, components, services, routeFiles);
    
    // Project Setup Guide
    content += await generateProjectSetupGuide(projectPath);
    
    // Recommendations
    content += `## 💡 Recommendations\n\n`;
    const recommendations = generateRecommendations(components, services, modules, routeFiles, translationFiles);
    recommendations.forEach(rec => content += `${rec}\n`);
    
    // Footer
    content += `\n---\n`;
    content += `*Report generated by Angular Project Insight Extension for VS Code*\n`;
    content += `*To learn more about your project, review the components, services, and modules listed above.*\n`;
    
    return content;
}

async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
    const results: string[] = [];
    
    function scan(directory: string) {
        try {
            const items = fs.readdirSync(directory);
            for (const item of items) {
                if (item === 'node_modules' || item === 'dist' || item === '.angular' || item === '.git') {
                    continue;
                }
                const fullPath = path.join(directory, item);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scan(fullPath);
                    } else if (pattern.test(item)) {
                        results.push(fullPath);
                    }
                } catch (error) {
                    // Skip inaccessible files
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }
    
    scan(dir);
    return results;
}

async function findI18nFolders(projectPath: string): Promise<string[]> {
    const folders: string[] = [];
    
    function scanDirectory(dir: string, depth: number = 0) {
        if (depth > 5) return;
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item === 'node_modules' || item === 'dist' || item === '.angular') continue;
                const fullPath = path.join(dir, item);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (item === 'i18n' || item === 'locale' || item === 'translations') {
                            if (!folders.includes(fullPath)) {
                                folders.push(fullPath);
                            }
                        }
                        scanDirectory(fullPath, depth + 1);
                    }
                } catch (error) {
                    // Skip
                }
            }
        } catch (error) {
            // Skip
        }
    }
    
    scanDirectory(projectPath);
    return folders;
}

async function extractTranslationKeys(projectPath: string): Promise<string[]> {
    const keys = new Set<string>();
    
    const translationJsonFiles = await findFiles(projectPath, /\.(json)$/i);
    
    for (const file of translationJsonFiles) {
        if (file.includes('i18n') || file.includes('locale') || file.includes('translations')) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const json = JSON.parse(content);
                extractKeysFromObject(json, keys);
            } catch (error) {
                // Skip invalid JSON
            }
        }
    }
    
    const tsFiles = await findFiles(projectPath, /\.ts$/);
    for (const file of tsFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const localizeMatches = content.match(/\$localize\s*`[^`]*`/g);
            if (localizeMatches) {
                localizeMatches.forEach(match => {
                    const keyMatch = match.match(/:\s*([a-zA-Z_][a-zA-Z0-9_]*):/);
                    if (keyMatch) {
                        keys.add(keyMatch[1]);
                    }
                });
            }
        } catch (error) {
            // Skip
        }
    }
    
    return Array.from(keys).slice(0, 100);
}

function extractKeysFromObject(obj: any, keys: Set<string>, prefix: string = '') {
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.add(fullKey);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            extractKeysFromObject(obj[key], keys, fullKey);
        }
    }
}

function detectLanguageFromPath(filePath: string): string {
    const languageMap: Record<string, string> = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
        'zh': 'Chinese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi'
    };
    
    for (const [code, name] of Object.entries(languageMap)) {
        if (filePath.includes(`/${code}/`) || filePath.includes(`-${code}.`) || filePath.includes(`_${code}.`)) {
            return name;
        }
    }
    return 'Unknown';
}

async function findConfigFiles(projectPath: string): Promise<Map<string, string>> {
    const configs = new Map<string, string>();
    
    const configPatterns: [string, string][] = [
        ['angular.json', 'Angular CLI Configuration'],
        ['package.json', 'NPM Dependencies & Scripts'],
        ['tsconfig.json', 'TypeScript Configuration'],
        ['tsconfig.app.json', 'TypeScript App Configuration'],
        ['tsconfig.spec.json', 'TypeScript Test Configuration'],
        ['.eslintrc.json', 'ESLint Rules'],
        ['.prettierrc', 'Prettier Formatting'],
        ['karma.conf.js', 'Karma Test Runner'],
        ['jest.config.js', 'Jest Test Configuration'],
        ['cypress.config.ts', 'Cypress E2E Tests'],
        ['proxy.conf.json', 'API Proxy Configuration'],
        ['.browserslistrc', 'Browser Support'],
        ['tailwind.config.js', 'Tailwind CSS Configuration'],
        ['webpack.config.js', 'Webpack Configuration']
    ];
    
    for (const [filename, description] of configPatterns) {
        const fullPath = path.join(projectPath, filename);
        if (fs.existsSync(fullPath)) {
            configs.set(fullPath, description);
        }
    }
    
    return configs;
}

async function generateProjectDescription(projectPath: string, components: string[], services: string[], routes: string[]): Promise<string> {
    let description = '';
    
    const componentNames = components.map(c => path.basename(c).replace('.component.ts', '').toLowerCase());
    const serviceNames = services.map(s => path.basename(s).replace('.service.ts', '').toLowerCase());
    
    const hasAuth = componentNames.some(n => n.includes('login') || n.includes('auth') || n.includes('register'));
    const hasDashboard = componentNames.some(n => n.includes('dashboard') || n.includes('home'));
    const hasAdmin = componentNames.some(n => n.includes('admin'));
    const hasUser = componentNames.some(n => n.includes('user') || n.includes('profile'));
    const hasProduct = componentNames.some(n => n.includes('product') || n.includes('item') || n.includes('catalog'));
    const hasCart = componentNames.some(n => n.includes('cart') || n.includes('checkout'));
    const hasApi = serviceNames.some(n => n.includes('api') || n.includes('http') || n.includes('data'));
    const hasAuthService = serviceNames.some(n => n.includes('auth') || n.includes('login'));
    
    if (hasAuth && hasDashboard && hasUser) {
        description += `- **User Management System**: This project includes authentication, user profiles, and dashboards.\n`;
    }
    if (hasProduct && hasCart) {
        description += `- **E-commerce Platform**: Product catalog, shopping cart, and checkout functionality detected.\n`;
    }
    if (hasAdmin) {
        description += `- **Admin Dashboard**: Administrative features and management interfaces.\n`;
    }
    if (hasApi) {
        description += `- **API Integration**: Services for communicating with backend APIs.\n`;
    }
    if (hasAuthService) {
        description += `- **Authentication & Authorization**: User login, registration, and protected routes.\n`;
    }
    
    if (description === '') {
        description = `- **Web Application**: This is an Angular application with ${components.length} components and ${services.length} services.\n`;
    }
    
    description += `\n### Key Features\n\n`;
    description += `- **Components**: ${components.length} reusable UI components\n`;
    description += `- **Services**: ${services.length} business logic and data services\n`;
    description += `- **Routes**: ${routes.length} route configuration(s)\n`;
    
    return description;
}

async function generateProjectSetupGuide(projectPath: string): Promise<string> {
    let setupGuide = `## 🚀 Project Setup Guide\n\n`;
    
    let scripts: Record<string, string> = {};
    let dependencies: Record<string, string> = {};
    let angularVersion = 'latest';
    
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            scripts = packageJson.scripts || {};
            dependencies = packageJson.dependencies || {};
            angularVersion = dependencies['@angular/core'] || 'latest';
            angularVersion = angularVersion.replace(/[\^~]/g, '');
        }
    } catch (error) {
        console.error('Error reading package.json:', error);
    }
    
    const hasYarnLock = fs.existsSync(path.join(projectPath, 'yarn.lock'));
    const hasPnpmLock = fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'));
    
    let packageManager = 'npm';
    let installCommand = 'npm install';
    
    if (hasYarnLock) {
        packageManager = 'yarn';
        installCommand = 'yarn install';
    } else if (hasPnpmLock) {
        packageManager = 'pnpm';
        installCommand = 'pnpm install';
    }
    
    setupGuide += `### 📋 Prerequisites\n\n`;
    setupGuide += `| Requirement | Version | Check Command |\n`;
    setupGuide += `|-------------|---------|---------------|\n`;
    setupGuide += `| **Node.js** | 18.x or higher | \`node --version\` |\n`;
    setupGuide += `| **npm** | 9.x or higher | \`npm --version\` |\n`;
    setupGuide += `| **Angular CLI** | ${angularVersion} | \`ng version\` |\n`;
    setupGuide += `| **Package Manager** | ${packageManager} | \`${packageManager} --version\` |\n\n`;
    
    setupGuide += `### 📦 Installation\n\n`;
    setupGuide += `1. **Clone the repository** (if applicable):\n`;
    setupGuide += `   \`\`\`bash\n   git clone <repository-url>\n   cd ${path.basename(projectPath)}\n   \`\`\`\n\n`;
    setupGuide += `2. **Install dependencies**:\n`;
    setupGuide += `   \`\`\`bash\n   ${installCommand}\n   \`\`\`\n\n`;
    
    const hasEnvExample = fs.existsSync(path.join(projectPath, '.env.example'));
    if (hasEnvExample) {
        setupGuide += `### 🔧 Environment Configuration\n\n`;
        setupGuide += `1. Copy the example environment file:\n`;
        setupGuide += `   \`\`\`bash\n   cp .env.example .env\n   \`\`\`\n\n`;
        setupGuide += `2. Update the \`.env\` file with your specific configuration values.\n\n`;
    }
    
    setupGuide += `### 🏃‍♂️ Running the Application\n\n`;
    setupGuide += `| Command | Description |\n`;
    setupGuide += `|---------|-------------|\n`;
    
    if (scripts['start']) {
        setupGuide += `| \`${packageManager} run start\` | Starts the development server |\n`;
    } else {
        setupGuide += `| \`ng serve\` | Starts the development server |\n`;
    }
    
    if (scripts['build']) {
        setupGuide += `| \`${packageManager} run build\` | Builds the application for production |\n`;
    }
    if (scripts['test']) {
        setupGuide += `| \`${packageManager} run test\` | Runs unit tests |\n`;
    }
    if (scripts['lint']) {
        setupGuide += `| \`${packageManager} run lint\` | Lints the codebase |\n`;
    }
    
    setupGuide += `\n**Development server:**\n`;
    setupGuide += `- Navigate to \`http://localhost:4200/\`\n`;
    setupGuide += `- The app will automatically reload if you change any source files\n\n`;
    
    setupGuide += `### 📦 Building for Production\n\n`;
    setupGuide += `\`\`\`bash\n${scripts['build'] ? `${packageManager} run build` : 'ng build --prod'}\n\`\`\`\n\n`;
    setupGuide += `The build artifacts will be stored in the \`dist/\` directory.\n\n`;
    
    setupGuide += `### 🔧 Troubleshooting\n\n`;
    setupGuide += `| Issue | Solution |\n`;
    setupGuide += `|-------|----------|\n`;
    setupGuide += `| **Node version mismatch** | Use \`nvm use\` or install Node.js ${angularVersion} |\n`;
    setupGuide += `| **Port 4200 already in use** | Run \`ng serve --port 4201\` |\n`;
    setupGuide += `| **Module not found errors** | Delete \`node_modules\` and run \`${installCommand}\` again |\n`;
    setupGuide += `| **Build fails** | Clear cache: \`${packageManager} cache clean --force\` and rebuild |\n\n`;
    
    setupGuide += `### 🔗 Useful Links\n\n`;
    setupGuide += `- [Angular Documentation](https://angular.io/docs)\n`;
    setupGuide += `- [Angular CLI Reference](https://angular.io/cli)\n`;
    
    return setupGuide;
}

function generateRecommendations(components: string[], services: string[], modules: string[], routes: string[], translationFiles: string[]): string[] {
    const recommendations: string[] = [];
    
    if (components.length === 0) {
        recommendations.push(`- ⚠️ **No components detected**. Run \`ng generate component component-name\` to create one.`);
    }
    if (services.length === 0) {
        recommendations.push(`- ⚠️ **No services detected**. Run \`ng generate service service-name\` to create one.`);
    }
    if (routes.length === 0) {
        recommendations.push(`- ⚠️ **No routing configuration**. Consider adding routing for better navigation.`);
    }
    if (components.length > 30) {
        recommendations.push(`- 📦 **Large component count (${components.length})**. Consider organizing into feature modules.`);
    }
    if (translationFiles.length === 0) {
        recommendations.push(`- 🌐 **No i18n files found**. Consider adding internationalization for multi-language support.`);
    }
    
    if (recommendations.length === 0) {
        recommendations.push(`- ✅ **Looking good!** Your Angular project follows best practices.`);
    }
    
    return recommendations;
}

function getFileTree(dirPath: string, prefix: string = '', isLast: boolean = true, maxDepth: number = 2, currentDepth: number = 0): string {
    if (currentDepth >= maxDepth) {
        return prefix + (isLast ? '└── ' : '├── ') + '...\n';
    }
    
    let tree = '';
    
    try {
        const items = fs.readdirSync(dirPath)
            .filter(item => {
                if (item.startsWith('.') && item !== '.env') return false;
                if (item === 'node_modules' || item === 'dist' || item === '.angular') return false;
                return true;
            })
            .slice(0, 25);
        
        const total = items.length;
        
        items.forEach((item, index) => {
            const isLastItem = index === total - 1;
            const fullPath = path.join(dirPath, item);
            let isDirectory = false;
            
            try {
                isDirectory = fs.statSync(fullPath).isDirectory();
            } catch {
                isDirectory = false;
            }
            
            let displayItem = item;
            if (item === 'package.json') displayItem = '📦 ' + item;
            else if (item === 'angular.json') displayItem = '🎯 ' + item;
            else if (item.includes('i18n') || item.includes('locale')) displayItem = '🌐 ' + item;
            else if (item.endsWith('.component.ts')) displayItem = '🧩 ' + item;
            else if (item.endsWith('.service.ts')) displayItem = '🔧 ' + item;
            else if (item.endsWith('.module.ts')) displayItem = '📦 ' + item;
            else if (item.endsWith('.guard.ts')) displayItem = '🔐 ' + item;
            else if (item.endsWith('.interceptor.ts')) displayItem = '📡 ' + item;
            else if (item.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) displayItem = '🖼️ ' + item;
            else if (item.match(/\.(json)$/i)) displayItem = '📋 ' + item;
            else if (item.match(/\.(css|scss|sass|less)$/i)) displayItem = '🎨 ' + item;
            
            tree += prefix + (isLast ? '└── ' : '├── ') + displayItem + (isDirectory ? '/' : '') + '\n';
            
            if (isDirectory && currentDepth + 1 < maxDepth) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                tree += getFileTree(fullPath, newPrefix, isLastItem, maxDepth, currentDepth + 1);
            }
        });
    } catch (error) {
        tree = prefix + (isLast ? '└── ' : '├── ') + '(unable to read)\n';
    }
    
    return tree;
}

export function deactivate() {}