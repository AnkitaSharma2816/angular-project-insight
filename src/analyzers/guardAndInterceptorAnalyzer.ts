/**
 * Guard and Interceptor File Analyzer
 * Parses guard and interceptor files
 * Extracts: guard types, interceptor configurations, dependencies
 */

import * as vscode from 'vscode';
import { AngularGuard, AngularInterceptor } from '../models/types';
import * as regexPatterns from '../utils/regexPatterns';
import * as fileUtils from '../utils/fileUtils';

// ============================================================================
// GUARD ANALYSIS
// ============================================================================

/**
 * Analyze a single guard file
 * @param uri VS Code URI of the guard file
 * @param fileContent File content
 * @returns AngularGuard object or null
 */
export async function analyzeGuardFile(
	uri: vscode.Uri,
	fileContent: string
): Promise<AngularGuard | null> {
	try {
		const filePath = fileUtils.getAbsolutePath(uri);
		const className = regexPatterns.extractClassName(fileContent);

		if (!className) {
			console.warn(`No class definition found in guard file ${filePath}`);
			return null;
		}

		// Detect guard type
		const guardType = detectGuardType(fileContent);
		if (!guardType) {
			console.warn(`No guard interface found in ${filePath}`);
			return null;
		}

		// Extract dependencies
		const dependencies =
			regexPatterns.extractConstructorDependencies(fileContent);

		const guard: AngularGuard = {
			filePath,
			name: className,
			guardType,
			dependencies,
		};

		return guard;
	} catch (error) {
		console.error(`Error analyzing guard ${uri.fsPath}:`, error);
		return null;
	}
}

/**
 * Detect the type of guard (CanActivate, CanDeactivate, etc.)
 * @param fileContent File content
 * @returns Guard type or null
 */
function detectGuardType(fileContent: string): string | null {
	const match = fileContent.match(regexPatterns.GUARD_INTERFACE_PATTERN);
	return match ? match[1] : null;
}

/**
 * Analyze all guard files in workspace
 * @returns Array of analyzed guards
 */
export async function analyzeAllGuards(): Promise<AngularGuard[]> {
	const guardUris = await fileUtils.findGuardFiles();
	const guards: AngularGuard[] = [];

	for (const uri of guardUris) {
		try {
			const content = await fileUtils.readFileContent(uri);
			const guard = await analyzeGuardFile(uri, content);

			if (guard) {
				guards.push(guard);
			}
		} catch (error) {
			console.error(`Failed to analyze guard at ${uri.fsPath}:`, error);
		}
	}

	return guards;
}

// ============================================================================
// INTERCEPTOR ANALYSIS
// ============================================================================

/**
 * Analyze a single interceptor file
 * @param uri VS Code URI of the interceptor file
 * @param fileContent File content
 * @returns AngularInterceptor object or null
 */
export async function analyzeInterceptorFile(
	uri: vscode.Uri,
	fileContent: string
): Promise<AngularInterceptor | null> {
	try {
		const filePath = fileUtils.getAbsolutePath(uri);
		const className = regexPatterns.extractClassName(fileContent);

		if (!className) {
			console.warn(`No class definition found in interceptor file ${filePath}`);
			return null;
		}

		// Check for HttpInterceptor interface
		if (!fileContent.includes('HttpInterceptor')) {
			console.warn(`No HttpInterceptor interface found in ${filePath}`);
			return null;
		}

		// Extract dependencies
		const dependencies =
			regexPatterns.extractConstructorDependencies(fileContent);

		const interceptor: AngularInterceptor = {
			filePath,
			name: className,
			dependencies,
		};

		return interceptor;
	} catch (error) {
		console.error(`Error analyzing interceptor ${uri.fsPath}:`, error);
		return null;
	}
}

/**
 * Analyze all interceptor files in workspace
 * @returns Array of analyzed interceptors
 */
export async function analyzeAllInterceptors(): Promise<AngularInterceptor[]> {
	const interceptorUris = await fileUtils.findInterceptorFiles();
	const interceptors: AngularInterceptor[] = [];

	for (const uri of interceptorUris) {
		try {
			const content = await fileUtils.readFileContent(uri);
			const interceptor = await analyzeInterceptorFile(uri, content);

			if (interceptor) {
				interceptors.push(interceptor);
			}
		} catch (error) {
			console.error(
				`Failed to analyze interceptor at ${uri.fsPath}:`,
				error
			);
		}
	}

	return interceptors;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get guard description based on type
 * @param guardType Guard type string
 * @returns Human-readable description
 */
export function getGuardTypeDescription(guardType: string): string {
	const descriptions: Record<string, string> = {
		CanActivate: 'Controls access to a route',
		CanActivateChild: 'Controls access to child routes',
		CanDeactivate: 'Prevents navigating away from a route',
		CanLoad: 'Guards lazy-loaded feature modules',
	};

	return descriptions[guardType] || guardType;
}

/**
 * Get guard usage summary
 * @param guardName Guard name
 * @param dependencies Guard dependencies
 * @returns Formatted summary string
 */
export function getGuardSummary(
	guardName: string,
	dependencies: string[]
): string {
	const deps =
		dependencies.length > 0 ? ` (depends on: ${dependencies.join(', ')})` : '';
	return `${guardName}${deps}`;
}

/**
 * Get interceptor usage summary
 * @param interceptorName Interceptor name
 * @param dependencies Interceptor dependencies
 * @returns Formatted summary string
 */
export function getInterceptorSummary(
	interceptorName: string,
	dependencies: string[]
): string {
	const deps =
		dependencies.length > 0 ? ` (depends on: ${dependencies.join(', ')})` : '';
	return `${interceptorName}${deps}`;
}
