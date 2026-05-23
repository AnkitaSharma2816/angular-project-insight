/**
 * File I/O and workspace utility functions
 * Handles reading files, finding Angular files, extracting file metadata
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// FILE READING UTILITIES
// ============================================================================

/**
 * Read file content from URI
 * @param uri VS Code URI of the file
 * @returns File content as string
 */
export async function readFileContent(uri: vscode.Uri): Promise<string> {
	try {
		const fileData = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(fileData).toString('utf-8');
	} catch (error) {
		console.error(`Error reading file ${uri.fsPath}:`, error);
		throw new Error(`Failed to read file: ${uri.fsPath}`);
	}
}

/**
 * Read file content synchronously from file path
 * Useful for reading files outside workspace
 * @param filePath Absolute file path
 * @returns File content as string
 */
export function readFileContentSync(filePath: string): string {
	try {
		return fs.readFileSync(filePath, 'utf-8');
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		throw new Error(`Failed to read file: ${filePath}`);
	}
}

/**
 * Check if a file exists
 * @param uri VS Code URI
 * @returns true if file exists
 */
export async function fileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

// ============================================================================
// FILE DISCOVERY UTILITIES
// ============================================================================

/**
 * Find all Angular component files in workspace
 * @returns Array of component file URIs
 */
export async function findComponentFiles(): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles('**/*.component.ts', '**/node_modules/**');
}

/**
 * Find all Angular service files in workspace
 * @returns Array of service file URIs
 */
export async function findServiceFiles(): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles('**/*.service.ts', '**/node_modules/**');
}

/**
 * Find all Angular module files in workspace
 * @returns Array of module file URIs
 */
export async function findModuleFiles(): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles('**/*.module.ts', '**/node_modules/**');
}

/**
 * Find all route files (typically routes.ts, routing.module.ts, or app-routing.module.ts)
 * @returns Array of route file URIs
 */
export async function findRouteFiles(): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles(
		'**/*{route,routes}*.ts'
	);
}

/**
 * Find all guard files
 * @returns Array of guard file URIs
 */
export async function findGuardFiles(): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles('**/*.guard.ts', '**/node_modules/**');
}

/**
 * Find all interceptor files
 * @returns Array of interceptor file URIs
 */
export async function findInterceptorFiles(): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles('**/*.interceptor.ts', '**/node_modules/**');
}

/**
 * Generic file finder by glob pattern
 * @param pattern Glob pattern
 * @param excludePattern Pattern to exclude
 * @returns Array of file URIs matching pattern
 */
export async function findFilesByPattern(
	pattern: string,
	excludePattern: string = '**/node_modules/**'
): Promise<vscode.Uri[]> {
	return vscode.workspace.findFiles(pattern, excludePattern);
}

// ============================================================================
// FILE NAME & PATH UTILITIES
// ============================================================================

/**
 * Extract file name without extension
 * @param filePath Full file path or URI fsPath
 * @returns File name without extension
 * Example: '/src/app/dashboard.component.ts' -> 'dashboard.component'
 */
export function getFileName(filePath: string): string {
	const basename = path.basename(filePath);
	return basename.substring(0, basename.lastIndexOf('.'));
}

/**
 * Extract just the class-related name from file path
 * @param filePath Full file path
 * @returns Component/Service name
 * Example: '/src/app/dashboard/dashboard.component.ts' -> 'dashboard'
 */
export function extractEntityName(filePath: string): string {
	const basename = path.basename(filePath);
	// Remove .component.ts, .service.ts, .module.ts, etc.
	return basename
		.replace(/\.component\.ts$/, '')
		.replace(/\.service\.ts$/, '')
		.replace(/\.module\.ts$/, '')
		.replace(/\.guard\.ts$/, '')
		.replace(/\.interceptor\.ts$/, '')
		.replace(/\.ts$/, '');
}

/**
 * Get directory name where file is located
 * @param filePath Full file path
 * @returns Directory name
 * Example: '/src/app/dashboard/dashboard.component.ts' -> 'dashboard'
 */
export function getDirectoryName(filePath: string): string {
	const dirname = path.dirname(filePath);
	return path.basename(dirname);
}

/**
 * Get relative path from workspace root
 * @param uri VS Code URI
 * @returns Relative path from workspace root
 */
export function getRelativePath(uri: vscode.Uri): string {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return uri.fsPath;
	}

	const workspaceRoot = workspaceFolders[0].uri.fsPath;
	return path.relative(workspaceRoot, uri.fsPath);
}

/**
 * Get absolute file path from URI
 * @param uri VS Code URI
 * @returns Absolute file path
 */
export function getAbsolutePath(uri: vscode.Uri): string {
	return uri.fsPath;
}

// ============================================================================
// WORKSPACE UTILITIES
// ============================================================================

/**
 * Get workspace root directory
 * @returns Workspace root URI, null if no workspace is open
 */
export function getWorkspaceRoot(): vscode.Uri | null {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return null;
	}
	return workspaceFolders[0].uri;
}

/**
 * Get workspace root as string path
 * @returns Workspace root path
 */
export function getWorkspaceRootPath(): string | null {
	const root = getWorkspaceRoot();
	return root ? root.fsPath : null;
}

/**
 * Check if workspace is open
 * @returns true if workspace exists
 */
export function isWorkspaceOpen(): boolean {
	return vscode.workspace.workspaceFolders !== undefined &&
		vscode.workspace.workspaceFolders.length > 0;
}

// ============================================================================
// PACKAGE.JSON UTILITIES
// ============================================================================

/**
 * Read package.json from workspace root
 * @returns Parsed package.json object
 */
export async function readPackageJson(): Promise<Record<string, any>> {
	const root = getWorkspaceRootPath();
	if (!root) {
		throw new Error('No workspace open');
	}

	const packageJsonPath = path.join(root, 'package.json');
	const content = readFileContentSync(packageJsonPath);
	return JSON.parse(content);
}

/**
 * Get Angular version from package.json
 * @returns Angular version string, or null if not found
 */
export async function getAngularVersion(): Promise<string | null> {
	try {
		const packageJson = await readPackageJson();
		return (
			packageJson.dependencies?.['@angular/core'] ||
			packageJson.devDependencies?.['@angular/core'] ||
			null
		);
	} catch {
		return null;
	}
}

/**
 * Get all dependencies from package.json
 * @returns Object with all dependencies
 */
export async function getDependencies(): Promise<Record<string, string>> {
	try {
		const packageJson = await readPackageJson();
		return {
			...packageJson.dependencies,
			...packageJson.devDependencies,
		};
	} catch {
		return {};
	}
}

// ============================================================================
// TSCONFIG.JSON UTILITIES
// ============================================================================

/**
 * Read tsconfig.json from workspace root
 * @returns Parsed tsconfig.json object
 */
export async function readTsConfig(): Promise<Record<string, any>> {
	const root = getWorkspaceRootPath();
	if (!root) {
		throw new Error('No workspace open');
	}

	const tsconfigPath = path.join(root, 'tsconfig.json');
	const content = readFileContentSync(tsconfigPath);
	// Remove comments from JSON
	const cleaned = content.replace(/\/\/.*$/gm, '');
	return JSON.parse(cleaned);
}

// ============================================================================
// FILE TYPE DETECTION
// ============================================================================

/**
 * Detect file type based on name
 * @param filePath File path
 * @returns File type: 'component', 'service', 'module', 'route', 'guard', 'interceptor', or 'other'
 */
export function detectFileType(filePath: string): string {
	if (filePath.includes('.component.ts')) return 'component';
	if (filePath.includes('.service.ts')) return 'service';
	if (filePath.includes('.module.ts')) return 'module';
	if (filePath.includes('routes.ts')) return 'route';
	if (filePath.includes('.guard.ts')) return 'guard';
	if (filePath.includes('.interceptor.ts')) return 'interceptor';
	return 'other';
}

/**
 * Check if file is an Angular file (.ts)
 * @param filePath File path
 * @returns true if TypeScript file
 */
export function isTypeScriptFile(filePath: string): boolean {
	return filePath.endsWith('.ts');
}

/**
 * Check if file is in node_modules
 * @param filePath File path
 * @returns true if file is in node_modules
 */
export function isNodeModuleFile(filePath: string): boolean {
	return filePath.includes('node_modules');
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Normalize path for cross-platform compatibility
 * @param filePath File path
 * @returns Normalized path
 */
export function normalizePath(filePath: string): string {
	return filePath.replace(/\\/g, '/');
}

/**
 * Convert file URI to normalized path
 * @param uri VS Code URI
 * @returns Normalized path
 */
export function uriToNormalizedPath(uri: vscode.Uri): string {
	return normalizePath(uri.fsPath);
}

/**
 * Get module path from file path (e.g., app/dashboard -> app/dashboard)
 * @param filePath File path
 * @returns Module path
 */
export function getModulePath(filePath: string): string {
	const normalized = normalizePath(filePath);
	return normalized
		.split('/')
		.filter((part) => part && part !== '.')
		.slice(0, -1) // Remove file name
		.join('/')
		.replace(/\.ts$/, '');
}
