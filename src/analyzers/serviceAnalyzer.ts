/**
 * Service File Analyzer
 * Parses @Injectable decorated TypeScript files
 */

import * as vscode from 'vscode';
import * as fileUtils from '../utils/fileUtils';

export interface AngularService {
    filePath: string;
    name: string;
    providedIn: string | null;
    dependencies: string[];
    httpMethods: string[];
    apiEndpoints: string[];
}

export async function analyzeServiceFile(
    uri: vscode.Uri,
    fileContent: string
): Promise<AngularService | null> {
    try {
        const filePath = fileUtils.getAbsolutePath(uri);
        const className = extractClassName(fileContent);

        if (!className) {
            console.warn(`No class definition found in ${filePath}`);
            return null;
        }

        if (!fileContent.includes('@Injectable')) {
            console.warn(`No @Injectable decorator found in ${filePath}`);
            return null;
        }

        const providedIn = extractProvidedIn(fileContent);
        const dependencies = extractConstructorDependencies(fileContent);
        const httpMethods = extractHttpMethods(fileContent);
        const apiEndpoints = extractApiEndpoints(fileContent);

        return {
            filePath,
            name: className,
            providedIn,
            dependencies,
            httpMethods,
            apiEndpoints,
        };
    } catch (error) {
        console.error(`Error analyzing service ${uri.fsPath}:`, error);
        return null;
    }
}

function extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
}

function extractProvidedIn(fileContent: string): string | null {
    const match = fileContent.match(/providedIn\s*:\s*['"`](\w+)['"`]/);
    return match ? match[1] : 'root';
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

function extractHttpMethods(fileContent: string): string[] {
    const methods = new Set<string>();
    const matches = fileContent.matchAll(/http\.(get|post|put|patch|delete|request)\s*\(/g);
    for (const match of matches) {
        methods.add(match[1].toLowerCase());
    }
    return Array.from(methods);
}

function extractApiEndpoints(fileContent: string): string[] {
    const endpoints = new Set<string>();
    const matches = fileContent.matchAll(/['"`](https?:\/\/[^'"`]+|\.?\/api\/[^'"`]+)['"`]/g);
    for (const match of matches) {
        const endpoint = match[1];
        if (!endpoint.includes('${') && !endpoint.includes('`')) {
            endpoints.add(endpoint);
        }
    }
    return Array.from(endpoints);
}

export async function analyzeAllServices(): Promise<AngularService[]> {
    const serviceUris = await fileUtils.findServiceFiles();
    const services: AngularService[] = [];

    for (const uri of serviceUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const service = await analyzeServiceFile(uri, content);
            if (service) {
                services.push(service);
            }
        } catch (error) {
            console.error(`Failed to analyze service at ${uri.fsPath}:`, error);
        }
    }
    return services;
}