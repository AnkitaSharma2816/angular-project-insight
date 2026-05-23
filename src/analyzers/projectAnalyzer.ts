/**
 * Project Analyzer
 * Main orchestrator that scans the entire Angular project
 */

import * as vscode from 'vscode';
import * as fileUtils from '../utils/fileUtils';
import { analyzeAllComponents, AngularComponent } from './componentAnalyzer';
import { analyzeAllServices, AngularService } from './serviceAnalyzer';
import { analyzeAllRoutes, AngularRoute } from './routeAnalyzer';
import { analyzeAllGuards, analyzeAllInterceptors, AngularGuard, AngularInterceptor } from './guardAndInterceptorAnalyzer';

export interface AngularProject {
    projectRoot: string;
    version: string;
    components: AngularComponent[];
    services: AngularService[];
    routes: AngularRoute[];
    guards: AngularGuard[];
    interceptors: AngularInterceptor[];
    analysisTime: number;
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
        console.log(`\n🔍 Starting Angular project analysis...`);
        console.log(`📁 Project root: ${projectRoot}`);

        const version = await fileUtils.getAngularVersion();
        console.log(`📦 Angular version: ${version || 'Unknown'}`);

        console.log(`🧩 Scanning components...`);
        const components = await analyzeAllComponents();
        console.log(`   ✅ Found ${components.length} component(s)`);

        console.log(`💼 Scanning services...`);
        const services = await analyzeAllServices();
        console.log(`   ✅ Found ${services.length} service(s)`);

        console.log(`🛣️ Scanning routes...`);
        const routes = await analyzeAllRoutes();
        console.log(`   ✅ Found ${routes.length} route(s)`);

        console.log(`🔐 Scanning guards...`);
        const guards = await analyzeAllGuards();
        console.log(`   ✅ Found ${guards.length} guard(s)`);

        console.log(`📡 Scanning interceptors...`);
        const interceptors = await analyzeAllInterceptors();
        console.log(`   ✅ Found ${interceptors.length} interceptor(s)`);

        const project: AngularProject = {
            projectRoot,
            version: version || 'Unknown',
            components,
            services,
            routes,
            guards,
            interceptors,
            analysisTime: Date.now() - startTime,
        };

        console.log(`✅ Analysis complete in ${project.analysisTime}ms`);

        return {
            success: true,
            data: project,
            errors,
            warnings,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Analysis failed: ${errorMessage}`);
        errors.push(errorMessage);

        return {
            success: false,
            data: null,
            errors,
            warnings,
        };
    }
}