import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchFollow);

async function fetchFollow(req: NextApiRequest, res: NextApiResponse) {
    const { type, action, userId } = req.query;
    const loggedInUser = req.session.userId;
    try {
        let response;
        let body;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': req.session.sessionToken || ''
        }
        if (action === 'follow' || action === 'unfollow') {
            const requestBody = {
                ...req.body,
                receiverId: parseInt(req.body.receiverId, 10),
                requesterId: loggedInUser,
            };
            body = JSON.stringify(requestBody);
        }
        
        switch (action) {
            case 'fetch':   
                response = await fetch(`http://localhost:8080/profile/${userId}/${type}`, { method: 'GET', headers });  
                break;
            case 'follow':
                response = await fetch(`http://localhost:8080/follow/request`, { method: 'POST', headers, body });
                break;
            case 'unfollow':
                response = await fetch (`http://localhost:8080/follow/unfollow/${userId}`, { method: 'DELETE', headers });
                break;
            default:
                throw new Error('Invalid action parameter');
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: 'An unexpected error occurred', error });
    }
}