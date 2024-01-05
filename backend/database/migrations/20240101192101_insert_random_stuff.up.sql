INSERT INTO users (first_name, last_name, date_of_birth, nickname, avatar, about_me, email, is_private, password)
VALUES
  ('Albert', 'Einstein', '1879-03-14', 'derDepperte', '', 'Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world!', 'albert@example.com', 0, x'24326124313024324a767948434a416f584c535677474d65363539717533646e63447577784d7567576e5563333175584e43796a656d6e772e7a584b'),
  ('Anne', 'Frank', '1929-06-12', 'chatterbox', '', 'Whoever is happy will make others happy too.', 'anne@example.com', 0, x'24326124313024324a767948434a416f584c535677474d65363539717533646e63447577784d7567576e5563333175584e43796a656d6e772e7a584b'),
  ('Sam', 'Panopoulos', '1934-06-08', 'pizzaking', '', 'Never say "Never"', 'sam@example.com', 0, x'24326124313024324a767948434a416f584c535677474d65363539717533646e63447577784d7567576e5563333175584e43796a656d6e772e7a584b');

INSERT INTO posts (user_id, user_avatar, title, content, photo, privacy)
VALUES
  (1, '', 'OMG, I discovered smth cool', 'Being at rest in the gravitational field and accelerating are identical physically. For example, an observer can see the ball fall the same way on the rocket and on Earth. This is due to the rocket''s acceleration, which equals 9.8 m/s2. Cool, right?', '', 'public'),
  (3, '', 'I LOVE PINEAPPLE PIZZA', 'Why do some people dislike pineapple on pizzas so much? If it is so bad, why is Hawaiian pizza (with ham or bacon) on almost every pizza menu around the world?', '', 'public'),
  (1, '', 'Simple as that', 'A person who never made a mistake never tried anything new.', '', 'public');

INSERT INTO comments (post_id, user_id, user_avatar, creator_name, content, photo)
VALUES
  (1, 3, '', 'Sam Panopoulos', 'Maaan, this is insane!', ''),
  (1, 2, '', 'Anne Frank', 'Sounds interesting, but I can''t say that I completely agree...', ''),
  (2, 2, '', 'Anne Frank', 'I find that a lot of the people who claim to hate pineapple on pizza have never actually tried it. They hate it just because it sounds weird to them.', '');

INSERT INTO groups (name, description, creator_id)
VALUES
  ('Science Enthusiasts', 'Discussing the wonders of science!', 1),
  ('Writers', 'For writers outside and inside.', 2),
  ('Average pineapple pizza lovers', 'All pineapple pizza haters are not welcome!!!!', 3);

INSERT INTO group_members (group_id, requester_id)
VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (2, 2),
  (2, 1),
  (2, 3),
  (3, 3),
  (3, 1),
  (3, 2);

INSERT INTO group_posts (group_id, user_id, user_avatar, title, content, photo)
VALUES
  (1, 1, '', 'Curvature of Spacetime', 'Discussing the curvature of spacetime as predicted by the Theory of General Relativity. Join me in exploring how massive objects bend the fabric of spacetime, influencing the motion of celestial bodies. Exciting stuff!', ''),
  (1, 1, '', 'Quantum Entanglement', 'Venturing into the intriguing realm of quantum entanglement. How do particles become entangled, and what are the implications for our understanding of reality? Let''s unravel the mysteries of this phenomenon together!', ''),
  (1, 1, '', 'The Elegant Equation of E=mc^2', 'In this post, I delve into the elegant and revolutionary equation E=mc^2. This formula changed our understanding of energy, mass, and the fabric of the universe. Let''s explore its implications and significance in the world of physics!', ''),
  (3, 3, '', 'Pizza Coding Challenge', 'Hey Coding Wizards! 🍕 Let''s embark on a coding challenge inspired by the art of making the perfect pizza. I challenge you to create a program that generates unique pizza recipes based on user preferences. Share your code and pizza ideas in the comments below! May the best coder win!', '');

INSERT INTO group_comments (post_id, user_id, group_id, user_avatar, creator_name, content, photo)
VALUES
  (1, 1, 1, '', 'Albert Einstein', 'Great for discussion!', ''),
  (2, 2, 1, '', 'Anne Frank', 'Interesting topic!', ''),
  (3, 3, 1, '', 'Sam Panopoulos', 'I learned something new!', '');