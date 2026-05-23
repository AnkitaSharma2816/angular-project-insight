/**
 * File System Utilities
 * Handles file discovery, reading, and path operations
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getWorkspaceRootPath(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    return workspaceFolders[0].uri.fsPath;
}

export function isWorkspaceOpen(): boolean {
    return !!(vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0);
}

export function getAbsolutePath(uri: vscode.Uri): string {
    return uri.fsPath;
}

export async function readFileContent(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString('utf8');
}

export async function findComponentFiles(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('**/*.component.ts', '**/node_modules/**');
}

export async function findServiceFiles(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('**/*.service.ts', '**/node_modules/**');
}

export async function findRouteFiles(): Promise<vscode.Uri[]> {
    const patterns = [
        '**/app-routing.module.ts',
        '**/*-routing.module.ts',
        '**/*.routes.ts',
        '**/routes.ts',
        '**/app.routes.ts'
    ];
    
    const allUris: vscode.Uri[] = [];
    for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 100);
        allUris.push(...files);
    }
    
    const uniqueUris = Array.from(new Map(allUris.map(uri => [uri.path, uri])).values());
    console.log(`📁 Found ${uniqueUris.length} route file(s):`, uniqueUris.map(u => path.basename(u.path)));
    return uniqueUris;
}

export async function findGuardFiles(): Promise<vscode.Uri[]> {
    const patterns = ['**/*.guard.ts', '**/guards/*.ts'];
    const allUris: vscode.Uri[] = [];
    for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
        allUris.push(...files);
    }
    return Array.from(new Map(allUris.map(uri => [uri.path, uri])).values());
}

export async function findInterceptorFiles(): Promise<vscode.Uri[]> {
    const patterns = ['**/*.interceptor.ts', '**/interceptors/*.ts'];
    const allUris: vscode.Uri[] = [];
    for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
        allUris.push(...files);
    }
    return Array.from(new Map(allUris.map(uri => [uri.path, uri])).values());
}

export async function findModuleFiles(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('**/*.module.ts', '**/node_modules/**');
}

export async function getAngularVersion(): Promise<string | null> {
    try {
        const workspaceRoot = getWorkspaceRootPath();
        if (!workspaceRoot) return null;
        
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.warn('package.json not found');
            return null;
        }
        
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        
        const ngCoreVersion = packageJson.dependencies?.['@angular/core'] || 
                              packageJson.devDependencies?.['@angular/core'];
        
        if (!ngCoreVersion) {
            console.warn('Angular core not found');
            return null;
        }
        
        let cleanVersion = ngCoreVersion.replace(/[\^~>=<]/g, '').replace(/^v+/g, '').trim();
        const versionMatch = cleanVersion.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
            cleanVersion = versionMatch[1];
        } else {
            const majorMatch = cleanVersion.match(/(\d+)/);
            if (majorMatch) cleanVersion = majorMatch[1];
        }
        
        const formattedVersion = `v${cleanVersion}`;
        console.log(`📦 Detected Angular version: ${formattedVersion}`);
        return formattedVersion;
    } catch (error) {
        console.error('Error reading Angular version:', error);
        return null;
    }
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

export function getRelativePath(absolutePath: string): string {
    const workspaceRoot = getWorkspaceRootPath();
    if (!workspaceRoot) return absolutePath;
    return path.relative(workspaceRoot, absolutePath);
}

export function getFileExtension(filePath: string): string {
    return path.extname(filePath);
}

export function getFileName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
}