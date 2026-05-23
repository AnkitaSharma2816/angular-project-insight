/**
 * Component File Analyzer
 * Parses @Component decorated TypeScript files
 * Extracts: selector, templateUrl, styleUrls, dependencies, standalone flag
 */

import * as vscode from 'vscode';
import { AngularComponent } from '../models/types';
import * as regexPatterns from '../utils/regexPatterns';
import * as fileUtils from '../utils/fileUtils';

/**
 * Analyze a single component file
 * @param uri VS Code URI of the component file
 * @param fileContent File content
 * @returns AngularComponent object with extracted metadata
 */
export async function analyzeComponentFile(
	uri: vscode.Uri,
	fileContent: string
): Promise<AngularComponent | null> {
	try {
		const filePath = fileUtils.getAbsolutePath(uri);
		const className = regexPatterns.extractClassName(fileContent);

		if (!className) {
			console.warn(`No class definition found in ${filePath}`);
			return null;
		}

		// Extract @Component decorator
		const componentMatch = fileContent.match(
			regexPatterns.COMPONENT_DECORATOR_PATTERN
		);
		if (!componentMatch) {
			console.warn(`No @Component decorator found in ${filePath}`);
			return null;
		}

		const decoratorContent = componentMatch[1];
		const properties =
			regexPatterns.extractDecoratorProperties(decoratorContent);

		// Extract selector
		const selector = extractSelector(fileContent) || className;

		// Extract templateUrl
		const templateUrl = extractTemplateUrl(fileContent);

		// Extract styleUrls
		const styleUrls = extractStyleUrls(fileContent);

		// Check if standalone
		const isStandalone = regexPatterns.isStandaloneComponent(fileContent);

		// Extract dependencies from constructor
		const dependencies =
			regexPatterns.extractConstructorDependencies(fileContent);

		const component: AngularComponent = {
			filePath,
			name: className,
			selector,
			dependencies,
			templateUrl,
			styleUrls,
			isStandalone,
			parentModule: null, // Will be set by module analyzer
			route: null, // Will be set by route analyzer
		};

		return component;
	} catch (error) {
		console.error(`Error analyzing component ${uri.fsPath}:`, error);
		return null;
	}
}

/**
 * Extract selector from @Component decorator
 * @param fileContent File content
 * @returns Selector string or null
 */
function extractSelector(fileContent: string): string | null {
	const match = fileContent.match(regexPatterns.SELECTOR_PATTERN);
	return match ? match[1] : null;
}

/**
 * Extract templateUrl from @Component decorator
 * @param fileContent File content
 * @returns Template URL or null if inline template or not found
 */
function extractTemplateUrl(fileContent: string): string | null {
	const match = fileContent.match(regexPatterns.TEMPLATE_URL_PATTERN);
	if (!match) return null;

	// Remove ./ prefix if present
	let url = match[1];
	if (url.startsWith('./')) {
		url = url.substring(2);
	}

	return url;
}

/**
 * Extract styleUrls array from @Component decorator
 * @param fileContent File content
 * @returns Array of style URLs
 */
function extractStyleUrls(fileContent: string): string[] {
	const match = fileContent.match(regexPatterns.STYLE_URLS_PATTERN);
	if (!match) return [];

	const styleUrlsContent = match[1];
	const urls: string[] = [];

	const urlMatches = styleUrlsContent.matchAll(
		regexPatterns.STYLE_URL_ITEM_PATTERN
	);
	for (const urlMatch of urlMatches) {
		let url = urlMatch[1];
		// Remove ./ prefix if present
		if (url.startsWith('./')) {
			url = url.substring(2);
		}
		urls.push(url);
	}

	return urls;
}

/**
 * Analyze all component files in workspace
 * @returns Array of analyzed components
 */
export async function analyzeAllComponents(): Promise<AngularComponent[]> {
	const componentUris = await fileUtils.findComponentFiles();
	const components: AngularComponent[] = [];

	for (const uri of componentUris) {
		try {
			const content = await fileUtils.readFileContent(uri);
			const component = await analyzeComponentFile(uri, content);

			if (component) {
				components.push(component);
			}
		} catch (error) {
			console.error(`Failed to analyze component at ${uri.fsPath}:`, error);
		}
	}

	return components;
}

/**
 * Get component name in PascalCase format for display
 * @param component AngularComponent object
 * @returns Formatted component name
 */
export function getComponentDisplayName(component: AngularComponent): string {
	return component.name;
}

/**
 * Get component selector in kebab-case (already in component object)
 * @param component AngularComponent object
 * @returns Component selector
 */
export function getComponentSelector(component: AngularComponent): string {
	return component.selector;
}
