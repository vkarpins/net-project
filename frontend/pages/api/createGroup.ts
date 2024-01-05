import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchCreateGroup);

async function fetchCreateGroup(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await fetch('http://localhost:8080/group/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.session.sessionToken || ''
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        if (data.status && data.status == "error"){
            res.status(500).json(data);
        }
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
        } else {
            res.status(200).json(data);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
}