/**
 * Guard and Interceptor File Analyzer
 */

import * as vscode from 'vscode';
import * as fileUtils from '../utils/fileUtils';

export interface AngularGuard {
    filePath: string;
    name: string;
    guardType: string | null;
    dependencies: string[];
}

export interface AngularInterceptor {
    filePath: string;
    name: string;
    dependencies: string[];
}

export async function analyzeGuardFile(
    uri: vscode.Uri,
    fileContent: string
): Promise<AngularGuard | null> {
    try {
        const filePath = fileUtils.getAbsolutePath(uri);
        const className = extractClassName(fileContent);

        if (!className) {
            console.warn(`No class definition found in guard file ${filePath}`);
            return null;
        }

        const guardType = detectGuardType(fileContent);
        const dependencies = extractConstructorDependencies(fileContent);

        return {
            filePath,
            name: className,
            guardType,
            dependencies,
        };
    } catch (error) {
        console.error(`Error analyzing guard ${uri.fsPath}:`, error);
        return null;
    }
}

function extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
}

function detectGuardType(fileContent: string): string | null {
    const guardTypes = ['CanActivate', 'CanActivateChild', 'CanDeactivate', 'CanLoad', 'CanMatch'];
    for (const type of guardTypes) {
        if (fileContent.includes(`implements ${type}`)) {
            return type;
        }
    }
    return null;
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

export async function analyzeAllGuards(): Promise<AngularGuard[]> {
    const guardUris = await fileUtils.findGuardFiles();
    const guards: AngularGuard[] = [];

    for (const uri of guardUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const guard = await analyzeGuardFile(uri, content);
            if (guard) {
                guards.push(guard);
            }
        } catch (error) {
            console.error(`Failed to analyze guard at ${uri.fsPath}:`, error);
        }
    }
    return guards;
}

export async function analyzeInterceptorFile(
    uri: vscode.Uri,
    fileContent: string
): Promise<AngularInterceptor | null> {
    try {
        const filePath = fileUtils.getAbsolutePath(uri);
        const className = extractClassName(fileContent);

        if (!className) {
            console.warn(`No class definition found in interceptor file ${filePath}`);
            return null;
        }

        if (!fileContent.includes('HttpInterceptor')) {
            console.warn(`No HttpInterceptor interface found in ${filePath}`);
            return null;
        }

        const dependencies = extractConstructorDependencies(fileContent);

        return {
            filePath,
            name: className,
            dependencies,
        };
    } catch (error) {
        console.error(`Error analyzing interceptor ${uri.fsPath}:`, error);
        return null;
    }
}

export async function analyzeAllInterceptors(): Promise<AngularInterceptor[]> {
    const interceptorUris = await fileUtils.findInterceptorFiles();
    const interceptors: AngularInterceptor[] = [];

    for (const uri of interceptorUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const interceptor = await analyzeInterceptorFile(uri, content);
            if (interceptor) {
                interceptors.push(interceptor);
            }
        } catch (error) {
            console.error(`Failed to analyze interceptor at ${uri.fsPath}:`, error);
        }
    }
    return interceptors;
}