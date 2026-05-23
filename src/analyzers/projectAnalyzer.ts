/**
 * Project Analyzer
 * Main orchestrator that scans the entire Angular project
 * Supports Angular 7 through Angular 21
 */

import * as vscode from 'vscode';
import * as fileUtils from '../utils/fileUtils';
import { analyzeAllComponents, AngularComponent } from './componentAnalyzer';
import { analyzeAllServices, AngularService } from './serviceAnalyzer';
import { analyzeAllRoutes, AngularRoute } from './routeAnalyzer';
import { analyzeAllGuards, analyzeAllInterceptors, AngularGuard, AngularInterceptor } from './guardAndInterceptorAnalyzer';

// Local version parsing (since versionCompat is missing)
interface VersionFeatures {
    majorVersion: number;
    minorVersion: number;
    patchVersion: number;
    versionString: string;
    hasStandaloneSupport: boolean;
    hasSignalsSupport: boolean;
    hasNewControlFlowSupport: boolean;
    hasFunctionalGuardsSupport: boolean;
    isModern: boolean;
}

function parseAngularVersion(versionString: string): VersionFeatures | null {
    try {
        // Extract version number from string like "v17.2.0" or "^17.2.0" or "~17.2.0" or "17.2.0"
        const match = versionString.match(/(\d+)\.(\d+)\.(\d+)/);
        if (!match) return null;
        
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const patch = parseInt(match[3], 10);
        
        return {
            majorVersion: major,
            minorVersion: minor,
            patchVersion: patch,
            versionString: `${major}.${minor}.${patch}`,
            hasStandaloneSupport: major >= 14,
            hasSignalsSupport: major >= 16,
            hasNewControlFlowSupport: major >= 17,
            hasFunctionalGuardsSupport: major >= 15,
            isModern: major >= 15
        };
    } catch (error) {
        return null;
    }
}

function getVersionDescription(features: VersionFeatures): string {
    const modernFeatures: string[] = [];
    if (features.hasStandaloneSupport) modernFeatures.push('Standalone Components');
    if (features.hasSignalsSupport) modernFeatures.push('Signals');
    if (features.hasNewControlFlowSupport) modernFeatures.push('New Control Flow');
    if (features.hasFunctionalGuardsSupport) modernFeatures.push('Functional Guards');
    
    if (modernFeatures.length === 0) {
        return 'Classic Angular (NgModule-based)';
    }
    return `Modern Angular (${modernFeatures.join(', ')})`;
}

// Interfaces
export interface AngularProject {
    projectRoot: string;
    version: string;
    versionFeatures: VersionFeatures | null;
    isStandalone: boolean;
    components: AngularComponent[];
    services: AngularService[];
    routes: AngularRoute[];
    guards: AngularGuard[];
    interceptors: AngularInterceptor[];
    modules: any[];
    dependencyGraph: any;
    analysisTime: number;
    warnings: string[];
    detectedFeatures: DetectedFeatures;
}

export interface DetectedFeatures {
    hasStandaloneComponents: boolean;
    usesModernRouting: boolean;
    usesSignals: boolean;
    usesNewControlFlow: boolean;
    usesFunctionalGuards: boolean;
    usesFunctionalInterceptors: boolean;
    hasModules: boolean;
}

export interface AnalysisResult {
    success: boolean;
    data: AngularProject | null;
    errors: string[];
    warnings: string[];
}

export async function analyzeAngularProject(): Promise<AnalysisResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace is currently open');
        }

        const projectRoot = workspaceFolders[0].uri.fsPath;
        console.log(`\n🔍 STARTING ANGULAR PROJECT ANALYSIS`);
        console.log(`📁 Project root: ${projectRoot}`);

        // Step 1: Detect Angular version
        const versionString = await fileUtils.getAngularVersion();
        let versionFeatures: VersionFeatures | null = null;
        if (versionString) {
            versionFeatures = parseAngularVersion(versionString);
            if (!versionFeatures) {
                warnings.push(`Unable to parse Angular version: ${versionString}`);
            } else {
                console.log(`✅ Angular ${versionFeatures.majorVersion} detected`);
                console.log(`   Features: ${getVersionDescription(versionFeatures)}`);
            }
        } else {
            warnings.push('Unable to detect Angular version from package.json');
        }

        // Step 2: Scan components
        console.log(`\n🧩 Scanning components...`);
        const components = await analyzeAllComponents();
        console.log(`   ✅ Found ${components.length} component(s)`);
        if (components.length > 0) {
            const standaloneCount = components.filter(c => c.isStandalone).length;
            console.log(`   📊 Standalone: ${standaloneCount}, Module-based: ${components.length - standaloneCount}`);
        }

        // Step 3: Scan services
        console.log(`\n💼 Scanning services...`);
        const services = await analyzeAllServices();
        console.log(`   ✅ Found ${services.length} service(s)`);

        // Step 4: Scan routes
        console.log(`\n🛣️  Scanning routes...`);
        const routes = await analyzeAllRoutes();
        console.log(`   ✅ Found ${routes.length} route(s)`);

        // Step 5: Scan guards
        console.log(`\n🔐 Scanning guards...`);
        const guards = await analyzeAllGuards();
        console.log(`   ✅ Found ${guards.length} guard(s)`);
        if (guards.length > 0) {
            const functionalCount = guards.filter(g => g.isFunctional).length;
            if (functionalCount > 0) console.log(`   📊 Functional guards: ${functionalCount}`);
        }

        // Step 6: Scan interceptors
        console.log(`\n📡 Scanning interceptors...`);
        const interceptors = await analyzeAllInterceptors();
        console.log(`   ✅ Found ${interceptors.length} interceptor(s)`);

        // Step 7: Detect project features
        console.log(`\n🔎 Detecting project features...`);
        const detectedFeatures = detectProjectFeatures(components, services, routes, guards, interceptors);
        console.log(`   ✅ Features detected:`);
        if (detectedFeatures.hasStandaloneComponents) console.log(`      • Standalone components (Angular 14+)`);
        if (detectedFeatures.usesModernRouting) console.log(`      • Modern routing (Angular 14+)`);
        if (detectedFeatures.usesSignals) console.log(`      • Signals (Angular 16+)`);
        if (detectedFeatures.usesNewControlFlow) console.log(`      • New control flow (Angular 17+)`);
        if (detectedFeatures.usesFunctionalGuards) console.log(`      • Functional guards (Angular 15+)`);
        if (detectedFeatures.usesFunctionalInterceptors) console.log(`      • Functional interceptors (Angular 15+)`);
        if (detectedFeatures.hasModules) console.log(`      • NgModules (Angular 7+)`);

        const project: AngularProject = {
            projectRoot,
            version: versionString || 'Unknown',
            versionFeatures,
            isStandalone: components.some(c => c.isStandalone),
            components,
            services,
            routes,
            guards,
            interceptors,
            modules: [],
            dependencyGraph: { nodes: [], circularDependencies: [], serviceDependencies: new Map(), componentDependencies: new Map() },
            analysisTime: Date.now() - startTime,
            warnings,
            detectedFeatures,
        };

        console.log(`\n✅ ANALYSIS COMPLETE in ${project.analysisTime}ms\n`);

        return {
            success: true,
            data: project,
            errors,
            warnings,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`\n❌ ANALYSIS FAILED: ${errorMessage}\n`);
        errors.push(errorMessage);

        return {
            success: false,
            data: null,
            errors,
            warnings,
        };
    }
}

/**
 * Detect project features to determine minimum Angular version needed
 */
function detectProjectFeatures(
    components: AngularComponent[],
    services: AngularService[],
    routes: AngularRoute[],
    guards: AngularGuard[],
    interceptors: AngularInterceptor[]
): DetectedFeatures {
    return {
        hasStandaloneComponents: components.some(c => c.isStandalone),
        usesModernRouting: routes.length > 0,
        usesSignals: components.some(c => c.usesSignals) || services.some(s => (s as any).usesSignals || false),
        usesNewControlFlow: components.some(c => c.usesNewControlFlow),
        usesFunctionalGuards: guards.some(g => g.isFunctional),
        usesFunctionalInterceptors: interceptors.some(i => i.isFunctional),
        hasModules: true, // Modules are always present in Angular 7+
    };
}

// Utility functions for external use
export function getProjectSummary(project: AngularProject): string {
    const features = project.detectedFeatures;
    const featureList: string[] = [];
    
    if (features.hasStandaloneComponents) featureList.push('Standalone Components');
    if (features.usesSignals) featureList.push('Signals');
    if (features.usesNewControlFlow) featureList.push('New Control Flow');
    if (features.usesFunctionalGuards) featureList.push('Functional Guards');
    
    let summary = `Angular ${project.version} project with ${project.components.length} components, ${project.services.length} services, and ${project.routes.length} routes`;
    
    if (featureList.length > 0) {
        summary += `\n✨ Modern features: ${featureList.join(', ')}`;
    }
    
    return summary;
}

export function getMinimumAngularVersion(project: AngularProject): number {
    let minVersion = 7; // Base Angular 7
    
    if (project.detectedFeatures.hasStandaloneComponents) minVersion = Math.max(minVersion, 14);
    if (project.detectedFeatures.usesSignals) minVersion = Math.max(minVersion, 16);
    if (project.detectedFeatures.usesNewControlFlow) minVersion = Math.max(minVersion, 17);
    if (project.detectedFeatures.usesFunctionalGuards) minVersion = Math.max(minVersion, 15);
    if (project.detectedFeatures.usesFunctionalInterceptors) minVersion = Math.max(minVersion, 15);
    
    return minVersion;
}

export function getVersionCompatibilityWarning(project: AngularProject): string | null {
    if (!project.versionFeatures) return null;
    
    const requiredVersion = getMinimumAngularVersion(project);
    const currentVersion = project.versionFeatures.majorVersion;
    
    if (currentVersion < requiredVersion) {
        return `⚠️ Project uses features requiring Angular ${requiredVersion}+, but currently using Angular ${currentVersion}. Consider upgrading.`;
    }
    
    return null;
}