/**
 * Route File Analyzer
 * Parses Angular route configurations
 * Supports: app-routing.module.ts, standalone routes, feature modules, inline routes
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fileUtils from '../utils/fileUtils';

export interface AngularRoute {
    path: string;
    component: string | null;
    children: AngularRoute[];
    guards: string[];
    lazyModule: string | null;
    lazyRoutes: any[];
    isWildcard: boolean;
    redirectTo: string | null;
    fullPath?: string;
}

/**
 * Analyze all routes in the workspace
 */
export async function analyzeAllRoutes(): Promise<AngularRoute[]> {
    const routeFiles = await findRouteFiles();
    console.log(`\n🛣️  ROUTE ANALYSIS STARTING`);
    console.log(`📁 Route files found: ${routeFiles.length}`);
    
    if (routeFiles.length === 0) {
        console.log('⚠️  No route files found. Patterns searched:');
        console.log('   - **/app-routing.module.ts');
        console.log('   - **/*-routing.module.ts');
        console.log('   - **/app.routes.ts');
        console.log('   - **/*.routes.ts');
        console.log('   - **/routes.ts');
        console.log('   Check that your Angular project has routing configured.');
        return [];
    }
    
    const allRoutes: AngularRoute[] = [];
    
    for (const file of routeFiles) {
        try {
            console.log(`\n📄 Analyzing: ${path.basename(file.fsPath)}`);
            const content = await fileUtils.readFileContent(file);
            const routes = await analyzeRouteFileContent(content, file.fsPath);
            
            if (routes.length > 0) {
                console.log(`   ✅ Found ${routes.length} route(s)`);
                routes.forEach(r => {
                    console.log(`      - Path: "${r.path || '(root)'}" → Component: ${r.component || 'lazy'} | Redirect: ${r.redirectTo || 'none'}`);
                });
                allRoutes.push(...routes);
            } else {
                console.log(`   ℹ️  No routes parsed from this file`);
            }
        } catch (error) {
            console.error(`❌ Error analyzing route file ${file.fsPath}:`, error);
        }
    }
    
    console.log(`\n✅ ROUTE ANALYSIS COMPLETE`);
    console.log(`📊 Total routes found: ${allRoutes.length}\n`);
    return allRoutes;
}

/**
 * Find all route files in the workspace
 */
async function findRouteFiles(): Promise<vscode.Uri[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        console.warn('No workspace folders open');
        return [];
    }
    
    console.log(`\n🔍 SEARCHING FOR ROUTE FILES IN: ${workspaceFolders[0].uri.fsPath}`);
    
    const patterns = [
        '**/app-routing.module.ts',      // Standard Angular routing module
        '**/*-routing.module.ts',        // Feature routing modules
        '**/app.routes.ts',              // Standalone Angular v14+ routes
        '**/*.routes.ts',                // Routes files
        '**/routes.ts'                   // Barrel routes
    ];
    
    const allUris: vscode.Uri[] = [];
    
    for (const pattern of patterns) {
        try {
            console.log(`   Searching: "${pattern}"`);
            const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 200);
            if (files.length > 0) {
                console.log(`      ✅ Found ${files.length} file(s)`);
                files.forEach(f => console.log(`         - ${path.relative(workspaceFolders[0].uri.fsPath, f.fsPath)}`));
                allUris.push(...files);
            } else {
                console.log(`      (none)`);
            }
        } catch (error) {
            console.warn(`   Error searching pattern "${pattern}":`, error);
        }
    }
    
    // Remove duplicates
    const unique = new Map<string, vscode.Uri>();
    for (const uri of allUris) {
        unique.set(uri.fsPath, uri);
    }
    
    const uniqueUris = Array.from(unique.values());
    console.log(`\n📊 Total unique route files found: ${uniqueUris.length}`);
    return uniqueUris;
}

/**
 * Analyze route file content
 */
export async function analyzeRouteFileContent(content: string, filePath: string): Promise<AngularRoute[]> {
    const routes: AngularRoute[] = [];
    
    // Try multiple extraction methods
    const routeArrays = extractRouteArrays(content);
    
    if (routeArrays.length === 0) {
        // Try inline RouterModule.forRoot
        const inlineMatch = content.match(/RouterModule\.forRoot\(\s*\[([\s\S]*?)\]\)/);
        if (inlineMatch && inlineMatch[1]) {
            routeArrays.push(inlineMatch[1]);
        }
        
        // Try provideRouter (standalone)
        const provideRouterMatch = content.match(/provideRouter\(\s*\[([\s\S]*?)\]\)/);
        if (provideRouterMatch && provideRouterMatch[1]) {
            routeArrays.push(provideRouterMatch[1]);
        }
    }
    
    for (const routeArray of routeArrays) {
        const parsedRoutes = parseRouteArray(routeArray);
        routes.push(...parsedRoutes);
    }
    
    // Build full paths for nested routes
    buildFullPaths(routes);
    
    return routes;
}

/**
 * Extract route arrays from file content
 */
function extractRouteArrays(content: string): string[] {
    const arrays: string[] = [];
    
    // Pattern 1: const routes: Routes = [...]
    const pattern1 = content.match(/(?:export\s+)?(?:const|let)\s+routes\s*:\s*Routes\s*=\s*(\[[\s\S]*?\];)/);
    if (pattern1 && pattern1[1]) {
        arrays.push(pattern1[1]);
        console.log('   Extracted routes from "routes: Routes = [...]" pattern');
    }
    
    // Pattern 2: Routes = [...]
    const pattern2 = content.match(/Routes\s*=\s*(\[[\s\S]*?\];)/);
    if (pattern2 && pattern2[1]) {
        arrays.push(pattern2[1]);
        console.log('   Extracted routes from "Routes = [...]" pattern');
    }
    
    // Pattern 3: export const routes = [...] (no type annotation)
    const pattern3 = content.match(/export\s+const\s+routes\s*=\s*(\[[\s\S]*?\];)/);
    if (pattern3 && pattern3[1]) {
        arrays.push(pattern3[1]);
        console.log('   Extracted routes from "export const routes = [...]" pattern');
    }
    
    // Pattern 4: Look for array with route-like objects (fallback)
    if (arrays.length === 0) {
        const arrayMatch = content.match(/\[\s*\{\s*path\s*:\s*['"`][^'"`]*['"`][\s\S]*?\}\s*\]/);
        if (arrayMatch) {
            arrays.push(arrayMatch[0]);
            console.log('   Extracted routes using fallback pattern');
        }
    }
    
    return arrays;
}

/**
 * Parse route array string into route objects
 */
function parseRouteArray(routeArrayStr: string): AngularRoute[] {
    const routes: AngularRoute[] = [];
    
    // Remove outer brackets
    let content = routeArrayStr.trim();
    if (content.startsWith('[') && content.endsWith(']')) {
        content = content.slice(1, -1);
    }
    
    // Parse each route object
    const routeObjects = splitRouteObjects(content);
    
    for (const routeObj of routeObjects) {
        const route = parseSingleRoute(routeObj);
        if (route) {
            routes.push(route);
        }
    }
    
    return routes;
}

/**
 * Split route array content into individual route objects
 * Handles nested objects and children arrays
 */
function splitRouteObjects(content: string): string[] {
    const objects: string[] = [];
    let braceCount = 0;
    let currentObject = '';
    let inObject = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        
        if (char === '{') {
            if (!inObject) {
                inObject = true;
                currentObject = '';
                braceCount = 0;
            }
            braceCount++;
            currentObject += char;
        } else if (char === '}') {
            braceCount--;
            currentObject += char;
            
            if (braceCount === 0 && inObject) {
                objects.push(currentObject);
                inObject = false;
                currentObject = '';
            }
        } else if (inObject) {
            currentObject += char;
        }
    }
    
    return objects;
}

/**
 * Parse a single route object
 */
function parseSingleRoute(routeStr: string): AngularRoute | null {
    try {
        // Extract path
        const pathMatch = routeStr.match(/path\s*:\s*['"`]([^'"`]*)['"`]/);
        const path = pathMatch ? pathMatch[1] : '';
        
        // Extract component
        const componentMatch = routeStr.match(/component\s*:\s*(\w+)/);
        let component = componentMatch ? componentMatch[1] : null;
        
        // Extract loadComponent (lazy loading)
        if (!component) {
            const loadComponentMatch = routeStr.match(/loadComponent\s*:\s*\(\)\s*=>\s*(?:import\([^)]+\)\.then\(\(?m\)?\s*=>\s*m\.(\w+)\)|(\w+))/);
            if (loadComponentMatch) {
                component = loadComponentMatch[1] || loadComponentMatch[2] || null;
            }
        }
        
        // Extract redirectTo
        const redirectMatch = routeStr.match(/redirectTo\s*:\s*['"`]([^'"`]*)['"`]/);
        const redirectTo = redirectMatch ? redirectMatch[1] : null;
        
        // Extract guards
        const guards: string[] = [];
        const canActivateMatch = routeStr.match(/canActivate\s*:\s*\[([^\]]*)\]/);
        if (canActivateMatch) {
            const guardNames = canActivateMatch[1].split(',').map(g => g.trim());
            guards.push(...guardNames);
        }
        
        // Extract lazy module
        const lazyModuleMatch = routeStr.match(/loadChildren\s*:\s*['"`]([^'"`]*)['"`]/);
        const lazyModule = lazyModuleMatch ? lazyModuleMatch[1] : null;
        
        // Extract children routes
        let children: AngularRoute[] = [];
        const childrenMatch = routeStr.match(/children\s*:\s*\[([\s\S]*?)\](?=\s*[,}])/);
        if (childrenMatch && childrenMatch[1]) {
            children = parseRouteArray(`[${childrenMatch[1]}]`);
        }
        
        const isWildcard = path === '**';
        
        return {
            path: path || '',
            component,
            children,
            guards,
            lazyModule,
            lazyRoutes: [],
            isWildcard,
            redirectTo
        };
        
    } catch (error) {
        console.error('Error parsing route object:', error);
        return null;
    }
}

/**
 * Build full paths for nested routes
 */
function buildFullPaths(routes: AngularRoute[], parentPath: string = ''): void {
    for (const route of routes) {
        let fullPath = route.path;
        
        if (parentPath && route.path) {
            fullPath = parentPath + (route.path.startsWith('/') ? route.path : `/${route.path}`);
        } else if (parentPath) {
            fullPath = parentPath;
        }
        
        route.fullPath = fullPath?.replace(/\/\//g, '/') || '/';
        
        if (route.children && route.children.length > 0) {
            buildFullPaths(route.children, route.fullPath);
        }
    }
}

/**
 * Flatten nested routes
 */
export function flattenRoutes(routes: AngularRoute[]): AngularRoute[] {
    const result: AngularRoute[] = [];
    
    for (const route of routes) {
        result.push(route);
        if (route.children && route.children.length > 0) {
            result.push(...flattenRoutes(route.children));
        }
    }
    
    return result;
}

/**
 * Get routes for a specific component
 */
export function getRoutesForComponent(routes: AngularRoute[], componentName: string): AngularRoute[] {
    return flattenRoutes(routes).filter(r => r.component === componentName);
}

/**
 * Get lazy loaded routes
 */
export function getLazyLoadedRoutes(routes: AngularRoute[]): AngularRoute[] {
    return flattenRoutes(routes).filter(r => !!r.lazyModule);
}

/**
 * Get guarded routes
 */
export function getGuardedRoutes(routes: AngularRoute[]): AngularRoute[] {
    return flattenRoutes(routes).filter(r => r.guards.length > 0);
}

/**
 * Get route display path
 */
export function getRouteDisplayPath(route: AngularRoute): string {
    if (route.isWildcard) return '** (Wildcard)';
    if (route.path === '') return '(Empty/Default)';
    if (route.redirectTo) return `${route.path} → redirect to ${route.redirectTo}`;
    return route.fullPath || route.path || '(Root)';
}

/**
 * Get route summary for display
 */
export function getRouteSummary(route: AngularRoute): string {
    const parts: string[] = [];
    
    if (route.path) parts.push(`path: "${route.path}"`);
    if (route.component) parts.push(`component: ${route.component}`);
    if (route.redirectTo) parts.push(`redirect: ${route.redirectTo}`);
    if (route.lazyModule) parts.push(`lazy: ${route.lazyModule}`);
    if (route.guards.length > 0) parts.push(`guards: [${route.guards.join(', ')}]`);
    
    return parts.join(' | ');
}