/**
 * PDF Generator Utility
 * Generates PDF reports without external dependencies
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function generatePdf(markdownContent: string, outputPath: string): Promise<void> {
    try {
        console.log('📄 Generating PDF report...');
        
        // Generate HTML from markdown
        const htmlPath = outputPath.replace('.pdf', '.html');
        const htmlContent = generateHtmlFromMarkdown(markdownContent);
        fs.writeFileSync(htmlPath, htmlContent);
        
        // Open HTML in browser for manual PDF saving
        await openHtmlInBrowser(htmlPath);
        
        vscode.window.showInformationMessage(
            `HTML report opened in browser. Press Ctrl+P → "Save as PDF" to save as PDF.`,
            'Open Folder'
        ).then(selection => {
            if (selection === 'Open Folder') {
                vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(path.dirname(htmlPath)));
            }
        });
        
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw error;
    }
}

export async function generateSimplePdf(content: string, outputPath: string): Promise<void> {
    // Alias for generatePdf
    return generatePdf(content, outputPath);
}

async function openHtmlInBrowser(htmlPath: string): Promise<void> {
    try {
        // Open in default browser
        await vscode.env.openExternal(vscode.Uri.file(htmlPath));
    } catch (error) {
        console.error('Failed to open browser:', error);
    }
}

function generateHtmlFromMarkdown(markdown: string): string {
    // Convert markdown to HTML
    let html = markdown;
    
    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    
    // Bold and Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Lists
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/<\/li>\n<li>/g, '</li><li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    
    // Tables
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
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Angular Project Insight Report</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 40px;
                line-height: 1.6;
                color: #333;
                background: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
                color: #dd0031;
                border-bottom: 3px solid #dd0031;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            h2 {
                color: #1976d2;
                margin-top: 30px;
                margin-bottom: 15px;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 8px;
            }
            h3 {
                color: #333;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
                font-size: 14px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 10px 12px;
                text-align: left;
            }
            th {
                background-color: #f5f5f5;
                font-weight: 600;
            }
            tr:nth-child(even) {
                background-color: #fafafa;
            }
            code {
                background-color: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', Courier, monospace;
                font-size: 13px;
            }
            pre {
                background-color: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                margin: 15px 0;
            }
            pre code {
                background: none;
                padding: 0;
            }
            ul, ol {
                margin: 10px 0 10px 30px;
            }
            li {
                margin: 5px 0;
            }
            blockquote {
                border-left: 4px solid #dd0031;
                margin: 15px 0;
                padding-left: 20px;
                color: #666;
            }
            hr {
                border: none;
                border-top: 1px solid #e0e0e0;
                margin: 20px 0;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .print-button {
                text-align: right;
                margin-bottom: 20px;
            }
            button {
                padding: 8px 16px;
                background: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            button:hover {
                background: #005a9e;
            }
            @media print {
                body {
                    padding: 0;
                    margin: 0;
                    background: white;
                }
                .container {
                    box-shadow: none;
                    padding: 20px;
                    max-width: 100%;
                }
                .no-print {
                    display: none;
                }
            }
        </style>
        <script>
            function printToPDF() {
                window.print();
            }
        </script>
    </head>
    <body>
        <div class="container">
            <div class="print-button no-print">
                <button onclick="printToPDF()">📄 Save as PDF (Ctrl+P)</button>
            </div>
            ${html}
            <div class="footer">
                <p>Generated by Angular Project Insight Extension for VS Code</p>
                <p>${new Date().toLocaleString()}</p>
                <p><small>To save as PDF: Click the button above or press Ctrl+P → "Save as PDF"</small></p>
            </div>
        </div>
    </body>
    </html>`;
}