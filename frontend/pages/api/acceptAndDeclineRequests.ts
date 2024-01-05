import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchAcceptAndDeclineFollowRequests);

async function fetchAcceptAndDeclineFollowRequests(req: NextApiRequest, res: NextApiResponse) {
    const { action } = req.query;
    const loggedInUserId = req.session.userId;
    try {
        let response;
        let body;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': req.session.sessionToken || ''
        }
        const requestBody = {
            ...req.body,
            receiverId: loggedInUserId,
            requesterId: parseInt(req.body.requesterId, 10),
        };
        body = JSON.stringify(requestBody);

        switch (action) {
            case 'accept':
                response = await fetch(`http://localhost:8080/follow/accept-follow-request`, { method: 'POST', headers, body });
                break;
            case 'decline':
                response = await fetch(`http://localhost:8080/follow/decline-follow-request`, { method: 'POST', headers, body });  
                break;
            default:
                throw new Error('Invalid action parameter');
        }
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: 'An unexpected error occurred', error });
    }
}