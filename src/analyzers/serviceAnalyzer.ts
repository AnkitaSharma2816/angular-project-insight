/**
 * Service File Analyzer
 * Parses @Injectable decorated TypeScript files
 * Extracts: providedIn scope, dependencies, HTTP methods, API endpoints
 */

import * as vscode from 'vscode';
import { AngularService } from '../models/types';
import * as regexPatterns from '../utils/regexPatterns';
import * as fileUtils from '../utils/fileUtils';

/**
 * Analyze a single service file
 * @param uri VS Code URI of the service file
 * @param fileContent File content
 * @returns AngularService object with extracted metadata
 */
export async function analyzeServiceFile(
	uri: vscode.Uri,
	fileContent: string
): Promise<AngularService | null> {
	try {
		const filePath = fileUtils.getAbsolutePath(uri);
		const className = regexPatterns.extractClassName(fileContent);

		if (!className) {
			console.warn(`No class definition found in ${filePath}`);
			return null;
		}

		// Check for @Injectable decorator
		if (!regexPatterns.hasDecorator(fileContent, 'Injectable')) {
			console.warn(`No @Injectable decorator found in ${filePath}`);
			return null;
		}

		// Extract providedIn scope
		const providedIn = extractProvidedIn(fileContent);

		// Extract dependencies from constructor
		const dependencies =
			regexPatterns.extractConstructorDependencies(fileContent);

		// Extract HTTP method calls
		const httpMethods = extractHttpMethods(fileContent);

		// Extract API endpoints
		const apiEndpoints = extractApiEndpoints(fileContent);

		const service: AngularService = {
			filePath,
			name: className,
			providedIn,
			dependencies,
			httpMethods,
			apiEndpoints,
		};

		return service;
	} catch (error) {
		console.error(`Error analyzing service ${uri.fsPath}:`, error);
		return null;
	}
}

/**
 * Extract providedIn scope from @Injectable decorator
 * @param fileContent File content
 * @returns providedIn value or 'root' as default or null
 */
function extractProvidedIn(fileContent: string): string | null {
	const match = fileContent.match(regexPatterns.SERVICE_DECORATOR_PATTERN);
	if (!match) return null;

	const decoratorContent = match[1];
	const properties =
		regexPatterns.extractDecoratorProperties(decoratorContent);

	if (!properties['providedIn']) {
		// If no providedIn specified, Angular defaults to 'root'
		return 'root';
	}

	return properties['providedIn'].replace(/['"]/g, '').trim();
}

/**
 * Extract HTTP methods used in the service
 * @param fileContent File content
 * @returns Array of HTTP methods (get, post, put, patch, delete)
 */
function extractHttpMethods(fileContent: string): string[] {
	const methods = new Set<string>();

	const httpMatches = fileContent.matchAll(regexPatterns.HTTP_METHOD_PATTERN);
	for (const match of httpMatches) {
		methods.add(match[1].toLowerCase());
	}

	return Array.from(methods);
}

/**
 * Extract API endpoints called in the service
 * @param fileContent File content
 * @returns Array of unique API endpoint URLs
 */
function extractApiEndpoints(fileContent: string): string[] {
	const endpoints = new Set<string>();

	const endpointMatches = fileContent.matchAll(
		regexPatterns.API_ENDPOINT_PATTERN
	);
	for (const match of endpointMatches) {
		const endpoint = match[1];
		// Skip template literals and variable references
		if (!endpoint.includes('${') && !endpoint.includes('`')) {
			endpoints.add(endpoint);
		}
	}

	return Array.from(endpoints);
}

/**
 * Analyze all service files in workspace
 * @returns Array of analyzed services
 */
export async function analyzeAllServices(): Promise<AngularService[]> {
	const serviceUris = await fileUtils.findServiceFiles();
	const services: AngularService[] = [];

	for (const uri of serviceUris) {
		try {
			const content = await fileUtils.readFileContent(uri);
			const service = await analyzeServiceFile(uri, content);

			if (service) {
				services.push(service);
			}
		} catch (error) {
			console.error(`Failed to analyze service at ${uri.fsPath}:`, error);
		}
	}

	return services;
}

/**
 * Check if service is provided at root level (tree-shaking eligible)
 * @param service AngularService object
 * @returns true if providedIn is 'root'
 */
export function isRootService(service: AngularService): boolean {
	return service.providedIn === 'root';
}

/**
 * Get service HTTP method summary
 * @param service AngularService object
 * @returns Formatted string of HTTP methods used
 */
export function getServiceHttpMethodsSummary(service: AngularService): string {
	if (service.httpMethods.length === 0) {
		return 'No HTTP methods detected';
	}
	return `Uses: ${service.httpMethods.map((m) => m.toUpperCase()).join(', ')}`;
}

/**
 * Get service endpoint summary
 * @param service AngularService object
 * @returns Formatted string of API endpoints
 */
export function getServiceEndpointsSummary(service: AngularService): string {
	if (service.apiEndpoints.length === 0) {
		return 'No API endpoints detected';
	}
	return `Endpoints: ${service.apiEndpoints.join(', ')}`;
}
