import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchFollowRequests);

async function fetchFollowRequests(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await fetch(`http://localhost:8080/profile/me/requests`, { 
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.session.sessionToken || ''
            } ,
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: 'An unexpected error occurred', error });
    }      
}