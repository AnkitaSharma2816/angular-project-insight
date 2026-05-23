/**
 * Service File Analyzer
 * Parses @Injectable decorated TypeScript files
 * Supports Angular 7 through Angular 21
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
    usesInject: boolean;
    usesSignals: boolean;
    minAngularVersion: number;
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
        
        // Detect new features (Angular 14+, 16+)
        const usesInject = usesInjectFunction(fileContent);
        const usesSignals = usesSignalsInService(fileContent);
        
        // Determine minimum Angular version
        let minAngularVersion = 7; // Base Angular 7
        if (usesInject) minAngularVersion = 14; // inject() function (Angular 14+)
        if (usesSignals) minAngularVersion = 16; // Signals (Angular 16+)

        return {
            filePath,
            name: className,
            providedIn,
            dependencies,
            httpMethods,
            apiEndpoints,
            usesInject,
            usesSignals,
            minAngularVersion,
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
            // Match private name: Type, public name: Type, protected name: Type
            const injectMatch = param.match(/(?:private|public|protected)\s+\w+\s*:\s*(\w+)/);
            if (injectMatch && injectMatch[1]) {
                dependencies.push(injectMatch[1]);
            }
            // Match simple injection without access modifier
            const simpleMatch = param.match(/^\s*(\w+)\s*:\s*(\w+)/);
            if (simpleMatch && simpleMatch[2] && !simpleMatch[1].match(/private|public|protected/)) {
                dependencies.push(simpleMatch[2]);
            }
        }
    }
    
    // Also check for inject() function calls (Angular 14+)
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

function extractHttpMethods(fileContent: string): string[] {
    const methods = new Set<string>();
    const patterns = [
        /http\.(get|post|put|patch|delete|request)\s*\(/gi,
        /this\.http\.(get|post|put|patch|delete|request)\s*\(/gi,
        /HttpClient\.(get|post|put|patch|delete|request)\s*\(/gi
    ];
    
    for (const pattern of patterns) {
        const matches = fileContent.matchAll(pattern);
        for (const match of matches) {
            methods.add(match[1].toLowerCase());
        }
    }
    return Array.from(methods);
}

function extractApiEndpoints(fileContent: string): string[] {
    const endpoints = new Set<string>();
    const patterns = [
        /['"`](https?:\/\/[^'"`]+)['"`]/g,
        /['"`](\/api\/[^'"`]+)['"`]/g,
        /['"`](\.\.\/api\/[^'"`]+)['"`]/g,
        /`([^`]*)`/g  // Template literals
    ];
    
    for (const pattern of patterns) {
        const matches = fileContent.matchAll(pattern);
        for (const match of matches) {
            let endpoint = match[1];
            // Skip dynamic endpoints with ${}
            if (endpoint && !endpoint.includes('${') && !endpoint.includes('`') && endpoint.length > 0) {
                endpoints.add(endpoint);
            }
        }
    }
    
    return Array.from(endpoints);
}

function usesInjectFunction(content: string): boolean {
    // Check for inject() function usage (Angular 14+ feature)
    const patterns = [
        /inject\s*\(\s*(\w+)\s*\)/g,  // inject(ServiceName)
        /import\s*\{[^}]*\binject\b[^}]*\}\s*from\s*['"]@angular\/core['"]/  // import { inject } from '@angular/core'
    ];
    
    for (const pattern of patterns) {
        if (pattern.test(content)) {
            return true;
        }
    }
    return false;
}

function usesSignalsInService(content: string): boolean {
    // Check for signal usage in service (Angular 16+ feature)
    const patterns = [
        /import\s*\{[^}]*\b(?:signal|computed|effect)\b[^}]*\}\s*from\s*['"]@angular\/core['"]/,
        /\b(?:signal|computed|effect)\s*\(/,
        /\.set\s*\(/,
        /\.update\s*\(/,
        /\.asReadonly\s*\(/
    ];
    
    for (const pattern of patterns) {
        if (pattern.test(content)) {
            return true;
        }
    }
    return false;
}

export async function analyzeAllServices(): Promise<AngularService[]> {
    const serviceUris = await fileUtils.findServiceFiles();
    const services: AngularService[] = [];

    console.log(`🔍 Scanning ${serviceUris.length} service file(s)...`);

    for (const uri of serviceUris) {
        try {
            const content = await fileUtils.readFileContent(uri);
            const service = await analyzeServiceFile(uri, content);
            if (service) {
                services.push(service);
                console.log(`   ✅ ${service.name} (providedIn: ${service.providedIn || 'root'}, inject(): ${service.usesInject}, signals: ${service.usesSignals})`);
            }
        } catch (error) {
            console.error(`Failed to analyze service at ${uri.fsPath}:`, error);
        }
    }
    
    console.log(`✅ Total services analyzed: ${services.length}`);
    return services;
}

// Utility functions for external use
export function getServiceDisplayName(service: AngularService): string {
    const features: string[] = [];
    if (service.usesInject) features.push('inject()');
    if (service.usesSignals) features.push('signals');
    if (service.httpMethods.length > 0) features.push(`HTTP: ${service.httpMethods.join(',')}`);
    
    const featureIndicator = features.length > 0 ? ` ✨(${features.join(', ')})` : '';
    return `${service.name}${featureIndicator}`;
}

export function getServiceVersionRequirement(service: AngularService): string {
    if (service.usesSignals) return 'Angular 16+ required (Signals)';
    if (service.usesInject) return 'Angular 14+ required (inject() function)';
    return 'Angular 7+ (Class-based service)';
}

export function getServiceType(service: AngularService): string {
    if (service.providedIn === 'root') return 'Root Service (Singleton)';
    if (service.providedIn === 'platform') return 'Platform Service';
    if (service.providedIn === 'any') return 'Any Service';
    if (service.providedIn) return `Module-scoped Service (${service.providedIn})`;
    return 'Legacy Service (not tree-shakable)';
}