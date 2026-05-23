/**
 * Dependency Analysis
 * Builds dependency graphs and detects relationships between entities
 * Identifies circular dependencies and service-to-service relationships
 */

import {
	DependencyGraph,
	DependencyNode,
	AngularComponent,
	AngularService,
	AngularGuard,
	AngularInterceptor,
} from '../models/types';

// ============================================================================
// DEPENDENCY GRAPH BUILDING
// ============================================================================

/**
 * Build complete dependency graph from all Angular entities
 * @param components Array of components
 * @param services Array of services
 * @param guards Array of guards
 * @param interceptors Array of interceptors
 * @returns Complete DependencyGraph
 */
export function buildDependencyGraph(
	components: AngularComponent[],
	services: AngularService[],
	guards: AngularGuard[],
	interceptors: AngularInterceptor[]
): DependencyGraph {
	const nodes: DependencyNode[] = [];
	const serviceDependencies = new Map<string, string[]>();
	const componentDependencies = new Map<string, string[]>();

	// Create nodes for components
	for (const component of components) {
		nodes.push({
			id: component.name,
			name: component.name,
			type: 'component',
			dependencies: component.dependencies,
		});

		// Map component dependencies
		componentDependencies.set(component.name, component.dependencies);
	}

	// Create nodes for services
	for (const service of services) {
		nodes.push({
			id: service.name,
			name: service.name,
			type: 'service',
			dependencies: service.dependencies,
		});

		// Map service dependencies
		serviceDependencies.set(service.name, service.dependencies);
	}

	// Create nodes for guards
	for (const guard of guards) {
		nodes.push({
			id: guard.name,
			name: guard.name,
			type: 'guard',
			dependencies: guard.dependencies,
		});
	}

	// Create nodes for interceptors
	for (const interceptor of interceptors) {
		nodes.push({
			id: interceptor.name,
			name: interceptor.name,
			type: 'interceptor',
			dependencies: interceptor.dependencies,
		});
	}

	// Detect circular dependencies
	const circularDependencies = detectCircularDependencies(
		nodes,
		serviceDependencies,
		componentDependencies
	);

	return {
		nodes,
		circularDependencies,
		serviceDependencies,
		componentDependencies,
	};
}

/**
 * Detect circular dependencies in the dependency graph
 * @param nodes All dependency nodes
 * @param serviceDeps Service dependency map
 * @param componentDeps Component dependency map
 * @returns Array of circular dependency paths
 */
function detectCircularDependencies(
	nodes: DependencyNode[],
	serviceDeps: Map<string, string[]>,
	componentDeps: Map<string, string[]>
): string[][] {
	const circularDeps: string[][] = [];
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	// Combine all dependencies
	const allDeps = new Map([...serviceDeps, ...componentDeps]);

	for (const node of nodes) {
		if (!visited.has(node.id)) {
			const cycle = findCycle(
				node.id,
				allDeps,
				visited,
				recursionStack,
				[]
			);
			if (cycle) {
				circularDeps.push(cycle);
			}
		}
	}

	return circularDeps;
}

/**
 * Find a circular dependency path using DFS
 * @param nodeId Current node ID
 * @param dependencies Dependency map
 * @param visited Set of visited nodes
 * @param recursionStack Current recursion stack
 * @param path Current path being explored
 * @returns Cycle path if found, null otherwise
 */
function findCycle(
	nodeId: string,
	dependencies: Map<string, string[]>,
	visited: Set<string>,
	recursionStack: Set<string>,
	path: string[]
): string[] | null {
	visited.add(nodeId);
	recursionStack.add(nodeId);
	path.push(nodeId);

	const deps = dependencies.get(nodeId) || [];

	for (const dep of deps) {
		if (!visited.has(dep)) {
			const cycle = findCycle(
				dep,
				dependencies,
				visited,
				recursionStack,
				[...path]
			);
			if (cycle) return cycle;
		} else if (recursionStack.has(dep)) {
			// Found a cycle
			const cycleStart = path.indexOf(dep);
			return path.slice(cycleStart).concat([dep]);
		}
	}

	recursionStack.delete(nodeId);
	return null;
}

// ============================================================================
// DEPENDENCY ANALYSIS UTILITIES
// ============================================================================

/**
 * Get all dependencies of an entity (transitive closure)
 * @param entityName Name of the entity
 * @param dependencyMap Dependency map
 * @returns Set of all direct and indirect dependencies
 */
export function getTransitiveDependencies(
	entityName: string,
	dependencyMap: Map<string, string[]>
): Set<string> {
	const visited = new Set<string>();
	const stack = [entityName];

	while (stack.length > 0) {
		const current = stack.pop()!;

		if (visited.has(current)) continue;
		visited.add(current);

		const deps = dependencyMap.get(current) || [];
		stack.push(...deps);
	}

	visited.delete(entityName); // Remove the starting entity
	return visited;
}

/**
 * Get all entities that depend on a given entity (reverse dependencies)
 * @param entityName Name of the entity
 * @param dependencyMap Dependency map
 * @returns Array of entities that depend on this entity
 */
export function getReverseDependencies(
	entityName: string,
	dependencyMap: Map<string, string[]>
): string[] {
	const reverseDeps: string[] = [];

	for (const [entity, deps] of dependencyMap) {
		if (deps.includes(entityName)) {
			reverseDeps.push(entity);
		}
	}

	return reverseDeps;
}

/**
 * Calculate dependency depth for an entity
 * @param entityName Name of the entity
 * @param dependencyMap Dependency map
 * @returns Maximum depth of dependencies
 */
export function calculateDependencyDepth(
	entityName: string,
	dependencyMap: Map<string, string[]>
): number {
	const visited = new Set<string>();

	function dfs(name: string): number {
		if (visited.has(name)) return 0; // Avoid infinite recursion
		visited.add(name);

		const deps = dependencyMap.get(name) || [];
		if (deps.length === 0) return 0;

		return 1 + Math.max(...deps.map((dep) => dfs(dep)));
	}

	return dfs(entityName);
}

/**
 * Get the most dependent-on services (hubs)
 * @param serviceDeps Service dependency map
 * @param limit Number of top services to return
 * @returns Array of most depended-upon service names
 */
export function getServiceHubs(
	serviceDeps: Map<string, string[]>,
	limit: number = 5
): string[] {
	const dependencyCount = new Map<string, number>();

	// Count how many entities depend on each service
	for (const deps of serviceDeps.values()) {
		for (const dep of deps) {
			dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
		}
	}

	// Sort by count descending and return top N
	return Array.from(dependencyCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([service]) => service);
}

/**
 * Get statistics about the dependency graph
 * @param graph DependencyGraph
 * @returns Statistics object
 */
export function getDependencyGraphStats(graph: DependencyGraph): {
	totalNodes: number;
	componentCount: number;
	serviceCount: number;
	guardCount: number;
	interceptorCount: number;
	circularDependencyCount: number;
	maxDependencyDepth: number;
	averageDependenciesPerNode: number;
} {
	const componentCount = graph.nodes.filter(
		(n) => n.type === 'component'
	).length;
	const serviceCount = graph.nodes.filter((n) => n.type === 'service').length;
	const guardCount = graph.nodes.filter((n) => n.type === 'guard').length;
	const interceptorCount = graph.nodes.filter(
		(n) => n.type === 'interceptor'
	).length;

	const totalDependencies = graph.nodes.reduce(
		(sum, node) => sum + node.dependencies.length,
		0
	);
	const averageDependenciesPerNode =
		graph.nodes.length > 0
			? Number((totalDependencies / graph.nodes.length).toFixed(2))
			: 0;

	let maxDependencyDepth = 0;
	for (const node of graph.nodes) {
		const depth = calculateDependencyDepth(node.id, graph.serviceDependencies);
		maxDependencyDepth = Math.max(maxDependencyDepth, depth);
	}

	return {
		totalNodes: graph.nodes.length,
		componentCount,
		serviceCount,
		guardCount,
		interceptorCount,
		circularDependencyCount: graph.circularDependencies.length,
		maxDependencyDepth,
		averageDependenciesPerNode,
	};
}

/**
 * Identify potentially unused services (no dependencies from components or other services)
 * @param graph DependencyGraph
 * @returns Array of potentially unused service names
 */
export function getUnusedServices(graph: DependencyGraph): string[] {
	const serviceNodes = graph.nodes.filter((n) => n.type === 'service');
	const unused: string[] = [];

	for (const service of serviceNodes) {
		const reverseDeps = getReverseDependencies(
			service.id,
			graph.serviceDependencies
		);
		if (reverseDeps.length === 0) {
			// Also check component dependencies
			const componentReverseDeps = getReverseDependencies(
				service.id,
				graph.componentDependencies
			);
			if (componentReverseDeps.length === 0) {
				unused.push(service.id);
			}
		}
	}

	return unused;
}
