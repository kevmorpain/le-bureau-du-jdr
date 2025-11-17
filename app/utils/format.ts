export const toSnakeCase = (str: string): string => {
  // Source - https://stackoverflow.com/a
  // Posted by ZPiDER
  // Retrieved 2025-11-17, License - CC BY-SA 4.0

  return str.replace(/(([a-z])(?=[A-Z][a-zA-Z])|([A-Z])(?=[A-Z][a-z]))/g, '$1_').toLowerCase()
}
