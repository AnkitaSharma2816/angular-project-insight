/**
 * Centralized regex patterns for Angular code analysis
 * Used to parse decorators, imports, injections, and routes
 */

// ============================================================================
// DECORATOR PATTERNS
// ============================================================================

/**
 * Matches @Component decorator and extracts its configuration
 * Handles both single-line and multi-line formats
 * Captures: selector, templateUrl, styleUrls, standalone
 */
export const COMPONENT_DECORATOR_PATTERN =
	/@Component\s*\(\s*{([\s\S]*?)}\s*\)/;

/**
 * Extract specific properties from decorator config
 * Examples: selector: 'app-dashboard', templateUrl: './dashboard.html'
 */
export const DECORATOR_PROPERTY_PATTERN =
	/(\w+)\s*:\s*([^,\n}]+)/g;

/**
 * Matches @Injectable decorator
 * Captures: providedIn scope
 */
export const SERVICE_DECORATOR_PATTERN =
	/@Injectable\s*\(\s*{([\s\S]*?)}\s*\)/;

/**
 * Matches @NgModule decorator for module analysis
 * Captures: declarations, imports, providers, exports
 */
export const NGMODULE_DECORATOR_PATTERN =
	/@NgModule\s*\(\s*{([\s\S]*?)}\s*\)/;

/**
 * Matches CanActivate, CanDeactivate, CanLoad, CanActivateChild guards
 */
export const GUARD_INTERFACE_PATTERN =
	/implements\s+(CanActivate|CanActivateChild|CanDeactivate|CanLoad)/;

/**
 * Matches HttpInterceptor implementation
 */
export const INTERCEPTOR_INTERFACE_PATTERN = /implements\s+HttpInterceptor/;

// ============================================================================
// IMPORT PATTERNS
// ============================================================================

/**
 * Matches ES6 import statements
 * Captures: imported items, source module
 * Example: import { Component, OnInit } from '@angular/core'
 */
export const IMPORT_STATEMENT_PATTERN =
	/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;

/**
 * Match specific named import from a module
 * Example: import { Component } from '@angular/core'
 */
export const NAMED_IMPORT_PATTERN =
	/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;

/**
 * Extract single import item (for splitting comma-separated imports)
 */
export const IMPORT_ITEM_PATTERN = /\w+/g;

// ============================================================================
// DEPENDENCY INJECTION PATTERNS
// ============================================================================

/**
 * Matches constructor with dependency injections
 * Captures the entire constructor parameter list
 * Example: constructor(private service: MyService, private http: HttpClient)
 */
export const CONSTRUCTOR_PATTERN =
	/constructor\s*\(\s*([^)]*)\s*\)/;

/**
 * Extract individual constructor parameters
 * Captures: access modifier, parameter name, type
 * Example: private service: MyService
 */
export const CONSTRUCTOR_PARAMETER_PATTERN =
	/(private|public|protected)?\s*(\w+)\s*:\s*(\w+)/g;

/**
 * Match inline property injection
 * Example: @Input() title: string = '';
 */
export const INPUT_PROPERTY_PATTERN = /@Input\s*\(\s*\)\s*(\w+)/g;

/**
 * Match Output property
 * Example: @Output() onClose = new EventEmitter();
 */
export const OUTPUT_PROPERTY_PATTERN = /@Output\s*\(\s*\)\s*(\w+)/g;

// ============================================================================
// ROUTE DEFINITION PATTERNS
// ============================================================================

/**
 * Matches const routes or export const routes declaration
 * Captures entire routes array
 */
export const ROUTES_DECLARATION_PATTERN =
	/(?:const|export\s+const)\s+\w*[Rr]outes\s*[:\w<>]*=\s*\[([\s\S]*?)\]\s*;/;

/**
 * Matches individual route object in routes array
 * Captures route properties
 */
export const ROUTE_OBJECT_PATTERN = /{([\s\S]*?)}/;

/**
 * Extract route path
 * Example: path: 'dashboard'
 */
export const ROUTE_PATH_PATTERN = /path\s*:\s*['"]([^'"]*)['"]/;

/**
 * Extract component from route
 * Example: component: DashboardComponent
 */
export const ROUTE_COMPONENT_PATTERN = /component\s*:\s*(\w+)/;

/**
 * Extract lazy-loaded module path
 * Example: loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
 */
export const LAZY_LOAD_PATTERN =
	/loadChildren\s*:\s*\(\s*\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/;

/**
 * Extract route guards
 * Example: canActivate: [AuthGuard]
 */
export const GUARD_PATTERN = /canActivate\s*:\s*\[([\w,\s]+)\]/;

/**
 * Extract child routes
 * Captures children array
 */
export const CHILDREN_ROUTES_PATTERN = /children\s*:\s*\[([\s\S]*?)\]/;

/**
 * Redirect route pattern
 * Example: redirectTo: 'dashboard'
 */
export const REDIRECT_PATTERN = /redirectTo\s*:\s*['"]([^'"]*)['"]/;

/**
 * Wildcard route pattern
 */
export const WILDCARD_ROUTE_PATTERN = /path\s*:\s*['"]\*\*['"]/;

// ============================================================================
// SELECTOR & CLASS NAME PATTERNS
// ============================================================================

/**
 * Extract selector from @Component decorator
 * Example: selector: 'app-dashboard'
 */
export const SELECTOR_PATTERN = /selector\s*:\s*['"]([^'"]+)['"]/;

/**
 * Extract class name
 * Example: export class DashboardComponent
 */
export const CLASS_DEFINITION_PATTERN =
	/export\s+class\s+(\w+)(\s+(?:implements|extends)\s+[\w\s,<>.]+)?/;

/**
 * Match standalone: true in @Component
 */
export const STANDALONE_PATTERN = /standalone\s*:\s*true/;

// ============================================================================
// TEMPLATEURL & STYLEURLS PATTERNS
// ============================================================================

/**
 * Extract templateUrl value
 */
export const TEMPLATE_URL_PATTERN = /templateUrl\s*:\s*['"]([^'"]+)['"]/;

/**
 * Extract styleUrls array
 */
export const STYLE_URLS_PATTERN = /styleUrls\s*:\s*\[([^\]]+)\]/;

/**
 * Extract individual style URL from styleUrls array
 */
export const STYLE_URL_ITEM_PATTERN = /['"]([^'"]+)['"]/g;

// ============================================================================
// API & HTTP PATTERNS
// ============================================================================

/**
 * Detect HTTP method calls
 * Examples: this.http.get(...), this.http.post(...), etc.
 */
export const HTTP_METHOD_PATTERN = /this\.http\.(get|post|put|patch|delete|request|head)\s*<([^>]+)>/g;

/**
 * Extract API endpoint URL from HTTP call
 * Example: this.http.get('/api/users')
 */
export const API_ENDPOINT_PATTERN =
	/(?:get|post|put|patch|delete|request|head)\s*\(\s*['"]([^'"]+)['"]/g;

// ============================================================================
// UTILITY FUNCTIONS FOR PATTERN MATCHING
// ============================================================================

/**
 * Safely extract string value between quotes
 * Handles both single and double quotes
 */
export function extractQuotedValue(text: string): string {
	const match = text.match(/['"]([^'"]+)['"]/);
	return match ? match[1] : '';
}

/**
 * Extract array values from bracket-enclosed list
 */
export function extractArrayItems(text: string): string[] {
	const match = text.match(/\[([^\]]*)\]/);
	if (!match) return [];

	return match[1]
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

/**
 * Extract properties from decorator config object
 * Returns key-value pairs found in decorator
 */
export function extractDecoratorProperties(
	decoratorContent: string
): Record<string, string> {
	const properties: Record<string, string> = {};

	const propertyMatches = decoratorContent.matchAll(DECORATOR_PROPERTY_PATTERN);
	for (const match of propertyMatches) {
		const key = match[1].trim();
		let value = match[2].trim();

		// Remove trailing comma if present
		if (value.endsWith(',')) {
			value = value.slice(0, -1).trim();
		}

		properties[key] = value;
	}

	return properties;
}

/**
 * Extract class name from TypeScript class definition
 */
export function extractClassName(fileContent: string): string | null {
	const match = fileContent.match(CLASS_DEFINITION_PATTERN);
	return match ? match[1] : null;
}

/**
 * Check if file contains a specific decorator
 */
export function hasDecorator(
	fileContent: string,
	decoratorName: string
): boolean {
	const pattern = new RegExp(`@${decoratorName}\\s*\\(`);
	return pattern.test(fileContent);
}

/**
 * Check if component is standalone
 */
export function isStandaloneComponent(fileContent: string): boolean {
	return STANDALONE_PATTERN.test(fileContent);
}

/**
 * Extract all imports from a file
 */
export function extractImports(
	fileContent: string
): Array<{ items: string[]; from: string }> {
	const imports: Array<{ items: string[]; from: string }> = [];

	const importMatches = fileContent.matchAll(NAMED_IMPORT_PATTERN);
	for (const match of importMatches) {
		const items = match[1]
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);

		imports.push({
			items,
			from: match[2],
		});
	}

	return imports;
}

/**
 * Extract constructor parameters (dependencies)
 */
export function extractConstructorDependencies(
	fileContent: string
): string[] {
	const dependencies: string[] = [];

	const constructorMatch = fileContent.match(CONSTRUCTOR_PATTERN);
	if (!constructorMatch) return dependencies;

	const parameterMatches = constructorMatch[1].matchAll(
		CONSTRUCTOR_PARAMETER_PATTERN
	);
	for (const match of parameterMatches) {
		const type = match[3];
		dependencies.push(type);
	}

	return dependencies;
}
