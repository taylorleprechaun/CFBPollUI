export function isActiveLink(pathname: string, linkTo: string): boolean {
  if (linkTo === '/') return pathname === '/';
  return pathname.startsWith(linkTo);
}
