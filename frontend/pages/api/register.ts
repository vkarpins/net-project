import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from "@/lib/withSession";

export default withSessionRoute(register);

async function register(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'POST':
      const { email, password, firstName, lastName, dateOfBirth, nickname, aboutMe, avatar } = req.body;

      if (!email || !password || !firstName || !lastName || !dateOfBirth) {
        res.status(400).send('Incomplete user information');
        break;
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password, firstName: firstName, lastName: lastName, dateOfBirth: dateOfBirth, nickname: nickname, aboutMe: aboutMe, avatar: avatar }),
      };

      try {
        const response = await fetch('http://localhost:8080/register', options);

        if (response.status !== 200) {
          res.status(404).send("Can't register the user");
          break;
        }

        await req.session.save();
        res.status(200).send('Registration successful');
        break;
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
      }
    default:
      res.status(405).end(`${req.method} Not Allowed`);
      break;
  }
};
