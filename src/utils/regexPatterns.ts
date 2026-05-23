/**
 * Regular Expression Patterns
 * Centralized regex patterns for Angular file parsing
 */

// ============================================================================
// DECORATOR PATTERNS
// ============================================================================

/**
 * Pattern to match @Component decorator content
 */
export const COMPONENT_DECORATOR_PATTERN = /@Component\(\{([\s\S]*?)\}\)/m;

/**
 * Pattern to match @Injectable decorator content
 */
export const INJECTABLE_DECORATOR_PATTERN = /@Injectable\(\{([\s\S]*?)\}\)/m;

/**
 * Pattern to match @NgModule decorator content
 */
export const NG_MODULE_DECORATOR_PATTERN = /@NgModule\(\{([\s\S]*?)\}\)/m;

/**
 * Pattern to match @Input decorator
 */
export const INPUT_DECORATOR_PATTERN = /@Input\(\)\s+(\w+)/g;

/**
 * Pattern to match @Output decorator
 */
export const OUTPUT_DECORATOR_PATTERN = /@Output\(\)\s+(\w+)/g;

// ============================================================================
// SELECTOR AND TEMPLATE PATTERNS
// ============================================================================

/**
 * Pattern to match selector in @Component
 */
export const SELECTOR_PATTERN = /selector:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to match templateUrl in @Component
 */
export const TEMPLATE_URL_PATTERN = /templateUrl:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to match styleUrl or styleUrls in @Component
 */
export const STYLE_URLS_PATTERN = /styleUrls:\s*\[\s*([^\]]*?)\s*\]/s;

/**
 * Pattern to match individual style URLs
 */
export const STYLE_URL_ITEM_PATTERN = /['"`]([^'"`]+)['"`]/g;

// ============================================================================
// SERVICE PATTERNS
// ============================================================================

/**
 * Pattern to extract providedIn from @Injectable decorator
 */
export const SERVICE_DECORATOR_PATTERN = /providedIn\s*:\s*['"`](\w+)['"`]/;

// ============================================================================
// DEPENDENCY PATTERNS (UPDATED - More comprehensive)
// ============================================================================

/**
 * Pattern to extract constructor parameters
 */
export const CONSTRUCTOR_PATTERN = /constructor\(([^)]*)\)/;

/**
 * Extract dependencies from constructor injection
 * Matches: private serviceName: ServiceType, public http: HttpClient
 */
export function extractConstructorDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    const constructorMatch = content.match(CONSTRUCTOR_PATTERN);
    if (!constructorMatch) return dependencies;
    
    const params = constructorMatch[1].split(',');
    
    for (const param of params) {
        // Match: private name: Type, public name: Type, protected name: Type
        const injectMatch = param.match(/(?:private|public|protected)\s+\w+\s*:\s*(\w+)/);
        if (injectMatch && injectMatch[1]) {
            dependencies.push(injectMatch[1]);
        }
        
        // Match: @Inject(Token) name
        const injectDecoratorMatch = param.match(/@Inject\((\w+)\)/);
        if (injectDecoratorMatch && injectDecoratorMatch[1]) {
            dependencies.push(injectDecoratorMatch[1]);
        }
        
        // Match: name: Type (no access modifier)
        const simpleMatch = param.match(/^\s*(\w+)\s*:\s*(\w+)/);
        if (simpleMatch && simpleMatch[2] && !simpleMatch[1].match(/private|public|protected/)) {
            dependencies.push(simpleMatch[2]);
        }
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
}

// ============================================================================
// HTTP AND API PATTERNS
// ============================================================================

/**
 * Pattern to match HTTP method calls
 * Matches: http.get(), http.post(), etc.
 */
export const HTTP_METHOD_PATTERN = /http\.(get|post|put|patch|delete|request)\s*\(/g;

/**
 * Pattern to match API endpoint URLs
 * Matches: 'https://api.example.com/users', "/api/data"
 */
export const API_ENDPOINT_PATTERN = /['"`](https?:\/\/[^'"`]+|\.?\/api\/[^'"`]+)['"`]/g;

// ============================================================================
// CLASS AND FILE PATTERNS
// ============================================================================

/**
 * Extract class name from TypeScript file
 */
export function extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
}

/**
 * Check if a decorator exists in the file content
 * @param content File content
 * @param decoratorName Decorator name (e.g., 'Component', 'Injectable')
 * @returns True if decorator exists
 */
export function hasDecorator(content: string, decoratorName: string): boolean {
    const pattern = new RegExp(`@${decoratorName}\\s*\\(`, 'i');
    return pattern.test(content);
}

/**
 * Check if component is standalone
 */
export function isStandaloneComponent(content: string): boolean {
    return /standalone:\s*true/.test(content);
}

// ============================================================================
// ROUTE PATTERNS (UPDATED - More comprehensive)
// ============================================================================

/**
 * Pattern to find routes array in various formats
 */
export const ROUTES_ARRAY_PATTERNS = [
    /export\s+const\s+\w+\s*:\s*Routes\s*=\s*\[([\s\S]*?)\];/m,
    /const\s+routes\s*:\s*Routes\s*=\s*\[([\s\S]*?)\];/m,
    /Routes\s*=\s*\[([\s\S]*?)\];/m,
    /RouterModule\.forRoot\(\s*\[([\s\S]*?)\]\)/m,
    /RouterModule\.forChild\(\s*\[([\s\S]*?)\]\)/m,
    /provideRouter\(\s*\[([\s\S]*?)\]\)/m
];

/**
 * Pattern to extract route path
 */
export const ROUTE_PATH_PATTERN = /path\s*:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to extract route component
 */
export const ROUTE_COMPONENT_PATTERN = /component\s*:\s*(\w+)/;

/**
 * Pattern to extract loadComponent (lazy loading)
 */
export const ROUTE_LOAD_COMPONENT_PATTERN = /loadComponent\s*:\s*\(\)\s*=>\s*import\([^)]+\)\.then\(m\s*=>\s*m\.(\w+)\)/;

/**
 * Pattern to extract loadChildren (lazy loading modules)
 */
export const ROUTE_LOAD_CHILDREN_PATTERN = /loadChildren\s*:\s*\(\)\s*=>\s*import\([^)]+\)\.then\(m\s*=>\s*m\.(\w+)\)/;

/**
 * Pattern to extract redirectTo
 */
export const ROUTE_REDIRECT_PATTERN = /redirectTo\s*:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to extract canActivate guards
 */
export const ROUTE_CAN_ACTIVATE_PATTERN = /canActivate\s*:\s*\[(.*?)\]/;

// ============================================================================
// GUARD PATTERNS
// ============================================================================

/**
 * Pattern to detect guard interface
 */
export const GUARD_INTERFACE_PATTERN = /implements\s+(\w+)/;

/**
 * Get all guard types
 */
export const GUARD_TYPES = ['CanActivate', 'CanActivateChild', 'CanDeactivate', 'CanLoad', 'CanMatch'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract decorator properties as key-value map
 * @param decoratorContent Content inside @Component({ ... })
 * @returns Map of property names to values
 */
export function extractDecoratorProperties(decoratorContent: string): Record<string, string> {
    const properties: Record<string, string> = {};
    
    // Match property: value pairs (handling nested objects/arrays)
    const propertyPattern = /(\w+):\s*([^,}\n]+)/g;
    let match;
    
    while ((match = propertyPattern.exec(decoratorContent)) !== null) {
        const key = match[1];
        let value = match[2].trim();
        
        // Clean up value
        if (value.startsWith('[') && value.endsWith(']')) {
            // Keep array as is
        } else if (value.startsWith('{') && value.endsWith('}')) {
            // Keep object as is
        } else if (value.match(/^['"`].*['"`]$/)) {
            // Remove quotes from strings
            value = value.slice(1, -1);
        }
        
        properties[key] = value;
    }
    
    return properties;
}

/**
 * Parse URL from property value (removes ./ prefix)
 */
export function parseUrl(url: string): string {
    if (url.startsWith('./')) {
        return url.substring(2);
    }
    return url;
}