/**
 * Component File Analyzer
 * Parses @Component decorated TypeScript files
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
        const isStandalone = /standalone:\s*true/.test(fileContent);
        const dependencies = extractConstructorDependencies(fileContent);

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
            const injectMatch = param.match(/(?:private|public|protected)\s+\w+\s*:\s*(\w+)/);
            if (injectMatch && injectMatch[1]) {
                dependencies.push(injectMatch[1]);
            }
        }
    }
    return [...new Set(dependencies)];
}

export async function analyzeAllComponents(): Promise<AngularComponent[]> {
    const componentUris = await fileUtils.findComponentFiles();
    const components: AngularComponent[] = [];

    for (const uri of componentUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const component = await analyzeComponentFile(uri, content);
            if (component) {
                components.push(component);
            }
        } catch (error) {
            console.error(`Failed to analyze component at ${uri.fsPath}:`, error);
        }
    }
    return components;
}