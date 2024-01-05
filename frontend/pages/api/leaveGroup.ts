import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(leaveGroup);

async function leaveGroup(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await fetch(`http://localhost:8080/group/${req.body.groupId}/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.session.sessionToken || '',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: 'An unexpected error occurred', error });
    }
}