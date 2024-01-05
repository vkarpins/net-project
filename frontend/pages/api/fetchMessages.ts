import { withSessionRoute } from "@/lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";

export default withSessionRoute(fetchMessages);

async function fetchMessages(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { chatId, chatType } = req.query;
        const backendResponse = await fetch(`http://localhost:8080/message-display?chatId=${chatId}&chatType=${chatType}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.session.sessionToken || ''
            },
        });
  
        const messages = await backendResponse.json();
        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ errorMessage: 'An unexpected error occurred', error });
    }
}