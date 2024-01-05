import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchCreateEvent);

async function fetchCreateEvent(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await fetch(`http://localhost:8080/group/${req.body.groupId}/event/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.session.sessionToken || ''
            },
            body: JSON.stringify(req.body)
        });
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
        } else {
            const data = await response.json();
            res.status(200).json(data);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
}