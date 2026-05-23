/**
 * WebView Panel Manager
 * Manages webview panels for displaying reports
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class PanelManager {
    private currentPanel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async showReport(content: string, title: string = 'Angular Project Insight Report'): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : vscode.ViewColumn.One;

        if (this.currentPanel) {
            this.currentPanel.reveal(column);
            this.currentPanel.webview.html = this.getHtmlContent(content, title);
        } else {
            this.currentPanel = vscode.window.createWebviewPanel(
                'angularInsightReport',
                title,
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.currentPanel.webview.html = this.getHtmlContent(content, title);

            this.currentPanel.onDidDispose(() => {
                this.currentPanel = undefined;
            });
        }
    }

    private getHtmlContent(content: string, title: string): string {
        const htmlContent = this.markdownToHtml(content);
        
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    line-height: 1.6;
                }
                pre {
                    background-color: #f6f8fa;
                    padding: 1rem;
                    border-radius: 6px;
                    overflow-x: auto;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1rem 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                button {
                    background-color: #007acc;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 10px;
                }
                button:hover {
                    background-color: #005a9e;
                }
            </style>
        </head>
        <body>
            <div style="margin-bottom: 20px;">
                <button onclick="copyToClipboard()">📋 Copy Report</button>
                <button onclick="exportToMarkdown()">💾 Export as Markdown</button>
                <button onclick="window.print()">🖨️ Print / Save as PDF</button>
            </div>
            <div id="report-content">
                ${htmlContent}
            </div>
            <script>
                function copyToClipboard() {
                    const content = document.getElementById('report-content').innerText;
                    navigator.clipboard.writeText(content);
                    alert('Report copied to clipboard!');
                }
                function exportToMarkdown() {
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({ command: 'exportMarkdown', content: ${JSON.stringify(content)} });
                }
            </script>
        </body>
        </html>`;
    }

    private markdownToHtml(markdown: string): string {
        let html = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Convert tables
        const tableRegex = /\|(.+)\|\n\|[-: |]+\|\n((?:\|.+\|\n?)+)/g;
        html = html.replace(tableRegex, (match, header, rows) => {
            const headers = header.split('|').filter((h: string) => h.trim());
            let tableHtml = '<table><thead><tr>';
            headers.forEach((h: string) => {
                tableHtml += `<th>${h.trim()}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
            
            const rowLines = rows.split('\n').filter((r: string) => r.trim());
            rowLines.forEach((row: string) => {
                const cells = row.split('|').filter((c: string) => c.trim());
                tableHtml += '<tr>';
                cells.forEach((cell: string) => {
                    tableHtml += `<td>${cell.trim()}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table>';
            return tableHtml;
        });
        
        return html;
    }

    async exportToMarkdown(content: string): Promise<void> {
        const uri = await vscode.window.showSaveDialog({
            filters: { 'Markdown': ['md'] },
            defaultUri: vscode.Uri.file('angular-insight-report.md')
        });
        
        if (uri) {
            fs.writeFileSync(uri.fsPath, content);
            vscode.window.showInformationMessage(`Report saved to ${uri.fsPath}`);
        }
    }
}