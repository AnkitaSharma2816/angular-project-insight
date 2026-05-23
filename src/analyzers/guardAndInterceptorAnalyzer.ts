/**
 * Guard and Interceptor File Analyzer
 * Supports Angular 7 through Angular 21
 * Detects both class-based (Angular 7+) and functional patterns (Angular 15+)
 */

import * as vscode from 'vscode';
import * as fileUtils from '../utils/fileUtils';

export interface AngularGuard {
    filePath: string;
    name: string;
    guardType: string | null;
    dependencies: string[];
    isFunctional: boolean;
    minAngularVersion: number;
}

export interface AngularInterceptor {
    filePath: string;
    name: string;
    dependencies: string[];
    isFunctional: boolean;
    minAngularVersion: number;
}

export async function analyzeGuardFile(
    uri: vscode.Uri,
    fileContent: string
): Promise<AngularGuard | null> {
    try {
        const filePath = fileUtils.getAbsolutePath(uri);
        const isFunctional = usesFunctionalGuards(fileContent);
        
        // For functional guards, extract function name instead of class name
        let name: string | null;
        if (isFunctional) {
            name = extractFunctionalGuardName(fileContent);
        } else {
            name = extractClassName(fileContent);
        }

        if (!name) {
            console.warn(`No guard definition found in ${filePath}`);
            return null;
        }

        const guardType = isFunctional ? detectFunctionalGuardType(fileContent) : detectGuardType(fileContent);
        const dependencies = extractConstructorDependencies(fileContent);

        return {
            filePath,
            name,
            guardType,
            dependencies,
            isFunctional,
            minAngularVersion: isFunctional ? 15 : 7,
        };
    } catch (error) {
        console.error(`Error analyzing guard ${uri.fsPath}:`, error);
        return null;
    }
}

export async function analyzeInterceptorFile(
    uri: vscode.Uri,
    fileContent: string
): Promise<AngularInterceptor | null> {
    try {
        const filePath = fileUtils.getAbsolutePath(uri);
        const isFunctional = usesFunctionalInterceptor(fileContent);
        
        const name = extractClassName(fileContent) || 'UnknownInterceptor';
        const dependencies = extractConstructorDependencies(fileContent);

        return {
            filePath,
            name,
            dependencies,
            isFunctional,
            minAngularVersion: isFunctional ? 15 : 7,
        };
    } catch (error) {
        console.error(`Error analyzing interceptor ${uri.fsPath}:`, error);
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

function detectFunctionalGuardType(fileContent: string): string | null {
    const guardTypes = ['CanActivateFn', 'CanActivateChildFn', 'CanDeactivateFn', 'CanLoadFn', 'CanMatchFn'];
    for (const type of guardTypes) {
        if (fileContent.includes(type)) {
            return type.replace('Fn', '');
        }
    }
    return null;
}

function usesFunctionalGuards(content: string): boolean {
    // Check for functional guard patterns (Angular 15+)
    const functionalPatterns = [
        /export\s+const\s+\w+Guard\s*:\s*CanActivateFn\s*=/,
        /export\s+const\s+\w+Guard\s*[:=]\s*\(/,
        /export\s+function\s+\w+Guard\s*\(/,
        /CanActivateFn\s*=\s*\(/
    ];
    
    for (const pattern of functionalPatterns) {
        if (pattern.test(content)) {
            return true;
        }
    }
    return false;
}

function usesFunctionalInterceptor(content: string): boolean {
    // Check for functional interceptor patterns (Angular 15+)
    const functionalPatterns = [
        /export\s+const\s+\w+Interceptor\s*:\s*HttpInterceptorFn\s*=/,
        /export\s+const\s+\w+Interceptor\s*[:=]\s*\(/,
        /export\s+function\s+\w+Interceptor\s*\(/,
        /HttpInterceptorFn\s*=\s*\(/
    ];
    
    for (const pattern of functionalPatterns) {
        if (pattern.test(content)) {
            return true;
        }
    }
    return false;
}

function extractFunctionalGuardName(content: string): string | null {
    // Match: export const guardNameGuard = (...) => {...}
    let match = content.match(/export\s+const\s+(\w+Guard)\s*:\s*CanActivateFn\s*=/);
    if (match) return match[1];
    
    match = content.match(/export\s+const\s+(\w+Guard)\s*=\s*\(/);
    if (match) return match[1];
    
    match = content.match(/export\s+function\s+(\w+Guard)\s*\(/);
    if (match) return match[1];
    
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
            // For functional guards, check injected dependencies in function parameters
            const funcParamMatch = param.match(/^\s*(\w+)\s*:\s*(\w+)/);
            if (funcParamMatch && funcParamMatch[2]) {
                dependencies.push(funcParamMatch[2]);
            }
        }
    }
    
    // Also check for functional guard dependencies (inject() calls)
    const injectMatches = content.match(/inject\((\w+)\)/g);
    if (injectMatches) {
        for (const match of injectMatches) {
            const serviceMatch = match.match(/inject\((\w+)\)/);
            if (serviceMatch && serviceMatch[1]) {
                dependencies.push(serviceMatch[1]);
            }
        }
    }
    
    return [...new Set(dependencies)];
}

export async function analyzeAllGuards(): Promise<AngularGuard[]> {
    const guardUris = await fileUtils.findGuardFiles();
    const guards: AngularGuard[] = [];

    console.log(`🔍 Scanning ${guardUris.length} guard file(s)...`);

    for (const uri of guardUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const guard = await analyzeGuardFile(uri, content);
            if (guard) {
                guards.push(guard);
                console.log(`   ✅ ${guard.name} (${guard.guardType}, Functional: ${guard.isFunctional})`);
            }
        } catch (error) {
            console.error(`Failed to analyze guard at ${uri.fsPath}:`, error);
        }
    }
    
    console.log(`✅ Total guards analyzed: ${guards.length}`);
    return guards;
}

export async function analyzeAllInterceptors(): Promise<AngularInterceptor[]> {
    const interceptorUris = await fileUtils.findInterceptorFiles();
    const interceptors: AngularInterceptor[] = [];

    console.log(`🔍 Scanning ${interceptorUris.length} interceptor file(s)...`);

    for (const uri of interceptorUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const interceptor = await analyzeInterceptorFile(uri, content);
            if (interceptor) {
                interceptors.push(interceptor);
                console.log(`   ✅ ${interceptor.name} (Functional: ${interceptor.isFunctional})`);
            }
        } catch (error) {
            console.error(`Failed to analyze interceptor at ${uri.fsPath}:`, error);
        }
    }
    
    console.log(`✅ Total interceptors analyzed: ${interceptors.length}`);
    return interceptors;
}

// Utility functions for external use
export function getGuardDisplayName(guard: AngularGuard): string {
    const functionalIndicator = guard.isFunctional ? '⚡ ' : '📦 ';
    return `${functionalIndicator}${guard.name}${guard.guardType ? ` (${guard.guardType})` : ''}`;
}

export function getInterceptorDisplayName(interceptor: AngularInterceptor): string {
    const functionalIndicator = interceptor.isFunctional ? '⚡ ' : '📦 ';
    return `${functionalIndicator}${interceptor.name}`;
}

export function getGuardVersionRequirement(guard: AngularGuard): string {
    if (guard.isFunctional) {
        return 'Angular 15+ required (Functional Guard)';
    }
    return 'Angular 7+ (Class-based Guard)';
}

export function getInterceptorVersionRequirement(interceptor: AngularInterceptor): string {
    if (interceptor.isFunctional) {
        return 'Angular 15+ required (Functional Interceptor)';
    }
    return 'Angular 7+ (Class-based Interceptor)';
}