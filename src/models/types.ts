/**
 * Core TypeScript interfaces and types for Angular Project Analysis
 * Supports Angular 15+ (both standalone and module-based applications)
 */

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface AngularComponent {
	/** Full file path of the component */
	filePath: string;

	/** Unique component class name */
	name: string;

	/** CSS selector (e.g., 'app-dashboard', 'app-card') */
	selector: string;

	/** List of services injected in constructor */
	dependencies: string[];

	/** Template file URL (if external) */
	templateUrl: string | null;

	/** Array of external stylesheet URLs */
	styleUrls: string[];

	/** Whether component uses standalone: true */
	isStandalone: boolean;

	/** Module that declares this component (if not standalone) */
	parentModule: string | null;

	/** Route path that uses this component (if applicable) */
	route: string | null;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface AngularService {
	/** Full file path of the service */
	filePath: string;

	/** Unique service class name */
	name: string;

	/** Service's providedIn scope (e.g., 'root', 'any', specific module) */
	providedIn: string | null;

	/** Services that this service depends on (injected in constructor) */
	dependencies: string[];

	/** HTTP methods used (if applicable) */
	httpMethods: string[];

	/** API endpoints called */
	apiEndpoints: string[];
}

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface AngularRoute {
	/** Route path (e.g., 'dashboard', 'user/:id') */
	path: string;

	/** Component to render for this route */
	component: string | null;

	/** Child routes (if any) */
	children: AngularRoute[];

	/** Route guard names (e.g., 'AuthGuard', 'PermissionGuard') */
	guards: string[];

	/** Lazy-loaded module path (if using loadChildren) */
	lazyModule: string | null;

	/** Lazy-loaded routes */
	lazyRoutes: AngularRoute[];

	/** Whether route is a wildcard ('**') */
	isWildcard: boolean;

	/** Route redirect target (if applicable) */
	redirectTo: string | null;
}

// ============================================================================
// GUARD & INTERCEPTOR TYPES
// ============================================================================

export interface AngularGuard {
	/** Full file path */
	filePath: string;

	/** Guard class name */
	name: string;

	/** Guard type: canActivate, canActivateChild, canDeactivate, canLoad */
	guardType: string;

	/** Services this guard depends on */
	dependencies: string[];
}

export interface AngularInterceptor {
	/** Full file path */
	filePath: string;

	/** Interceptor class name */
	name: string;

	/** Services this interceptor depends on */
	dependencies: string[];
}

// ============================================================================
// MODULE TYPES
// ============================================================================

export interface AngularModule {
	/** Full file path */
	filePath: string;

	/** Module class name */
	name: string;

	/** Components declared in this module */
	declarations: string[];

	/** Imported modules */
	imports: string[];

	/** Services provided by this module */
	providers: string[];

	/** Components exported from this module */
	exports: string[];
}

// ============================================================================
// DEPENDENCY GRAPH TYPES
// ============================================================================

export interface DependencyNode {
	/** Unique identifier (file path or class name) */
	id: string;

	/** Human-readable name */
	name: string;

	/** Entity type: 'component', 'service', 'guard', 'interceptor', 'module' */
	type: 'component' | 'service' | 'guard' | 'interceptor' | 'module' | 'api';

	/** Dependencies this node has */
	dependencies: string[];
}

export interface DependencyGraph {
	/** All nodes in the dependency graph */
	nodes: DependencyNode[];

	/** Detected circular dependencies (array of paths) */
	circularDependencies: string[][];

	/** Service-to-service dependency map */
	serviceDependencies: Map<string, string[]>;

	/** Component-to-service dependency map */
	componentDependencies: Map<string, string[]>;
}

// ============================================================================
// PROJECT ANALYSIS TYPES
// ============================================================================

export interface AngularProject {
	/** Root directory path of the Angular project */
	projectRoot: string;

	/** Detected Angular version (e.g., '17.0.0') */
	version: string;

	/** Whether project uses standalone components (Angular 14+) */
	isStandalone: boolean;

	/** All detected components */
	components: AngularComponent[];

	/** All detected services */
	services: AngularService[];

	/** All detected routes */
	routes: AngularRoute[];

	/** All detected route guards */
	guards: AngularGuard[];

	/** All detected HTTP interceptors */
	interceptors: AngularInterceptor[];

	/** All detected NgModules */
	modules: AngularModule[];

	/** Dependency analysis results */
	dependencyGraph: DependencyGraph;

	/** Build time in milliseconds */
	analysisTime: number;

	/** Any warnings or issues found during analysis */
	warnings: string[];
}

// ============================================================================
// ANALYSIS RESULT TYPES
// ============================================================================

export interface AnalysisResult<T = unknown> {
	/** Whether analysis succeeded */
	success: boolean;

	/** Analysis data (if successful) */
	data: T | null;

	/** Errors encountered during analysis */
	errors: string[];

	/** Non-critical warnings */
	warnings: string[];
}

// ============================================================================
// REPORT GENERATION TYPES
// ============================================================================

export interface GeneratedReport {
	/** Markdown formatted project overview */
	markdown: string;

	/** Mermaid flowcharts (component-service relationships) */
	componentServiceChart: string;

	/** Mermaid flowchart (route hierarchy) */
	routeFlowchart: string;

	/** Mermaid flowchart (service dependencies) */
	dependencyChart: string;

	/** All errors encountered during generation */
	errors: string[];
}

// ============================================================================
// FILE ANALYSIS TYPES
// ============================================================================

export interface FileAnalysisContext {
	/** Full file path */
	filePath: string;

	/** File content */
	content: string;

	/** File type: 'component', 'service', 'route', 'guard', 'interceptor', 'module' */
	fileType: string;

	/** Class name extracted from file */
	className: string | null;
}
