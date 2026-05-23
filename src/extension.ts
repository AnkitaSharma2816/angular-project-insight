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
    // Detailed file scanning
    console.log('Scanning project:', projectPath);
    
    const components = await findFiles(projectPath, /\.component\.ts$/);
    const services = await findFiles(projectPath, /\.service\.ts$/);
    const modules = await findFiles(projectPath, /\.module\.ts$/);
    const routeFiles = await findFiles(projectPath, /-routing\.module\.ts$|\.routes\.ts$/);
    const guards = await findFiles(projectPath, /\.guard\.ts$/);
    const interceptors = await findFiles(projectPath, /\.interceptor\.ts$/);
    const pipes = await findFiles(projectPath, /\.pipe\.ts$/);
    const directives = await findFiles(projectPath, /\.directive\.ts$/);
    
    console.log(`Found: ${components.length} components, ${services.length} services, ${modules.length} modules`);
    
    // Get Angular version
    let angularVersion = 'Not detected';
    let projectName = path.basename(projectPath);
    
    try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            angularVersion = packageJson.dependencies?.['@angular/core'] || 
                            packageJson.devDependencies?.['@angular/core'] || 
                            'Not found';
            angularVersion = angularVersion.replace(/[\^~]/g, '');
            projectName = packageJson.name || projectName;
        }
    } catch (error) {
        console.error('Error reading package.json:', error);
    }
    
    let content = `# 📊 Angular Project Insight Report\n\n`;
    content += `> **Project:** ${projectName}\n`;
    content += `> **Generated:** ${new Date().toLocaleString()}\n\n`;
    content += `---\n\n`;
    
    // Quick Stats Dashboard
    content += `## 📈 Project Statistics\n\n`;
    content += `| Category | Count |\n`;
    content += `|----------|-------|\n`;
    content += `| **Angular Version** | ${angularVersion} |\n`;
    content += `| **Components** | ${components.length} |\n`;
    content += `| **Services** | ${services.length} |\n`;
    content += `| **Modules** | ${modules.length} |\n`;
    content += `| **Route Files** | ${routeFiles.length} |\n`;
    content += `| **Guards** | ${guards.length} |\n`;
    content += `| **Interceptors** | ${interceptors.length} |\n`;
    content += `| **Pipes** | ${pipes.length} |\n`;
    content += `| **Directives** | ${directives.length} |\n\n`;
    
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
    
    // Modules Section
    if (modules.length > 0) {
        content += `## 📦 Modules (${modules.length})\n\n`;
        content += `| # | Module Name | Path |\n`;
        content += `|---|--------------|------|\n`;
        
        const sortedModules = modules.sort();
        sortedModules.forEach((module, index) => {
            const name = path.basename(module).replace('.module.ts', '');
            let relativePath = path.relative(projectPath, module);
            if (relativePath.length > 50) {
                relativePath = '...' + relativePath.slice(-47);
            }
            content += `| ${index + 1} | \`${name}\` | \`${relativePath}\` |\n`;
        });
        content += `\n`;
    }
    
    // Route Files Section
    if (routeFiles.length > 0) {
        content += `## 🛣️ Routing Configuration\n\n`;
        content += `| # | File | Path |\n`;
        content += `|---|------|------|\n`;
        
        routeFiles.sort().forEach((route, index) => {
            const name = path.basename(route);
            let relativePath = path.relative(projectPath, route);
            if (relativePath.length > 50) {
                relativePath = '...' + relativePath.slice(-47);
            }
            content += `| ${index + 1} | \`${name}\` | \`${relativePath}\` |\n`;
        });
        content += `\n`;
        
        // Try to parse routes from the main routing file
        const mainRouteFile = routeFiles.find(r => r.includes('app-routing.module.ts'));
        if (mainRouteFile) {
            content += await extractRoutesFromFile(mainRouteFile);
        }
    } else {
        content += `## 🛣️ Routing\n\n`;
        content += `*No routing files detected. To add routing:*\n`;
        content += `\`\`\`bash\nng generate module app-routing --flat --module=app\n\`\`\`\n\n`;
    }
    
    // Project Structure
    content += `## 📁 Project Structure\n\n`;
    content += `\`\`\`\n`;
    content += getFileTree(projectPath, '', true, 2);
    content += `\`\`\`\n\n`;
    
    // Summary
    content += `## 📊 Summary\n\n`;
    const totalAngularFiles = components.length + services.length + modules.length + 
                              routeFiles.length + guards.length + interceptors.length;
    content += `- **Total Angular files detected:** ${totalAngularFiles}\n`;
    content += `- **Project root:** \`${projectPath}\`\n`;
    content += `- **Analysis completed:** ${new Date().toLocaleString()}\n\n`;
    
    // Recommendations
    content += `## 💡 Recommendations\n\n`;
    if (components.length === 0) {
        content += `- ⚠️ No components detected. Run \`ng generate component component-name\` to create one.\n`;
    }
    if (services.length === 0) {
        content += `- ⚠️ No services detected. Run \`ng generate service service-name\` to create one.\n`;
    }
    if (routeFiles.length === 0) {
        content += `- ⚠️ No routing configuration. Consider adding routing for better navigation.\n`;
    }
    if (components.length > 20) {
        content += `- ✅ Large component count (${components.length}). Consider organizing into feature modules.\n`;
    }
    if (content.includes('lazy')) {
        content += `- ✅ Lazy loading detected! Good for performance optimization.\n`;
    }
    
    content += `\n---\n`;
    content += `*Report generated by Angular Project Insight Extension for VS Code*\n`;
    
    return content;
}

async function extractRoutesFromFile(routeFilePath: string): Promise<string> {
    try {
        const content = fs.readFileSync(routeFilePath, 'utf8');
        const routeMatches = content.match(/path:\s*['"`]([^'"`]*)['"`]/g);
        
        if (routeMatches && routeMatches.length > 0) {
            let routesContent = `\n### Detected Routes\n\n`;
            routesContent += `| # | Route Path |\n`;
            routesContent += `|---|------------|\n`;
            
            const paths = routeMatches.map(m => m.replace(/path:\s*['"`]/, '').replace(/['"`]/, ''));
            paths.forEach((route, idx) => {
                if (route && route !== '**') {
                    routesContent += `| ${idx + 1} | \`${route}\` |\n`;
                }
            });
            routesContent += `\n`;
            return routesContent;
        }
        return '';
    } catch (error) {
        return '';
    }
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
            .slice(0, 20);
        
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
            
            tree += prefix + (isLast ? '└── ' : '├── ') + item + (isDirectory ? '/' : '') + '\n';
            
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