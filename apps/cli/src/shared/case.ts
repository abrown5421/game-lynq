export function isPascalCase(value: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(value);
}

export function toCamelCase(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
