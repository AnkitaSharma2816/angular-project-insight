/**
 * Component File Analyzer
 * Parses @Component decorated TypeScript files
 * Supports Angular 7 through Angular 21
 */

import * as vscode from 'vscode';
import * as fileUtils from '../utils/fileUtils';

export interface AngularComponent {
    filePath: string;
    name: string;
    selector: string;
    dependencies: string[];
    templateUrl: string | null;
    styleUrls: string[];
    isStandalone: boolean;
    parentModule: string | null;
    route: string | null;
    usesSignals: boolean;
    usesNewControlFlow: boolean;
    minAngularVersion: number;
}

export async function analyzeComponentFile(
    uri: vscode.Uri,
    fileContent: string
): Promise<AngularComponent | null> {
    try {
        const filePath = fileUtils.getAbsolutePath(uri);
        const className = extractClassName(fileContent);

        if (!className) {
            console.warn(`No class definition found in ${filePath}`);
            return null;
        }

        const componentMatch = fileContent.match(/@Component\(\{([\s\S]*?)\}\)/m);
        if (!componentMatch) {
            console.warn(`No @Component decorator found in ${filePath}`);
            return null;
        }

        const selector = extractSelector(fileContent) || className;
        const templateUrl = extractTemplateUrl(fileContent);
        const styleUrls = extractStyleUrls(fileContent);
        const isStandalone = isStandaloneComponent(fileContent);
        const dependencies = extractConstructorDependencies(fileContent);
        
        // Detect new features (Angular 14+, 16+, 17+)
        const usesSignals = detectSignals(fileContent);
        const usesNewControlFlow = detectNewControlFlow(fileContent);
        
        // Determine minimum Angular version
        let minAngularVersion = 7; // Base Angular 7
        if (isStandalone) minAngularVersion = 14; // Standalone (Angular 14+)
        if (usesSignals) minAngularVersion = 16; // Signals (Angular 16+)
        if (usesNewControlFlow) minAngularVersion = 17; // New control flow (Angular 17+)

        return {
            filePath,
            name: className,
            selector,
            dependencies,
            templateUrl,
            styleUrls,
            isStandalone,
            parentModule: null,
            route: null,
            usesSignals,
            usesNewControlFlow,
            minAngularVersion,
        };
    } catch (error) {
        console.error(`Error analyzing component ${uri.fsPath}:`, error);
        return null;
    }
}

function extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
}

function extractSelector(fileContent: string): string | null {
    const match = fileContent.match(/selector:\s*['"`]([^'"`]*)['"`]/);
    return match ? match[1] : null;
}

function extractTemplateUrl(fileContent: string): string | null {
    const match = fileContent.match(/templateUrl:\s*['"`]([^'"`]*)['"`]/);
    if (!match) return null;
    let url = match[1];
    if (url.startsWith('./')) url = url.substring(2);
    return url;
}

function extractStyleUrls(fileContent: string): string[] {
    const match = fileContent.match(/styleUrls:\s*\[\s*([^\]]*?)\s*\]/s);
    if (!match) return [];
    
    const urls: string[] = [];
    const urlMatches = match[1].matchAll(/['"`]([^'"`]+)['"`]/g);
    for (const urlMatch of urlMatches) {
        let url = urlMatch[1];
        if (url.startsWith('./')) url = url.substring(2);
        urls.push(url);
    }
    return urls;
}

function extractConstructorDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const constructorMatch = content.match(/constructor\(([^)]*)\)/);
    
    if (constructorMatch) {
        const params = constructorMatch[1].split(',');
        for (const param of params) {
            // Match private name: Type, public name: Type, protected name: Type
            const injectMatch = param.match(/(?:private|public|protected)\s+\w+\s*:\s*(\w+)/);
            if (injectMatch && injectMatch[1]) {
                dependencies.push(injectMatch[1]);
            }
            // Match simple injection: name: Type
            const simpleMatch = param.match(/^\s*(\w+)\s*:\s*(\w+)/);
            if (simpleMatch && simpleMatch[2] && !simpleMatch[1].match(/private|public|protected/)) {
                dependencies.push(simpleMatch[2]);
            }
        }
    }
    return [...new Set(dependencies)];
}

function isStandaloneComponent(content: string): boolean {
    return /standalone:\s*true/.test(content);
}

function detectSignals(content: string): boolean {
    // Check for signal imports and usage
    const hasSignalImport = /import\s*\{[^}]*\b(?:signal|computed|effect)\b[^}]*\}\s*from\s*['"]@angular\/core['"]/.test(content);
    const hasSignalUsage = /\b(?:signal|computed|effect)\s*\(/.test(content);
    const hasInputSignal = /input\s*\(/.test(content) || /output\s*\(/.test(content);
    
    return hasSignalImport || hasSignalUsage || hasInputSignal;
}

function detectNewControlFlow(content: string): boolean {
    // Check for new @ syntax for control flow (Angular 17+)
    const hasNewIf = /@if\s*\(/.test(content);
    const hasNewFor = /@for\s*\(/.test(content);
    const hasNewSwitch = /@switch\s*\(/.test(content);
    const hasDefer = /@defer\s*\{/.test(content);
    
    return hasNewIf || hasNewFor || hasNewSwitch || hasDefer;
}

export async function analyzeAllComponents(): Promise<AngularComponent[]> {
    const componentUris = await fileUtils.findComponentFiles();
    const components: AngularComponent[] = [];

    console.log(`🔍 Scanning ${componentUris.length} component file(s)...`);

    for (const uri of componentUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const component = await analyzeComponentFile(uri, content);
            if (component) {
                components.push(component);
                console.log(`   ✅ ${component.name} (Standalone: ${component.isStandalone}, Signals: ${component.usesSignals})`);
            }
        } catch (error) {
            console.error(`Failed to analyze component at ${uri.fsPath}:`, error);
        }
    }
    
    console.log(`✅ Total components analyzed: ${components.length}`);
    return components;
}