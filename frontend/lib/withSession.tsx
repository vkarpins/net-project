import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiHandler,
} from 'next';
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next';

declare module 'iron-session' {
  interface IronSessionData {
    userId: number;
    email?: string;
    expiration: string;
    sessionToken?: string;
  }
}

const sessionOptions = {
  password: 'your-32-character-password111111111111111', // Replace with a strong password
  cookieName: 'my-cookie-name',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSessionSsr<
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
  handler: ({
    req,
    res,
  }: GetServerSidePropsContext) =>
    | GetServerSidePropsResult<P>
    | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, sessionOptions);
}
