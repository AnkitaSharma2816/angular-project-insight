/**
 * Error Handler and Logger Utility
 * Provides consistent logging and error handling across the extension
 */

import * as vscode from 'vscode';

export class ExtensionLogger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: 'info' | 'warn' | 'error' | 'debug';
    
    constructor(name: string = 'Angular Project Insight') {
        this.outputChannel = vscode.window.createOutputChannel(name);
        this.logLevel = 'info';
    }
    
    setLogLevel(level: 'info' | 'warn' | 'error' | 'debug') {
        this.logLevel = level;
    }
    
    logInfo(message: string) {
        if (this.logLevel === 'info' || this.logLevel === 'debug') {
            const formattedMessage = `[${this.getTimestamp()}] [INFO] ${message}`;
            this.outputChannel.appendLine(formattedMessage);
            console.log(formattedMessage);
        }
    }
    
    logWarning(message: string) {
        if (this.logLevel === 'info' || this.logLevel === 'warn' || this.logLevel === 'debug') {
            const formattedMessage = `[${this.getTimestamp()}] [WARN] ${message}`;
            this.outputChannel.appendLine(formattedMessage);
            console.warn(formattedMessage);
        }
    }
    
    logError(message: string, error?: any) {
        const formattedMessage = `[${this.getTimestamp()}] [ERROR] ${message}`;
        this.outputChannel.appendLine(formattedMessage);
        
        if (error) {
            const errorDetails = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`Details: ${errorDetails}`);
            if (error.stack) {
                this.outputChannel.appendLine(`Stack: ${error.stack}`);
            }
            console.error(formattedMessage, error);
        } else {
            console.error(formattedMessage);
        }
        
        // Show error notification for critical errors
        if (message.includes('Failed') || message.includes('Critical')) {
            vscode.window.showErrorMessage(`Angular Insight: ${message}`);
        }
    }
    
    logDebug(message: string) {
        if (this.logLevel === 'debug') {
            const formattedMessage = `[${this.getTimestamp()}] [DEBUG] ${message}`;
            this.outputChannel.appendLine(formattedMessage);
            console.debug(formattedMessage);
        }
    }
    
    showChannel() {
        this.outputChannel.show();
    }
    
    dispose() {
        this.outputChannel.dispose();
    }
    
    private getTimestamp(): string {
        return new Date().toISOString();
    }
}

export class FileValidator {
    static isValidAngularFile(filePath: string): boolean {
        const validExtensions = ['.ts', '.html', '.scss', '.css'];
        const extension = filePath.substring(filePath.lastIndexOf('.'));
        return validExtensions.includes(extension);
    }
    
    static getFileSize(filePath: string): number {
        try {
            const fs = require('fs');
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }
    
    static isWithinSizeLimit(filePath: string, maxSizeMB: number = 5): boolean {
        const sizeInBytes = this.getFileSize(filePath);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB <= maxSizeMB;
    }
}

export class ErrorHandler {
    static handle(error: unknown, context: string): void {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error in ${context}:`, message);
        
        vscode.window.showErrorMessage(`Angular Insight: Failed to ${context}. Check output channel for details.`);
    }
    
    static async wrapAsync<T>(fn: () => Promise<T>, context: string): Promise<T | null> {
        try {
            return await fn();
        } catch (error) {
            this.handle(error, context);
            return null;
        }
    }
}