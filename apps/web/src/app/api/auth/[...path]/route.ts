import { getNeonAuth } from '../../../../lib/auth/neon-auth';

export const { DELETE, GET, PATCH, POST, PUT } = getNeonAuth().handler();
