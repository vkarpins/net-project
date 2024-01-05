import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(search);

async function search(req: NextApiRequest, res: NextApiResponse) {
    try {
        const searchQuery = typeof req.query.query === 'string' ? req.query.query : '';
        const response = await fetch(`http://localhost:8080/${req.query.endpoint}?query=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.session.sessionToken || ''
            },
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: 'An unexpected error occurred', error });
    }
}