import { getNeonAuth } from '../../../../lib/auth/neon-auth';

type AuthRouteContext = { params: Promise<{ path: string[] }> };

export function GET(request: Request, context: AuthRouteContext) {
  return getNeonAuth().handler().GET(request, context);
}

export function POST(request: Request, context: AuthRouteContext) {
  return getNeonAuth().handler().POST(request, context);
}

export function PUT(request: Request, context: AuthRouteContext) {
  return getNeonAuth().handler().PUT(request, context);
}

export function PATCH(request: Request, context: AuthRouteContext) {
  return getNeonAuth().handler().PATCH(request, context);
}

export function DELETE(request: Request, context: AuthRouteContext) {
  return getNeonAuth().handler().DELETE(request, context);
}
