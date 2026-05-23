/**
 * Project Analyzer
 * Main orchestrator that scans the entire Angular project
 * Coordinates all individual analyzers and aggregates results
 * Detects Angular version, project structure, and builds complete analysis
 */

import {
	AngularProject,
	AnalysisResult,
	AngularComponent,
	AngularService,
	AngularRoute,
	AngularGuard,
	AngularInterceptor,
} from '../models/types';
import * as componentAnalyzer from './componentAnalyzer';
import * as serviceAnalyzer from './serviceAnalyzer';
import * as routeAnalyzer from './routeAnalyzer';
import * as guardAndInterceptorAnalyzer from './guardAndInterceptorAnalyzer';
import * as dependencyAnalyzer from './dependencyAnalyzer';
import * as fileUtils from '../utils/fileUtils';

// ============================================================================
// PROJECT ANALYSIS
// ============================================================================

/**
 * Analyze the entire Angular project
 * This is the main entry point that orchestrates all analyzers
 * @returns AnalysisResult with complete AngularProject analysis
 */
export async function analyzeAngularProject(): Promise<
	AnalysisResult<AngularProject>
> {
	const startTime = Date.now();
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		// Verify workspace is open
		if (!fileUtils.isWorkspaceOpen()) {
			throw new Error('No workspace is currently open');
		}

		const projectRoot = fileUtils.getWorkspaceRootPath();
		if (!projectRoot) {
			throw new Error('Unable to determine workspace root');
		}

		console.log(`🔍 Starting Angular project analysis in: ${projectRoot}`);

		// Step 1: Detect Angular version
		console.log('📦 Detecting Angular version...');
		const version = await detectAngularVersion();
		if (!version) {
			warnings.push(
				'Unable to detect Angular version. Assuming modern Angular (15+).'
			);
		}

		// Step 2: Analyze all components (in parallel)
		console.log('🧩 Scanning components...');
		const components = await componentAnalyzer.analyzeAllComponents();
		console.log(`   Found ${components.length} component(s)`);

		// Step 3: Analyze all services (in parallel)
		console.log('💼 Scanning services...');
		const services = await serviceAnalyzer.analyzeAllServices();
		console.log(`   Found ${services.length} service(s)`);

		// Step 4: Analyze all routes
		console.log('🛣️  Scanning routes...');
		const routes = await routeAnalyzer.analyzeAllRoutes();
		console.log(`   Found ${routes.length} route(s)`);

		// Step 5: Analyze guards (in parallel)
		console.log('🔐 Scanning guards...');
		const guards = await guardAndInterceptorAnalyzer.analyzeAllGuards();
		console.log(`   Found ${guards.length} guard(s)`);

		// Step 6: Analyze interceptors (in parallel)
		console.log('📡 Scanning interceptors...');
		const interceptors =
			await guardAndInterceptorAnalyzer.analyzeAllInterceptors();
		console.log(`   Found ${interceptors.length} interceptor(s)`);

		// Step 7: Detect if project uses standalone components
		const isStandalone = detectStandaloneArchitecture(components);

		// Step 8: Build dependency graph
		console.log('🔗 Building dependency graph...');
		const dependencyGraph = dependencyAnalyzer.buildDependencyGraph(
			components,
			services,
			guards,
			interceptors
		);

		// Check for issues
		if (dependencyGraph.circularDependencies.length > 0) {
			warnings.push(
				`⚠️  Detected ${dependencyGraph.circularDependencies.length} circular dependencies`
			);
		}

		// Step 9: Aggregate results
		const project: AngularProject = {
			projectRoot,
			version: version || 'Unknown',
			isStandalone,
			components,
			services,
			routes,
			guards,
			interceptors,
			modules: [], // Could be populated by module analyzer in future
			dependencyGraph,
			analysisTime: Date.now() - startTime,
			warnings,
		};

		console.log(
			`✅ Analysis complete in ${project.analysisTime}ms`
		);

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect Angular version from package.json
 * @returns Version string or null
 */
async function detectAngularVersion(): Promise<string | null> {
	try {
		const version = await fileUtils.getAngularVersion();
		if (!version) return null;

		// Extract version number (e.g., "^17.0.0" -> "17")
		const match = version.match(/(\d+)/);
		return match ? `v${match[1]}` : version;
	} catch {
		return null;
	}
}

/**
 * Detect if project uses standalone components (Angular 14+)
 * @param components Array of components
 * @returns true if at least one component uses standalone
 */
function detectStandaloneArchitecture(
	components: AngularComponent[]
): boolean {
	return components.some((c) => c.isStandalone);
}

/**
 * Get analysis summary as formatted string
 * @param analysis AnalysisResult with AngularProject
 * @returns Formatted summary string
 */
export function getAnalysisSummary(
	analysis: AnalysisResult<AngularProject>
): string {
	if (!analysis.success || !analysis.data) {
		return `❌ Analysis failed:\n${analysis.errors.join('\n')}`;
	}

	const project = analysis.data;
	const stats = dependencyAnalyzer.getDependencyGraphStats(
		project.dependencyGraph
	);

	const summary = `
📊 Angular Project Analysis Summary
=====================================

🏗️  Architecture
  Angular Version: ${project.version}
  Architecture Style: ${project.isStandalone ? 'Standalone Components' : 'Module-based'}
  Analysis Time: ${project.analysisTime}ms

📈 Statistics
  Components: ${project.components.length}
  Services: ${project.services.length}
  Routes: ${project.routes.length}
  Guards: ${project.guards.length}
  Interceptors: ${project.interceptors.length}
  
🔗 Dependency Graph
  Total Entities: ${stats.totalNodes}
  Avg Dependencies/Entity: ${stats.averageDependenciesPerNode}
  Max Dependency Depth: ${stats.maxDependencyDepth}
  Circular Dependencies: ${stats.circularDependencyCount}

${project.warnings.length > 0 ? `⚠️  Warnings:\n  ${project.warnings.join('\n  ')}` : '✅ No warnings'}
`;

	return summary.trim();
}

/**
 * Get detailed analysis report
 * @param analysis AnalysisResult with AngularProject
 * @returns Detailed report object
 */
export function getDetailedAnalysisReport(
	analysis: AnalysisResult<AngularProject>
): {
	components: string[];
	services: string[];
	routes: string[];
	guards: string[];
	interceptors: string[];
	stats: any;
} {
	if (!analysis.success || !analysis.data) {
		return {
			components: [],
			services: [],
			routes: [],
			guards: [],
			interceptors: [],
			stats: {},
		};
	}

	const project = analysis.data;

	return {
		components: project.components.map((c) => c.name),
		services: project.services.map((s) => s.name),
		routes: project.routes
			.map((r) => (r.path ? `/${r.path}` : '/'))
			.filter((r) => r !== '**'),
		guards: project.guards.map((g) => g.name),
		interceptors: project.interceptors.map((i) => i.name),
		stats: dependencyAnalyzer.getDependencyGraphStats(
			project.dependencyGraph
		),
	};
}

/**
 * Validate analysis results
 * @param analysis AnalysisResult
 * @returns true if analysis was successful and contains data
 */
export function isAnalysisValid(analysis: AnalysisResult): boolean {
	return analysis.success && analysis.data !== null && analysis.errors.length === 0;
}

/**
 * Get friendly error message for analysis failure
 * @param analysis AnalysisResult
 * @returns Error message or empty string if successful
 */
export function getErrorMessage(analysis: AnalysisResult): string {
	if (analysis.success) {
		return '';
	}

	if (analysis.errors.length === 0) {
		return 'Unknown error occurred during analysis';
	}

	return analysis.errors[0]; // Return first error as main message
}
