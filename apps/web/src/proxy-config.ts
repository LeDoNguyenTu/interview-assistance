export function shouldAuthenticateAtProxy(headers: Headers): boolean {
  return !headers.has('next-action');
}
