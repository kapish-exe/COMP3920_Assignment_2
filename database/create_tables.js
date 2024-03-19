// const database = include('databaseConnection');

// async function createTables() {
//     let createSQL = `
//     INSERT INTO message (message_id, room_user_id, sent_datetime, text) VALUES 
//     (1,16,'2023-01-19 13:05:16','My favourite is orange tabbys'),
//     (2,15,'2023-01-19 13:05:48','Mine is siamese'),
//     (3,17,'2023-01-19 13:06:16','My cat likes to sleep in my bookshelf'),
//     (4,15,'2023-01-19 13:06:52','Argh! I can\'t get my cat to stop stratching the couch!'),
//     (5,6,'2023-01-19 13:07:51','I can\'t believe they raised the parking prices again!'),
//     (6,18,'2023-01-19 13:08:26','German shepards are the smartest dogs.'),
//     (7,7,'2023-01-19 13:09:08','I think they should raise prices. Maybe fewer people will drive and more will take transit.'),
//     (8,8,'2023-01-19 13:09:50','We should get a discount if we are employees.'),
//     (9,19,'2023-01-19 13:10:17','I like pugs'),
//     (10,20,'2023-01-19 13:11:02','My dog loves to go for long hikes with me. He even packs his own food.'),
//     (11,30,'2023-01-20 14:44:14','I saw a great movie about databases today. I can't wait for the SQL.'),
//     (12,23,'2023-01-20 14:52:32','Quiz next week on how to install the software'),
//     (13,31,'2023-01-20 14:52:58','I keep all my dad jokes in a \"Dad-a-base\".'),
//     (14,29,'2023-01-20 15:23:05','3 SQL databases walked into a NoSQL bar. A little while later they walked out, because they couldn't find a table.'),
//     (15,21,'2023-01-20 15:33:01','My bucket list includes: Mexico, Bahamas, New Zealand and Scotland'),
//     (16,9,'2023-01-20 15:33:25','I can\'t get enough Pizza! :P'),
//     (17,12,'2023-01-20 15:34:05','I just made myself some lazagne. Gonna freeze some and take it for lunches this week.'),
//     (18,31,'2023-01-20 15:34:24','To understand what recursion is, you must first understand recursion.'),
//     (19,31,'2023-01-20 15:36:17','Interviewer: \"Explain deadlock and we\'ll hire you.\"  Interviewee: \"Hire me and I\'ll explain it to you.\"'),
//     (20,31,'2023-01-20 15:37:54','Why did the programmer quit his job? Because he couldn\'t get arrays.'),
//     (21,31,'2023-01-20 15:38:41','There are 2 hard problems in computer science: caching, naming, and off-by-1 errors.'),
//     (22,31,'2023-01-20 15:40:00','What's the best thing thing about UDP jokes? I don't care if you get them.'),
//     (23,1,'2023-01-20 19:02:14','Who wants to go to the Mall on Saturday?'),(24,4,'2023-01-20 19:05:52','I will!'),
//     (25,2,'2023-01-20 19:07:17','What about 5PM?');
//     `;
//     try {
// 		const results = await database.query(createSQL);

//         console.log("Successfully created tables");
// 		console.log(results[0]);
// 		return true;
// 	}
// 	catch(err) {
// 		console.log("Error Creating tables");
//         console.log(err);
// 		return false;
// 	}
// }

// module.exports = {createTables};