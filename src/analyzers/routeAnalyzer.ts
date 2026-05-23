import * as vscode from 'vscode';
import { AngularRoute } from '../models/types';
import * as fileUtils from '../utils/fileUtils';

/**
 * Analyze a single route file
 */
export async function analyzeRouteFile(
	uri: vscode.Uri,
	fileContent: string
): Promise<AngularRoute[]> {

	try {

		console.log("📄 Route file:", uri.fsPath);

		const routeBlocks =
			extractRouteBlocks(fileContent);

		if (routeBlocks.length === 0) {
			console.warn("❌ No route block found");
			return [];
		}

		const allRoutes: AngularRoute[] = [];

		for (const block of routeBlocks) {
			allRoutes.push(...parseRouteObjects(block));
		}

		console.log("✅ Parsed routes:", allRoutes);

		return allRoutes;

	} catch (error) {

		console.error("Route parse error:", error);
		return [];
	}
}

/**
 * Extract routes array from Angular file
 * Supports: export const routes: Routes = [...]
 */
function extractRouteBlocks(content: string): string[] {

	const match =
		content.match(
			/export\s+const\s+\w+\s*:\s*Routes\s*=\s*\[([\s\S]*?)\]/m
		);

	if (!match) {
		return [];
	}

	return [match[1]];
}

/**
 * Parse all route objects inside array
 */
function parseRouteObjects(content: string): AngularRoute[] {

	const routes: AngularRoute[] = [];

	const objects =
		content.match(/\{[\s\S]*?\}/g);

	if (!objects) return [];

	for (const obj of objects) {

		const route =
			parseRouteObject(obj);

		if (route) {
			routes.push(route);
		}
	}

	return routes;
}

/**
 * Parse single route object
 */
function parseRouteObject(
	routeStr: string
): AngularRoute | null {

	try {

		// path
		const pathMatch =
			routeStr.match(
				/path\s*:\s*['"`](.*?)['"`]/
			);

		const path =
			pathMatch ? pathMatch[1] : '';

		// component
		const componentMatch =
			routeStr.match(
				/component\s*:\s*(\w+)/
			);

		const component =
			componentMatch ? componentMatch[1] : null;

		// lazy load (optional)
		let lazyComponent: string | null = null;

		const lazyMatch =
			routeStr.match(
				/loadComponent\s*:\s*\(\)\s*=>.*?(\w+)/
			);

		if (lazyMatch) {
			lazyComponent = lazyMatch[1];
		}

		// redirect
		const redirectMatch =
			routeStr.match(
				/redirectTo\s*:\s*['"`](.*?)['"`]/
			);

		const redirectTo =
			redirectMatch ? redirectMatch[1] : null;

		// guards
		const guardsMatch =
			routeStr.match(
				/canActivate\s*:\s*\[(.*?)\]/
			);

		const guards =
			guardsMatch
				? guardsMatch[1]
					.split(',')
					.map(g => g.trim())
					.filter(Boolean)
				: [];

		// wildcard
		const isWildcard =
			path === '**';

		return {
			path,
			component: component || lazyComponent,
			children: [],
			guards,
			lazyModule: null,
			lazyRoutes: [],
			isWildcard,
			redirectTo
		};

	} catch (err) {

		console.error("Parse error:", routeStr);
		return null;
	}
}

/**
 * Analyze all route files
 */
export async function analyzeAllRoutes():
	Promise<AngularRoute[]> {

	const routeFiles =
		await fileUtils.findRouteFiles();

	console.log("📁 Route files:", routeFiles.length);

	const allRoutes: AngularRoute[] = [];

	for (const file of routeFiles) {

		try {

			const content =
				await fileUtils.readFileContent(file);

			const routes =
				await analyzeRouteFile(file, content);

			allRoutes.push(...routes);

		} catch (err) {

			console.error("File error:", file.fsPath, err);
		}
	}

	return allRoutes;
}

/**
 * Flatten routes
 */
export function flattenRoutes(
	routes: AngularRoute[]
): AngularRoute[] {

	const result: AngularRoute[] = [];

	for (const r of routes) {

		result.push(r);

		if (r.children?.length) {
			result.push(...flattenRoutes(r.children));
		}
	}

	return result;
}

/**
 * Filter helpers
 */
export function getRoutesForComponent(
	routes: AngularRoute[],
	componentName: string
): AngularRoute[] {

	return flattenRoutes(routes)
		.filter(r => r.component === componentName);
}

export function getLazyLoadedRoutes(
	routes: AngularRoute[]
): AngularRoute[] {

	return flattenRoutes(routes)
		.filter(r => !!r.component);
}

export function getGuardedRoutes(
	routes: AngularRoute[]
): AngularRoute[] {

	return flattenRoutes(routes)
		.filter(r => r.guards.length > 0);
}

/**
 * Display helper
 */
export function getRouteDisplayPath(
	route: AngularRoute
): string {

	if (route.isWildcard) return '** (Wildcard)';

	return route.path || '(root)';
}