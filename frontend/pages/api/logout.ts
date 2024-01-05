import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from "@/lib/withSession";

export default withSessionRoute(logout);

async function logout(req: NextApiRequest, res: NextApiResponse) {
    if (req.session) {
        await fetch('http://localhost:8080/logout', {
            method: 'GET',
            headers: {
                'Authorization': req.session.sessionToken as string,
            },
        });
        req.session.destroy();
        res.send({ ok: true });
    } else {
        res.status(400).send({ ok: false, error: 'No session to destroy' });
    }
}
