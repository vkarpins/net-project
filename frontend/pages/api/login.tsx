import { withSessionRoute } from '../../lib/withSession';

export default withSessionRoute(async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      const { email, password } = req.body;

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginEmail: email, loginPassword: password }),
      };

      try {
        const response = await fetch('http://localhost:8080/login', options);

        if (response.status !== 200) {
          res.status(404).send("Can't find the user");
          break;
        }

        const json = await response.json();

        req.session.userId = json.userId;
        req.session.expiration = json.expiration;
        req.session.email = json.email;
        req.session.sessionToken = json.sessionId;
        await req.session.save();
        res.status(200).send('Found the user');
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
      }
      
      break;
    default:
      res.status(405).end(`${req.method} Not Allowed`);
      break;
  }
});
