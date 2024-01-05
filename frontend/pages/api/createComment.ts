import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchCreateComment);

async function fetchCreateComment(req: NextApiRequest, res: NextApiResponse) {
    try {
        const apiEndpoint = req.body.groupId
            ? `http://localhost:8080/group/${req.body.groupId}/post/${req.body.postId}/comment/create`
            : `http://localhost:8080/post/${req.body.postId}/comment/create`;

        const response = await fetch(apiEndpoint, {
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