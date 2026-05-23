/**
 * PDF Generator Utility
 * Generates PDF reports with proper markdown to HTML conversion
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function generatePdf(markdownContent: string, outputPath: string): Promise<void> {
    try {
        console.log('📄 Generating PDF report...');
        
        // Generate HTML from markdown
        const htmlPath = outputPath.replace('.pdf', '.html');
        const htmlContent = generateFullHtmlReport(markdownContent);
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
    return generatePdf(content, outputPath);
}

async function openHtmlInBrowser(htmlPath: string): Promise<void> {
    try {
        await vscode.env.openExternal(vscode.Uri.file(htmlPath));
    } catch (error) {
        console.error('Failed to open browser:', error);
    }
}

function generateFullHtmlReport(markdownContent: string): string {
    // Convert markdown to HTML
    const htmlContent = convertMarkdownToHtml(markdownContent);
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Angular Project Insight Report</title>
        <style>
            /* Reset and Base Styles */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
                line-height: 1.6;
            }
            
            .report-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            
            .report-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 50px;
                text-align: center;
            }
            
            .report-header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                font-weight: 700;
            }
            
            .report-header .subtitle {
                font-size: 1rem;
                opacity: 0.9;
                margin-top: 10px;
            }
            
            .report-meta {
                margin-top: 20px;
                display: flex;
                justify-content: center;
                gap: 30px;
                font-size: 0.9rem;
                opacity: 0.85;
                flex-wrap: wrap;
            }
            
            .report-meta span {
                background: rgba(255,255,255,0.2);
                padding: 5px 15px;
                border-radius: 20px;
            }
            
            .controls {
                padding: 20px 50px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: flex-end;
                gap: 15px;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-2px);
            }
            
            .report-content {
                padding: 50px;
            }
            
            /* Typography */
            h1 {
                font-size: 2rem;
                color: #2c3e50;
                margin: 30px 0 20px 0;
                padding-bottom: 10px;
                border-bottom: 3px solid #667eea;
            }
            
            h2 {
                font-size: 1.5rem;
                color: #2c3e50;
                margin: 25px 0 15px 0;
                padding-left: 15px;
                border-left: 5px solid #667eea;
            }
            
            h3 {
                font-size: 1.2rem;
                color: #34495e;
                margin: 20px 0 10px 0;
            }
            
            h4 {
                font-size: 1rem;
                color: #555;
                margin: 15px 0 10px 0;
            }
            
            /* Tables */
            .table-wrapper {
                overflow-x: auto;
                margin: 20px 0;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            
            th {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 15px;
                text-align: left;
                font-weight: 600;
            }
            
            td {
                padding: 10px 15px;
                border-bottom: 1px solid #e9ecef;
            }
            
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            tr:hover {
                background-color: #e3f2fd;
            }
            
            /* Code */
            pre {
                background: #2d2d2d;
                color: #f8f8f2;
                padding: 15px;
                border-radius: 8px;
                overflow-x: auto;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                margin: 15px 0;
            }
            
            code {
                background: #f4f4f4;
                color: #e83e8c;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }
            
            pre code {
                background: transparent;
                color: #f8f8f2;
                padding: 0;
            }
            
            /* Lists */
            ul, ol {
                margin: 15px 0;
                padding-left: 30px;
            }
            
            li {
                margin: 5px 0;
            }
            
            /* Blockquotes */
            blockquote {
                border-left: 4px solid #667eea;
                padding: 10px 20px;
                margin: 20px 0;
                background: #f8f9fa;
                font-style: italic;
                border-radius: 0 8px 8px 0;
            }
            
            /* Horizontal Rule */
            hr {
                border: none;
                height: 2px;
                background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
                margin: 30px 0;
            }
            
            /* Links */
            a {
                color: #667eea;
                text-decoration: none;
                border-bottom: 1px dashed #667eea;
            }
            
            a:hover {
                color: #764ba2;
                border-bottom-color: #764ba2;
            }
            
            /* Footer */
            .report-footer {
                background: #f8f9fa;
                padding: 20px 50px;
                text-align: center;
                border-top: 1px solid #e9ecef;
                font-size: 12px;
                color: #6c757d;
            }
            
            /* Print Styles */
            @media print {
                body {
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                .controls, .btn {
                    display: none !important;
                }
                
                .report-container {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                }
                
                .report-header {
                    background: #667eea !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                th {
                    background: #667eea !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                h1, h2, h3, h4 {
                    break-after: avoid !important;
                    page-break-after: avoid !important;
                }
                
                table, pre, blockquote {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
                
                tr {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
            }
        </style>
        <script>
            function printToPDF() {
                window.print();
            }
            
            function copyToClipboard() {
                const content = document.getElementById('report-content').innerText;
                navigator.clipboard.writeText(content).then(() => {
                    alert('Report copied to clipboard!');
                });
            }
        </script>
    </head>
    <body>
        <div class="report-container">
            <div class="report-header">
                <h1>📊 Angular Project Insight</h1>
                <div class="subtitle">Comprehensive Angular Project Analysis Report</div>
                <div class="report-meta">
                    <span>📅 ${new Date().toLocaleDateString()}</span>
                    <span>⏰ ${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
            
            <div class="controls">
                <button class="btn btn-primary" onclick="printToPDF()">
                    📄 Save as PDF
                </button>
                <button class="btn btn-secondary" onclick="copyToClipboard()">
                    📋 Copy Report
                </button>
            </div>
            
            <div id="report-content" class="report-content">
                ${htmlContent}
            </div>
            
            <div class="report-footer">
                <p>Generated by Angular Project Insight Extension for VS Code</p>
                <p style="margin-top: 5px; font-size: 11px;">This report provides a comprehensive overview of your Angular project structure.</p>
            </div>
        </div>
    </body>
    </html>`;
}

function convertMarkdownToHtml(markdown: string): string {
    let html = markdown;
    
    // Convert headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    
    // Convert bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Convert unordered lists
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)\n(<li>.*<\/li>)/g, '$1$2');
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
    
    // Convert ordered lists
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)+/g, (match) => {
        if (!match.includes('</ul>')) {
            return `<ol>${match}</ol>`;
        }
        return match;
    });
    
    // Convert blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    
    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    
    // Convert tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    let newHtml = [];
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.match(/^\|.+\|$/) && !inTable) {
            inTable = true;
            tableRows = [];
            tableRows.push(line);
        } else if (line.match(/^\|.+\|$/) && inTable) {
            tableRows.push(line);
        } else if (inTable && !line.match(/^\|.+\|$/)) {
            // End of table
            tableHtml = convertTableRowsToHtml(tableRows);
            newHtml.push(tableHtml);
            newHtml.push(line);
            inTable = false;
        } else {
            newHtml.push(line);
        }
    }
    
    if (inTable && tableRows.length > 0) {
        tableHtml = convertTableRowsToHtml(tableRows);
        newHtml.push(tableHtml);
    }
    
    html = newHtml.join('\n');
    
    // Convert line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><h/g, '<h');
    html = html.replace(/<\/h>\s*<\/p>/g, '</h>');
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><ol>/g, '<ol>');
    html = html.replace(/<\/ol><\/p>/g, '</ol>');
    html = html.replace(/<p><table/g, '<div class="table-wrapper"><table');
    html = html.replace(/<\/table><\/p>/g, '</table></div>');
    html = html.replace(/<p><pre>/g, '<pre>');
    html = html.replace(/<\/pre><\/p>/g, '</pre>');
    html = html.replace(/<p><blockquote>/g, '<blockquote>');
    html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
    
    return html;
}

function convertTableRowsToHtml(rows: string[]): string {
    if (rows.length === 0) return '';
    
    let html = '<div class="table-wrapper"><table>';
    let isHeader = true;
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip separator row (|---|)
        if (row.match(/^\|[\s\-:|]+\|$/)) {
            isHeader = false;
            continue;
        }
        
        const cells = row.split('|').filter(cell => cell.trim() !== '');
        
        if (isHeader) {
            html += '<thead><tr>';
            cells.forEach(cell => {
                html += `<th>${cell.trim()}</th>`;
            });
            html += '</tr></thead><tbody>';
            isHeader = false;
        } else {
            html += '<tr>';
            cells.forEach(cell => {
                html += `<td>${cell.trim()}</td>`;
            });
            html += '</tr>';
        }
    }
    
    html += '</tbody></table></div>';
    return html;
}