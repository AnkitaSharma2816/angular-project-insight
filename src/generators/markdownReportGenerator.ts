/**
 * Markdown Report Generator
 * Converts analyzed Angular project data into formatted markdown
 * Creates comprehensive project overview, statistics, and entity listings
 */

import {
	AngularProject,
	DependencyGraph,
	AngularComponent,
	AngularService,
	AngularRoute,
} from '../models/types';
import * as dependencyAnalyzer from '../analyzers/dependencyAnalyzer';

/**
 * Generate complete markdown project overview (SMART STRUCTURE)
 * Organized for quick understanding of architecture
 * @param project AngularProject analysis result
 * @returns Formatted markdown string
 */
export function generateProjectOverview(project: AngularProject): string {
	const sections = [
		generateTitle(),
		generateArchitectureSection(project),
		generateStatisticsSection(project),
		generateComponentsSection(project),
		generateServicesSection(project),
		generateRoutesSection(project),
		generateGuardsAndInterceptorsSection(project),
		generateDependencyInsightsSection(project),
		generateWarningsSection(project),
	];

	return sections.join('\n\n');
}

/**
 * Generate document title
 */
function generateTitle(): string {
	return `# 📊 Angular Project Insight Report

Generated: ${new Date().toLocaleString()}`;
}

/**
 * Generate architecture section
 */
function generateArchitectureSection(project: AngularProject): string {
	const architectureType = project.isStandalone
		? 'Standalone Components (Angular 14+)'
		: 'Traditional Module-Based Architecture';

	return `## 🏗️ Architecture Overview

| Property | Value |
|----------|-------|
| **Angular Version** | ${project.version} |
| **Architecture Style** | ${architectureType} |
| **Project Root** | \`${project.projectRoot}\` |
| **Analysis Duration** | ${project.analysisTime}ms |`;
}

/**
 * Generate statistics section
 */
function generateStatisticsSection(project: AngularProject): string {
	const stats = dependencyAnalyzer.getDependencyGraphStats(
		project.dependencyGraph
	);

	const rows = [
		['Total Entities', stats.totalNodes],
		['Components', stats.componentCount],
		['Services', stats.serviceCount],
		['Route Guards', stats.guardCount],
		['HTTP Interceptors', stats.interceptorCount],
		['Distinct Routes', project.routes.length],
		['Avg Dependencies/Entity', stats.averageDependenciesPerNode],
		['Max Dependency Depth', stats.maxDependencyDepth],
		['Circular Dependencies', stats.circularDependencyCount],
	];

	let table = `## 📈 Statistics

| Metric | Count |
|--------|-------|
`;

	for (const [metric, count] of rows) {
		table += `| ${metric} | ${count} |\n`;
	}

	return table;
}

/**
 * Generate components section
 */
function generateComponentsSection(project: AngularProject): string {
	if (project.components.length === 0) {
		return `## 🧩 Components

No components found in project.`;
	}

	let section = `## 🧩 Components (${project.components.length})

| Component | Selector | Type | Dependencies |
|-----------|----------|------|--------------|
`;

	for (const component of project.components) {
		const type = component.isStandalone ? 'Standalone' : 'Module';
		const depList =
			component.dependencies.length > 0
				? component.dependencies.slice(0, 3).join(', ')
				: 'None';
		const depSuffix =
			component.dependencies.length > 3
				? ` +${component.dependencies.length - 3}`
				: '';

		section += `| \`${component.name}\` | \`${component.selector}\` | ${type} | ${depList}${depSuffix} |\n`;
	}

	section += `
### Component Dependencies
${generateComponentDependencyList(project.components)}`;

	return section;
}

/**
 * Generate component dependency list
 */
function generateComponentDependencyList(
	components: AngularComponent[]
): string {
	let list = '';

	for (const component of components) {
		if (component.dependencies.length > 0) {
			list += `\n- **${component.name}** depends on:\n`;
			for (const dep of component.dependencies) {
				list += `  - \`${dep}\`\n`;
			}
		}
	}

	return list || 'No component-service dependencies detected.';
}

/**
 * Generate services section
 */
function generateServicesSection(project: AngularProject): string {
	if (project.services.length === 0) {
		return `## 💼 Services

No services found in project.`;
	}

	let section = `## 💼 Services (${project.services.length})

| Service | Provided In | Dependencies | HTTP Methods |
|---------|-------------|--------------|--------------|
`;

	for (const service of project.services) {
		const providedIn = service.providedIn || 'unknown';
		const depCount = service.dependencies.length;
		const httpMethods = service.httpMethods.length > 0
			? service.httpMethods.map((m) => m.toUpperCase()).join(', ')
			: 'None';

		section += `| \`${service.name}\` | ${providedIn} | ${depCount} | ${httpMethods} |\n`;
	}

	// Add service details
	const unusedServices = dependencyAnalyzer.getUnusedServices(
		project.dependencyGraph
	);

	if (unusedServices.length > 0) {
		section += `
### ⚠️ Potentially Unused Services
${unusedServices.map((s) => `- \`${s}\``).join('\n')}`;
	}

	// Add services with high dependency count
	const serviceHubs = dependencyAnalyzer.getServiceHubs(
		project.dependencyGraph.serviceDependencies
	);
	if (serviceHubs.length > 0) {
		section += `
### 🔌 Core Services (Most Depended Upon)
${serviceHubs.map((s) => `- \`${s}\``).join('\n')}`;
	}

	return section;
}

/**
 * Generate routes section
 */
function generateRoutesSection(project: AngularProject): string {
	if (project.routes.length === 0) {
		return `## 🛣️ Routes

### ⚠️ No Routes Detected

The analyzer searched for route files but found none. This could mean:

1. **No routing configured** - Your Angular project might not have routing set up
2. **Route file naming** - If you use custom route file names, they might not match the search patterns
3. **Inline routing** - Routes defined inline in app.config.ts or similar files

**Common route file names searched:**
- \`app-routing.module.ts\`
- \`*-routing.module.ts\`
- \`app.routes.ts\`
- \`*.routes.ts\`
- \`routes.ts\`

**Check your project:**
- Look for files with "routes" in the name in your \`src/app/\` directory
- If using standalone APIs (Angular 14+), look for \`provideRouter()\` calls
- If using NgModule, look for \`RouterModule.forRoot()\` calls in your app module`;
	}

	let section = `## 🛣️ Routes (${project.routes.length})

| Path | Component | Type | Guards |
|------|-----------|------|--------|
`;

	// Flatten routes for display
	function addRouteRows(routes: any[], prefix: string = '') {
		for (const route of routes) {
			const path = route.isWildcard ? '**' : (route.path || '/');
			const fullPath = prefix ? `${prefix}/${path}` : `/${path}`;
			const component = route.component || (route.lazyModule ? '(lazy)' : '—');
			const routeType = route.lazyModule ? '🔄 Lazy' : '📄 Eager';
			const guards = route.guards.length > 0
				? route.guards.join(', ')
				: '—';

			section += `| \`${fullPath}\` | ${component} | ${routeType} | ${guards} |\n`;

			// Add child routes with indentation
			if (route.children && route.children.length > 0) {
				addRouteRows(route.children, fullPath);
			}
		}
	}

	addRouteRows(project.routes);

	// Lazy-loaded modules summary
	const lazyRoutes = project.routes.flatMap((r) => {
		function collectLazy(routes: any[]): any[] {
			return routes
				.filter((r) => r.lazyModule !== null)
				.concat(
					routes.flatMap((r) =>
						r.children ? collectLazy(r.children) : []
					)
				);
		}
		return collectLazy([r]);
	});

	if (lazyRoutes.length > 0) {
		section += `
### 📦 Lazy-Loaded Modules
${lazyRoutes.map((r) => `- \`${r.lazyModule}\` at \`${r.path}\``).join('\n')}`;
	}

	return section;
}

/**
 * Generate guards and interceptors section
 */
function generateGuardsAndInterceptorsSection(
	project: AngularProject
): string {
	let section = '';

	if (project.guards.length > 0) {
		section += `## 🔐 Route Guards (${project.guards.length})

| Guard | Type | Dependencies |
|-------|------|--------------|
`;

		for (const guard of project.guards) {
			const depList = guard.dependencies.slice(0, 2).join(', ') || 'None';
			section += `| \`${guard.name}\` | ${guard.guardType} | ${depList} |\n`;
		}
	}

	if (project.interceptors.length > 0) {
		section += `\n## 📡 HTTP Interceptors (${project.interceptors.length})

| Interceptor | Dependencies |
|-------------|--------------|
`;

		for (const interceptor of project.interceptors) {
			const depList =
				interceptor.dependencies.join(', ') || 'None';
			section += `| \`${interceptor.name}\` | ${depList} |\n`;
		}
	}

	return section;
}

/**
 * Generate dependency insights section
 */
function generateDependencyInsightsSection(
	project: AngularProject
): string {
	let section = `## 🔗 Dependency Insights

### Dependency Graph Statistics
- **Total Entities**: ${project.dependencyGraph.nodes.length}
- **Average Dependencies per Entity**: ${dependencyAnalyzer
		.getDependencyGraphStats(project.dependencyGraph)
		.averageDependenciesPerNode.toFixed(2)}
- **Maximum Dependency Depth**: ${dependencyAnalyzer
		.getDependencyGraphStats(project.dependencyGraph)
		.maxDependencyDepth}
`;

	if (project.dependencyGraph.circularDependencies.length > 0) {
		section += `
### ⚠️ Circular Dependencies (${project.dependencyGraph.circularDependencies.length})

Circular dependencies can cause issues. Consider refactoring:

${project.dependencyGraph.circularDependencies
	.map((cycle) => `- ${cycle.join(' → ')}`)
	.join('\n')}
`;
	} else {
		section += `
### ✅ No Circular Dependencies Detected

The dependency graph is clean and acyclic.`;
	}

	return section;
}

/**
 * Generate warnings section
 */
function generateWarningsSection(project: AngularProject): string {
	if (project.warnings.length === 0) {
		return `## ✅ No Warnings

The project analysis completed successfully with no warnings.`;
	}

	let section = `## ⚠️ Warnings (${project.warnings.length})

`;
	for (const warning of project.warnings) {
		section += `- ${warning}\n`;
	}

	return section;
}

/**
 * Generate component service matrix (which components use which services)
 * Useful for understanding service usage patterns
 */
export function generateComponentServiceMatrix(
	project: AngularProject
): string {
	let matrix = `## 🔀 Component-Service Usage Matrix

| Component | Services Used |
|-----------|---------------|
`;

	for (const component of project.components) {
		const services = component.dependencies
			.filter((dep) =>
				project.services.some((s) => s.name === dep)
			)
			.join(', ') || '—';

		matrix += `| \`${component.name}\` | ${services} |\n`;
	}

	return matrix;
}

/**
 * Generate API endpoints summary
 */
export function generateApiEndpointsSummary(
	project: AngularProject
): string {
	const endpoints = new Set<string>();

	for (const service of project.services) {
		service.apiEndpoints.forEach((ep) => endpoints.add(ep));
	}

	if (endpoints.size === 0) {
		return `## 📡 API Endpoints

No API endpoints detected in services.`;
	}

	let section = `## 📡 API Endpoints (${endpoints.size})

| Endpoint |
|----------|
`;

	for (const endpoint of Array.from(endpoints).sort()) {
		section += `| \`${endpoint}\` |\n`;
	}

	return section;
}
